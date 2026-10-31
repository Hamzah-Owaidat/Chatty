// Relative time formatting shared by the sidebar's "last message" time and the
// chat header's "last seen" text (e.g. "2m ago", "3h ago").
export const formatRelativeTime = (timestamp?: string): string => {
  if (!timestamp) return "";

  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  } catch {
    return timestamp;
  }
};

// Calendar-day key (local time) for grouping messages into "Today" / "Yesterday" /
// date sections, WhatsApp-style — two timestamps land in the same group iff this
// key matches, regardless of time of day.
export const dayKey = (timestamp?: string): string => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

// Chat message-list day divider label: "Today", "Yesterday", or a full date —
// with the year only shown when it isn't the current one.
export const formatDayDivider = (timestamp?: string): string => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: sameYear ? undefined : "numeric",
  });
};

export interface DisplayNameCooldown {
  canChange: boolean;
  // Set only when canChange is false.
  nextEligibleAt?: Date;
  daysRemaining?: number;
}

// Display names can be changed once every rolling 30 days (not calendar month) — this
// derives whether a change is currently allowed from the timestamp of the last change.
export const getDisplayNameCooldown = (displayNameUpdatedAt?: string): DisplayNameCooldown => {
  if (!displayNameUpdatedAt) return { canChange: true };

  const updatedAt = new Date(displayNameUpdatedAt);
  if (isNaN(updatedAt.getTime())) return { canChange: true };

  const nextEligibleAt = new Date(updatedAt);
  nextEligibleAt.setDate(nextEligibleAt.getDate() + 30);

  const now = new Date();
  if (now >= nextEligibleAt) return { canChange: true };

  return {
    canChange: false,
    nextEligibleAt,
    daysRemaining: Math.max(1, Math.ceil((nextEligibleAt.getTime() - now.getTime()) / 86400000)),
  };
};

// Shared "Online" / "Last seen X ago" / "Offline" label for read-only profile views
// (Contact Info modal, avatar hover-card).
export const getPresenceLabel = (status?: "online" | "offline", lastSeenAt?: string): string => {
  if (status === "online") return "Online";
  if (lastSeenAt) return `Last seen ${formatRelativeTime(lastSeenAt)}`;
  return "Offline";
};
