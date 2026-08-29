"use client";

import Image from "next/image";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";

import { coverFor } from "@/lib/content/blog-covers";
import { cn } from "@/lib/utils";

import { DesktopFrame } from "./marketing-lab-shared";

/**
 * Touchpoint: BLOG IDENTITY (the blog round, 2026-08-28).
 *
 * /blog is the last marketing surface still wearing its route-completeness scaffold: a centered
 * hero identical in shape to /press and /careers, a raw pill row of tags, card boxes in a 2-up
 * grid, and NO photography at all on a product whose identity is "media is the color".
 *
 * Will's rulings going in: /blog moves into the (cinema) group (the /help posture), posts get an
 * optional `cover` with a deterministic fallback, freeform tags stay with a redesigned rail, and
 * the brief verbatim is "a bespoke header/hero article, with a polished library beneath that can
 * be filtered as needed."
 *
 * Which makes DISTINCTNESS FROM /help the hard constraint of this round: both hubs now open on the
 * dark stage, and the frame doctrine is "never one visual reused". /help opens with an INSTRUMENT
 * (centered question, search field, emblem strip). Every direction here opens with the LEAD STORY
 * itself: asymmetric, media-led, one big thing.
 *
 *  V1 THE BROADSHEET   type-led periodical: a drawn masthead rule, the lead as an editorial
 *      spread, the archive as a hairline ruled ledger. Deliberately NOT /help's index sheet: the
 *      folio numerals and mono chrome are dropped (they renumber on every publish, and mono is
 *      numerals-only under the R6 ruling), so the masthead has to carry itself on type alone.
 *  V2 THE CONTACT SHEET  media-led proof sheet: every post a frame, the lead the marked one.
 *      Lives or dies on the crop derivation, since the manifest holds ~12 images and a proof sheet
 *      puts duplicates side by side.
 *  V3 THE READING TABLE  object-led desk: the lead lying open on the dark desk, the archive as
 *      physical cards. The fanning STACK was cut on purpose (the footer already runs that exact
 *      recipe on every page, and a stack cannot be filtered) so the archive stays a real library.
 *  V4 THE CUTTING ROOM   the library as an edit track: 21:9 letterbox slabs, tight seams, scrim at
 *      rest. The one crop nothing else on the site uses, and single-column means a filter moves
 *      things on Y only.
 *
 * All four share the cover resolver, the develop beat, the byline treatment, and the hero/filter
 * rule, so a composite ruling wires cleanly.
 */

// ── The fixture ──────────────────────────────────────────────────────────────
// The 4 real posts plus 5 plausible ones. NINE is the point: at 4 posts every direction flatters
// itself, and the design has to hold when the content agent's real articles land. Covers come from
// the REAL resolver (not hand-picked) so the lab is honest about what production composes.

type LabPost = {
  slug: string;
  title: string;
  description: string;
  dateLabel: string;
  author: string;
  readingTime: string;
  tags: string[];
};

const POSTS: LabPost[] = [
  {
    slug: "introducing-the-highlight-reel",
    title: "Introducing the highlight reel: your event's best moments, automatically",
    description:
      "A shared album is wonderful. A reel is the thing people rewatch and send to each other. Here's the feature that gives Partyreel its name.",
    dateLabel: "May 31, 2026",
    author: "Partyreel Team",
    readingTime: "6 min read",
    tags: ["product", "highlight-reel"],
  },
  {
    slug: "stop-losing-group-photos-to-the-group-chat",
    title: "Stop losing your group photos to the group chat",
    description:
      "Group chats compress your photos, bury them in threads, and lose them when someone leaves. Here's a cleaner way to collect every shot.",
    dateLabel: "May 29, 2026",
    author: "Partyreel Team",
    readingTime: "5 min read",
    tags: ["parties", "how-to"],
  },
  {
    slug: "wedding-photo-qr-guests-will-use",
    title: "How to set up a wedding photo QR your guests will actually use",
    description:
      "A few small choices decide whether you get a full album or an empty one: where you put the code, what you ask for, and when you open it.",
    dateLabel: "May 26, 2026",
    author: "Partyreel Team",
    readingTime: "7 min read",
    tags: ["weddings", "how-to"],
  },
  {
    slug: "best-photos-are-on-everyone-elses-phone",
    title: "The best photos from your night are on everyone else's phone",
    description:
      "The candid shots your friends take are the ones worth keeping, and the ones that scatter and vanish. Here's the problem we set out to fix.",
    dateLabel: "May 22, 2026",
    author: "Partyreel Team",
    readingTime: "4 min read",
    tags: ["story", "behind-the-scenes"],
  },
  {
    slug: "what-to-do-with-800-photos",
    title: "What to do with 800 photos the morning after",
    description:
      "Everyone uploaded. Now what? A short method for turning a full album into the twenty shots people will actually look at twice.",
    dateLabel: "May 18, 2026",
    author: "Partyreel Team",
    readingTime: "5 min read",
    tags: ["how-to", "album"],
  },
  {
    slug: "who-can-see-your-album",
    title: "Who can see your album, and how to decide",
    description:
      "Open link, guest list, or password. The three ways to share an event album, and the kind of event each one suits.",
    dateLabel: "May 14, 2026",
    author: "Partyreel Team",
    readingTime: "6 min read",
    tags: ["privacy", "how-to"],
  },
  {
    slug: "photographing-a-trip-together",
    title: "Photographing a trip when everyone brought a camera",
    description:
      "Ten days, six people, one shared roll. How to run a group trip album so nobody is chasing AirDrops at the airport.",
    dateLabel: "May 9, 2026",
    author: "Partyreel Team",
    readingTime: "8 min read",
    tags: ["trips", "how-to"],
  },
  {
    slug: "why-we-built-the-qr-first",
    title: "Why we built the QR code first",
    description:
      "Most photo apps start with the app. We started with the thing on the table, because that is where a guest actually decides.",
    dateLabel: "May 4, 2026",
    author: "Partyreel Team",
    readingTime: "5 min read",
    tags: ["story", "behind-the-scenes"],
  },
  {
    slug: "a-reel-for-every-party",
    title: "A reel for every party, not just the big ones",
    description:
      "Birthdays, leaving drinks, a Tuesday. The small events are the ones nobody documents, and the ones that age best.",
    dateLabel: "April 28, 2026",
    author: "Partyreel Team",
    readingTime: "4 min read",
    tags: ["parties", "highlight-reel"],
  },
];

// ── Shared behavior ──────────────────────────────────────────────────────────

/**
 * THE HERO/FILTER RULE, shared by all four so a composite ruling inherits it.
 *
 * The lead exists ONLY in the unfiltered view. Hoisting it permanently out of the filtered set
 * looks tidy and is a bug: today's newest post owns two tags no other post has, so two chips would
 * render an empty library while the matching article sat in the hero directly above it. Selecting
 * a tag therefore collapses the lead and shows a pure library containing EVERY match, ex-lead
 * included, which makes an empty tag structurally impossible.
 */
function useLibrary(posts: LabPost[]) {
  const [active, setActive] = useState<string | null>(null);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([label, count]) => ({ label, count }));
  }, [posts]);

  const matched = active
    ? posts.filter((post) => post.tags.includes(active))
    : posts;

  return {
    active,
    setActive,
    tags,
    lead: active ? null : matched[0],
    library: active ? matched : matched.slice(1),
    total: posts.length,
    shown: matched.length,
  };
}

/** The cinema room + the overlay-header posture, shared by every direction's stage. */
function Stage({ children }: { children: ReactNode }) {
  return (
    // lab-cinema beside dark, never instead of it: `dark` flips the tokens, `lab-cinema` corrects
    // the room to marketing.css's 0.11 (a bare `dark` is the app night, three points lighter).
    <div className="dark lab-cinema bg-background text-foreground">
      <FauxHeader />
      {children}
    </div>
  );
}

/** A stand-in for the real overlay header: transparent at scroll top, no hairline. Its only job
 *  here is to make the stage's top spacing judgeable, which is why every cinema page opens at
 *  pt-14/pt-20 rather than the paper group's py-12. */
function FauxHeader() {
  return (
    <div
      aria-hidden
      className="flex h-12 items-center gap-6 px-6 text-[11px] text-muted-foreground"
    >
      <span className="font-heading text-sm text-foreground">Partyreel</span>
      <span>Features</span>
      <span>Events</span>
      <span className="text-foreground">Resources</span>
      <span>Pricing</span>
      <span className="ml-auto rounded-full bg-foreground px-3 py-1 text-background">
        Start free
      </span>
    </div>
  );
}

/** The paper chapter: the reading half of every direction, below the cut. */
function PaperBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "surface-paper border-t bg-background text-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * A cover plate. Two layers on purpose: the WRAPPER is the always-painted muted base, and only the
 * inner photo layer develops over it. Never animate the wrapper itself - a plate whose default
 * state is invisible renders a hole on every path that does not fire the beat (23 of 23 covers
 * disappeared exactly that way on this round's first cut).
 *
 * `index` is the develop slot; give the LEAD the highest one so it resolves LAST and lands the eye
 * where the reading starts. The crop comes from the production resolver, never a center default.
 */
function Plate({
  slug,
  index,
  className,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority,
}: {
  slug: string;
  index: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const cover = coverFor(slug);
  return (
    <span className={cn("relative block overflow-hidden bg-muted", className)}>
      <span
        data-lab-plate
        className="absolute inset-0"
        style={{ "--i": index } as CSSProperties}
      >
        <Image
          src={cover.src}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          style={{ objectPosition: cover.objectPosition }}
        />
      </span>
    </span>
  );
}

/**
 * The byline. The name is INTER with real weight, not mono: the R6 ruling makes mono
 * numerals-only, and today's card renders the whole line as a timecode, which flattens the only
 * human signal on the page. Dates and reading time keep mono numerals.
 */
function Byline({
  post,
  className,
}: {
  post: LabPost;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs",
        className,
      )}
    >
      <span className="font-medium text-foreground">{post.author}</span>
      <span className="font-mono text-[11px] tracking-wide text-muted-foreground tabular-nums">
        {post.dateLabel}
      </span>
      <span aria-hidden className="text-muted-foreground">
        &middot;
      </span>
      <span className="font-mono text-[11px] tracking-wide text-muted-foreground tabular-nums">
        {post.readingTime}
      </span>
    </span>
  );
}

/** One labeled direction. NOTE: no `surface-paper` wrapper here (the contact round's frame shape),
 *  because each direction nests a `.dark` stage and nesting dark inside surface-paper is forbidden
 *  by both globals.css and the paper-chapter doctrine. */
function Direction({
  n,
  name,
  rationale,
  children,
}: {
  n: number;
  name: string;
  rationale: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold">
          <span className="mr-2 inline-flex size-5 items-center justify-center rounded-md bg-foreground font-mono text-[11px] text-background">
            {n}
          </span>
          {name}
        </p>
        <p className="mt-1 max-w-2xl text-xs text-pretty text-muted-foreground">
          {rationale}
        </p>
      </div>
      <DesktopFrame>{children}</DesktopFrame>
    </section>
  );
}

export function BlogIdentityVariants() {
  return (
    <div className="flex flex-col gap-12">
      <Broadsheet />
      <ContactSheet />
      <ReadingTable />
      <CuttingRoom />
    </div>
  );
}

// ── V1 The Broadsheet ────────────────────────────────────────────────────────

function Broadsheet() {
  const { active, setActive, tags, lead, library, shown, total } =
    useLibrary(POSTS);

  return (
    <Direction
      n={1}
      name="The Broadsheet"
      rationale="Type-led periodical. A drawn masthead rule, the lead as an editorial spread, the archive as a hairline ledger. Folio numerals and mono chrome are dropped on purpose: they are /help's instrument, and a folio on a recency list renumbers every time you publish."
    >
      <Stage>
        <div className="px-6 pt-8 pb-12">
          <div
            data-lab-line
            className="flex items-baseline justify-between gap-4"
          >
            <span className="font-heading text-lg">Notes</span>
            <span className="text-[11px] text-muted-foreground">
              Field notes from building Partyreel
            </span>
          </div>
          <span
            data-lab-rule
            className="mt-3 mb-8 block h-px w-full bg-foreground/25"
          />

          {lead && (
            <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center">
              <div>
                <p
                  data-lab-line
                  style={{ "--i": 1 } as CSSProperties}
                  className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase"
                >
                  Latest
                </p>
                <h1
                  data-lab-line
                  style={{ "--i": 2 } as CSSProperties}
                  className="mt-3 font-heading text-3xl text-balance sm:text-4xl"
                >
                  {lead.title}
                </h1>
                <p
                  data-lab-line
                  style={{ "--i": 3 } as CSSProperties}
                  className="mt-4 max-w-md text-sm leading-relaxed text-pretty text-muted-foreground"
                >
                  {lead.description}
                </p>
                <Byline
                  post={lead}
                  className="mt-5 [&>span:first-child]:text-foreground"
                />
              </div>
              <Plate
                slug={lead.slug}
                index={4}
                priority
                className="aspect-4/3 w-full"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          )}
        </div>
      </Stage>

      <PaperBody className="px-6 py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-heading text-xl">The archive</h2>
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
            {shown} of {total}
          </span>
        </div>

        {/* The rail as editorial text, not a widget rack: labels and counts on one line, the
            active one going to full ink. Contrast is the state, per the achromatic register. */}
        <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-y py-2.5 text-sm">
          <RailLink
            label="Everything"
            count={total}
            active={active === null}
            onClick={() => setActive(null)}
          />
          {tags.map((tag) => (
            <RailLink
              key={tag.label}
              label={tag.label}
              count={tag.count}
              active={active === tag.label}
              onClick={() => setActive(tag.label)}
            />
          ))}
        </div>

        <ul key={active ?? "all"} data-section-swap className="mt-2">
          {library.map((post) => (
            <li key={post.slug} className="border-b last:border-b-0">
              <a
                href="#"
                className="group grid grid-cols-[auto_1fr] items-baseline gap-x-5 py-3.5 sm:grid-cols-[7rem_1fr_auto]"
              >
                <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                  {post.dateLabel}
                </span>
                <span className="min-w-0">
                  <span className="block font-heading text-base text-balance transition-colors duration-150 group-hover:text-foreground">
                    {post.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {post.author}
                  </span>
                </span>
                <span className="hidden font-mono text-[11px] text-muted-foreground tabular-nums sm:block">
                  {post.readingTime}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </PaperBody>
    </Direction>
  );
}

function RailLink({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group inline-flex items-baseline gap-1.5 transition-colors duration-150",
        active
          ? "font-medium text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span className={cn(active && "underline underline-offset-4")}>
        {label}
      </span>
      <span className="font-mono text-[10px] text-muted-foreground/70 tabular-nums">
        {count}
      </span>
    </button>
  );
}

// ── V2 The Contact Sheet ─────────────────────────────────────────────────────

function ContactSheet() {
  const { active, setActive, tags, lead, library, shown, total } =
    useLibrary(POSTS);

  return (
    <Direction
      n={2}
      name="The Contact Sheet"
      rationale="Media-led proof sheet: every post is a frame, the lead is the marked one. The whole direction rides the crop derivation, since the manifest holds a dozen images and a proof sheet puts duplicates side by side."
    >
      <Stage>
        <div className="px-6 pt-8 pb-12">
          <p
            data-lab-line
            className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase"
          >
            Notes &middot; the latest frame
          </p>
          {lead && (
            <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
              {/* The marked frame: chinagraph corner ticks instead of a border, so the mark reads
                  as an editor's selection rather than as a card. */}
              <div className="relative">
                <Plate
                  slug={lead.slug}
                  index={3}
                  priority
                  className="aspect-3/2 w-full"
                  sizes="(max-width: 1024px) 100vw, 45vw"
                />
                <span aria-hidden className="pointer-events-none">
                  <span className="absolute -top-1.5 -left-1.5 size-5 border-t-2 border-l-2 border-foreground/70" />
                  <span className="absolute -top-1.5 -right-1.5 size-5 border-t-2 border-r-2 border-foreground/70" />
                  <span className="absolute -bottom-1.5 -left-1.5 size-5 border-b-2 border-l-2 border-foreground/70" />
                  <span className="absolute -right-1.5 -bottom-1.5 size-5 border-r-2 border-b-2 border-foreground/70" />
                </span>
              </div>
              <div>
                <h1
                  data-lab-line
                  style={{ "--i": 1 } as CSSProperties}
                  className="font-heading text-3xl text-balance sm:text-4xl"
                >
                  {lead.title}
                </h1>
                <p
                  data-lab-line
                  style={{ "--i": 2 } as CSSProperties}
                  className="mt-4 max-w-md text-sm leading-relaxed text-pretty text-muted-foreground"
                >
                  {lead.description}
                </p>
                <Byline post={lead} className="mt-5" />
              </div>
            </div>
          )}
        </div>
      </Stage>

      <PaperBody className="px-6 py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-heading text-xl">The sheet</h2>
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
            {shown} of {total}
          </span>
        </div>

        {/* Marks, not pills: a square chip row reads as selecting frames on a sheet. */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          <MarkChip
            label="All"
            count={total}
            active={active === null}
            onClick={() => setActive(null)}
          />
          {tags.map((tag) => (
            <MarkChip
              key={tag.label}
              label={tag.label}
              count={tag.count}
              active={active === tag.label}
              onClick={() => setActive(tag.label)}
            />
          ))}
        </div>

        <div
          key={active ?? "all"}
          data-section-swap
          className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3"
        >
          {library.map((post, i) => (
            <a key={post.slug} href="#" className="group block">
              <Plate
                slug={post.slug}
                index={i}
                className="aspect-3/2 w-full ring-1 ring-foreground/10 transition-[filter] duration-150 group-hover:brightness-105"
                sizes="(max-width: 640px) 45vw, 30vw"
              />
              <span className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 text-[13px] leading-snug text-balance transition-colors duration-150 group-hover:text-foreground">
                  {post.title}
                </span>
              </span>
              <span className="mt-1 block pl-7 font-mono text-[10px] text-muted-foreground tabular-nums">
                {post.dateLabel}
              </span>
            </a>
          ))}
        </div>
      </PaperBody>
    </Direction>
  );
}

function MarkChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-baseline gap-1.5 border px-2 py-1 text-xs transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.97]",
        active
          ? "border-foreground bg-foreground text-background"
          : "text-muted-foreground hover:border-foreground/40 hover:text-foreground",
      )}
    >
      {label}
      <span className="font-mono text-[10px] tabular-nums opacity-70">
        {count}
      </span>
    </button>
  );
}

// ── V3 The Reading Table ─────────────────────────────────────────────────────

function ReadingTable() {
  const { active, setActive, tags, lead, library, shown, total } =
    useLibrary(POSTS);

  return (
    <Direction
      n={3}
      name="The Reading Table"
      rationale="Object-led desk: the lead lying open on the dark desk, the archive as physical cards. The fanning stack was cut deliberately, since the footer already runs that exact recipe on every page and a stack cannot be filtered."
    >
      <Stage>
        <div className="px-6 pt-8 pb-14">
          <p
            data-lab-line
            className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase"
          >
            Notes
          </p>
          {lead && (
            // The open spread: two leaves with a visible gutter, tilted just off square so it
            // reads as an object set down rather than a component placed.
            <div
              data-lab-line
              style={{ "--i": 1 } as CSSProperties}
              className="mx-auto mt-6 max-w-3xl -rotate-[0.6deg]"
            >
              <div className="surface-paper grid overflow-hidden bg-background text-foreground shadow-float sm:grid-cols-2">
                <Plate
                  slug={lead.slug}
                  index={3}
                  priority
                  className="aspect-4/3 w-full sm:aspect-auto sm:h-full"
                  sizes="(max-width: 640px) 100vw, 45vw"
                />
                <div className="flex flex-col justify-center border-l p-6">
                  <h1 className="font-heading text-2xl text-balance">
                    {lead.title}
                  </h1>
                  <p className="mt-3 text-sm leading-relaxed text-pretty text-muted-foreground">
                    {lead.description}
                  </p>
                  <Byline post={lead} className="mt-4" />
                </div>
              </div>
            </div>
          )}
        </div>
      </Stage>

      <PaperBody className="px-6 py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-heading text-xl">Everything else on the table</h2>
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
            {shown} of {total}
          </span>
        </div>

        {/* Index-card tabs: the filter as stationery, matching the objects below it. */}
        <div className="mt-4 flex flex-wrap gap-1">
          <TabChip
            label="All"
            count={total}
            active={active === null}
            onClick={() => setActive(null)}
          />
          {tags.map((tag) => (
            <TabChip
              key={tag.label}
              label={tag.label}
              count={tag.count}
              active={active === tag.label}
              onClick={() => setActive(tag.label)}
            />
          ))}
        </div>

        <div
          key={active ?? "all"}
          data-section-swap
          className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {library.map((post, i) => (
            <a
              key={post.slug}
              href="#"
              style={
                { "--tilt": `${(i % 3) - 1}deg` } as CSSProperties
              }
              className="group flex flex-col bg-card shadow-float ring-1 ring-foreground/10 transition-[transform] duration-200 ease-emphasis [rotate:var(--tilt)] hover:-translate-y-1 hover:[rotate:0deg] active:scale-[0.99] motion-reduce:transition-none"
            >
              <Plate
                slug={post.slug}
                index={i}
                className="aspect-3/2 w-full"
                sizes="(max-width: 640px) 90vw, 30vw"
              />
              <span className="flex flex-1 flex-col gap-2 p-4">
                <span className="font-heading text-[15px] leading-snug text-balance">
                  {post.title}
                </span>
                <Byline post={post} className="mt-auto" />
              </span>
            </a>
          ))}
        </div>
      </PaperBody>
    </Direction>
  );
}

function TabChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-baseline gap-1.5 rounded-t-md border border-b-0 px-3 py-1.5 text-xs transition-[color,background-color,transform] duration-150 active:scale-[0.98]",
        active
          ? "bg-card font-medium text-foreground shadow-float"
          : "bg-muted/50 text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      <span className="font-mono text-[10px] tabular-nums opacity-70">
        {count}
      </span>
    </button>
  );
}

// ── V4 The Cutting Room ──────────────────────────────────────────────────────

function CuttingRoom() {
  const { active, setActive, tags, lead, library, shown, total } =
    useLibrary(POSTS);

  return (
    <Direction
      n={4}
      name="The Cutting Room"
      rationale="The library as an edit track: 21:9 letterbox slabs on tight seams, ink scrim at rest. The one crop nothing else on the site uses, extreme enough to hide cover repetition, and single-column so a filter only ever moves things on Y."
    >
      <Stage>
        <div className="px-6 pt-8 pb-12">
          <p
            data-lab-line
            className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase"
          >
            Notes &middot; now playing
          </p>
          {lead && (
            // The current cut: title ON the stage, not beside it. The scrim is what makes ink
            // type legible over photography without desaturating the photograph.
            <div
              data-lab-line
              style={{ "--i": 1 } as CSSProperties}
              className="relative mt-4 aspect-video w-full overflow-hidden"
            >
              <Plate
                slug={lead.slug}
                index={2}
                priority
                className="absolute inset-0 size-full"
                sizes="100vw"
              />
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h1 className="max-w-2xl font-heading text-3xl text-balance text-white sm:text-4xl">
                  {lead.title}
                </h1>
                <p className="mt-3 max-w-xl text-sm text-pretty text-white/70">
                  {lead.description}
                </p>
                <Byline
                  post={lead}
                  className="mt-4 [&_span]:text-white/70 [&>span:first-child]:text-white"
                />
              </div>
            </div>
          )}
        </div>
      </Stage>

      <PaperBody className="px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[10rem_1fr] lg:gap-10">
          {/* THE MARGIN INDEX: a ruled ledger in the body margin, words and numerals only. No
              emblems and no icons, ever: an icon row here is the one move that would pull this
              back toward /help's emblem strip. */}
          <nav aria-label="Filter notes" className="lg:sticky lg:top-6">
            <p className="text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
              Browse
            </p>
            <div className="mt-3 flex gap-x-4 overflow-x-auto lg:flex-col lg:gap-x-0 lg:overflow-visible">
              <MarginRow
                label="Everything"
                count={total}
                active={active === null}
                onClick={() => setActive(null)}
              />
              {tags.map((tag) => (
                <MarginRow
                  key={tag.label}
                  label={tag.label}
                  count={tag.count}
                  active={active === tag.label}
                  onClick={() => setActive(tag.label)}
                />
              ))}
            </div>
          </nav>

          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-heading text-xl">The library</h2>
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                {shown} of {total}
              </span>
            </div>

            <div
              key={active ?? "all"}
              data-section-swap
              className="mt-4 flex flex-col gap-1"
            >
              {library.map((post, i) => (
                <a
                  key={post.slug}
                  href="#"
                  className="group relative block aspect-21/9 overflow-hidden"
                >
                  <Plate
                    slug={post.slug}
                    index={i}
                    className="absolute inset-0 size-full"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />
                  {/* Scrim at rest, LIFTING on hover. Dim, never desaturate: photography supplies
                      all the color in this system, so draining it would fight the identity. */}
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-black/55 transition-[background-color] duration-150 ease-emphasis group-hover:bg-black/30"
                  />
                  <span className="absolute inset-0 flex flex-col justify-end p-4">
                    <span className="font-heading text-lg leading-tight text-balance text-white">
                      {post.title}
                    </span>
                    <span className="mt-1 flex items-baseline gap-2 font-mono text-[10px] text-white/70 tabular-nums">
                      {post.dateLabel}
                      <span aria-hidden>&middot;</span>
                      {post.readingTime}
                    </span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </PaperBody>
    </Direction>
  );
}

function MarginRow({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group relative flex shrink-0 items-baseline justify-between gap-3 py-1.5 text-left text-[13px] whitespace-nowrap transition-colors duration-150 lg:w-full lg:border-t lg:pl-3 lg:first:border-t-0",
        active
          ? "font-medium text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {/* The ink bar is the active state: a fill would make the filter the loudest thing on a page
          whose subject is photographs. */}
      <span
        aria-hidden
        className={cn(
          "absolute top-1 bottom-1 left-0 hidden w-0.5 bg-foreground transition-[opacity] duration-150 lg:block",
          active ? "opacity-100" : "opacity-0",
        )}
      />
      {label}
      <span className="font-mono text-[10px] text-muted-foreground/70 tabular-nums">
        {count}
      </span>
    </button>
  );
}
