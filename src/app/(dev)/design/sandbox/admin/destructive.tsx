"use client";

import type { ReactNode } from "react";
import { Play, Trash2, Undo2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { floatingPanel } from "@/components/ui/floating-layer";
import { cn } from "@/lib/utils";

import { type Colour, StateChip } from "./state-ui";

/**
 * THREE DESTRUCTIVE MOMENTS, AND WHETHER THEY SHARE A GRAMMAR.
 *
 * The premise in the manifest was that destructive actions are inline forms.
 * Walking the portal says something more awkward: there is no grammar at all.
 * Deleting an account opens a dialog and makes you retype the address
 * (`accounts/[id]/delete-account-control.tsx`); removing a photo opens a dialog
 * and asks nothing (`moderation-grid.tsx`); releasing a legal hold arms in place
 * and needs a second click (`forensics-controls.tsx`); pausing the purge sweep,
 * which stops storage being reclaimed platform-wide, is a bare switch with no
 * confirmation whatever (`jobs/job-controls.tsx`). Four acts, four grammars, and
 * the severity does not line up with the friction: the switch is the cheapest
 * click in the portal and one of the more expensive mistakes.
 *
 * So the decision is which ONE grammar the portal speaks, drawn on three acts
 * whose blast radius differs on purpose: permanent, reversible within a grace,
 * and reversible instantly but expensive while it lasts.
 *
 * ★ THE PANELS ARE STATIC, AND THEY WEAR THE REAL CONTRACT. A radix Dialog
 * portals to `document.body`, which inside a lab frame is the board's body and
 * not the frame's, so the panel would leave the picture entirely. These are
 * drawn in place on `floatingPanel`, the shipped corner, material and light
 * (bible 15, `src/components/ui/floating-layer.ts`), so what is reproduced is
 * the position and nothing that carries a rule.
 */

export type Grammar = "mixed" | "sheet" | "arm";

const ACTS = [
  {
    id: "account",
    title: "Delete an account",
    weight: "Permanent. Nothing comes back.",
  },
  {
    id: "photo",
    title: "Remove a photo",
    weight: "Reversible for seven days, then the bytes are gone.",
  },
  {
    id: "job",
    title: "Pause the purge sweep",
    weight: "Reversible at once, and costly every hour it is off.",
  },
] as const;

function Column({
  title,
  weight,
  children,
}: {
  title: string;
  weight: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{weight}</p>
      </div>
      {children}
    </div>
  );
}

const PANEL = cn(floatingPanel, "grid gap-4 p-4 text-sm");

/* ── Today: whatever each surface happened to grow ───────────────────────── */

function TodayAccount() {
  return (
    <div className={PANEL}>
      <div className="flex flex-col gap-2">
        <p className="font-heading text-card-title">Delete this account?</p>
        <p className="text-muted-foreground">
          Immediate and permanent, exactly as if the account holder had done it
          themselves.
        </p>
      </div>
      <ul className="space-y-2 text-muted-foreground">
        <li>
          Any active subscription is cancelled first. If Stripe refuses, nothing
          is deleted.
        </li>
        <li>
          18 events are binned now and hard-deleted by the next purge run, media
          and objects included.
        </li>
        <li>
          The profile is anonymised immediately and the person can no longer
          sign in.
        </li>
      </ul>
      <div className="space-y-1.5">
        <Label>
          Type{" "}
          <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground tabular-nums">
            grace@whitlockevents.co
          </span>{" "}
          to confirm
        </Label>
        <Input readOnly value="" placeholder="" />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm">
          Cancel
        </Button>
        <Button variant="destructive" size="sm">
          Delete account
        </Button>
      </div>
    </div>
  );
}

function TodayPhoto() {
  return (
    <div className={PANEL}>
      <div className="flex flex-col gap-2">
        <p className="font-heading text-card-title">Remove this photo?</p>
        <p className="text-muted-foreground">
          It disappears from the album immediately. You can restore it for seven
          days, after which the purge deletes it.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm">
          Cancel
        </Button>
        <Button variant="destructive" size="sm">
          Remove
        </Button>
      </div>
    </div>
  );
}

function TodayJob({ armed = false }: { armed?: boolean }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Purge sweep</p>
          <p className="text-xs text-muted-foreground">
            {armed ? "Skips its next run" : "Runs on schedule"}
          </p>
        </div>
        <Switch checked={!armed} aria-label="Purge sweep" />
      </div>
    </div>
  );
}

/* ── One sheet, scaled to the blast radius ───────────────────────────────── */

function Sheet({
  title,
  lede,
  touches,
  typed,
  confirm,
  tone = "destructive",
}: {
  title: string;
  lede: string;
  touches: string[];
  typed?: string;
  confirm: string;
  tone?: "destructive" | "default";
}) {
  return (
    <div className={PANEL}>
      <div className="flex flex-col gap-2">
        <p className="font-heading text-card-title">{title}</p>
        <p className="text-muted-foreground">{lede}</p>
      </div>
      <div className="rounded-lg border bg-muted/50 px-3 py-2.5">
        <p className="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          What this touches
        </p>
        <ul className="space-y-1 text-xs">
          {touches.map((t) => (
            <li key={t} className="flex gap-2">
              <span className="text-muted-foreground">-</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>
      {typed ? (
        <div className="space-y-1.5">
          <Label>
            Type{" "}
            <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground tabular-nums">
              {typed}
            </span>{" "}
            to confirm
          </Label>
          <Input readOnly value="" />
        </div>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm">
          Cancel
        </Button>
        <Button
          variant={tone === "destructive" ? "destructive" : "default"}
          size="sm"
        >
          {confirm}
        </Button>
      </div>
    </div>
  );
}

/* ── Armed in place, and written down afterwards ─────────────────────────── */

function Armed({
  resting,
  armedLabel,
  icon,
  note,
}: {
  resting: string;
  armedLabel: string;
  icon: ReactNode;
  note: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="opacity-60">
          {icon}
          {resting}
        </Button>
        <span className="text-xs text-muted-foreground">then</span>
        <Button variant="destructive" size="sm">
          {icon}
          {armedLabel}
        </Button>
      </div>
      <p className="mt-2.5 text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function AuditLine({ colour }: { colour: Colour }) {
  const rows = [
    {
      at: "14:18",
      what: "Removed 1 photo from Whitlock Events, Summer party",
      level: "warn" as const,
      undo: true,
    },
    {
      at: "11:02",
      what: "Paused Backup prune",
      level: "off" as const,
      undo: true,
    },
    {
      at: "Yesterday",
      what: "Deleted account tomas.berg@example.com",
      level: "fail" as const,
      undo: false,
    },
  ];
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <p className="text-sm font-medium">What you did</p>
        <span className="text-xs text-muted-foreground">
          Every operator action, kept for 90 days
        </span>
      </div>
      <ul className="divide-y">
        {rows.map((r) => (
          <li
            key={r.what}
            className="flex items-center gap-4 px-4 py-2.5 text-sm"
          >
            <span className="w-20 shrink-0 text-xs text-muted-foreground tabular-nums">
              {r.at}
            </span>
            <span className="min-w-0 flex-1 truncate">{r.what}</span>
            <StateChip level={r.level} colour={colour}>
              {r.level === "fail" ? "Permanent" : "Reversible"}
            </StateChip>
            {r.undo ? (
              <Button variant="ghost" size="sm">
                <Undo2 className="size-3.5" />
                Undo
              </Button>
            ) : (
              <Badge variant="outline" className="font-normal">
                Cannot undo
              </Badge>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── The three moments, side by side ─────────────────────────────────────── */

export function AdminDestructive({
  grammar,
  colour,
}: {
  grammar: Grammar;
  colour: Colour;
}) {
  return (
    <div className="ops-scope min-h-screen bg-background p-8 text-foreground">
      <div className="mb-6">
        <p className="font-heading text-subsection">
          One grammar, three blast radii
        </p>
        <p className="text-sm text-muted-foreground">
          The same three acts under each answer: permanent, reversible within a
          grace, and reversible at once but expensive while it lasts.
        </p>
      </div>

      <div className="flex items-start gap-6">
        {grammar === "mixed" ? (
          <>
            <Column {...ACTS[0]}>
              <TodayAccount />
            </Column>
            <Column {...ACTS[1]}>
              <TodayPhoto />
            </Column>
            <Column {...ACTS[2]}>
              <TodayJob />
              <p className="text-xs text-muted-foreground">
                No confirmation at all. One stray click stops storage being
                reclaimed until somebody notices.
              </p>
            </Column>
          </>
        ) : null}

        {grammar === "sheet" ? (
          <>
            <Column {...ACTS[0]}>
              <Sheet
                title="Delete this account?"
                lede="Immediate and permanent, exactly as if the account holder had done it themselves."
                touches={[
                  "1 Pro subscription, cancelled in Stripe first",
                  "18 events and 4,120 photos, binned now",
                  "The profile, anonymised at once",
                  "2 events under legal hold, skipped",
                ]}
                typed="grace@whitlockevents.co"
                confirm="Delete account"
              />
            </Column>
            <Column {...ACTS[1]}>
              <Sheet
                title="Remove this photo?"
                lede="It leaves the album now and you can restore it until the grace ends."
                touches={[
                  "1 photo, hidden from the album and the reel",
                  "Restorable until 22 September",
                  "The guest who uploaded it is not told",
                ]}
                confirm="Remove"
              />
            </Column>
            <Column {...ACTS[2]}>
              <Sheet
                title="Pause the purge sweep?"
                lede="It skips every run until you turn it back on."
                touches={[
                  "No storage is reclaimed while it is off",
                  "About 40 GB a day, at today's rate",
                  "Over-capacity accounts stay blocked",
                ]}
                confirm="Pause the sweep"
                tone="default"
              />
            </Column>
          </>
        ) : null}

        {grammar === "arm" ? (
          <>
            <Column {...ACTS[0]}>
              <Armed
                resting="Delete account"
                armedLabel="Click again to delete, 4s"
                icon={<Trash2 className="size-3.5" />}
                note="No dialog and nothing to type. The second click is the whole confirmation, and the act is written down below."
              />
            </Column>
            <Column {...ACTS[1]}>
              <Armed
                resting="Remove"
                armedLabel="Click again to remove, 4s"
                icon={<Trash2 className="size-3.5" />}
                note="The tile dims while the button is armed, so the photo being removed is never in doubt."
              />
            </Column>
            <Column {...ACTS[2]}>
              <Armed
                resting="Pause"
                armedLabel="Click again to pause, 4s"
                icon={<Play className="size-3.5" />}
                note="The switch becomes a button, because a switch that needs confirming is not a switch."
              />
            </Column>
          </>
        ) : null}
      </div>

      {grammar === "arm" ? (
        <div className="mt-8">
          <AuditLine colour={colour} />
        </div>
      ) : (
        <p className="mt-8 text-xs text-muted-foreground">
          Nothing is written down afterwards. The only record that an operator
          removed a photo or paused a job is the effect itself.
        </p>
      )}
    </div>
  );
}
