const ADMIN_USER = "adminkymrunhere22!!";
const ADMIN_PASS = "kymrunToWin2423";

export function assertAdmin(credentials: { user: string; pass: string }) {
  if (credentials.user !== ADMIN_USER || credentials.pass !== ADMIN_PASS) {
    throw new Error("unauthorized");
  }
}
