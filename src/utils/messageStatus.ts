// Mirrors Chatty.Domain's MessageStatus enum (numeric, no JsonStringEnumConverter registered).
export enum BackendMessageStatus {
  Failed = 1,
  Pending = 2,
  Sent = 3,
  Read = 4,
}

export type UiMessageStatus = 'sent' | 'seen' | 'failed';

// There is no "delivered" state on the backend — Pending/Sent both render as a single check.
export function normalizeMessageStatus(status: unknown): UiMessageStatus {
  const numeric = typeof status === 'string' ? Number(status) : status;

  switch (numeric) {
    case BackendMessageStatus.Failed:
      return 'failed';
    case BackendMessageStatus.Read:
      return 'seen';
    case BackendMessageStatus.Pending:
    case BackendMessageStatus.Sent:
    default:
      return 'sent';
  }
}
