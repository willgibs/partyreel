"use client";

// the board's own sheet; it leaves with the board when the ruling lands.
import "./board.css";

import { useState } from "react";

import {
  BoardMeta,
  Stage,
  Toggle,
  type Ground,
  type Mode,
} from "@/components/dev/board";
import { PageHero } from "@/components/marketing/system/page-hero";
import { SectionShell } from "@/components/marketing/system/section-shell";

import { Variant } from "../variant-frame";
import {
  FIVE_PICKS,
  HEADER_APPETITE,
  HEADER_ORDER,
  QUIET_SURFACES,
  REGISTERS,
  UNFURL,
  VOICES,
  voiceById,
  type HeaderKey,
  type Voice,
  type VoiceId,
} from "./voices";

/**
 * THE BRAND-VOICE BOARD (the review wave, 2026-09-14). The voice as a guide
 * with do's, shown three ways beside today's on the real marketing shells.
 *
 * The brief, the facts and the lane are in docs/tracks/brand-voice.md; the
 * guide itself is docs/specs/brand-voice.md (a proposal until Will rules). The
 * lines live in ./voices.ts so this file is layout only. Nothing here is
 * imported by production and no production byte changed on this track.
 *
 * Rising tides (bible 22): the three candidates span tune-to-replace. A is the
 * ratified register written down and tuned; B rebuilds the voice from the
 * product's one idea (the code becoming the album); C replaces the subject of
 * a sentence with the people and rewrites a RULED line, flagged in BoardMeta.
 *
 * ★ WHY THE STAGES FORCE data-inview: the marketing reveal grammar rests every
 * [data-mkt-reveal] slot at opacity 0 in BOTH motion preferences (marketing.css
 * chapter 1) and waits on the Reveal island. This is a READING board, so a
 * subhead that has to be scrolled into view is a subhead Will cannot rule on.
 * The wrapper sets the final state the CSS already defines, which is the house
 * convention (final states outside the media queries) rather than an override.
 * The sections take reveal="none" for the same reason, through the real prop.
 *
 * ★ WHY THE SECTIONS ARE py-8: the board judges the LINE, not the arc's
 * vertical rhythm, which belongs to the home page and is ruled elsewhere. The
 * type, the ground and the heading tiers are the real ones; only the air
 * between sections is compressed so four sections read side by side.
 */

const INTRO = [
  "There is no voice doc anywhere in the repo. The only written copy rule is the em-dash ban, so the voice is whatever the eight lines Will ratified in 2026-07-08 happen to have in common. Bible 20 was reviewed as messy (don'ts with no do's) and bible 21 opened every line until the voice exists. This board writes the voice and shows it on the real shells.",
  "Three candidates, spanning the range. A tunes the register the ratified lines already speak. B rebuilds it from the product's one idea, the code becoming the album, with new sentence shapes. C replaces the subject of a sentence with the people who were in the room, and rewrites the ruled thesis to do it.",
  "The worked example is the home arc's seven provisional headers, each with Will's recorded appetite beside it. The quiet surfaces are shown once, because the guide's claim is that they do not fork with the voice. The guide itself is docs/specs/brand-voice.md.",
];

const QUESTION =
  "The voice as a guide with do's (its three registers, the sentence shapes, examples per surface), shown as sample headings and lines beside today's on real section shells.";

const ASKS = [
  "The voice: today, A the house, B the room, or C the guest list (the agent recommends B, with A second)",
  "The seven provisional home headers in the ruled voice, or line by line from any column",
  "The account-required unfurl line: asks for an email, or asks to sign in with an email (the agent recommends asks for an email)",
  "Bible 20's replacement: lead with what arrives, an absence may be the second beat and never the first",
];

const DEPARTURES = [
  "Bible 20 as written blocks a RULED line. \"Say who we are, never who we are not\" reads on \"Scan, upload, done. No app to install.\" (ruled 2026-08-25) and on the whole no-app argument, the product's sharpest differentiator. The rule's target was a fenced use case, a host told to leave; an absence that IS the feature is a different thing. The guide proposes the sharper do, ask 4.",
  "Candidate C rewrites SITE_THESIS, ruled 2026-08-25: \"The whole event, in one album.\" becomes \"The whole event, as everyone saw it.\" An album is a container anyone can offer; the same event from every camera in the room is only ours. The cadence is kept, so the ruling is one clause.",
  "The five copy-alternative picks have lost their list: the queue item predates the docs consolidation and no list survives in the repo. The board reads it as the five headers carrying an appetite for a DIFFERENT line (liveDemo, album, curation, privacy, reel), alongside noApp and fullQuality, Will's own lines pending a ruling. Marked with a dot below. Correct it and the board adds the missing picks.",
];

const VOICE_OPTIONS = VOICES.map((v) => ({ id: v.id, label: v.name }));

const CINEMA_KEYS: HeaderKey[] = ["noApp", "fullQuality", "liveDemo"];
const PAPER_KEYS: HeaderKey[] = ["album", "curation", "privacy", "reel"];

/** The heading tier and alignment each section really ships at (SECTION_HEADERS'
 *  notes: liveDemo is chapter 1's centred lg anchor, album the paper chapter's
 *  left masthead at lg). Everything else is the body-section h2. */
const SECTION_SHAPE: Partial<
  Record<HeaderKey, { scale?: "lg"; align?: "left" }>
> = {
  liveDemo: { scale: "lg" },
  album: { scale: "lg", align: "left" },
};

function headerSection(voice: Voice, key: HeaderKey) {
  const shape = SECTION_SHAPE[key] ?? {};
  return (
    <SectionShell
      key={key}
      className="py-8"
      reveal="none"
      scale={shape.scale ?? "default"}
      align={shape.align ?? "center"}
      heading={voice.headers[key]}
    />
  );
}

/** The comparison Will rules on: the key, his appetite, today's line, the
 *  candidate's. A dot marks one of the five picks. */
function LineDiff({ voice, keys }: { voice: Voice; keys: HeaderKey[] }) {
  const today = voiceById("today");
  return (
    <dl className="mt-3 space-y-2.5 text-xs">
      {keys.map((key) => (
        <div key={key} className="space-y-1">
          <dt className="flex flex-wrap items-baseline gap-x-2 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">{key}</span>
            {FIVE_PICKS.includes(key) && (
              <span
                title="one of the five copy-alternative picks"
                className="inline-block size-1.5 rounded-full bg-foreground/60"
              />
            )}
            <span>{HEADER_APPETITE[key]}</span>
          </dt>
          <dd className="grid gap-x-3 gap-y-0.5 sm:grid-cols-[5rem_minmax(0,1fr)]">
            <span className="text-[11px] text-muted-foreground">Today</span>
            <span className="text-muted-foreground">
              {today.headers[key]}
            </span>
            {voice.id !== "today" && (
              <>
                <span className="text-[11px] text-muted-foreground">
                  {voice.name}
                </span>
                <span className="text-foreground">{voice.headers[key]}</span>
              </>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function HeaderStage({
  voice,
  mode,
  ground,
  keys,
  height,
}: {
  voice: Voice;
  mode: Mode;
  ground: Ground;
  keys: HeaderKey[];
  height: number;
}) {
  return (
    <Stage mode={mode} ground={ground} height={height}>
      <div
        key={voice.id}
        data-inview="true"
        data-bv-swap
        className="flex h-full flex-col justify-center"
      >
        {keys.map((key) => headerSection(voice, key))}
      </div>
    </Stage>
  );
}

export function BrandVoiceBoard() {
  const [mode, setMode] = useState<Mode>("desktop");
  const [voiceId, setVoiceId] = useState<VoiceId>("room");
  const voice = voiceById(voiceId);
  const desktop = mode === "desktop";

  return (
    <div className="flex flex-col gap-8 py-4">
      <div className="max-w-2xl space-y-3 text-xs leading-relaxed text-muted-foreground">
        {INTRO.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Toggle
          ariaLabel="Viewport"
          options={[
            { id: "desktop" as Mode, label: "Desktop" },
            { id: "phone" as Mode, label: "Phone 375" },
          ]}
          value={mode}
          onChange={setMode}
        />
        <Toggle
          ariaLabel="Voice"
          options={VOICE_OPTIONS}
          value={voiceId}
          onChange={setVoiceId}
        />
      </div>

      <Variant
        n={1}
        name="The voice, in one paragraph"
        rationale="The first ask. The three registers below are shown once, because the guide's claim is that they do not fork with the voice: only the marketing register's default sentence shape moves."
        framed={false}
      >
        <div className="space-y-5">
          <div
            key={voice.id}
            data-bv-swap
            className="rounded-lg border border-border bg-card px-5 py-4"
          >
            <p className="text-[11px] font-medium text-muted-foreground">
              {voice.name}
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground">
              {voice.paragraph}
            </p>
            <p className="mt-3 max-w-3xl text-xs leading-relaxed text-muted-foreground">
              {voice.rationale}
            </p>
          </div>
          <dl className="grid gap-3 sm:grid-cols-3">
            {REGISTERS.map((r) => (
              <div
                key={r.name}
                className="rounded-lg border border-border bg-card px-4 py-3"
              >
                <dt className="text-xs font-medium text-foreground">
                  {r.name}
                </dt>
                <dd className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {r.rule}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Variant>

      <Variant
        n={2}
        name="The hero, on cinema"
        rationale="The voice at its loudest, on the real PageHero at the cinema ramp. The h1 is the whole product in one line; the subhead is the mechanism in one sentence."
        framed={false}
      >
        <div className="space-y-3">
          <Stage mode={mode} ground="cinema" height={desktop ? 520 : 720}>
            <div
              key={voice.id}
              data-inview="true"
              data-bv-swap
              className="flex h-full items-center"
            >
              <PageHero
                className="w-full"
                scale="xl"
                heading={voice.hero.h1}
                subhead={voice.hero.sub}
              />
            </div>
          </Stage>
          <div className="grid gap-x-3 text-xs text-muted-foreground sm:grid-cols-[4rem_minmax(0,1fr)]">
            <p className="text-[11px]">Today</p>
            <p>
              <span className="text-foreground">
                {voiceById("today").hero.h1}
              </span>{" "}
              {voiceById("today").hero.sub}
            </p>
          </div>
        </div>
      </Variant>

      <Variant
        n={3}
        name="Chapter 1, on cinema"
        rationale="The first three provisional headers on the real SectionShell, in arc order. liveDemo runs at the lg tier, chapter 1's closing anchor."
        framed={false}
      >
        <div>
          <HeaderStage
            voice={voice}
            mode={mode}
            ground="cinema"
            keys={CINEMA_KEYS}
            height={desktop ? 440 : 540}
          />
          <LineDiff voice={voice} keys={CINEMA_KEYS} />
        </div>
      </Variant>

      <Variant
        n={4}
        name="The paper chapter and the close"
        rationale="The remaining four on paper. album is the paper chapter's opener, a left masthead at the lg tier; the other three are body sections."
        framed={false}
      >
        <div>
          <HeaderStage
            voice={voice}
            mode={mode}
            ground="paper"
            keys={PAPER_KEYS}
            height={desktop ? 600 : 700}
          />
          <LineDiff voice={voice} keys={PAPER_KEYS} />
        </div>
      </Variant>

      <Variant
        n={5}
        name="A feature card"
        rationale="The hub door's directory line, read in a row of six. One line, no verb in front (the card's title already carries the name), and different from its neighbours in substance rather than wording. The photograph is the real door's; the board judges the line."
        framed={false}
      >
        <Stage mode={mode} ground="paper" height={desktop ? 260 : 320}>
          <div
            key={voice.id}
            data-bv-swap
            className="flex h-full items-center justify-center px-8"
          >
            <div className="w-full max-w-sm rounded-[var(--radius)] border border-border bg-card p-5">
              <div className="mb-4 h-24 rounded-[var(--radius-tile)] bg-muted" />
              <p className="font-heading text-xl">The live album</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {voice.card}
              </p>
            </div>
          </div>
        </Stage>
      </Variant>

      <Variant
        n={6}
        name="The quiet surfaces, shown once"
        rationale="A help article head, an app label, an email subject and an error, today beside the guide's rule. Three of the four do not change: that is the finding, not an omission. The registers are the guide's, not the candidate's."
        framed={false}
      >
        <Stage mode={mode} ground="app-light" height={desktop ? 660 : 1180}>
          <div className="h-full px-8 py-6">
            <dl className="flex flex-col gap-3">
              {QUIET_SURFACES.map((s) => (
                <div
                  key={s.surface}
                  className="rounded-lg border border-border bg-card px-4 py-3"
                >
                  <dt className="text-[11px] font-medium text-foreground">
                    {s.surface}
                  </dt>
                  <dd className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {s.rule}
                  </dd>
                  <dd
                    className={
                      desktop
                        ? "mt-2 grid grid-cols-2 gap-x-4 gap-y-1"
                        : "mt-2 grid gap-y-2"
                    }
                  >
                    <div>
                      <p className="text-[11px] text-muted-foreground">Today</p>
                      <p className="text-sm text-muted-foreground">
                        {s.today.title}
                      </p>
                      {s.today.body && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {s.today.body}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        Proposed
                      </p>
                      <p className="text-sm text-foreground">
                        {s.proposed.title}
                      </p>
                      {s.proposed.body && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {s.proposed.body}
                        </p>
                      )}
                    </div>
                  </dd>
                  <dd className="mt-1.5 text-[11px] text-muted-foreground">
                    {s.note}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Stage>
      </Variant>

      <Variant
        n={7}
        name="The unfurl, both ways"
        rationale="The parked ruling, on the surface it actually renders: what a host's group chat shows when the event asks guests to verify an email first. One word settles it."
        framed={false}
      >
        <Stage mode={mode} ground="app-light" height={desktop ? 330 : 620}>
          <div
            className={
              desktop
                ? "grid h-full grid-cols-2 items-center gap-6 px-8"
                : "flex h-full flex-col justify-center gap-5 px-6"
            }
          >
            {UNFURL.options.map((o) => (
              <div key={o.id} className="space-y-1.5">
                <p className="text-[11px] font-medium text-foreground">
                  {o.label}
                </p>
                <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
                  <div className="h-12 bg-muted" />
                  <div className="px-4 py-2.5">
                    <p className="text-sm font-medium">{UNFURL.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {o.line}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {o.note}
                </p>
              </div>
            ))}
          </div>
        </Stage>
      </Variant>

      <BoardMeta
        question={QUESTION}
        candidates={VOICES.filter((v) => v.id !== "today").map((v) => ({
          name: v.name,
          rationale: v.rationale,
        }))}
        asks={ASKS}
        departures={DEPARTURES}
      />
    </div>
  );
}
