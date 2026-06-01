/**
 * Tiny in-memory dedup for smart reminders.
 *
 * A reminder can reach the app twice while foregrounded: once via FCM push and
 * once via the realtime `.ticket.reminder` broadcast. Both paths key on
 * `${ticket_id}:${stage}` so the banner is shown exactly once. Whichever path
 * arrives first marks the key; the other one suppresses itself.
 */
const shown = new Map<string, number>();
const TTL_MS = 90_000;

export function reminderKey(ticketId: number | string, stage: string): string {
  return `${ticketId}:${stage}`;
}

export function reminderAlreadyShown(key: string): boolean {
  const now = Date.now();
  for (const [k, t] of shown) {
    if (now - t > TTL_MS) shown.delete(k);
  }
  return shown.has(key);
}

export function markReminderShown(key: string): void {
  shown.set(key, Date.now());
}
