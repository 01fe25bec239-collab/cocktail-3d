// Runnable check for isSameOrigin. Run with: tsx utils/verify-origin.test.ts
import assert from 'node:assert';
import { isSameOrigin } from './verify-origin';

const req = (headers: Record<string, string>) =>
  new Request('https://example.com/auth/login', { method: 'POST', headers });

// Same origin → allowed
assert.strictEqual(isSameOrigin(req({ origin: 'https://site.com', host: 'site.com' })), true);
// Cross origin → rejected
assert.strictEqual(isSameOrigin(req({ origin: 'https://evil.com', host: 'site.com' })), false);
// Missing Origin header → allowed (some same-origin agents omit it)
assert.strictEqual(isSameOrigin(req({ host: 'site.com' })), true);
// Malformed Origin → rejected, not a thrown 500
assert.strictEqual(isSameOrigin(req({ origin: 'not a url', host: 'site.com' })), false);

console.log('✓ verify-origin tests passed');
