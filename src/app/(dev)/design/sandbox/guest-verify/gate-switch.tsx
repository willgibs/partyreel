"use client";

import { Eye, Lock, Plus, Users } from "lucide-react";

import { GuestMasonry } from "@/components/guest/guest-masonry";
import { ConfirmSwitch } from "@/components/ui/confirm-switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { ALBUM, ALLOWANCE } from "./fixtures";
import { EventBlock, FrameNote, GUTTER, Pane, type ScreenId } from "./page-parts";

/**
 * `gate-switch` -- WHAT "REQUIRE ACCOUNTS TO UPLOAD" BECOMES ONCE UPLOADING NO
 * LONGER REQUIRES ONE.
 *
 * ★ THE SWITCH HAS ALWAYS DONE TWO JOBS UNDER ONE NAME, and only one of them
 * is about uploading. `allow_anonymous_uploads = false` gates the VIEW as well:
 * a signed-out visitor to an open event gets the teaser, not the album
 * (`guest-flow.md`, "Gallery access"). His `gate=after` ruling retires the
 * upload half by itself, because a mail that never arrives may no longer stop
 * an upload. This decides what happens to the other half.
 *
 * ★ HIS OWN SENTENCE OPENED IT: "Now that we're allowing unconfirmed uploads,
 * it's making me rethink whether we allow anonymous uploads at all." So the
 * board draws the switch keeping both rows, keeping one, and retiring.
 *
 * ★ AND WHAT RETIRING WOULD ACTUALLY COST, drawn rather than argued: an event's
 * three visibility states are private, password and open, and none of them is
 * an identity gate. A host who wanted "only people who tell me who they are may
 * see my wedding" would be left with a shared secret, which is a different
 * promise, or with nothing. That is a one-way door for every event already set
 * this way, which is why it is drawn on the guest's screen and not asserted in
 * a sentence.
 *
 * ★ THE CONTROLS ARE THE SHIPPED `ConfirmSwitch`, the one primitive
 * `app-vocabulary` r1 ruled owns the glyph and the deferred-open dance, in the
 * settings sheet's own Card. The rows are static here on purpose: a frame that
 * moves under a pixel comparison is a frame that cannot be compared.
 */

export type GateSwitchShape = "two" | "one" | "none";

export const gateSwitchOf = (v: string | undefined): GateSwitchShape =>
  v === "one" ? "one" : v === "none" ? "none" : "two";

const noop = () => {};

/* -- the settings sheet --------------------------------------------------- */

function SettingsSide({ shape }: { shape: GateSwitchShape }) {
  return (
    <div className="h-full overflow-y-auto p-3">
      <Card>
        <CardHeader>
          <CardTitle>Guest uploads</CardTitle>
          <CardDescription>
            Control whether and how guests contribute.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(shape === "two" || shape === "one") && (
            <ConfirmSwitch
              label="Require an account to view"
              description="On: someone with the link sees a few previews until they confirm an email. Off: the album is open to anyone with the link."
              checked
              onCheckedChange={noop}
              confirmWhen={(next) => !next}
              dialogTitle="Open this album to anyone with the link?"
              dialogDescription="Anyone holding the link will see every photo without confirming anything. You can turn this back on anytime."
              confirmLabel="Open the album"
              cancelLabel="Keep it gated"
            />
          )}
          {shape === "two" && (
            <ConfirmSwitch
              label="Require an account to add"
              description="On: a guest confirms an email before their first photo. Off: anyone may add, up to the unconfirmed allowance."
              checked={false}
              onCheckedChange={noop}
              confirmWhen={() => false}
              dialogTitle="Require accounts to add?"
              dialogDescription="Guests will confirm an email before their first photo."
              confirmLabel="Require accounts"
              cancelLabel="Leave it open"
            />
          )}
          {shape === "none" && (
            <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-[11px] leading-snug text-muted-foreground">
              Nothing here. Who may SEE the album is the visibility control
              above (private, password, open), and who may ADD is the
              allowance, the same at every event.
            </p>
          )}
          <p
            data-gv-rows={shape === "two" ? "2" : shape === "one" ? "1" : "0"}
            className="text-sm text-muted-foreground"
          >
            {shape === "two" &&
              "Guests confirm an email to see the full album, and may add straight away."}
            {shape === "one" &&
              "Guests confirm an email to see the full album. Anyone may add."}
            {shape === "none" &&
              "Anyone with the link sees the album and may add."}
          </p>
        </CardContent>
      </Card>
      <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
        {shape === "two" &&
          "Two rows, and the second one re-opens the failure his gate=after ruling closed: a host flips it on, a guest's mail never arrives, and that guest is blocked at the party again."}
        {shape === "one" &&
          `One row, doing the job it was always really doing. Adding is governed by the allowance (${ALLOWANCE.handful} photographs on the dock's answer), which no host has to know about.`}
        {shape === "none" &&
          "No row, and no identity gate anywhere. Every event already set this way opens, which is a change to a promise a host made to their guests."}
      </p>
    </div>
  );
}

/* -- what a signed-out visitor meets -------------------------------------- */

function GuestSide({ shape }: { shape: GateSwitchShape }) {
  const gated = shape !== "none";
  return (
    <div className="relative h-full overflow-hidden">
      <div className={cn("pt-3 pb-2", GUTTER)}>
        <EventBlock count={ALBUM.length} />
      </div>
      <div className={GUTTER}>
        <GuestMasonry items={gated ? ALBUM.slice(0, 4) : ALBUM.slice(0, 12)} />
      </div>
      {gated && (
        <div
          data-gv-teaser
          className="absolute inset-x-0 bottom-0 space-y-1.5 border-t border-border bg-background px-5 pt-3 pb-4"
        >
          <p className="flex items-center gap-1.5 text-[12px] font-medium">
            <Lock className="size-3.5 shrink-0" aria-hidden />
            See all {ALBUM.length} photos
          </p>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Maya asked that guests confirm an email to see the whole album.
            Adding yours needs nothing.
          </p>
        </div>
      )}
      {!gated && (
        <div
          data-gv-open
          className="absolute inset-x-0 bottom-0 border-t border-border bg-background px-5 pt-3 pb-4"
        >
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Eye className="size-3.5 shrink-0" aria-hidden />
            Everything, to anyone holding the link. A host who wanted otherwise
            has a password, or nothing.
          </p>
        </div>
      )}
    </div>
  );
}

export function GateSwitchScreen({
  shape,
  screen,
}: {
  shape: GateSwitchShape;
  screen: ScreenId;
}) {
  const wide = screen === "1440";
  return (
    <div
      className={cn(
        "grid h-screen gap-3 bg-background p-3 text-foreground",
        wide ? "grid-cols-[1.1fr_1fr] grid-rows-[1fr_auto]" : "grid-rows-[1.1fr_1fr_auto]",
      )}
    >
      <Pane label="Maya's settings sheet, the uploads section" tone="host">
        <SettingsSide shape={shape} />
      </Pane>
      <Pane
        label="A signed-out visitor with the link"
        tone={shape === "none" ? "warn" : "plain"}
      >
        <GuestSide shape={shape} />
      </Pane>
      <div className={cn("space-y-2", wide && "col-span-2")}>
        <FrameNote label="What the switch was really doing">
          It gated the VIEW and the UPLOAD under one name. His gate=after ruling
          retires the upload half on its own. Only the view half is still a
          question, and only this decision answers it.
        </FrameNote>
        <FrameNote
          label="Adding, on every answer"
          tone={shape === "two" ? "warn" : "good"}
        >
          <span className="inline-flex items-center gap-1">
            <Plus className="size-2.5 shrink-0" aria-hidden />
            <Users className="size-2.5 shrink-0" aria-hidden />
          </span>{" "}
          {shape === "two"
            ? "Two rows means a host can still block an upload on a mail arriving, which is the one thing his ruling says a guest may never be blocked on."
            : "A guest may always add, up to the allowance, whatever the host has set. That is what his ruling bought."}
        </FrameNote>
      </div>
    </div>
  );
}
