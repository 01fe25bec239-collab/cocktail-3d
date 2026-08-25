// Request-local origin resolution for auth redirects (ADMIN-001).
//
// Login/logout redirects previously hardcoded the production canonical URL,
// which bounced localhost and preview-deployment workflows away from the host
// under test. Redirects now stay on whatever host served the form.
//
// Open-redirect safety:
// - Only constant paths (/admin, /admin/login) are ever appended — never
//   user-supplied paths or query params.
// - Callers run isSameOrigin() first, so a present Origin header has already
//   been proven equal to the Host header.
export function getRequestOrigin(request: Request): string {
  const originHeader = request.headers.get('origin');
  if (originHeader) {
    try {
      return new URL(originHeader).origin;
    } catch {
      // Malformed Origin was already rejected by isSameOrigin(); fall through.
    }
  }

  // No Origin header (common for same-origin form posts): reconstruct from
  // Host plus forwarded/proto hints. Netlify terminates TLS at the edge and
  // reports the original scheme in x-forwarded-proto; local dev has neither
  // header and falls back to the protocol of the actual request URL.
  const host = request.headers.get('host');
  const proto =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
    new URL(request.url).protocol.replace(/:$/, '');

  if (host && /^[a-zA-Z0-9.\-\[\]:]+$/.test(host)) {
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}
