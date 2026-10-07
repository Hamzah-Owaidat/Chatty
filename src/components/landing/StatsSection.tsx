"use client";
import { useEffect, useRef, useState } from "react";
import { LANDING_STATS, type LandingStat } from "./landing-data";

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const percent = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function formatStat(stat: LandingStat, current: number): string {
  if (stat.format === "percent") return `${percent.format(current)}%`;
  return compact.format(current);
}

function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return { ref, inView };
}

function useCountUp(target: number, active: boolean, duration = 1600): number {
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    setValue(0);
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, duration]);

  return value;
}

function StatCard({ stat, active }: { stat: LandingStat; active: boolean }) {
  const current = useCountUp(stat.value, active);
  return (
    <div className="rounded-2xl border border-gray-200/70 bg-white/70 p-6 shadow-[0_1px_2px_rgba(16,24,40,.04)] backdrop-blur-sm dark:border-stone-800/70 dark:bg-stone-900/60">
      <p className="text-3xl font-semibold tracking-tight text-gray-900 tabular-nums sm:text-4xl dark:text-white">
        {formatStat(stat, current)}
      </p>
      <p className="mt-2 text-sm text-gray-500 dark:text-stone-400">{stat.label}</p>
    </div>
  );
}

export default function StatsSection() {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <section id="stats" aria-labelledby="stats-heading" className="scroll-mt-20 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 id="stats-heading" className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Chatty in numbers
          </h2>
          <p className="mt-3 text-gray-600 dark:text-stone-300">
            A snapshot of what people are doing on Chatty.
          </p>
        </div>
        <div ref={ref} className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {LANDING_STATS.map((stat) => (
            <StatCard key={stat.id} stat={stat} active={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
