"use client";

import { ArrowDown, Ban, Images, ShieldAlert, ShieldCheck } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { COLLISION } from "./fixtures";
import { Pane, type ScreenId } from "./page-parts";

/**
 * `collision` — TWO PEOPLE, ONE ADDRESS, AND WHERE THE PHOTOGRAPHS ARE BOUND.
 *
 * ★ THE GOAL'S OWN INSTRUCTION, AND THE REASON THIS FILE IS A DIAGRAM RATHER
 * THAN A SCREEN: "the collision is about sessions, not emails". There is no
 * screen on which the difference between these three answers is visible — all
 * three look like an ordinary door to the person standing at it — so drawing
 * three doors would be drawing three identical pictures. What differs is where
 * five photographs END UP, and that is a diagram or it is nothing.
 *
 * ★ WHY THE MIDDLE ANSWER IS A REAL TAKEOVER AND NOT A HYPOTHETICAL.
 * `signInWithOtp({ shouldCreateUser: true })` creates the `auth.users` row at
 * SEND time, with `email_confirmed_at` null. Today that row can never hold a
 * session or an upload, so nothing accretes on it. The moment an unproven
 * address may upload, `email` binding means A's photographs hang off the row
 * for bob@example.com — and when the real Bob types the same address and
 * verifies, GoTrue hands him THAT row. He does not get a similar account. He
 * gets the account, and everything on it. Supabase's own identity linking
 * refuses to link an unverified email for exactly this reason
 * (auth-accounts.md); `email` would re-open the hole one layer up.
 *
 * ★ AND `session` IS ALREADY BUILT. An anonymous guest row plus
 * `claimAnonymousUploads` is today's path for an open event, and the four-second
 * hold in `AccountDoor`'s existing-account line exists because that claim is
 * permanent. This answer adds a label, not a mechanism.
 */

export type CollisionShape = "session" | "email" | "refuse";

export const collisionOf = (v: string | undefined): CollisionShape =>
  v === "email" ? "email" : v === "refuse" ? "refuse" : "session";

/* ── the diagram's pieces ────────────────────────────────────────────────── */

function Who({
  label,
  seed,
  line,
  uploads,
}: {
  label: string;
  seed: string;
  line: string;
  uploads: number;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
      <Avatar size="lg" seed={seed}>
        <AvatarFallback className="text-xs">{label.slice(0, 1)}</AvatarFallback>
      </Avatar>
      <p className="text-[11px] leading-tight font-medium">{label}</p>
      <p className="text-[10px] leading-tight text-muted-foreground">{line}</p>
      {uploads > 0 && (
        <p className="flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          <Images className="size-2.5" aria-hidden />
          {uploads} photos
        </p>
      )}
    </div>
  );
}

function Arrow({
  label,
  tone = "plain",
}: {
  label: string;
  tone?: "plain" | "warn" | "stop";
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-1">
      {tone === "stop" ? (
        <Ban className="size-4 text-destructive" aria-hidden />
      ) : (
        <ArrowDown
          className={cn(
            "size-4",
            tone === "warn" ? "text-warning" : "text-muted-foreground",
          )}
          aria-hidden
        />
      )}
      <span
        className={cn(
          "text-center text-[10px] leading-tight",
          tone === "warn"
            ? "text-warning"
            : tone === "stop"
              ? "text-destructive"
              : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}

/** Where the photographs live, and what it is keyed on. */
function Vault({
  title,
  keyed,
  holds,
  photos,
  bob,
  tone = "plain",
}: {
  title: string;
  keyed: string;
  holds: string;
  /** How many of the five photographs sit in this box. */
  photos: number;
  /** Whether the real Bob's confirmed code opens it. */
  bob: boolean;
  tone?: "plain" | "warn";
}) {
  return (
    <div
      data-gv-vault
      data-gv-photos={photos}
      data-gv-bob={bob ? "yes" : "no"}
      className={cn(
        "rounded-lg border px-3 py-2 text-center",
        tone === "warn"
          ? "border-warning/50 bg-warning/10"
          : "border-border bg-muted/40",
      )}
    >
      <p className="text-[11px] font-medium">{title}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{keyed}</p>
      <p
        className={cn(
          "mt-1 text-[10px] font-medium",
          tone === "warn" ? "text-warning" : "text-foreground",
        )}
      >
        {holds}
      </p>
    </div>
  );
}

/** The one line that says what the answer costs, drawn as the diagram's foot. */
function Verdict({ safe, text }: { safe: boolean; text: string }) {
  return (
    <p
      data-gv-verdict
      className={cn(
        "mt-auto flex items-start gap-2 rounded-lg px-3 py-2 text-[11px] leading-snug",
        safe
          ? "bg-success/10 text-success"
          : "bg-destructive/10 text-destructive",
      )}
    >
      {safe ? (
        <ShieldCheck className="mt-px size-3.5 shrink-0" aria-hidden />
      ) : (
        <ShieldAlert className="mt-px size-3.5 shrink-0" aria-hidden />
      )}
      <span>{text}</span>
    </p>
  );
}

/* ── the three lanes ─────────────────────────────────────────────────────── */

function SessionLane() {
  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col">
          <Who
            label={COLLISION.first.label}
            seed={COLLISION.first.seed}
            line={`typed ${COLLISION.address}, never confirmed`}
            uploads={COLLISION.first.uploads}
          />
          <Arrow label="bound to this browser" />
          <Vault
            title="Guest row"
            keyed="session_token · user_id null"
            holds="5 photos"
            photos={5}
            bob={false}
          />
        </div>
        <div className="flex flex-col">
          <Who
            label={COLLISION.real.label}
            seed={COLLISION.real.seed}
            line={`types ${COLLISION.address}, confirms`}
            uploads={COLLISION.real.uploads}
          />
          <Arrow label="a guest row of his own" />
          <Vault
            title="Guest row"
            keyed="session_token · user_id set"
            holds="0 photos"
            photos={0}
            bob
          />
        </div>
      </div>
      <Verdict
        safe
        text="Bob gets nothing of theirs. The address was a label, never a key: confirming from the SAME browser claims those five (the claim we already ship); from any other, they stay anonymous and `expiry` decides their end."
      />
    </div>
  );
}

function EmailLane() {
  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="grid grid-cols-2 gap-3">
        <Who
          label={COLLISION.first.label}
          seed={COLLISION.first.seed}
          line={`typed ${COLLISION.address}, never confirmed`}
          uploads={COLLISION.first.uploads}
        />
        <Who
          label={COLLISION.real.label}
          seed={COLLISION.real.seed}
          line={`types ${COLLISION.address}, confirms`}
          uploads={COLLISION.real.uploads}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Arrow label="attaches on typing" tone="warn" />
        <Arrow label="the code opens it" tone="warn" />
      </div>
      <Vault
        title={`One account · ${COLLISION.address}`}
        keyed="auth.users row, created at SEND time"
        holds="5 photos, and Bob now holds the key"
        photos={5}
        bob
        tone="warn"
      />
      <Verdict
        safe={false}
        text="Bob does not get a similar account. GoTrue hands him THAT row, with five photographs he never took, and the claim never re-stamps an owned row, so it cannot be undone. This is the takeover Supabase's own identity linking refuses unverified emails to prevent."
      />
    </div>
  );
}

function RefuseLane() {
  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col">
          <Who
            label={COLLISION.first.label}
            seed={COLLISION.first.seed}
            line={`types ${COLLISION.address} second`}
            uploads={0}
          />
          <Arrow label="refused at the door" tone="stop" />
          <Vault
            title="Nothing minted"
            keyed="no guest row, no session"
            holds="0 photos"
            photos={0}
            bob={false}
          />
        </div>
        <div className="flex flex-col">
          <Who
            label={COLLISION.real.label}
            seed={COLLISION.real.seed}
            line={`typed ${COLLISION.address} first`}
            uploads={COLLISION.real.uploads}
          />
          <Arrow label="waiting on a code" />
          <Vault
            title="Unconfirmed, waiting"
            keyed="auth.users row, no session"
            holds="0 photos"
            photos={0}
            bob
          />
        </div>
      </div>
      <Verdict
        safe={false}
        text="Nothing to inherit, and nothing to upload either: a guest whose own address was typed by someone else five minutes ago is out. And the refusal itself tells a stranger the address exists, which is the enumeration oracle every other door in the product is built to avoid."
      />
    </div>
  );
}

/* ── the door the second person meets ────────────────────────────────────── */

function SecondDoor({ shape }: { shape: CollisionShape }) {
  const refused = shape === "refuse";
  return (
    <div className="flex h-full flex-col justify-center gap-3 p-5">
      <p className="text-[11px] font-medium">
        {refused
          ? "That address is already waiting to be confirmed"
          : "Check your email"}
      </p>
      <p className="text-[11px] text-muted-foreground">
        {refused
          ? "Someone entered this address a few minutes ago. Use a different one, or wait for that code to be used."
          : `We sent a code to ${COLLISION.address}. Enter it to keep your photos.`}
      </p>
      <div
        className={cn(
          "flex h-10 items-center rounded-lg border px-3 text-[11px]",
          refused
            ? "border-destructive/50 bg-destructive/5 text-destructive"
            : "border-border text-muted-foreground",
        )}
      >
        {refused ? "Use another address" : "· · · · · ·"}
      </div>
      <p className="text-[10px] text-muted-foreground">
        {refused
          ? "The one option that puts a new dead end in front of a real guest."
          : "Identical on both other answers: the door never changes, only where the photos land."}
      </p>
    </div>
  );
}

export function CollisionScreen({
  shape,
  screen,
}: {
  shape: CollisionShape;
  screen: ScreenId;
}) {
  const wide = screen === "1440";
  const lane =
    shape === "session" ? (
      <SessionLane />
    ) : shape === "email" ? (
      <EmailLane />
    ) : (
      <RefuseLane />
    );
  return (
    <div
      className={cn(
        "grid h-screen gap-3 bg-background p-3 text-foreground",
        wide ? "grid-cols-[1.9fr_1fr]" : "grid-rows-[1.85fr_1fr]",
      )}
    >
      <Pane
        label="Where the five photographs end up"
        tone={shape === "session" ? "plain" : "warn"}
      >
        {lane}
      </Pane>
      <Pane label="What the second person is told">
        <SecondDoor shape={shape} />
      </Pane>
    </div>
  );
}
