// Same-origin check for state-changing POSTs (CSRF guard). Returns false for a
// cross-origin OR malformed Origin header; true when Origin is absent (some
// same-origin agents omit it) or matches the request Host.
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get('host');
  } catch {
    return false; // malformed Origin — reject rather than throw a 500
  }
}
