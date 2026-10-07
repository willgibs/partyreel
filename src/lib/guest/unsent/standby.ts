/**
 * ★ A FILE STANDING BY FOR THE LINE (no-signal r1, Will's `drop=standby`): its last try ended for the connection
 * (`QueueItem.cause` is `dropped`) and it waits, `queued`, for the line to answer before it goes again
 * (`use-upload-queue.ts`'s `standBy`, `unsent/line.ts`). It is still on its way ("active means queued or uploading": the
 * run, the shutter's ring and the stack all hold it), and the queue's runner never takes it until the line is back.
 *
 * Its own module, and pure, so the camera's rules (`camera/shots.ts`) read it without the queue's machine.
 */
import type { QueueItem } from "@/lib/guest/use-upload-queue";

export function waitsForLine(it: Pick<QueueItem, "status" | "cause">): boolean {
  return it.status === "queued" && it.cause === "dropped";
}
