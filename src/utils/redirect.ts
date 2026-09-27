// Only accept a same-origin relative path from a `?redirect=` query param — guards
// against an open redirect via a crafted link like `?redirect=https://evil.com`
// or `?redirect=//evil.com` (protocol-relative).
export const getSafeRedirect = (value: string | null, fallback: string): string => {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return fallback;
};
