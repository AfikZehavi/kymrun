// Server-side check of a payment directly with Tranzila (Transaction Reports API),
// so a forged "payment succeeded" call to the notify URL can't mark an order as paid.
// Needs TRANZILA_APP_KEY / TRANZILA_APP_SECRET (my.tranzila -> Settings -> API).

const API_URL = "https://api.tranzila.com/v1/transactions";

type Signer = (appKey: string, secret: string) => Promise<Record<string, string>>;

const hex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

async function hmacHex(key: string, message: string) {
  const enc = new TextEncoder();
  const k = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC", k, enc.encode(message)));
}

function nonce() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return hex(bytes.buffer);
}

// Tranzila's docs describe the access token two ways (Quickstart vs. API reference).
// Try the Quickstart form first and remember whichever the API accepts.
const signers: Signer[] = [
  async (appKey, secret) => {
    const time = String(Date.now());
    const n = nonce();
    return headers(appKey, time, n, await hmacHex(secret, appKey + time + n));
  },
  async (appKey, secret) => {
    const time = String(Math.floor(Date.now() / 1000));
    const n = nonce();
    return headers(appKey, time, n, await hmacHex(secret + time + n, appKey));
  },
];
let workingSigner: Signer | undefined;

function headers(appKey: string, time: string, n: string, token: string) {
  return {
    "Content-Type": "application/json",
    "X-tranzila-api-app-key": appKey,
    "X-tranzila-api-request-time": time,
    "X-tranzila-api-nonce": n,
    "X-tranzila-api-access-token": token,
  };
}

export function tranzilaApiConfigured() {
  return Boolean(process.env["TRANZILA_APP_KEY"] && process.env["TRANZILA_APP_SECRET"]);
}

export type VerifyResult =
  | { ok: true; amount: number; responseCode: string }
  | { ok: false; reason: string; retry: boolean };

/** Looks up one transaction by its index and checks it was approved for the expected amount. */
export async function verifyTranzilaPayment(
  index: string,
  expectedAmount: number,
): Promise<VerifyResult> {
  const appKey = process.env["TRANZILA_APP_KEY"]!;
  const secret = process.env["TRANZILA_APP_SECRET"]!;
  const terminal = process.env["TRANZILA_TERMINAL"]!;
  if (!/^\d+$/.test(index)) return { ok: false, reason: "missing transaction index", retry: false };

  const body = JSON.stringify({ terminal_name: terminal, transaction_index: Number(index) });
  let res: Response | undefined;
  for (const sign of workingSigner ? [workingSigner] : signers) {
    try {
      res = await fetch(API_URL, { method: "POST", headers: await sign(appKey, secret), body });
    } catch (e) {
      return { ok: false, reason: `network error: ${String(e)}`, retry: true };
    }
    if (res.status !== 401 && res.status !== 403) {
      workingSigner = sign;
      break;
    }
  }
  if (!res) return { ok: false, reason: "no response", retry: true };
  if (res.status === 401 || res.status === 403)
    return { ok: false, reason: "Tranzila API rejected the API keys", retry: true };
  if (!res.ok)
    return { ok: false, reason: `Tranzila API HTTP ${res.status}`, retry: res.status >= 500 };

  const data = (await res.json().catch(() => null)) as {
    transactions?: Record<string, unknown>[];
  } | null;
  const tx =
    data?.transactions?.find((t) => String(t["index"]) === index) ?? data?.transactions?.[0];
  if (!tx) return { ok: false, reason: "transaction not found at Tranzila", retry: false };

  const amount = Number(tx["amount"]);
  const responseCode = String(tx["processor_response_code"] ?? "");
  if (responseCode !== "000")
    return { ok: false, reason: `not approved (code ${responseCode})`, retry: false };
  // The report may give the amount in shekels or in agorot; accept either form of the same sum.
  const matches =
    Math.abs(amount - expectedAmount) < 0.01 || Math.abs(amount - expectedAmount * 100) < 0.5;
  if (!matches) {
    return {
      ok: false,
      reason: `amount mismatch (Tranzila ${amount}, order ${expectedAmount})`,
      retry: false,
    };
  }
  return { ok: true, amount, responseCode };
}
