const DOMAIN = "kymrun-01g25-8ed07gjd.myshopify.com";
const VERSION = "2025-07";

export async function adminGql<T = any>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const token = process.env["SHOPIFY_ACCESS_TOKEN"];
  if (!token) throw new Error("missing SHOPIFY_ACCESS_TOKEN");
  const res = await fetch(`https://${DOMAIN}/admin/api/${VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Shopify admin [${res.status}]: ${text}`);
  const json = JSON.parse(text) as { data?: T; errors?: unknown };
  if (json.errors) throw new Error(`Shopify admin: ${JSON.stringify(json.errors)}`);
  return json.data as T;
}

export function userErrors(payload: { userErrors?: { message: string }[] } | undefined) {
  const errs = payload?.userErrors ?? [];
  if (errs.length) throw new Error(errs.map((e) => e.message).join(", "));
}

/** Uploads a data: URL to Shopify staged storage and returns a resourceUrl. */
export async function uploadDataUrl(dataUrl: string): Promise<string> {
  const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  if (!m) throw new Error("bad image");
  const mime = m[1]!;
  const bytes = Uint8Array.from(atob(m[2]!), (c) => c.charCodeAt(0));
  const ext = mime.split("/")[1] ?? "jpg";
  const d = await adminGql(
    `mutation($input:[StagedUploadInput!]!){stagedUploadsCreate(input:$input){stagedTargets{url resourceUrl parameters{name value}} userErrors{message}}}`,
    {
      input: [
        {
          resource: "IMAGE",
          filename: `kymrun-${Date.now()}.${ext}`,
          mimeType: mime,
          httpMethod: "POST",
          fileSize: String(bytes.length),
        },
      ],
    },
  );
  userErrors(d.stagedUploadsCreate);
  const t = d.stagedUploadsCreate.stagedTargets[0];
  const form = new FormData();
  for (const p of t.parameters) form.append(p.name, p.value);
  form.append("file", new Blob([bytes], { type: mime }));
  const up = await fetch(t.url, { method: "POST", body: form });
  if (!up.ok) throw new Error(`upload failed [${up.status}]: ${await up.text()}`);
  return t.resourceUrl as string;
}
