/**
 * THE SWEEP, EVERY FIFTEEN MINUTES (drive-export.md): the backstop of every kick. The Worker reads its own queue's depths,
 * tells the app its switch and those readings in one signed word, and enqueues the lanes the app answers (a send that
 * stopped moving, a pause whose time came, a dying lane's connection at most once an hour). The app does every other
 * piece of the sweep (`cloud_export_sweep`, then the mails, the rechecks and the hourly heartbeat), so a Worker whose
 * secret drifted reads Overdue on /admin/jobs.
 *
 * Switched off (DRIVE_MODE), it still reports (the heartbeat says so) and enqueues nothing.
 */
import type { AppClient } from "./app-client";
import type { LaneMessage } from "./lane";
import { log } from "./log";

export async function sweep(input: {
  app: AppClient;
  mode: "on" | "off";
  depths: Record<string, number>;
  enqueue(messages: LaneMessage[]): Promise<void>;
}): Promise<number> {
  const answer = await input.app.sweep({
    mode: input.mode,
    depths: input.depths,
  });
  if ("state" in answer) {
    log("drive-sweep", { ok: false, status: answer.status });
    return 0;
  }
  if (input.mode === "off") return 0;
  const messages: LaneMessage[] = [];
  for (const k of answer.kick) {
    for (let i = 0; i < Math.min(Math.max(k.lanes, 0), 3); i++)
      messages.push({ v: 1, connectionId: k.connectionId });
  }
  if (messages.length > 0) await input.enqueue(messages);
  log("drive-sweep", {
    ok: true,
    kicked: answer.kick.length,
    lanes: messages.length,
  });
  return messages.length;
}
