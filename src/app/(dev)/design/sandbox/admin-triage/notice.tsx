"use client";

import type { ReactNode } from "react";
import {
  Bell,
  CheckCircle2,
  ImageIcon,
  Trash2,
  Undo2,
  XCircle,
} from "lucide-react";

import { GLASS, GLASS_MARK } from "@/lib/glass";
import { TRACKER_WORDS } from "@/lib/guest/upload-tracker";
import { cn } from "@/lib/utils";

import { frameOf, OPEN_REPORTS, UPLOADER } from "./fixtures";
import type { VerdictShape } from "./report";
import { StateChip } from "./shell";

/**
 * WHO IS TOLD WHEN AN OPERATOR REMOVES A PHOTO, AS IT SHIPS (the production
 * refresh, 2026-09-28). The first draft asked whether to break a silence that
 * no longer exists, so each party is drawn as the code has them today:
 *
 *  - THE UPLOADER IS TOLD ALREADY. `told=line` shipped (`TRACKER_TELLS_REFUSAL`),
 *    and `listOwnUploadStatuses` maps an operator's removal to refused, so at an
 *    event that reviews uploads her list says "Not in the album": the words it
 *    says for the host's Reject, and for a held photo. Nothing there tells a
 *    hold apart, which is the doctrine's whole demand. voice-guest r2 is asking
 *    those words, so they are drawn from `TRACKER_WORDS` itself, as today.
 *  - THE HOST MEETS A DEAD END. The bin does not filter an operator's removal
 *    out, so the photo waits in her Deleted with a countdown and a Restore
 *    that answers only "That item is no longer available." (`restore_media`'s
 *    admin_removed and legal_hold both map to the vague default, on purpose).
 *  - THE REPORTER IS ANONYMOUS BY CONSTRUCTION: `reports` stores no reporter,
 *    so her thank-you is the one moment the product can reach her. Mailing her
 *    left this ask for `emails`' `guest` (flow-refresh adds it there).
 *
 * ★ SO THE ASK IS THE HOST'S, AND EVERY ANSWER KEEPS A HOLD INVISIBLE. A line
 * that fired on a takedown and stayed silent on a hold would be a hold oracle,
 * so whatever she is told, and wherever, the words are the same for both.
 */

export type NoticeShape = "silence" | "deleted" | "host";

export const noticeOf = (v: string | undefined): NoticeShape =>
  v === "silence" || v === "deleted" || v === "host" ? v : "silence";

function Column({
  title,
  who,
  children,
}: {
  title: string;
  who: string;
  children: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{who}</p>
      </div>
      <div className="flex flex-1 flex-col gap-2 rounded-xl border bg-muted/20 p-3">
        {children}
      </div>
    </section>
  );
}

function Note({
  icon,
  children,
  muted,
}: {
  icon: ReactNode;
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-lg border bg-card px-3 py-2.5 text-sm",
        muted && "text-muted-foreground",
      )}
    >
      <span className="mt-0.5 shrink-0 opacity-70">{icon}</span>
      <div className="min-w-0 space-y-1">{children}</div>
    </div>
  );
}

function Silence({ what }: { what: string }) {
  return (
    <div className="flex items-center justify-center rounded-lg border border-dashed px-3 py-5 text-center text-xs text-muted-foreground">
      {what}
    </div>
  );
}

/**
 * HER UPLOADS LIST, three of hers refused three ways. The rows are
 * `upload-tracker.tsx`'s refused row: no picture (a photograph that is not in
 * the album is never presigned for a guest), the crossed circle, the word.
 */
function TrackerList() {
  return (
    <div className="rounded-lg border bg-card">
      <div className="border-b px-3 py-2.5">
        <p className="font-heading text-sm font-medium">Your uploads</p>
        <p className="text-xs text-muted-foreground">
          The host reviews uploads before they appear in the album.
        </p>
      </div>
      <ul className="divide-y divide-border/60 px-3">
        {["reject", "takedown", "hold"].map((why) => (
          <li
            key={why}
            data-tri-tracker={why}
            className="flex items-center gap-3 py-2"
          >
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-tile bg-muted">
              <ImageIcon
                className="size-4 text-muted-foreground/60"
                aria-hidden
              />
            </div>
            <p className="flex min-w-0 flex-1 items-center gap-1.5 text-sm text-muted-foreground">
              <XCircle className="size-4 shrink-0" aria-hidden />
              <span className="truncate text-foreground">
                {TRACKER_WORDS.refused}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * THE PHOTO IN HER DELETED, the album's own bin tile: the glass mark at the
 * top left, the bin's two verbs at the top right. Today the mark counts down
 * and Restore fails; `deleted` and `host` say who removed it and offer nothing
 * to fail.
 */
function DeletedTile({ said }: { said: boolean }) {
  const still = frameOf(OPEN_REPORTS[0]);
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium">Her album, View: Deleted</p>
      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-tile bg-muted">
        {still ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local still standing in for a presigned original
          <img
            src={still.src}
            alt=""
            className="size-full object-cover"
            draggable={false}
          />
        ) : null}
        <span
          className={cn(
            "absolute top-1.5 left-1.5 inline-flex h-5 items-center rounded-full px-2 text-micro font-medium text-white",
            GLASS_MARK,
          )}
        >
          {said ? "Removed by Partyreel" : "Deletes in 30 days"}
        </span>
        {said ? null : (
          <span
            className={cn(
              "absolute top-1.5 right-1.5 flex items-center gap-0.5 rounded-full p-0.5",
              GLASS,
            )}
          >
            <span className="flex size-6 items-center justify-center text-white">
              <Undo2 className="size-4" aria-hidden />
            </span>
            <span className="flex size-6 items-center justify-center text-white">
              <Trash2 className="size-4" aria-hidden />
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

export function WhoIsTold({
  shape,
  verdict,
}: {
  shape: NoticeShape;
  /** The verdict the record was written under: only a note leaves a line. */
  verdict: VerdictShape;
}) {
  const row = OPEN_REPORTS[0];
  const said = shape !== "silence";
  return (
    <div className="tri-told">
      <Column
        title="The person who reported it"
        who="A guest at the album, on her phone"
      >
        <Note icon={<CheckCircle2 className="size-4" />}>
          <p>Thanks. Your report has been sent for review.</p>
          <p className="text-xs text-muted-foreground">
            At the moment she sends it, as today.
          </p>
        </Note>
        <Silence what="Nothing after it, under every answer here: a report stores no one to tell. Whether a mail ever reaches her is asked on the emails board." />
      </Column>

      <Column
        title="The guest who sent it"
        who={`${UPLOADER.name}, at an event that reviews uploads`}
      >
        <TrackerList />
        <p className="text-xs leading-relaxed text-muted-foreground">
          From the top: the host&rsquo;s Reject, an operator&rsquo;s takedown, a
          hold. One line for all three, so nothing gives a hold away. Where an
          event shows everything at once she has no list, and the photo is
          simply gone. As today under every answer; voice-guest is asking its
          words.
        </p>
      </Column>

      <Column title="The host" who="Maya, whose album it is">
        {shape === "host" ? (
          <Note icon={<Bell className="size-4" />}>
            <p>Partyreel removed an item from {row.event}.</p>
            <p className="text-xs text-muted-foreground">
              No reason, no reporter, no appeal: the same line whatever the
              removal was, a hold included.
            </p>
          </Note>
        ) : (
          <Silence what="Nothing is sent. The photo is gone from the album." />
        )}
        <DeletedTile said={said} />
        {said ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            No Restore to fail and no countdown to chase: the same words for a
            takedown and a hold.
          </p>
        ) : (
          <Note icon={<XCircle className="size-4" />} muted>
            <p className="text-foreground">Couldn&rsquo;t restore that item.</p>
            <p className="text-xs">
              That item is no longer available. What Restore answers, the line a
              missing row gives, for a takedown and a hold alike.
            </p>
          </Note>
        )}
      </Column>

      <Column title="The record" who="What survives the night">
        <div className="space-y-1.5 rounded-lg border bg-card px-3 py-2.5 text-sm">
          <StateChip level="actioned">Actioned</StateChip>
          <p className="text-xs break-words text-muted-foreground">
            {row.when} · {row.host}
          </p>
          {verdict === "two" ? (
            <p className="text-muted-foreground">
              No note: no verdict writes one today.
            </p>
          ) : (
            <p>Child in frame; her parent asked.</p>
          )}
        </div>
        <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
          The record does not move between these answers. What moves is what the
          host is told and where, and none of it ever tells a hold from a
          takedown.
        </p>
      </Column>
    </div>
  );
}
