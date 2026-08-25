// Client-side helper: asks the server to invalidate ISR-cached public routes
// after a successful admin mutation (ADMIN-002). Never call before the DB
// write has succeeded — invalidating on failure would needlessly thrash cache.
// Failures are non-blocking: the 60s ISR timer is a correctness backstop.
export async function requestPublicRevalidation(paths: string[]): Promise<void> {
  try {
    const res = await fetch('/api/admin/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths }),
    });
    if (!res.ok) {
      console.warn(`Cache revalidation skipped (HTTP ${res.status}) — public pages will refresh within 60s.`);
    }
  } catch (error) {
    console.warn('Cache revalidation request failed — public pages will refresh within 60s.', error);
  }
}
