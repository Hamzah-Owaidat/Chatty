import { ChatActivityType } from "@/types/chat/chat.models";

// Single place to grow when new activity types are added (e.g. voice notes) —
// everything else (hub, hook, UI) is already generic over activityType.
// displayName is only passed for group chats — a direct chat has a single possible
// actor, so naming them would be redundant.
export const getActivityLabel = (activityType: ChatActivityType, displayName?: string): string => {
  const verb = (() => {
    switch (activityType) {
      case "typing":
        return "typing...";
      default:
        return "typing...";
    }
  })();

  return displayName ? `${displayName} is ${verb}` : verb;
};
