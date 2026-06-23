// In-memory sliding window rate limiter for auth routes
const tracker = new Map<string, number[]>();

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_ATTEMPTS = 5; // Allow maximum 5 attempts per window

export function isRateLimited(ip: string): { limited: boolean; retryAfter: number } {
  const now = Date.now();

  // Perform a cleanup run for expired keys to prevent memory leaks
  tracker.forEach((timestamps, key) => {
    const validTimestamps = timestamps.filter(t => now - t < WINDOW_MS);
    if (validTimestamps.length === 0) {
      tracker.delete(key);
    } else {
      tracker.set(key, validTimestamps);
    }
  });

  const timestamps = tracker.get(ip) || [];
  const activeTimestamps = timestamps.filter(t => now - t < WINDOW_MS);

  if (activeTimestamps.length >= MAX_ATTEMPTS) {
    const oldest = activeTimestamps[0];
    const retryAfter = Math.ceil((oldest + WINDOW_MS - now) / 1000);
    return { limited: true, retryAfter };
  }

  activeTimestamps.push(now);
  tracker.set(ip, activeTimestamps);

  return { limited: false, retryAfter: 0 };
}
