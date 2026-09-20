"use client";

import { DoorOpen, MessageSquare, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { Pane, type ScreenId, WallStrip } from "./page-parts";

/**
 * `outage` — WHAT HAPPENS WHEN THE CODE NEVER ARRIVES.
 *
 * ★ HIS FEAR, MEASURED, AND HALF OF IT IS WORSE THAN HE THINKS. He wrote: "at
 * one event on a shared network, either users can't get the email confirm email
 * or we have a problem that stops sending them, blocking everyone from creating
 * an account to upload." Both halves are real and they are DIFFERENT limits,
 * which is why the wall is drawn under all three answers rather than described
 * once: typing the code is capped PER IP and that cap is the one row in
 * Supabase's table we are not allowed to raise, while SENDING the code is
 * capped PROJECT-WIDE, so the wedding next door and every host signing in are
 * spending from the same bucket.
 *
 * ★ EVERY ANSWER HERE IS A REMEDY, NOT A PREVENTION. None of the three makes
 * the limit go away; each one decides who reaches for the switch and when. So
 * each is drawn as the pair that decides it: the HOST's control on one side,
 * the GUEST's door on the other, at the moment the outage is happening.
 *
 * ★ AND `bypass` IS ALREADY SHIPPED, UNDER ANOTHER NAME. "Let anyone upload
 * without confirming" is `allow_anonymous_uploads` turned on, the switch in
 * `uploads-section.tsx` with its own confirm dialog. Drawing it as a new
 * control would be drawing a feature we have; it is here because the question
 * is whether the remedy is that switch, and the answer "yes" costs nothing to
 * build and everything to remember.
 */

export type OutageShape = "bypass" | "window" | "channel";

export const outageOf = (v: string | undefined): OutageShape =>
  v === "window" ? "window" : v === "channel" ? "channel" : "bypass";

/* ── the host's side ─────────────────────────────────────────────────────── */

function SettingRow({
  label,
  desc,
  on,
  children,
}: {
  label: string;
  desc: string;
  on?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
      <div className="min-w-0 space-y-0.5">
        <p className="text-[13px] font-medium">{label}</p>
        <p className="text-[11px] leading-snug text-muted-foreground">{desc}</p>
      </div>
      {children ?? (
        <Switch checked={on} aria-label={label} className="shrink-0" />
      )}
    </div>
  );
}

function HostSide({ shape }: { shape: OutageShape }) {
  return (
    <div className="flex h-full flex-col gap-2.5 overflow-y-auto p-3">
      <SettingRow
        label="Require accounts to upload"
        desc="On: every upload is tied to a confirmed email."
        on={shape !== "bypass"}
      />
      {shape === "bypass" && (
        <p
          data-gv-host-note
          data-gv-remedy="permanent"
          className="rounded-lg bg-warning/10 px-3 py-2 text-[11px] leading-snug text-warning"
        >
          Turned off before the party, or not at all. The protection is off for
          the whole event, and a host who did not foresee tonight has nothing to
          flip.
        </p>
      )}
      {shape === "window" && (
        <>
          <SettingRow
            label="Let everyone in for a while"
            desc="Skip confirmation for new guests, then close it again by itself."
          >
            <Button size="sm" variant="outline" className="shrink-0">
              <Timer /> 3 hours
            </Button>
          </SettingRow>
          <p
            data-gv-host-note
            data-gv-remedy="3 hours"
            className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-[11px] font-medium text-success"
          >
            <DoorOpen className="size-3.5 shrink-0" aria-hidden />
            Open door · 2h 41m left · closes at 11:40pm
          </p>
          <p className="text-[11px] leading-snug text-muted-foreground">
            The host is holding a microphone, not a phone. Somebody has to
            notice and reach for this, which is the one thing it costs.
          </p>
        </>
      )}
      {shape === "channel" && (
        <p
          data-gv-host-note
          data-gv-remedy="per message"
          className="rounded-lg bg-muted/50 px-3 py-2 text-[11px] leading-snug text-muted-foreground"
        >
          Nothing for the host to do or notice, which is the point. The cost
          moves to us: money per message, a phone number is a worse thing to
          hold than an email, and the SMS provider brings limits of its own.
        </p>
      )}
      <div className="mt-auto pt-1">
        <WallStrip />
      </div>
    </div>
  );
}

/* ── the guest's side ────────────────────────────────────────────────────── */

function GuestSide({ shape }: { shape: OutageShape }) {
  return (
    <div className="flex h-full flex-col justify-center gap-3 p-5">
      <p className="text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Almost in
      </p>
      {shape === "channel" ? (
        <>
          <p className="text-[12px] leading-snug text-muted-foreground">
            We sent a code to maya.guest@example.com. Nothing arrived?
          </p>
          <div
            data-gv-code-field
            className="h-10 rounded-lg border border-border"
          />
          <Button size="sm" variant="outline" className="w-full">
            <MessageSquare /> Text me a code instead
          </Button>
          <p className="text-[10px] leading-snug text-warning">
            A phone number is the one thing we have never asked a guest for.
          </p>
        </>
      ) : (
        <>
          <p className="text-[12px] leading-snug text-muted-foreground">
            The host has opened the door. Add your name and start adding photos.
          </p>
          <div className="h-10 rounded-lg border border-border" />
          <Button size="sm" className="w-full">
            Add photos
          </Button>
          <p className="text-[10px] leading-snug text-muted-foreground">
            {shape === "window"
              ? "No code, for the next 2h 41m. After that the gate is back."
              : "No code, for the whole event."}
          </p>
        </>
      )}
    </div>
  );
}

export function OutageScreen({
  shape,
  screen,
}: {
  shape: OutageShape;
  screen: ScreenId;
}) {
  const wide = screen === "1440";
  return (
    <div
      className={cn(
        "grid h-screen gap-3 bg-background p-3 text-foreground",
        wide ? "grid-cols-[1.35fr_1fr]" : "grid-rows-[1.5fr_1fr]",
      )}
    >
      <Pane label="What the host holds" tone="host">
        <HostSide shape={shape} />
      </Pane>
      <Pane label="What the guest meets, mid-outage">
        <GuestSide shape={shape} />
      </Pane>
    </div>
  );
}
