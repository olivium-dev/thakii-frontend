/**
 * Stub for axios fetch adapter. Avoids loading the real fetch adapter so we never hit
 * "Cannot destructure property 'Request' of 'undefined'" in Vite production builds.
 * Axios will fall back to the XHR adapter, which works in all browsers.
 */
function getFetch() {
  return false;
}

export { getFetch };
export default false;
