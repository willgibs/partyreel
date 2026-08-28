"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

import {
  CONTACT_TOPICS,
  type ContactTopicValue,
} from "@/lib/constants/contact";
import { marketingImage } from "@/lib/constants/marketing-media";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * Touchpoint: CONTACT IDENTITY (the contact round REDO, 2026-08-28).
 *
 * Will's verdict on the first build: "super bland... wireframe feel... did not
 * follow 'if this page didn't already exist, what's the ideal version?'" The
 * IA survives (topic router, help search, directory); the VISUAL IDENTITY is
 * re-designed from zero here. Three full form-chapter directions, each with
 * its own topic-router treatment, all obeying the type corrections from the
 * verdict: real headings (no display-face-at-body-size), no mono links, media
 * on a media product.
 *
 *  V1 THE NOTE — the form as a stationery artifact: letterhead, a photo
 *     postage stamp (the one media gesture), "Re:" topic chips, a PS line for
 *     plain email. Centered single path; charm from the artifact.
 *  V2 THE DESK — the media split: heading + a fanned photo spread + the
 *     contact facts fill the left column (the void that killed the first
 *     build), the form on elevated paper right. Warmth from photography.
 *  V3 THE LEDGER — bare paper, no card: topics as an editorial numbered
 *     index, fields directly on the page, facts as hairline definition rows.
 *     The most Biograph; texture from type alone.
 */

const REPLY_LINE = "Every note gets a reply, usually within a day.";

function Frame({
  name,
  note,
  children,
}: {
  name: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className="font-heading text-lg font-medium">{name}</h3>
        <p className="max-w-2xl text-sm text-pretty text-muted-foreground">
          {note}
        </p>
      </div>
      {/* surface-paper so every frame is token-truthful to the real page. */}
      <div className="surface-paper overflow-hidden rounded-2xl border bg-background p-6 text-foreground sm:p-10">
        {children}
      </div>
    </section>
  );
}

function Fields({ bare = false }: { bare?: boolean }) {
  const field = bare
    ? "h-11 rounded-none border-0 border-b bg-transparent px-0 text-base shadow-none focus-visible:ring-0 focus-visible:border-foreground md:text-base"
    : "h-11 rounded-xl text-base md:text-base";
  const area = bare
    ? "min-h-32 rounded-none border-0 border-b bg-transparent px-0 text-base shadow-none focus-visible:ring-0 focus-visible:border-foreground md:text-base"
    : "min-h-32 rounded-xl text-base md:text-base";
  const label = bare
    ? "text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase"
    : "text-sm font-medium";
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className={label}>Name</label>
          <Input className={field} placeholder="Your name" />
        </div>
        <div className="flex flex-col gap-2">
          <label className={label}>Email</label>
          <Input className={field} type="email" placeholder="you@example.com" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className={label}>
          Subject{" "}
          <span className="font-normal normal-case text-muted-foreground">
            (optional)
          </span>
        </label>
        <Input className={field} placeholder="One line, if it helps" />
      </div>
      <div className="flex flex-col gap-2">
        <label className={label}>Message</label>
        <Textarea className={area} placeholder="What's going on?" />
      </div>
    </>
  );
}

function useHint(picked: ContactTopicValue | null) {
  return CONTACT_TOPICS.find((t) => t.value === picked)?.hint ?? null;
}

function HintLine({ picked }: { picked: ContactTopicValue | null }) {
  const hint = useHint(picked);
  if (!hint) return null;
  return (
    <p
      key={picked}
      className="text-sm text-pretty text-muted-foreground duration-200 animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none"
    >
      {hint.text}{" "}
      <span className="font-medium text-foreground underline underline-offset-4">
        {hint.linkLabel}
      </span>
    </p>
  );
}

/* ── V1 · THE NOTE ─────────────────────────────────────────────────────── */

function TheNote() {
  const [picked, setPicked] = useState<ContactTopicValue | null>(null);
  const stamp = marketingImage("party-balloons");
  return (
    <div className="mx-auto max-w-xl">
      <div className="relative rounded-2xl border bg-card p-6 shadow-float ring-1 ring-foreground/5 sm:p-8">
        {/* The postage stamp: one photo, white border, a hair of rotation.
            The single media gesture that makes it stationery, not a widget. */}
        <div className="absolute -top-4 right-6 rotate-3">
          <Image
            src={stamp.src}
            alt=""
            width={64}
            height={64}
            className="size-16 rounded-[4px] border-4 border-background object-cover shadow-lg"
          />
        </div>
        <MonoCaption>A note to Partyreel</MonoCaption>
        <h2 className="mt-2 font-heading text-2xl tracking-tight sm:text-3xl">
          Send a note
        </h2>
        <div className="mt-6 flex flex-col gap-5">
          {/* Re: — the topic line reads like correspondence. */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            <span className="text-sm font-medium text-muted-foreground">
              Re:
            </span>
            {CONTACT_TOPICS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setPicked(t.value)}
                className={cn(
                  "ease-emphasis h-8 rounded-full border px-3 text-sm transition-[background-color,border-color,color,transform] duration-150 select-none active:scale-[0.96] motion-reduce:transition-none",
                  picked === t.value
                    ? "border-foreground bg-foreground font-medium text-background"
                    : "bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <HintLine picked={picked} />
          <Fields />
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <Button size="lg" className="h-11 px-6 text-base">
              Send message
            </Button>
            <p className="text-xs text-muted-foreground">{REPLY_LINE}</p>
          </div>
        </div>
      </div>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        PS: plain email works too.{" "}
        <span className="font-medium text-foreground underline underline-offset-4">
          help@partyreel.com
        </span>
      </p>
    </div>
  );
}

/* ── V2 · THE DESK ─────────────────────────────────────────────────────── */

const DESK_SPREAD = [
  { id: "wedding-golden", rotate: -7, x: -6 },
  { id: "party-dj", rotate: 2, x: 0 },
  { id: "festival-lights", rotate: 8, x: 6 },
] as const;

function TheDesk() {
  const [picked, setPicked] = useState<ContactTopicValue | null>(null);
  return (
    <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-14">
      <div className="flex flex-col">
        <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
          Send a note
        </h2>
        <p className="mt-3 max-w-sm text-pretty text-muted-foreground">
          Pick a topic so it lands in the right place, say what&rsquo;s going
          on, and that&rsquo;s it.
        </p>
        {/* The spread: the photos a note is ABOUT. Fills the column that sat
            empty in the first build; the one place color lives. */}
        <div aria-hidden className="group relative mt-10 h-44">
          {DESK_SPREAD.map((s, i) => {
            const m = marketingImage(s.id);
            return (
              <div
                key={s.id}
                className="absolute top-0 transition-transform duration-300 ease-emphasis group-hover:translate-y-[calc(var(--dy)*-1)] motion-reduce:transition-none"
                style={{
                  left: `${14 + i * 26}%`,
                  transform: `rotate(${s.rotate}deg) translateX(${s.x}px)`,
                  "--dy": `${4 + i * 2}px`,
                  zIndex: i,
                } as React.CSSProperties}
              >
                <Image
                  src={m.src}
                  alt=""
                  width={132}
                  height={132}
                  className="size-32 rounded-md border-4 border-background object-cover shadow-lg"
                />
              </div>
            );
          })}
        </div>
        <dl className="mt-auto flex flex-col gap-3 border-t pt-6 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">Plain email</dt>
            <dd className="font-medium underline underline-offset-4">
              help@partyreel.com
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">Reply time</dt>
            <dd className="text-pretty">Usually within a day</dd>
          </div>
        </dl>
      </div>
      <div className="rounded-2xl border bg-card p-6 shadow-float ring-1 ring-foreground/5 sm:p-8">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">What&rsquo;s this about?</p>
            <div className="flex flex-wrap gap-2">
              {CONTACT_TOPICS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setPicked(t.value)}
                  className={cn(
                    "ease-emphasis inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-[background-color,border-color,color,transform] duration-150 select-none active:scale-[0.96] motion-reduce:transition-none",
                    picked === t.value
                      ? "border-foreground bg-foreground font-medium text-background"
                      : "bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                  )}
                >
                  <t.icon aria-hidden className="size-3.5" strokeWidth={1.5} />
                  {t.label}
                </button>
              ))}
            </div>
            <HintLine picked={picked} />
          </div>
          <Fields />
          <Button size="lg" className="h-11 self-start px-6 text-base">
            Send message
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── V3 · THE LEDGER ───────────────────────────────────────────────────── */

function TheLedger() {
  const [picked, setPicked] = useState<ContactTopicValue | null>(null);
  const hint = useHint(picked);
  return (
    <div className="mx-auto max-w-xl">
      <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
        What&rsquo;s this about?
      </h2>
      {/* The index: numbered, editorial, two columns. Selection = ink. */}
      <div className="mt-8 grid gap-x-8 sm:grid-cols-2">
        {CONTACT_TOPICS.map((t, i) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setPicked(t.value)}
            className={cn(
              "ease-emphasis group flex items-baseline gap-3 border-b py-3 text-left transition-colors duration-150 select-none motion-reduce:transition-none",
              picked === t.value
                ? "border-foreground"
                : "hover:border-foreground/40",
            )}
          >
            <span
              className={cn(
                "font-heading text-sm tabular-nums transition-colors duration-150",
                picked === t.value
                  ? "text-foreground"
                  : "text-muted-foreground/60",
              )}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className={cn(
                "text-base transition-colors duration-150",
                picked === t.value
                  ? "font-medium text-foreground"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            >
              {t.label}
            </span>
          </button>
        ))}
      </div>
      {hint && (
        <p
          key={picked}
          className="mt-4 text-sm text-pretty text-muted-foreground duration-200 animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none"
        >
          {hint.text}{" "}
          <span className="font-medium text-foreground underline underline-offset-4">
            {hint.linkLabel}
          </span>
        </p>
      )}
      <div className="mt-10 flex flex-col gap-6">
        <Fields bare />
        <Button size="lg" className="h-12 w-full text-base">
          Send message
        </Button>
      </div>
      <dl className="mt-10 flex flex-col text-sm">
        <div className="flex items-baseline justify-between gap-4 border-t py-3">
          <dt className="text-muted-foreground">Plain email</dt>
          <dd className="font-medium underline underline-offset-4">
            help@partyreel.com
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 border-t py-3">
          <dt className="text-muted-foreground">Reply time</dt>
          <dd>Usually within a day</dd>
        </div>
      </dl>
    </div>
  );
}

export function ContactIdentityVariants() {
  return (
    <div className="flex flex-col gap-12">
      <Frame
        name="V1 · The note"
        note="The form as stationery: a letterhead, a photo postage stamp, topics as a Re: line, plain email as the PS. Centered single path; the self-serve band and close follow unchanged below it."
      >
        <TheNote />
      </Frame>
      <Frame
        name="V2 · The desk"
        note="The media split: heading, a fanned photo spread, and the contact facts fill the left column; the form keeps its elevated card on the right. The spread is where the page's color lives."
      >
        <TheDesk />
      </Frame>
      <Frame
        name="V3 · The ledger"
        note="Bare paper, no card: topics as a numbered editorial index, underline fields directly on the page, facts as hairline rows. The most Biograph of the three; texture comes from type alone."
      >
        <TheLedger />
      </Frame>
    </div>
  );
}
