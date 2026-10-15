interface PresenceDotProps {
  status?: "online" | "offline" | "away";
  size?: number;
  // Pulsing ring when online. Defaults to on.
  ring?: boolean;
  className?: string;
}

const dotColorClass = (status?: PresenceDotProps["status"]) =>
  status === "online" ? "bg-success-500 dark:bg-success-400" : status === "away" ? "bg-warning-400" : "bg-gray-400 dark:bg-stone-500";

/**
 * Small online/away/offline status dot, with an optional pulsing ring when online.
 * Shared by the read-only profile views (Contact Info modal, avatar hover-card) — the
 * sidebar and chat header render their own dot inline and aren't migrated to this.
 */
export default function PresenceDot({ status, size = 12, ring = true, className = "" }: PresenceDotProps) {
  return (
    <span className={`relative flex shrink-0 ${className}`} style={{ width: size, height: size }}>
      {ring && status === "online" && <span className="absolute inset-0 rounded-full bg-success-500 animate-ring" />}
      <span
        className={`relative rounded-full border-2 border-white dark:border-[#201d1b] ${dotColorClass(status)}`}
        style={{ width: size, height: size }}
      />
    </span>
  );
}
