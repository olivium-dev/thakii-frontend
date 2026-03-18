/**
 * Ensures fetch API (Request, Response, Headers, fetch) is on globalThis and self
 * before any other module runs. Fixes "Cannot destructure property 'Request' of 'undefined'"
 * in some environments (Firebase/deps). Must be the first import in main.jsx.
 */
if (typeof window !== 'undefined') {
  const w = window;
  const g = typeof globalThis !== 'undefined' ? globalThis : w;
  const s = typeof self !== 'undefined' ? self : w;
  if (w.Request) {
    g.Request = w.Request;
    s.Request = w.Request;
  }
  if (w.Response) {
    g.Response = w.Response;
    s.Response = w.Response;
  }
  if (w.Headers) {
    g.Headers = w.Headers;
    s.Headers = w.Headers;
  }
  if (w.fetch) {
    g.fetch = w.fetch;
    s.fetch = w.fetch;
  }
}
