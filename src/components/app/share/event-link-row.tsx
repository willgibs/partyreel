"use client";

import { Check, Copy, Link2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { trackAttrs } from "@/lib/analytics/events";

import { useCopyLink } from "./use-copy-link";

import "./share.css";

/**
 * THE THIRD, SUBTLER LINK (Will, `share` note: "under the metadata line under
 * the event name, we can add a third even more subtle event link with a direct
 * copy button").
 *
 * ★ IT SHOWS THE PRETTY URL AND COPIES THE PERMANENT ONE, and those are not the
 * same string. A custom slug is MUTABLE — a host can change or release it — and
 * a code already printed on a table card cannot be reprinted. So the readable
 * form is what a host reads out loud, and what lands on the clipboard is always
 * the `qr_token` link the QR encodes. Nothing a guest holds can ever break.
 *
 * ★ THE CONFIRMATION IS IN PLACE AND THERE IS NO TOAST. The reader is looking
 * directly at the control they pressed; a toast in the corner is a notification
 * about something already in the eye's centre. The check plus the word "Copied"
 * replace the label, an `aria-live` region says it once for a screen reader,
 * and both revert after a beat.
 *
 * ★ THE PHONE GETS A MIDDLE-TRUNCATED URL, CHOSEN IN STRINGS AND SWAPPED IN
 * CSS. A `text-overflow: ellipsis` cuts the END, which on an event link throws
 * away the only part that differs between two events. Two spans toggled at `sm`
 * keeps it deterministic — no measuring, no layout effect, and the server and
 * the client render the same bytes.
 */
export function EventLinkRow({
  /** The readable form (`preferredEventUrl`): `/e/<slug>` when a slug is set, else the /e/ link. */
  prettyUrl,
  /** The permanent qr_token URL. Always what is copied. */
  permanentUrl,
  className,
}: {
  prettyUrl: string;
  permanentUrl: string;
  className?: string;
}) {
  // One copy implementation for all three of the hub's copy controls.
  const { copied, copy } = useCopyLink(permanentUrl);

  const display = stripScheme(prettyUrl);

  return (
    <div className={cn("flex min-w-0 items-center gap-1.5", className)}>
      <Link2 className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      {/* The readable link itself opens the album in a new tab: a host checks
          what a guest will see far more often than they copy it. */}
      <a
        href={permanentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 truncate text-xs text-muted-foreground transition-colors hover:text-foreground"
        {...trackAttrs("cta_click", { cta: "event-link", location: "hub" })}
      >
        <span className="hidden sm:inline">{display}</span>
        <span className="sm:hidden">{middleTruncate(display, 30)}</span>
      </a>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy the link to this event"
        className="flex h-6 shrink-0 items-center gap-1 rounded-full px-1.5 text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.97]"
        {...trackAttrs("cta_click", { cta: "copy-event-link", location: "hub" })}
      >
        <span data-copy-pop={copied ? "on" : undefined} className="flex">
          {copied ? (
            <Check className="size-3.5 text-success" aria-hidden />
          ) : (
            <Copy className="size-3.5" aria-hidden />
          )}
        </span>
        {copied && <span className="font-medium text-success">Copied</span>}
      </button>
      {/* Said once, to a screen reader, because the visual swap above is the
          only other confirmation there is. */}
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>
    </div>
  );
}

/** `https://partyreel.com/e/abc` → `partyreel.com/e/abc`. The scheme is the
 *  least informative 8 characters on the line and the first to go. */
function stripScheme(url: string): string {
  return url.replace(/^https?:\/\//, "");
}

/** Keep both ends, drop the middle: on an event link the TAIL is the part that
 *  identifies the event, so an end-ellipsis would cut the only useful half. */
function middleTruncate(value: string, max: number): string {
  if (value.length <= max) return value;
  const keep = max - 1;
  const head = Math.ceil(keep / 2);
  const tail = Math.floor(keep / 2);
  return `${value.slice(0, head)}…${value.slice(value.length - tail)}`;
}
