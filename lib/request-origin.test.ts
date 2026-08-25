// Runnable checks for getRequestOrigin. Run with: tsx lib/request-origin.test.ts
import assert from 'node:assert';
import { getRequestOrigin } from './request-origin';

const req = (url: string, headers: Record<string, string> = {}) =>
  new Request(url, { method: 'POST', headers });

// Origin header present → trusted (callers validate it equals Host first).
assert.strictEqual(
  getRequestOrigin(req('https://preview-abc.netlify.app/auth/login', {
    origin: 'https://preview-abc.netlify.app',
    host: 'preview-abc.netlify.app',
  })),
  'https://preview-abc.netlify.app'
);

// Localhost login stays on localhost (no x-forwarded-proto locally).
assert.strictEqual(
  getRequestOrigin(req('http://localhost:3000/auth/login', {
    host: 'localhost:3000',
  })),
  'http://localhost:3000'
);

// Behind a proxy without Origin header → x-forwarded-proto + Host.
assert.strictEqual(
  getRequestOrigin(req('http://internal-upstream/auth/login', {
    host: 'cocktail-3d.netlify.app',
    'x-forwarded-proto': 'https',
  })),
  'https://cocktail-3d.netlify.app'
);

// Comma-chained x-forwarded-proto → first hop.
assert.strictEqual(
  getRequestOrigin(req('http://internal/auth/login', {
    host: 'site.example',
    'x-forwarded-proto': 'https, http',
  })),
  'https://site.example'
);

// No useful headers at all → fall back to the request URL itself.
assert.strictEqual(
  getRequestOrigin(req('https://fallback.example/auth/login')),
  'https://fallback.example'
);

// Host header with injection characters must NOT be echoed into the redirect.
assert.strictEqual(
  getRequestOrigin(req('https://safe.example/auth/login', {
    host: 'evil.example\\nX-Evil: 1',
  })),
  'https://safe.example'
);

console.log('✓ request-origin tests passed');
