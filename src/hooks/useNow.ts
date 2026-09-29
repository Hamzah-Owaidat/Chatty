import { useEffect, useState } from "react";

// Forces a re-render every `intervalMs` so relative-time labels (formatRelativeTime's
// "just now" / "2m ago" / last-seen text) stay live without needing new data to
// arrive or a page refresh. The returned value isn't meant to be read — it's just a
// dependency to force the tick.
export const useNow = (intervalMs = 30000) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return tick;
};
