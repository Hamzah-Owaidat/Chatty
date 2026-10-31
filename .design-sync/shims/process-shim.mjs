// Next.js inlines process.env.NEXT_PUBLIC_* at build time; this IIFE bundle is built without that step, so `process` must exist before app modules evaluate.
globalThis.process ??= { env: {} };
