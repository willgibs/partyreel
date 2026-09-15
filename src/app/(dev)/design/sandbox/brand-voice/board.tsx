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
import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { PageHero } from "@/components/marketing/system/page-hero";
import { SectionShell } from "@/components/marketing/system/section-shell";
import { Button } from "@/components/ui/button";

import { Variant } from "../variant-frame";
import {
  ALBUM_PAGE,
  ARC,
  CURATION_PAGE,
  FEATURES,
  GUEST_SURFACES,
  QUIET_SURFACES,
  REGISTERS,
  THESIS,
  UNFURL,
  VOICES,
  arcDiff,
  featureDiff,
  featurePagesPaste,
  held,
  pick,
  sectionHeadersPaste,
  voiceById,
  type ArcSection,
  type Surface,
  type Trio,
  type VoiceId,
  type WholePage,
} from "./voices";

/**
 * THE BRAND-VOICE BOARD, ROUND TWO (2026-09-14).
 *
 * WHAT CHANGED. Round one argued three voices on seven HEADERS and a handful
 * of sample surfaces. Will's read afterwards was that no track had reached
 * enough of its potential for a real review, and a voice is in any case judged
 * in a paragraph and a page, not a line. So round two walks WHOLE surfaces in
 * the selected voice: the home arc's fifteen sections top to bottom on their
 * real grounds, two feature pages whole, the six pages' thirty identity
 * strings with the paste the infusion round runs, the app's quiet copy, and
 * the guest surfaces with Partyreel nearly silent.
 *
 * THREE JUDGMENTS MADE FROM THE GROUND UP (bible 22), all flagged in
 * BoardMeta rather than buried:
 *  1. Candidate C was retired as a column. Its argument was the subject of one
 *     sentence, which over fifteen sections reads as B with a substitution.
 *     Its one real question, the ruled thesis, is now its own ask on the real
 *     hero (board 5).
 *  2. Every candidate ships as a PASTE. Copy is not CSS, so there is no "apply
 *     to the site" here; the equivalent is a block of real TypeScript for
 *     SECTION_HEADERS and FEATURE_PAGES, copied from the board.
 *  3. Every line a candidate HOLDS is marked, and each chapter carries a
 *     count. Where a voice does not bite is as much of the ruling as where it
 *     does, and it is the fastest way to see that A barely touches the feature
 *     pages.
 *
 * The lines live in ./voices.ts so this file is layout only. Nothing here is
 * imported by production and no production byte changed on this track.
 *
 * ★ WHY THE STAGES FORCE data-inview: the marketing reveal grammar rests every
 * [data-mkt-reveal] slot at opacity 0 in BOTH motion preferences (marketing.css
 * chapter 1) and waits on the Reveal island. This is a READING board, so a
 * subhead that has to be scrolled into view is a subhead Will cannot rule on.
 * The wrapper sets the final state the CSS already defines, which is the house
 * convention (final states outside the media queries) rather than an override.
 * The sections take reveal="none" for the same reason, through the real prop.
 *
 * ★ WHY THE SECTIONS ARE COMPRESSED: the board judges the LINE, not the arc's
 * vertical rhythm, which belongs to the home page and is ruled elsewhere. The
 * type, the ground and the heading tiers are the real ones; only the air
 * between sections is compressed so a chapter reads as one stretch.
 */

const INTRO = [
  "Round one wrote the voice down and argued it on seven headers. A voice is judged in a paragraph and a page, so round two walks whole surfaces: the home arc top to bottom on its real grounds, two feature pages whole, the thirty strings that carry the six feature pages, the app's quiet copy, and the guest surfaces.",
  "Two candidates now, not three. A tunes the register the eight ratified lines already speak. B rebuilds it from the product's one idea, the code becoming the album. Candidate C from round one was retired as a column and its one real question, the ruled thesis, is board 5.",
  "Every line a candidate keeps verbatim is marked held, and each chapter counts them, so the ruling can be a few words. Every candidate also ships as a paste: the boards below hand over the real SECTION_HEADERS and FEATURE_PAGES blocks.",
];

const QUESTION =
  "What Partyreel sounds like, argued on whole pages: the home arc top to bottom, two feature pages whole, the app's quiet copy and the guest surfaces, each in the selected voice beside today's.";

const ASKS = [
  "The voice: today, A the house, or B the room (the agent recommends B)",
  "The seven provisional home headers: the selected voice whole, or line by line from the ledgers",
  "The rest of the arc (the eyebrows, the supporting lines, the CTAs): take the selected voice, or hold today's",
  "The account-required unfurl line: asks for an email, or asks to sign in with an email (the agent recommends asks for an email)",
  "Bible 20's replacement, in one sentence: lead with what arrives, an absence may be the second beat and never the first, and never both",
  "The thesis: keep in one album, or take as everyone saw it (the agent recommends keeping it)",
  "One noun for the thing: album everywhere, or album on the site and gallery on a guest's screen (the agent recommends album everywhere)",
];

const DEPARTURES = [
  "Bible 20 as written blocks a RULED line. Say who we are, never who we are not reads on Scan, upload, done. No app to install. (ruled 2026-08-25) and on the whole no-app argument. The rule's target was a fenced use case, a host told to leave; an absence that IS the feature is a different thing. The guide proposes the sharper do, ask 5.",
  "Candidate C was RETIRED as a column, which is a round-two judgment rather than a ruling. Across fifteen sections C read as B with everyone substituted in seven places, so it cost a third of the board and answered nothing B did not. Its one real question, the thesis, is board 5 and ask 6; say the word and it comes back as a column.",
  "The product calls the same thing two names. The site says album in every heading, nav label and directory line; the guest surface says gallery in five places (a shared gallery for the whole event, see the full gallery, opening the gallery, view the gallery, the empty gallery). One of them is wrong and a guide cannot settle it, so it is ask 7.",
  "The five copy-alternative picks have lost their list: the queue item predates the docs consolidation and no list survives in the repo. The board reads it as the five headers carrying an appetite for a DIFFERENT line (liveDemo, album, curation, privacy, reel), marked with a dot in the ledgers. Correct it and the board adds the missing picks.",
];

const VOICE_OPTIONS = VOICES.map((v) => ({ id: v.id, label: v.name }));

/** The real hrefs behind each section's chevron CTA, so the board renders the
 *  shipped LearnMoreLink rather than a look-alike. */
const CTA_HREF: Record<string, string> = {
  "film-strip": "/how-it-works",
  "no-app": "/features/guests",
  "full-quality": "/features/album",
  album: "/features/album",
  curation: "/features/curation",
  privacy: "/features/privacy",
  "reel-teaser": "/reel#styles",
  "events-teaser": "/events",
};

/* -------------------------------------------------------------------------
 * Small pieces
 * ---------------------------------------------------------------------- */

/** The held marker: a candidate keeping the shipped line unchanged. */
function Held() {
  return (
    <span className="bv-held rounded-full border border-border px-1.5 py-px text-[10px] text-muted-foreground">
      held
    </span>
  );
}

/** A copy-to-clipboard block: a candidate is only ruled on if it can ship, and
 *  copy cannot be applied to the site as CSS, so the paste IS the artifact. */
function CopyPaste({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          void navigator.clipboard
            ?.writeText(text)
            .then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            })
            .catch(() => setCopied(false));
        }}
      >
        {copied ? "Copied" : label}
      </Button>
      <p className="text-[11px] text-muted-foreground">
        {text.split("\n").length} lines of real TypeScript, ready for the
        infusion round.
      </p>
    </div>
  );
}

/** The CTA row as the real components: chevron links where the section ships
 *  one, buttons where it ships buttons. */
function Cta({ id, text }: { id: string; text: string }) {
  if (!text) return null;
  const href = CTA_HREF[id];
  if (href) {
    return (
      <div className="mt-4 flex justify-center">
        <LearnMoreLink href={href}>{text}</LearnMoreLink>
      </div>
    );
  }
  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
      {text.split("·").map((label, i) => (
        <Button
          key={label}
          size="lg"
          variant={i === 0 ? "default" : "outline"}
          className="h-11 px-6 text-base"
        >
          {label.trim()}
        </Button>
      ))}
    </div>
  );
}

/** A claim row: the trust strip's four, a section's three or five titles. */
function Items({
  items,
  voice,
  strip,
}: {
  items: Trio[];
  voice: VoiceId;
  strip?: boolean;
}) {
  if (strip) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-y border-border/60 py-5">
        {items.map((t, i) => (
          <span key={i} className="text-sm text-muted-foreground">
            {pick(t, voice)}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="mt-6 flex flex-wrap items-start justify-center gap-x-8 gap-y-3">
      {items.map((t, i) => (
        <p key={i} className="font-heading text-lg">
          {pick(t, voice)}
        </p>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * The arc
 * ---------------------------------------------------------------------- */

/** One arc section on the real shells, in the selected voice. */
function ArcBlock({
  section,
  voice,
  mode,
}: {
  section: ArcSection;
  voice: VoiceId;
  mode: Mode;
}) {
  const pad = mode === "desktop" ? "py-10" : "py-7";

  if (section.id === "trust-strip") {
    return (
      <div className="px-6">
        <Items items={section.items ?? []} voice={voice} strip />
      </div>
    );
  }

  if (section.id === "decomposition") {
    return (
      <div className={`px-6 text-center ${pad}`}>
        <p className="mx-auto max-w-2xl font-heading text-2xl text-balance sm:text-3xl">
          {pick(section.support, voice)}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1">
          {(section.items ?? []).map((t, i) => (
            <span key={i} className="text-sm text-muted-foreground">
              {pick(t, voice)}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (section.tier === "hero") {
    return (
      <PageHero
        className="w-full py-10"
        scale="xl"
        eyebrow={pick(section.eyebrow, voice)}
        heading={pick(section.header, voice)}
        subhead={pick(section.support, voice)}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {pick(section.cta, voice)
              .split("·")
              .map((label, i) => (
                <Button
                  key={label}
                  size="lg"
                  variant={i === 0 ? "default" : "outline"}
                  className="h-11 px-6 text-base"
                >
                  {label.trim()}
                </Button>
              ))}
          </div>
        }
      />
    );
  }

  return (
    <SectionShell
      className={pad}
      reveal="none"
      scale={section.tier === "lg" ? "lg" : "default"}
      align={section.align === "left" ? "left" : "center"}
      eyebrow={pick(section.eyebrow, voice)}
      heading={pick(section.header, voice)}
      subhead={pick(section.support, voice)}
    >
      {section.items && <Items items={section.items} voice={voice} />}
      <Cta id={section.id} text={pick(section.cta, voice)} />
    </SectionShell>
  );
}

/** One chapter of the arc, on its real ground, in arc order. */
function ArcChapter({
  sections,
  voice,
  mode,
  ground,
  height,
}: {
  sections: ArcSection[];
  voice: VoiceId;
  mode: Mode;
  ground: Ground;
  height: number;
}) {
  return (
    <Stage mode={mode} ground={ground} height={height}>
      <div key={voice} data-inview="true" data-bv-swap className="min-h-full">
        {sections.map((s) => (
          <ArcBlock key={s.id} section={s} voice={voice} mode={mode} />
        ))}
      </div>
    </Stage>
  );
}

const SLOT_LABEL: Record<string, string> = {
  eyebrow: "Eyebrow",
  header: "Header",
  support: "Support",
  cta: "CTA",
  items: "Claims",
};

/** The ledger under a chapter: every slot, today beside the candidate, with
 *  held marked. This is the surface a line-by-line ruling is written on. */
function Ledger({ sections, voice }: { sections: ArcSection[]; voice: VoiceId }) {
  const rows = (s: ArcSection): { slot: string; trio: Trio | Trio[] }[] => {
    const out: { slot: string; trio: Trio | Trio[] }[] = [];
    if (s.eyebrow) out.push({ slot: "eyebrow", trio: s.eyebrow });
    if (s.header) out.push({ slot: "header", trio: s.header });
    if (s.support) out.push({ slot: "support", trio: s.support });
    if (s.items) out.push({ slot: "items", trio: s.items });
    if (s.cta) out.push({ slot: "cta", trio: s.cta });
    return out;
  };
  const join = (t: Trio | Trio[], id: VoiceId) =>
    Array.isArray(t) ? t.map((x) => pick(x, id)).join("  ·  ") : pick(t, id);
  const allHeld = (t: Trio | Trio[], id: VoiceId) =>
    Array.isArray(t) ? t.every((x) => held(x, id)) : held(t, id);

  return (
    <dl className="bv-arc-ledger mt-4 space-y-3 text-xs">
      {sections.map((s) => (
        <div key={s.id} className="space-y-1.5">
          <dt className="flex flex-wrap items-baseline gap-x-2 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">{s.id}</span>
            {s.pick && (
              <span
                title="one of the five copy-alternative picks"
                className="inline-block size-1.5 rounded-full bg-foreground/60"
              />
            )}
            {s.ruled && <span>ruled</span>}
            {s.appetite && <span>{s.appetite}</span>}
          </dt>
          {rows(s).map(({ slot, trio }) => (
            <dd
              key={slot}
              className="grid gap-x-3 gap-y-0.5 sm:grid-cols-[4.5rem_minmax(0,1fr)]"
            >
              <span className="text-[11px] text-muted-foreground">
                {SLOT_LABEL[slot]}
              </span>
              <span className="space-y-0.5">
                <span className="block text-muted-foreground">
                  {join(trio, "today")}
                </span>
                {voice !== "today" &&
                  (allHeld(trio, voice) ? (
                    <span className="block">
                      <Held />
                    </span>
                  ) : (
                    <span className="block text-foreground">
                      {join(trio, voice)}
                    </span>
                  ))}
              </span>
            </dd>
          ))}
        </div>
      ))}
    </dl>
  );
}

/* -------------------------------------------------------------------------
 * A feature page, whole
 * ---------------------------------------------------------------------- */

function FeaturePageStage({
  page,
  voice,
  mode,
  height,
}: {
  page: WholePage;
  voice: VoiceId;
  mode: Mode;
  height: { cinema: number; paper: number };
}) {
  const strings = FEATURES.find((f) => f.slug === page.slug);
  const pad = mode === "desktop" ? "py-10" : "py-7";
  // The page's own chapters: consecutive same-ground sections share a stage,
  // exactly as PaperChapter groups them on the real route.
  const chunks: { ground: "cinema" | "paper"; items: typeof page.sections }[] =
    [];
  for (const s of page.sections) {
    const last = chunks[chunks.length - 1];
    if (last && last.ground === s.ground) last.items.push(s);
    else chunks.push({ ground: s.ground, items: [s] });
  }

  return (
    <div className="space-y-2">
      <Stage
        mode={mode}
        ground={page.slug === "curation" ? "cinema" : "cinema"}
        height={mode === "desktop" ? 420 : 620}
      >
        <div key={voice} data-inview="true" data-bv-swap className="min-h-full">
          <PageHero
            className="w-full py-10"
            scale="lg"
            eyebrow={pick(strings?.navLabel, voice)}
            heading={pick(strings?.h1, voice)}
            subhead={pick(strings?.heroSub, voice)}
          />
        </div>
      </Stage>
      {chunks.map((chunk, i) => (
        <Stage
          key={i}
          mode={mode}
          ground={chunk.ground}
          height={
            mode === "desktop"
              ? chunk.items.length * (height.cinema / 2)
              : chunk.items.length * height.paper
          }
        >
          <div
            key={voice}
            data-inview="true"
            data-bv-swap
            className="min-h-full"
          >
            {chunk.items.map((s, j) => (
              <SectionShell
                key={j}
                className={pad}
                reveal="none"
                eyebrow={pick(s.eyebrow, voice)}
                heading={pick(s.header, voice)}
                subhead={pick(s.support, voice)}
              >
                {s.cta && (
                  <div className="mt-5 flex justify-center">
                    <Button size="lg" className="h-11 px-6 text-base">
                      {pick(s.cta, voice)}
                    </Button>
                  </div>
                )}
              </SectionShell>
            ))}
          </div>
        </Stage>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * A quiet or guest surface
 * ---------------------------------------------------------------------- */

function SurfaceCard({ s }: { s: Surface }) {
  const unchanged =
    s.today.title === s.proposed.title &&
    s.today.body === s.proposed.body &&
    s.today.action === s.proposed.action;
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <p className="text-[11px] font-medium text-foreground">{s.surface}</p>
        <p className="text-[11px] text-muted-foreground">{s.where}</p>
        {unchanged && <Held />}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
        {s.rule}
      </p>
      <div className="mt-2 grid gap-y-3 sm:grid-cols-2 sm:gap-x-5">
        {(["today", "proposed"] as const).map((col) => {
          const v = s[col];
          return (
            <div key={col}>
              <p className="text-[11px] text-muted-foreground">
                {col === "today" ? "Today" : "Proposed"}
              </p>
              <p
                className={
                  col === "today"
                    ? "text-sm text-muted-foreground"
                    : "text-sm text-foreground"
                }
              >
                {v.title}
              </p>
              {v.body && (
                <p className="mt-0.5 text-xs text-muted-foreground">{v.body}</p>
              )}
              {v.action && (
                <p className="mt-1.5 inline-flex rounded-md bg-foreground px-2.5 py-1 text-[11px] text-background">
                  {v.action}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        {s.note}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * The board
 * ---------------------------------------------------------------------- */

const CHAPTER_1 = ARC.slice(0, 7);
const CHAPTER_PAPER = ARC.slice(7, 10);
const CHAPTER_CLOSE = ARC.slice(10);

export function BrandVoiceBoard() {
  const [mode, setMode] = useState<Mode>("desktop");
  const [voiceId, setVoiceId] = useState<VoiceId>("room");
  const voice = voiceById(voiceId);
  const desktop = mode === "desktop";
  const arc = arcDiff(voiceId);
  const feat = featureDiff(voiceId);

  return (
    <div className="bv-round-two flex flex-col gap-8 py-4">
      <div className="max-w-2xl space-y-3 text-xs leading-relaxed text-muted-foreground">
        {INTRO.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {/* The switch follows the walk: the arc runs for several screens and a
          voice toggle at the top of it is a toggle nobody reaches. */}
      <div className="bv-controls sticky top-0 z-20 -mx-2 flex flex-wrap items-center gap-3 border-b border-border bg-background/95 px-2 py-3 backdrop-blur">
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
        <p className="text-[11px] text-muted-foreground">
          {voiceId === "today"
            ? "The shipped lines."
            : `Moves ${arc.moved} of ${arc.total} lines in the arc, ${feat.moved} of ${feat.total} on the feature pages.`}
        </p>
      </div>

      <Variant
        n={1}
        name="The voice, in one paragraph"
        rationale="The first ask, with what each answer costs. The three registers below are shown once, because round one found that they do not fork with the voice: only the marketing register's default sentence shape moves."
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
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
              <span className="text-foreground">What it costs. </span>
              {voice.cost}
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
          <div className="rounded-lg border border-border bg-card px-5 py-4">
            <p className="text-[11px] font-medium text-muted-foreground">
              Bible 20&rsquo;s replacement, in one sentence (ask 5)
            </p>
            <p className="mt-2 max-w-3xl font-heading text-xl text-balance">
              Lead with what arrives; an absence may be the second beat, never
              the first, and never both.
            </p>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
              It keeps the ruled line (Scan, upload, done. No app to install.)
              and kills the doubled-absence one (Nothing to install. Nothing to
              sign up for.), which is the rule the whole arc below is written
              against.
            </p>
          </div>
        </div>
      </Variant>

      <Variant
        n={2}
        name="The home arc, chapter one: the event"
        rationale="Seven sections in arc order on the cinema ground, on the real PageHero and SectionShell, in the selected voice. The ledger beneath carries today beside it, line by line, with every held line marked."
        framed={false}
      >
        <div>
          <ArcChapter
            sections={CHAPTER_1}
            voice={voiceId}
            mode={mode}
            ground="cinema"
            height={desktop ? 1820 : 3180}
          />
          <Ledger sections={CHAPTER_1} voice={voiceId} />
        </div>
      </Variant>

      <Variant
        n={3}
        name="The home arc, the paper chapter: the morning after"
        rationale="The three sections of the host's desk, on paper. album opens it as a left masthead at the lg tier, which is why its line has to carry more weight than the two beneath it."
        framed={false}
      >
        <div>
          <ArcChapter
            sections={CHAPTER_PAPER}
            voice={voiceId}
            mode={mode}
            ground="paper"
            height={desktop ? 1000 : 1720}
          />
          <Ledger sections={CHAPTER_PAPER} voice={voiceId} />
        </div>
      </Variant>

      <Variant
        n={4}
        name="The home arc, the close: the payoff"
        rationale="The last five, back on cinema. The arc has to land here in the same voice it opened in, which is the thing a header-by-header comparison cannot show."
        framed={false}
      >
        <div>
          <ArcChapter
            sections={CHAPTER_CLOSE}
            voice={voiceId}
            mode={mode}
            ground="cinema"
            height={desktop ? 1280 : 2180}
          />
          <Ledger sections={CHAPTER_CLOSE} voice={voiceId} />
          <div className="mt-5">
            <CopyPaste
              label="Copy the SECTION_HEADERS paste"
              text={sectionHeadersPaste(voiceId)}
            />
          </div>
        </div>
      </Variant>

      <Variant
        n={5}
        name="The thesis, both ways"
        rationale="All that survives of candidate C, on the surface it actually renders: the site's loudest line, at the hero tier, on cinema. One clause settles it."
        framed={false}
      >
        <div className="space-y-3">
          <Stage mode={mode} ground="cinema" height={desktop ? 560 : 760}>
            <div
              data-inview="true"
              className="flex h-full flex-col justify-center gap-10 py-10"
            >
              <PageHero className="w-full" scale="xl" heading={THESIS.ruled} />
              <PageHero
                className="w-full"
                scale="xl"
                heading={THESIS.alternative}
              />
            </div>
          </Stage>
          <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
            {THESIS.note}
          </p>
        </div>
      </Variant>

      <Variant
        n={6}
        name="A feature page, whole: /features/album"
        rationale="The h1, the hero sub and every section eyebrow and header on the page, in order, on the two grounds it really uses. A voice that holds for ten sections of one page is a voice the other five pages can be written against."
        framed={false}
      >
        <FeaturePageStage
          page={ALBUM_PAGE}
          voice={voiceId}
          mode={mode}
          height={{ cinema: 520, paper: 300 }}
        />
      </Variant>

      <Variant
        n={7}
        name="A feature page, whole: /features/curation"
        rationale="The second page, and the harder one: its whole body is one paper chapter of decisions, so the voice has to stay quiet enough to read as a working document and loud enough to still be marketing."
        framed={false}
      >
        <FeaturePageStage
          page={CURATION_PAGE}
          voice={voiceId}
          mode={mode}
          height={{ cinema: 520, paper: 300 }}
        />
      </Variant>

      <Variant
        n={8}
        name="The thirty strings, as a paste"
        rationale="The shared identity layer behind all six feature pages: the nav label, the mega-panel one-liner, the h1, the hero sub and the directory line. navDescription holds its 45-character band and directoryLine its length band in every column, because the panel and the six hub doors wrap against them."
        framed={false}
      >
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-xs">
              <thead>
                <tr className="border-b border-border text-left text-[11px] text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Page</th>
                  <th className="py-2 pr-3 font-medium">Slot</th>
                  <th className="py-2 pr-3 font-medium">Today</th>
                  <th className="py-2 font-medium">{voice.name}</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f) =>
                  (
                    [
                      ["navLabel", f.navLabel],
                      ["navDescription", f.navDescription],
                      ["h1", f.h1],
                      ["heroSub", f.heroSub],
                      ["directoryLine", f.directoryLine],
                    ] as const
                  ).map(([slot, trio], i) => (
                    <tr
                      key={`${f.slug}-${slot}`}
                      className="border-b border-border/50 align-top"
                    >
                      <td className="py-1.5 pr-3 text-muted-foreground">
                        {i === 0 ? f.slug : ""}
                      </td>
                      <td className="py-1.5 pr-3 text-muted-foreground">
                        {slot}
                      </td>
                      <td className="py-1.5 pr-3 text-muted-foreground">
                        {trio.today}
                      </td>
                      <td className="py-1.5 text-foreground">
                        {held(trio, voiceId) ? <Held /> : pick(trio, voiceId)}
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
          <CopyPaste
            label="Copy the FEATURE_PAGES paste"
            text={featurePagesPaste(voiceId)}
          />
        </div>
      </Variant>

      <Variant
        n={9}
        name="The quiet register, on real app copy"
        rationale="The dashboard's empty state, an error, two notifications, an email subject with its first line, and the account page's labels. Shown once, not per candidate: the quiet register does not fork with the voice, which is why three of these hold unchanged."
        framed={false}
      >
        <Stage mode={mode} ground="app-light" height={desktop ? 1180 : 2200}>
          <div className="h-full overflow-hidden px-8 py-6">
            <div className="flex flex-col gap-3">
              {QUIET_SURFACES.map((s) => (
                <SurfaceCard key={s.surface} s={s} />
              ))}
            </div>
          </div>
        </Stage>
      </Variant>

      <Variant
        n={10}
        name="The guest register, with Partyreel nearly silent"
        rationale="The demo guest page's real lines: the door in its three states, the upload prompt, the empty album, the upload confirmation. Bible 4 is the whole rule here, and the shipped account gate is the one line that breaks it."
        framed={false}
      >
        <Stage mode={mode} ground="app-light" height={desktop ? 1180 : 2200}>
          <div className="h-full overflow-hidden px-8 py-6">
            <div className="flex flex-col gap-3">
              {GUEST_SURFACES.map((s) => (
                <SurfaceCard key={s.surface} s={s} />
              ))}
            </div>
          </div>
        </Stage>
      </Variant>

      <Variant
        n={11}
        name="The unfurl, both ways"
        rationale="The parked ruling, on the surface it actually renders: what a host's group chat shows. The public variant sits above as the control, because the two lines have to read as one set."
        framed={false}
      >
        <Stage mode={mode} ground="app-light" height={desktop ? 430 : 780}>
          <div className="flex h-full flex-col justify-center gap-5 px-8">
            <div className="max-w-md">
              <p className="text-[11px] font-medium text-muted-foreground">
                A public event, for reference
              </p>
              <div className="mt-1.5 overflow-hidden rounded-[var(--radius)] border border-border bg-card">
                <div className="h-10 bg-muted" />
                <div className="px-4 py-2.5">
                  <p className="text-sm font-medium">{UNFURL.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {UNFURL.publicLine}
                  </p>
                </div>
              </div>
            </div>
            <div
              className={
                desktop
                  ? "grid grid-cols-2 items-start gap-6"
                  : "flex flex-col gap-5"
              }
            >
              {UNFURL.options.map((o) => (
                <div key={o.id} className="space-y-1.5">
                  <p className="text-[11px] font-medium text-foreground">
                    {o.label}
                  </p>
                  <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
                    <div className="h-10 bg-muted" />
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
