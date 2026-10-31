// Placeholder content for the landing page. Replace these hardcoded values with
// real data from the API when the endpoints exist.

export interface LandingStat {
  id: string;
  label: string;
  value: number;
  format: "compact" | "percent";
}

export const LANDING_STATS: LandingStat[] = [
  { id: "users", label: "Registered users", value: 12480, format: "compact" },
  { id: "messages", label: "Messages sent", value: 3200000, format: "compact" },
  { id: "groups", label: "Group chats created", value: 4130, format: "compact" },
  { id: "uptime", label: "Uptime, last 30 days", value: 99.9, format: "percent" },
];

export interface LandingFeature {
  id: string;
  title: string;
  description: string;
  icon: "message" | "presence" | "group" | "link" | "request" | "unread";
}

export const LANDING_FEATURES: LandingFeature[] = [
  {
    id: "realtime",
    title: "Real-time messaging",
    description: "Messages arrive the moment they are sent, over a live connection.",
    icon: "message",
  },
  {
    id: "presence",
    title: "Presence",
    description: "See who is online and when someone was last active.",
    icon: "presence",
  },
  {
    id: "groups",
    title: "Group chats",
    description: "Create a group, invite people, and decide who stays in it.",
    icon: "group",
  },
  {
    id: "invites",
    title: "Invite links",
    description: "Share one link and let anyone start a conversation with you.",
    icon: "link",
  },
  {
    id: "requests",
    title: "Chat requests",
    description: "Nobody reaches you unannounced. Requests are accepted before a chat opens.",
    icon: "request",
  },
  {
    id: "unread",
    title: "Unread badges",
    description: "Counts on each conversation show what needs your attention first.",
    icon: "unread",
  },
];

export const LANDING_STEPS = [
  {
    id: "signup",
    title: "Create your account",
    description: "Pick a username and sign up in under a minute.",
  },
  {
    id: "connect",
    title: "Connect with people",
    description: "Search for someone, or share your invite link.",
  },
  {
    id: "chat",
    title: "Start chatting",
    description: "Send messages, start groups, and stay in sync live.",
  },
];
