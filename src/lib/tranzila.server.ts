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

/** POSTs JSON to a Tranzila API with the signed headers, remembering whichever signing form works. */
async function signedPost(url: string, payload: unknown): Promise<Response> {
  const appKey = process.env["TRANZILA_APP_KEY"]!;
  const secret = process.env["TRANZILA_APP_SECRET"]!;
  const body = JSON.stringify(payload);
  let res: Response | undefined;
  for (const sign of workingSigner ? [workingSigner] : signers) {
    res = await fetch(url, { method: "POST", headers: await sign(appKey, secret), body });
    if (res.status !== 401 && res.status !== 403) {
      workingSigner = sign;
      break;
    }
  }
  return res!;
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
  const terminal = process.env["TRANZILA_TERMINAL"]!;
  if (!/^\d+$/.test(index)) return { ok: false, reason: "missing transaction index", retry: false };

  let res: Response;
  try {
    res = await signedPost(API_URL, { terminal_name: terminal, transaction_index: Number(index) });
  } catch (e) {
    return { ok: false, reason: `network error: ${String(e)}`, retry: true };
  }
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

// Tranzila Invoices API (https://docs.tranzila.com/docs/invoices/invoices-api): same keys and signed headers.
const INVOICE_URL = "https://billing5.tranzila.com/api/documents_db/create_document";
const INVOICE_PDF_URL = "https://my.tranzila.com/api/get_financial_document/";

type InvoiceOrder = {
  id: string;
  full_name: string;
  email: string;
  address: string;
  items: { name: string; qty: number; price: number }[];
  shipping: number | string;
  shipping_method: string;
  total: number | string;
};

export type InvoiceResult =
  | { ok: true; number: string; url: string }
  | { ok: false; reason: string };

/** Issues a tax invoice/receipt (IR) for a paid order and binds it to the Tranzila transaction. */
export async function createTranzilaInvoice(
  order: InvoiceOrder,
  index: string,
  shippingLabel: string,
): Promise<InvoiceResult> {
  const terminal = process.env["TRANZILA_TERMINAL"]!;
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const items = (order.items ?? []).map((l) => ({
    type: "I",
    name: l.name.slice(0, 100),
    price_type: "G", // prices on the site include VAT
    unit_price: r2(Number(l.price)),
    units_number: l.qty,
    currency_code: "ILS",
  }));
  if (Number(order.shipping) > 0) {
    items.push({
      type: "I",
      name: `משלוח · ${shippingLabel}`.slice(0, 100),
      price_type: "G",
      unit_price: r2(Number(order.shipping)),
      units_number: 1,
      currency_code: "ILS",
    });
  }
  const payload = {
    terminal_name: terminal,
    document_type: "IR",
    action: 1,
    document_language: "heb",
    response_language: "eng",
    document_currency_code: "ILS",
    client_name: order.full_name.slice(0, 100),
    client_email: order.email,
    client_address_line_1: order.address.slice(0, 100),
    items,
    payments: [
      {
        payment_method: 1,
        amount: r2(Number(order.total)),
        currency_code: "ILS",
        ...(/^\d+$/.test(index) ? { txnindex: Number(index) } : {}),
      },
    ],
    created_by_system: `kymrun.co.il order ${order.id}`,
  };

  let res: Response;
  try {
    res = await signedPost(INVOICE_URL, payload);
  } catch (e) {
    return { ok: false, reason: `network error: ${String(e)}` };
  }
  const data = (await res.json().catch(() => null)) as {
    status_code?: number;
    status_msg?: string;
    document?: { number?: string | number; retrieval_key?: string };
  } | null;
  if (!res.ok || !data || data.status_code !== 0 || !data.document?.retrieval_key) {
    return {
      ok: false,
      reason: `HTTP ${res.status} code ${data?.status_code ?? "?"} ${data?.status_msg ?? ""}`.trim(),
    };
  }
  return {
    ok: true,
    number: String(data.document.number ?? ""),
    url: INVOICE_PDF_URL + data.document.retrieval_key,
  };
}

/** Calls the invoice API with a terminal name that doesn't exist: checks the keys work without issuing anything. */
export async function probeInvoiceApi() {
  const res = await signedPost(INVOICE_URL, {
    terminal_name: "kymrun-probe-no-such-terminal",
    items: [{ name: "probe", unit_price: 1 }],
    payments: [{ payment_method: 1, amount: 1 }],
  });
  return { http: res.status, body: (await res.text()).slice(0, 200) };
}
