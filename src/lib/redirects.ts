// Only allow application destinations. Decode before matching to reject encoded separators.
export function safeNext(value: unknown, fallback = "/circles"): string {
  if (typeof value !== "string" || value.length > 512) return fallback;
  try {
    const decoded = decodeURIComponent(value);
    if (/[\\\s\u0000-\u001f\u007f]/.test(decoded)) return fallback;
    if (decoded === "/circles" || decoded === "/profile") return decoded;
    if (/^\/circles\/[0-9a-f-]{36}$/.test(decoded)) return decoded;
    if (/^\/join\/[0-9a-f]{64}$/.test(decoded)) return decoded;
  } catch {
    /* Malformed encodings are not navigation targets. */
  }
  return fallback;
}

export function parseOrigin(value: string): string {
  const url = new URL(value);
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (
    (url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "APP_ORIGIN must be an HTTPS origin, or HTTP localhost, without a path.",
    );
  }
  return url.origin;
}

export const authNextCookie = "circle-auth-next";
export function callbackUrl(origin: string) {
  return new URL("/auth/callback", parseOrigin(origin)).toString();
}

export function canonicalUrl(origin: string, pathname: string, search: string) {
  const url = new URL(parseOrigin(origin));
  // Assign components, rather than resolving an untrusted path (which may begin //).
  url.pathname = pathname;
  url.search = search;
  return url;
}
