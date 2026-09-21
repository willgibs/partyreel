"use client";

import { ArrowRight, Eye, EyeOff, Mail, ShieldCheck, User } from "lucide-react";

import { MediaTile } from "@/components/app/media-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { JUST_ADDED, PEOPLE } from "./fixtures";
import {
  ClaimedSlot,
  FactsPanel,
  FrameNote,
  Pane,
  PersonAvatar,
  type ScreenId,
} from "./page-parts";

/**
 * `address` -- WHAT A TYPED ADDRESS DOES ON AN UNPROVEN SESSION, and it is the
 * decision the other four rest on.
 *
 * ★ THE ONE THING IT IS NOT ASKING. Whether the address is a KEY is settled and
 * drawn beside it as a refusal, not an option: round one's stage showed the
 * takeover, and Supabase's own identity linking refuses to link an unverified
 * email for exactly that reason. So on all three answers below the address
 * authorises nothing and opens nothing. What moves is whether the string exists
 * at all, and who can see it.
 *
 * ★ AND THE TRANSITION RULE IS THE SAME ON ALL THREE, which is why it is a note
 * and not a difference: proof from the SAME device claims that session's rows
 * (the claim we already ship); from another device it claims nothing.
 *
 * ★ `none` IS HALF-SHIPPED ALREADY. His `account=after` ruling moved the
 * account ask off the door and made it a one-tap offer after a guest's first
 * photograph lands. `none` is that ruling carried the rest of the way: the door
 * asks a name, and the only place an address is ever typed is inside the
 * sign-in door, where the code proves it by construction.
 */

export type AddressShape = "none" | "private" | "public";

export const addressOf = (v: string | undefined): AddressShape =>
  v === "private" ? "private" : v === "public" ? "public" : "none";

/* -- the door, as the guest meets it -------------------------------------- */

const DOOR: Record<
  AddressShape,
  { title: string; fields: { icon: "user" | "mail"; label: string; hint: string }[] }
> = {
  none: {
    title: "Add your photos",
    fields: [
      {
        icon: "user",
        label: "What should we call you?",
        hint: "Just a name. Nobody has to prove a name.",
      },
    ],
  },
  private: {
    title: "Add your photos",
    fields: [
      {
        icon: "user",
        label: "What should we call you?",
        hint: "This is the name the album shows.",
      },
      {
        icon: "mail",
        label: "Email, so you can claim these later",
        hint: "We never send to it and never show it to other guests.",
      },
    ],
  },
  public: {
    title: "Add your photos",
    fields: [
      {
        icon: "user",
        label: "Your name or email",
        hint: "Whatever you type is the credit on your photos, marked until you confirm.",
      },
    ],
  },
};

function Door({ shape }: { shape: AddressShape }) {
  const door = DOOR[shape];
  return (
    <div data-gv-door className="flex flex-col gap-3 p-4">
      <p className="text-[13px] font-medium">{door.title}</p>
      {door.fields.map((f) => (
        <div key={f.label} className="space-y-1">
          <label className="flex items-center gap-1.5 text-[11px] font-medium">
            {f.icon === "user" ? (
              <User className="size-3 text-muted-foreground" aria-hidden />
            ) : (
              <Mail className="size-3 text-muted-foreground" aria-hidden />
            )}
            {f.label}
          </label>
          <Input
            readOnly
            className="h-9 text-[13px]"
            defaultValue={
              f.icon === "user"
                ? "Sam"
                : shape === "public"
                  ? ""
                  : "sam.here@example.com"
            }
          />
          <p className="text-[10px] leading-snug text-muted-foreground">
            {f.hint}
          </p>
        </div>
      ))}
      <Button size="sm" className="mt-1 w-full">
        Add photos
        <ArrowRight className="size-3.5" aria-hidden />
      </Button>
      <p
        data-gv-strings={shape === "none" ? "0" : "1"}
        className="text-[10px] leading-snug text-muted-foreground"
      >
        {shape === "none"
          ? "No address is typed here. The only field that ever takes one is the sign-in door, where the code proves it."
          : "One address typed, proved by nothing, stored beside the session."}
      </p>
    </div>
  );
}

/* -- where the string ends up, on three surfaces -------------------------- */

/** One row of the drawn consequence: a surface, and what it holds. */
function Where({
  surface,
  seen,
  children,
}: {
  surface: string;
  seen: "everyone" | "host" | "you" | "nobody";
  children: React.ReactNode;
}) {
  const Icon = seen === "nobody" ? EyeOff : Eye;
  return (
    <div className="space-y-1 rounded-lg border border-border px-2.5 py-2">
      <p className="flex items-center justify-between text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {surface}
        <span className="flex items-center gap-1 normal-case">
          <Icon className="size-2.5" aria-hidden />
          {seen === "everyone"
            ? "every guest"
            : seen === "host"
              ? "the host"
              : seen === "you"
                ? "only you"
                : "nobody"}
        </span>
      </p>
      {children}
    </div>
  );
}

/** Sam's chip in the album's guest list, which is the public surface. */
function PublicChip({ shape }: { shape: AddressShape }) {
  const sam = PEOPLE[1];
  return (
    <span className="flex h-8 w-fit items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1 text-sm">
      <PersonAvatar person={sam} shape="mark" />
      <span className="max-w-44 truncate">
        {shape === "public" ? (sam.claimed ?? sam.name) : sam.name}
      </span>
    </span>
  );
}

/** The host's own lightbox line, where a verified string has always lived. */
function HostLine({ shape }: { shape: AddressShape }) {
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1.5 text-[10px]">
        <ShieldCheck className="size-3 shrink-0 text-success" aria-hidden />
        <span className="text-muted-foreground">Added by</span>
        <span className="font-medium">Priya</span>
        <span className="truncate text-muted-foreground">
          priya@example.com
        </span>
      </p>
      {shape === "none" ? (
        <p className="text-[10px] text-muted-foreground">
          Added by Sam. No address, because none was ever typed.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">
            Added by Sam
          </span>
          <ClaimedSlot address="sam.here@example.com" />
        </div>
      )}
    </div>
  );
}

/** Sam's own tile, the one place a private string could usefully appear. */
function OwnTile({ shape }: { shape: AddressShape }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-16 shrink-0 overflow-hidden rounded-[var(--radius-tile)]">
        <MediaTile item={JUST_ADDED} />
      </div>
      <p className="min-w-0 text-[10px] leading-snug text-muted-foreground">
        {shape === "none" &&
          "Yours on this phone. Keep them for good with one tap, whenever you like."}
        {shape === "private" &&
          "Yours on this phone, kept for sam.here@example.com. Tap to confirm and keep them anywhere."}
        {shape === "public" &&
          "Yours on this phone, and the album shows sam.here@example.com beside them, marked."}
      </p>
    </div>
  );
}

function Consequence({ shape }: { shape: AddressShape }) {
  return (
    <div className="space-y-2 p-3">
      <Where
        surface="The album's guest list"
        seen={shape === "public" ? "everyone" : "everyone"}
      >
        <PublicChip shape={shape} />
        <p className="text-[10px] leading-snug text-muted-foreground">
          {shape === "public"
            ? "The string a stranger typed is public credit, marked. It can be anybody's address."
            : "A name, marked. Nothing unproven is presented as an identity."}
        </p>
      </Where>
      <Where surface="The host's lightbox" seen="host">
        <HostLine shape={shape} />
      </Where>
      <Where surface="Sam's own photos" seen={shape === "none" ? "you" : "you"}>
        <OwnTile shape={shape} />
      </Where>
    </div>
  );
}

/* -- the cost each answer carries ----------------------------------------- */

const COST: Record<AddressShape, { tone: "good" | "warn"; text: string }> = {
  none: {
    tone: "good",
    text: "His cases 1 and 3 cannot be posed: there is no unproven address to reassign and none for two people to share. The cost is that a host loses a hint about who an unproven guest was, and a guest cannot be credited by an address they like.",
  },
  private: {
    tone: "warn",
    text: "A hint for the later claim, and a column. The cost is that a stranger can type anyone's address and the host reads it beside real ones, so the slot has to keep saying typed, for ever, on every surface it reaches.",
  },
  public: {
    tone: "warn",
    text: "His badge world at its fullest. The cost is a rule the product must then keep: proving an address anywhere scrubs every unproven copy of that string, everywhere, or the album shows a stranger wearing someone's address after they have proved it.",
  },
};

export function AddressScreen({
  shape,
  screen,
}: {
  shape: AddressShape;
  screen: ScreenId;
}) {
  const wide = screen === "1440";
  const cost = COST[shape];
  const left = (
    <div className="flex min-h-0 flex-col gap-2">
      <Pane label="The door, as a guest meets it">
        <Door shape={shape} />
      </Pane>
      <Pane label="Where that string ends up" tone={shape === "none" ? "good" : "warn"}>
        <Consequence shape={shape} />
      </Pane>
    </div>
  );
  const right = (
    <div className="flex min-h-0 flex-col gap-2">
      <FrameNote label="Same on all three" tone="plain">
        Proof from this device claims this session&rsquo;s photographs, which is
        the claim we already ship. From any other device it claims nothing.
      </FrameNote>
      <FrameNote label="The cost" tone={cost.tone === "good" ? "good" : "warn"}>
        {cost.text}
      </FrameNote>
      <FactsPanel />
    </div>
  );

  if (!wide) {
    return (
      <div className="h-screen overflow-y-auto bg-background p-3 text-foreground">
        <div className="space-y-2">
          {left}
          {right}
        </div>
      </div>
    );
  }
  return (
    <div
      className={cn(
        "grid h-screen gap-3 bg-background p-3 text-foreground",
        "grid-cols-[1fr_1.15fr]",
      )}
    >
      <div className="min-h-0 overflow-y-auto">{left}</div>
      <div className="min-h-0 overflow-y-auto">{right}</div>
    </div>
  );
}
