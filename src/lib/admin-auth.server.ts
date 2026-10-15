// Admin login comes from host secrets (Cloudflare: Variables and Secrets; locally: .env.local).
// If either is missing, every login is refused rather than falling back to a default.
function safeEqual(a: string, b: string) {
  // Compare full length every time so response timing doesn't leak how much matched.
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export function assertAdmin(credentials: { user: string; pass: string }) {
  const adminUser = process.env["ADMIN_USER"];
  const adminPass = process.env["ADMIN_PASS"];
  if (!adminUser || !adminPass) {
    console.error("[admin] ADMIN_USER / ADMIN_PASS are not set; admin login is disabled.");
    throw new Error("unauthorized");
  }
  const userOk = safeEqual(String(credentials?.user ?? ""), adminUser);
  const passOk = safeEqual(String(credentials?.pass ?? ""), adminPass);
  if (!userOk || !passOk) {
    throw new Error("unauthorized");
  }
}
