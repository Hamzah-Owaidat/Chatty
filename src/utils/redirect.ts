// Only accept a same-origin relative path from a `?redirect=` query param — guards
// against an open redirect via a crafted link like `?redirect=https://evil.com`,
// `?redirect=//evil.com` (protocol-relative), or `?redirect=/\evil.com` (browsers
// normalize a leading backslash to `//`, same trick as above). Resolving with `new
// URL` and comparing origins closes all of these at once, instead of trying to
// enumerate every string pattern that can end up meaning "different origin".
export const getSafeRedirect = (value: string | null, fallback: string): string => {
  if (!value || !value.startsWith("/") || typeof window === "undefined") {
    return fallback;
  }

  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) {
      return fallback;
    }
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
};
