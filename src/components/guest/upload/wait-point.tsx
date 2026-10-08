import { cn } from "@/lib/utils";

/**
 * STANDBY'S MARK: A POINT, HALF-LIT, WITH NO HUE (no-signal r1, on brand r2's settled status: "a status is a point and
 * its word; waiting for the line is Standby, half-lit with no hue, never a fault's colour"). Its left half lit and a
 * hairline round the rest, in whatever ink stands around it (the ground's, or the white of a photograph's glass), so a
 * send that waits for the line reads as nobody's failure. 8 px, so the half stays open at a phone's 2x and a desk's 1x.
 *
 * ★ STILL UNTIL SOMETHING HAPPENS: nothing waiting moves (the sending dot on a camera's frame pulses; a waiting one, its
 * half-lit twin in `camera-roll.css`, stands still). Beside its word always, so it is never the only carrier of the state.
 */
export function WaitPoint({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      data-wait-point=""
      className={cn(
        "inline-block size-2 shrink-0 rounded-full bg-[linear-gradient(90deg,currentColor_50%,transparent_50%)] shadow-[inset_0_0_0_1px_currentColor]",
        className,
      )}
    />
  );
}
