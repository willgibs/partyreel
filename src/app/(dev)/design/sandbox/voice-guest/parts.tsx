"use client";

import { Check, Clock, MailCheck, XCircle } from "lucide-react";

import { DoorHeading } from "@/components/guest/door/heading";
import { DoorCheck } from "@/components/guest/door/lit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  EVENT,
  HOST,
  PICK,
  type HerUpload,
  type UploadStatus,
} from "./fixtures";
import {
  HELD_LINE,
  IN_THE_ALBUM,
  KEEP_ASK,
  KEEP_SENT,
  type Register,
  type StatusLines,
  UPLOADS_TITLE,
} from "./lines";

/**
 * THE PIECES EACH OPTION STANDS IN, QUOTED FROM THE SHIPPED COMPONENTS WITH THE
 * WORDS LIFTED TO A PROP (the retired `voice` board's rule: a shipped component
 * takes its line through a prop where one exists, and is copied where none
 * does). Everything around the words is the shipped markup, classes and all,
 * so two options differ in their words, or in the one place they move, and
 * nothing else.
 *
 * ★ `data-vg-*` MARKS WHAT IS BEING JUDGED, and the board's readers measure
 * exactly those (lines run, words read, a label cut short). A caption never
 * asserts what a reader can count.
 *
 * ★ NOTHING HERE CALLS A SERVER FUNCTION, READS A SESSION OR MOUNTS A RADIX
 * PORTAL (`scene.tsx`'s own note). Every control that looks pressable is inert
 * (`tabIndex={-1}`, no handler), so a stray tap in a review does nothing rather
 * than something misleading.
 */

/* ── 1. held: the line at the album's head (`line`) ───────────────────────── */

/**
 * ONE QUIET LINE WHERE HER TILES STOOD, in the grammar the album's head already
 * has for a line about her own photographs (`live-gallery.tsx`'s Yours line,
 * "Showing yours · Show all"): muted words, a faint dot, and the one act, here
 * the list its tap opens, named by the list's own title. The clock is the
 * waiting mark her uploads' rows wear, so the line and the list it opens read
 * as one thing.
 */
export function HeldLine({ n }: { n: number }) {
  return (
    <div
      data-vg-held-line
      className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
    >
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Clock className="size-3.5 shrink-0" aria-hidden />
        <span data-vg-line>{HELD_LINE(n)}</span>
      </span>
      <span aria-hidden className="text-faint">
        ·
      </span>
      <span className="rounded-md font-medium underline-offset-4">
        {UPLOADS_TITLE}
      </span>
    </div>
  );
}

/* ── 2. status: her uploads' rows (`upload-tracker.tsx`, `TrackerRowView`) ─── */

const ICON = { waiting: Clock, approved: Check, refused: XCircle } as const;

const TONE: Record<UploadStatus, string> = {
  waiting: "text-warning",
  approved: "text-success",
  refused: "text-muted-foreground",
};

/** One of hers: the picture, the status's mark in its tone, and its words. */
function TrackerRow({ upload, words }: { upload: HerUpload; words: string }) {
  const Icon = ICON[upload.status];
  return (
    <li
      data-upload-tracker-row={upload.status}
      className="flex items-center gap-3 py-2.5"
    >
      <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-tile bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- this device's own picture of the file it sent */}
        <img src={upload.still.src} alt="" className="size-full object-cover" />
      </div>
      <p
        className={cn(
          "flex min-w-0 flex-1 items-center gap-1.5 text-sm",
          TONE[upload.status],
        )}
      >
        <Icon className="size-4 shrink-0" aria-hidden />
        <span
          data-vg-status={upload.status}
          className="truncate text-foreground"
        >
          {words}
        </span>
      </p>
    </li>
  );
}

/**
 * HER UPLOADS' LIST, IN ONE OPTION'S WORDS. Every option but `apart` is the
 * shipped list, newest first, each row saying where it stands. `apart` keeps
 * those rows for what is waiting and what is in, and gathers what the host
 * left out at the foot: a heading, one sentence of why, and the pictures, with
 * no verdict on any row.
 */
export function UploadsList({
  uploads,
  words,
}: {
  uploads: readonly HerUpload[];
  words: StatusLines;
}) {
  const say = (status: UploadStatus) =>
    status === "waiting"
      ? words.waiting
      : status === "approved"
        ? IN_THE_ALBUM
        : (words.refused ?? "");
  const section = words.section;
  const listed = section
    ? uploads.filter((u) => u.status !== "refused")
    : uploads;
  const apart = section ? uploads.filter((u) => u.status === "refused") : [];
  return (
    <>
      <ul className="divide-y divide-border/60 pb-2">
        {listed.map((u) => (
          <TrackerRow key={u.key} upload={u} words={say(u.status)} />
        ))}
      </ul>
      {section && apart.length > 0 && (
        <section data-vg-apart className="mt-2 border-t border-border/60 pt-4">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            {section.heading}
            <span className="text-faint tabular-nums">{apart.length}</span>
          </p>
          <p
            data-vg-why
            className="mt-1 text-sm text-pretty text-muted-foreground"
          >
            {section.why(apart.length)}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {apart.map((u) => (
              <li
                key={u.key}
                data-upload-tracker-row="refused"
                className="size-11 overflow-hidden rounded-tile bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- this device's own picture of the file it sent */}
                <img
                  src={u.still.src}
                  alt=""
                  className="size-full object-cover"
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/* ── 3. keep: the door's last screen (`save-account-prompt.tsx`, `KeepOffer`) ── */

/**
 * THE KEEP AS IT SHIPS, WITH THE ASK'S TWO SENTENCES LIFTED TO A PROP: "Sent"
 * beside the real lit check (`DoorCheck`), where her photos went (the shipped
 * `keepSentLine`), the ask on the door's one heading scale (the real
 * `DoorHeading`, from the left), then Confirm your email and Maybe later. No
 * chevron: what the keep follows is done.
 */
export function KeepAsk({ register }: { register: Register }) {
  const ask = KEEP_ASK[register];
  return (
    <div data-keep-step="offer" className="flex flex-col gap-5">
      <div data-keep-sent className="flex items-center gap-3">
        <DoorCheck size="sent" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="font-heading text-card-title font-medium text-foreground">
            Sent
          </p>
          <p className="text-working text-muted-foreground">
            {KEEP_SENT(PICK, HOST.displayName)}
          </p>
        </div>
      </div>
      <div data-vg-line>
        <DoorHeading
          title={ask.title(PICK)}
          reason={ask.reason(PICK, EVENT.name)}
          hidden
        />
      </div>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          size="cta"
          className="w-full"
          tabIndex={-1}
          data-vg-confirm
        >
          <MailCheck /> Confirm your email
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full text-muted-foreground"
          tabIndex={-1}
        >
          Maybe later
        </Button>
      </div>
    </div>
  );
}
