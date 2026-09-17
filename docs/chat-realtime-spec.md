## Chatty – Realtime & Presence Spec (Frontend + Backend TODO)

This file summarizes what we discussed and what needs to be built, so you and your backend dev can implement it cleanly later.

---

### 1. Online status (presence)

**Goal:**  
Show whether a user is online both:
- Inside the chat header
- In the sidebar list (green dot, “online” label)

**Rules:**
- A user is **online** when they have an active SignalR connection.
- A user is **offline** when all their SignalR connections have disconnected.

**Backend responsibilities:**
1. In `ChatHub.OnConnectedAsync`:
   - Get `userId = Context.UserIdentifier`.
   - Mark that user as `online` (DB or cache).
   - Broadcast presence change:
     ```csharp
     await Clients.All.SendAsync("UserStatusChanged", new { userId, status = "online" });
     ```

2. In `ChatHub.OnDisconnectedAsync`:
   - Mark that user as `offline` (only if they have no other active connections).
   - Broadcast:
     ```csharp
     await Clients.All.SendAsync("UserStatusChanged", new { userId, status = "offline" });
     ```

3. Include `status` in:
   - `GetCurrentUser` response
   - `/chat/user-chats` response (`UserChat.status`)

**Frontend responsibilities (later):**
- Add a `usePresence` or extend `useSignalR` to listen to:
  ```ts
  connection.on("UserStatusChanged", ({ userId, status }) => { ... });
  ```
- In `ChatSidebar`, update `ChatUserDisplay.status` for matching chats.
- In `ChatWindow`, use **other participant’s** status, not `isConnected`, for the “Online” text.

---

### 2. Realtime sidebar last message

**Goal:**  
Sidebar should always show the **latest message** and order chats by most recent activity without manual refresh.

**Current frontend behavior (done):**
- `ChatSidebar`:
  - Fetches chats once via `getUserChats()`.
  - Uses `useSignalR(null)` to listen to **all** `MessageReceived` events.
  - When a new message arrives:
    - Finds matching chat by `chatId`.
    - Updates:
      - `lastMessage` = `message.content`
      - `lastTime` = `message.sentAt/createdAt`
    - Moves that chat to the top of the list.

**Backend requirement:**  
No extra requirement if `MessageReceived` already includes:
- `chatId`
- `content`
- `sentAt`/`timestamp`

---

### 3. Message delivery ticks (static design now, dynamic later)

We want WhatsApp-style message states with icons:

1. **Clock**  
   - Meaning: Message is still **pending locally** (not accepted by server).
2. **One gray tick**  
   - Meaning: Message **saved on server** but receiver might not be connected yet.
3. **Two gray ticks**  
   - Meaning: Message **delivered** to receiver’s device.
4. **Two blue ticks**  
   - Meaning: Receiver has **seen** the message (chat opened / marked read).

#### Static frontend API (design)

```ts
// src/types/chat/chat.models.ts
export type MessageStatus = "pending" | "sent" | "delivered" | "seen";

export interface ChatMessage {
  ...
  status?: MessageStatus;
}
```

```tsx
// src/components/common/ChatWindow.tsx (MessageStatus component)
const MessageStatus = ({ status }: { status?: MessageStatus }) => {
  if (status === "pending") return <ClockIcon className="w-4 h-4 text-gray-400" />;
  if (status === "sent") return <OneTickIcon className="w-4 h-4 text-gray-400" />;
  if (status === "delivered") return <TwoTicksIcon className="w-4 h-4 text-gray-400" />;
  if (status === "seen") return <TwoTicksIcon className="w-4 h-4 text-blue-500" />;
  return null;
};
```

Right now we can keep it **static**:
- Set `status: "sent"` when the server returns successfully.
- Later, backend will send real statuses via SignalR.

#### Backend responsibilities (to be done later)

1. Extend `Message` model:
   ```csharp
   public enum MessageStatus { Pending, Sent, Delivered, Seen }

   public class Message {
     ...
     public MessageStatus Status { get; set; }
   }
   ```

2. When `ChatHub.SendMessage` (or API) saves the message:
   - Set `Status = MessageStatus.Sent`.
   - Broadcast `MessageReceived` with that status.

3. When message is **delivered** to receiver:
   - Decide the event logic (e.g. when receiver’s client confirms receipt).
   - Update `Status` to `Delivered`.
   - Broadcast:
     ```csharp
     await Clients.Group(chatId)
       .SendAsync("MessageStatusChanged", new { messageId, status = "delivered" });
     ```

4. When message is **seen**:
   - Add an endpoint or hub method like `MarkMessagesAsSeen(chatId)`.
   - Update status to `Seen` for relevant messages.
   - Broadcast `MessageStatusChanged` with status `"seen"`.

#### Frontend after backend is ready

- Listen for:
  ```ts
  connection.on("MessageStatusChanged", ({ messageId, status }) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, status } : m
    ));
  });
  ```
- `MessageStatus` component (above) will automatically render the right icon/color.

---

### 4. Summary of TODOs (backend first, then frontend)

**Backend:**
1. Implement presence in `ChatHub` (`OnConnectedAsync` / `OnDisconnectedAsync`) and broadcast `"UserStatusChanged"`.
2. Persist and expose `status` for users (online/offline) in APIs.
3. Extend `Message` with `Status` and implement transitions:
   - `Pending` → `Sent` → `Delivered` → `Seen`.
4. Broadcast:
   - `"MessageReceived"` with full message payload (including `status`).
   - `"MessageStatusChanged"` when only the status changes.

**Frontend (after backend done):**
1. Use `"UserStatusChanged"` to drive presence in chat header + sidebar.
2. Use `Message.status` + `"MessageStatusChanged"` to drive the tick icons:
   - clock / one tick / two gray ticks / two blue ticks.

For now, the icons and status type can stay **static** in the frontend, and this file documents everything needed so you can coordinate with your backend dev and plug it in later.

