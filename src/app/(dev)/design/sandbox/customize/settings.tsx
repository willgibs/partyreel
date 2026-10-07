"use client";

import { Check, ChevronDown, ChevronRight } from "lucide-react";
import {
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { AlbumStyles } from "@/components/app/event-settings/camera-settings";
import { SettingsNext } from "@/components/app/event-settings/event-settings-sheet";
import {
  SAVES_NOTE,
  SettingsCard,
  SettingsNote,
  StackSetting,
  SwitchSetting,
} from "@/components/app/event-settings/settings-furniture";
import { SettingWord } from "@/components/app/event-settings/setting-word";
import { useSettingsReadiness } from "@/components/app/event-settings/settings-rows";
import {
  SettingsProvider,
  type SettingsWrites,
  useSettings,
} from "@/components/app/event-settings/settings-state";
import {
  hostEvent,
  NO_COUNTS,
  readyFacts,
} from "@/components/app/event-settings/testing/host-event";
import { VideosSwitch } from "@/components/app/event-settings/videos-switch";
import { UserMenu } from "@/components/app/user-menu";
import { AppShell } from "@/components/shared/app-shell";
import { SetCrumbs } from "@/components/shared/crumbs";
import { PageHeading } from "@/components/shared/page-heading";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
} from "@/components/ui/popup";
import type { HostEvent } from "@/lib/db/queries/events";
import {
  type SentencePart,
  SETTINGS_GROUP_TITLES,
  settingsSentence,
} from "@/lib/events/guest-experience-summary";
import { readyHead } from "@/lib/events/readiness";
import { cn, formatEventDate } from "@/lib/utils";

import { HOST, NIGHT, USUAL_ROLL, WEDDING, WEDDING_ROLL } from "./fixtures";
import { type Screen } from "./knobs";
import { RollControl, type RollWay } from "./roll-control";

/**
 * SETTINGS, PRODUCTION'S, OVER MAYA'S WEDDING: the provider, the popup (a
 * desk's panel at 1440, a phone's whole screen at 375), its header, the album
 * styles, the furniture and the live words, composed as
 * `event-settings-sheet.tsx` composes them, its writes inert. What an option
 * adds is only its own piece: the roll's row, a sentence's new words, the
 * album's page, More, the offer of a usual.
 *
 * ★ NOTHING HERE REACHES A SERVER: every write answers after a round trip's
 * wait and changes nothing, so a press in a frame shows the control working
 * and leaves no trace.
 *
 * ★ AT A DESK THE HUB STANDS BEHIND THE PANEL, quietly: the app's bar, the
 * wedding's name and date and its first photographs. Its own head and rooms
 * are event-header's to draw, so this is a stand-in, never a proposal.
 */

const settle = <T,>(value: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), 320));

export const INERT: SettingsWrites = {
  updateEvent: async () => settle({ ok: true as const }),
  setDoor: async () =>
    settle({ ok: true as const, emailHeld: false, admitted: 0 }),
  setReel: async (input) =>
    settle({
      ok: true as const,
      defaults: {
        showReel: input.showReel ?? true,
        styleId: input.styleId ?? null,
        holdSec: input.holdSec ?? null,
      },
    }),
  setProfile: async () => settle({ ok: true as const }),
};

/** The wedding as Settings reads it: a Disposable of 12, its develop the morning after. */
export function weddingEvent(over: Partial<HostEvent> = {}): HostEvent {
  return hostEvent({
    id: WEDDING.id,
    name: WEDDING.name,
    event_date: WEDDING.date,
    capture: "camera",
    roll_size: WEDDING_ROLL,
    develops_at: WEDDING.developsAt,
    ...over,
  } as Partial<HostEvent>);
}

/* ── the hub behind the panel, at a desk ──────────────────────────────── */

function HubBehind() {
  return (
    <div className="min-h-screen bg-background text-foreground" inert>
      <AppShell
        headerActions={
          <UserMenu
            email={HOST.email}
            displayName={HOST.name}
            avatarUrl={null}
            seed={HOST.seed}
            planName="Event Pass"
          />
        }
      >
        <div className="space-y-5">
          <SetCrumbs
            trail={[
              { label: "Partyreel", href: "/dashboard" },
              { label: WEDDING.name },
            ]}
          />
          <div className="space-y-1">
            <PageHeading>{WEDDING.name}</PageHeading>
            <p className="text-sm text-muted-foreground">
              {formatEventDate(WEDDING.date)}
            </p>
          </div>
          <div
            className="flex"
            style={{ gap: "var(--gap-gallery)", height: 220 }}
          >
            {NIGHT.slice(0, 5).map((p) => (
              <div
                key={p.id}
                className="relative overflow-hidden rounded-tile bg-muted"
                style={{ flex: `${p.ratio} 1 0` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph */}
                <img
                  src={p.src}
                  alt=""
                  className="absolute inset-0 size-full object-cover"
                  style={{ objectPosition: p.focus }}
                />
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    </div>
  );
}

/* ── the panel ────────────────────────────────────────────────────────── */

/**
 * Settings open over the wedding: the four rows (`page` null) or one page,
 * production's header for each, the body the option's.
 */
export function SettingsScene({
  screen,
  page,
  event = weddingEvent(),
  children,
}: {
  screen: Screen;
  /** The page's own title, or null for the first screen. */
  page: string | null;
  event?: HostEvent;
  children: ReactNode;
}) {
  return (
    <>
      {screen === "1440" ? <HubBehind /> : null}
      <SettingsProvider
        event={event}
        tier="event_pass"
        counts={{ ...NO_COUNTS, in: 38 }}
        pendingCount={0}
        social={{ displayInProfile: false, hostHasSlug: true }}
        reelSample={NIGHT[3]!.src}
        writes={INERT}
      >
        <Popup open onOpenChange={() => {}}>
          <PopupContent
            kind="settings"
            routed
            {...(page ? { "aria-describedby": undefined } : {})}
          >
            {page ? (
              <PopupHeader
                title={page}
                up={{ label: "Settings", onUp: () => {} }}
              />
            ) : (
              <PopupHeader
                title="Settings"
                description={event.name}
                back={event.name}
              />
            )}
            <PopupBody
              className="space-y-6 pb-6"
              data-settings-page={page ?? "rows"}
            >
              {children}
            </PopupBody>
          </PopupContent>
        </Popup>
      </SettingsProvider>
    </>
  );
}

/* ── a usual, offered where she changed it ────────────────────────────── */

/**
 * THE OFFER (the `mine` ask's `offer`): once a choice stands away from her
 * usual, one quiet line under it says what new parties start with and offers
 * this one instead; pressed, it says so and takes it back in the same place
 * (Linear's Set as default and Reset to default, in one line, the layer said
 * out loud).
 */
export function OfferLine({
  now,
  kept,
  press,
}: {
  /** What new parties start with today: "New parties start with 24 shots." */
  now: string;
  /** The same once she keeps this one. */
  kept: string;
  /** The press: "Use 12 for new parties". */
  press: string;
}) {
  const [isKept, setKept] = useState(false);
  return (
    <p
      data-cz-offer={isKept ? "kept" : "offered"}
      className="cz-offer text-caption text-muted-foreground"
    >
      {isKept ? (
        <>
          <span className="inline-flex items-center gap-1">
            <Check className="size-3.5" aria-hidden />
            {kept}
          </span>
          <button
            type="button"
            onClick={() => setKept(false)}
            className="cz-offer-press"
          >
            Undo
          </button>
        </>
      ) : (
        <>
          <span>{now}</span>
          <button
            type="button"
            onClick={() => setKept(true)}
            className="cz-offer-press"
          >
            {press}
          </button>
        </>
      )}
    </p>
  );
}

/* ── the roll's row, in What guests can add ───────────────────────────── */

/** The roll's row: its name, its one line and the option's control under them. */
export function RollRow({
  way,
  value,
  onChange,
  offer = false,
}: {
  way: RollWay;
  value: number;
  onChange: (n: number) => void;
  offer?: boolean;
}) {
  const labelId = useId();
  return (
    <StackSetting
      label="Shots each"
      labelId={labelId}
      line="Each guest's roll on the album's camera."
      className="space-y-3"
    >
      <div data-cz-roll-row="">
        <RollControl way={way} value={value} onChange={onChange} />
      </div>
      {offer && value !== USUAL_ROLL ? (
        <OfferLine
          now={`New parties start with ${USUAL_ROLL} shots.`}
          kept={`New parties start with ${value} shots.`}
          press={`Use ${value} for new parties`}
        />
      ) : null}
    </StackSetting>
  );
}

/**
 * WHAT GUESTS CAN ADD WITH THE ROLL IN IT: production's album styles
 * (`AlbumStyles`), the Disposable picked, and in its card the develop time
 * (production's), then the roll's row, then the page's own switches. The
 * frame holds the roll, so the Disposable card's line says the size she
 * picks the moment she picks it.
 */
export function AddsWithRoll({
  way,
  start,
  offer = false,
  developOffer,
  more,
}: {
  way: RollWay | null;
  start: number;
  /** The roll's row offers itself as her usual. */
  offer?: boolean;
  /** A line under the develop time offering its hour as her usual: "noon". */
  developOffer?: string;
  /** What stands at the page's foot (More, opened). */
  more?: ReactNode;
}) {
  const s = useSettings();
  const v = s.values;
  const [roll, setRoll] = useState(start);
  return (
    <div data-cz-adds="" className="space-y-6">
      <AlbumStyles
        value={{
          capture: v.capture,
          review: v.review,
          developsAt: v.developsAt,
        }}
        rollSize={roll}
        eventDate={v.eventDate || null}
        eventEndDate={v.eventEndDate || null}
        heldCount={0}
        savingCapture={false}
        savingReveal={false}
        onSave={(patch) => void s.saveEvent(patch)}
      >
        {developOffer ? (
          <div data-cz-offer-row="" className="px-4 pb-3">
            <OfferLine
              now="New parties develop at 9 am."
              kept={`New parties develop at ${developOffer}.`}
              press={`Use ${developOffer} for new parties`}
            />
          </div>
        ) : null}
        {way ? (
          <RollRow way={way} value={roll} onChange={setRoll} offer={offer} />
        ) : null}
        <SwitchSetting
          label="Accepting uploads"
          line="Turn off to freeze the album. Guests can still view it."
          checked={v.acceptingUploads}
          onCheckedChange={(next) =>
            void s.saveEvent({ acceptingUploads: next })
          }
        />
        <VideosSwitch />
      </AlbumStyles>
      {more}
      <SettingsNext page="adds" onNext={() => {}} />
    </div>
  );
}

/* ── the first screen, production's, with words of its own ────────────── */

/** The wedding a fortnight off, set up: its door open, its code opened, guests in, its first photos. */
const READY = readyFacts({
  guestsIn: 38,
  approved: 24,
  playable: 24,
  eventDate: WEDDING.date,
  description: "Dinner, dancing, and a disposable on every table.",
  opened: 3,
});

/** One answer a new live word offers, in `SettingWord`'s own shape. */
type Choice = { id: string; label: string; note?: string };

export const ORDER_CHOICES: readonly Choice[] = [
  {
    id: "turns",
    label: "Newest first, then the night in order",
    note: "Newest while the party is on; the story once it is over.",
  },
  { id: "newest", label: "Newest first", note: "Always the latest on top." },
  {
    id: "night",
    label: "The night in order",
    note: "First photo first, always.",
  },
];

export const TAKE_CHOICES: readonly Choice[] = [
  {
    id: "all",
    label: "Everything",
    note: "Each guest can save every photo she sees.",
  },
  {
    id: "own",
    label: "Their own photos",
    note: "Everyone else's are there to look at.",
  },
  {
    id: "none",
    label: "Nothing, just to look",
    note: "No Save; a screenshot is still a screenshot.",
  },
];

/** The words a sentence says for an answer, lower-cased where it runs on. */
export const orderWords: Record<string, string> = {
  turns: "newest first, then in order",
  newest: "newest first",
  night: "the night in order",
};
export const takeWords: Record<string, string> = {
  all: "everything",
  own: "their own photos",
  none: "nothing",
};

/** A live word the frame holds, its menu opened by a press (or by the frame, `open`). */
export function LiveWord({
  title,
  choices,
  value,
  onChoose,
  words,
  open,
}: {
  title: string;
  choices: readonly Choice[];
  value: string;
  onChoose: (id: string) => void;
  words: string;
  /** The frame opens this word's menu once it has painted. */
  open?: boolean;
}) {
  const box = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(
      () => box.current?.querySelector<HTMLButtonElement>("button")?.click(),
      350,
    );
    return () => window.clearTimeout(t);
  }, [open]);
  return (
    <span ref={box} data-cz-word={title}>
      <SettingWord
        title={title}
        choices={choices.map((c) => ({ ...c, selected: c.id === value }))}
        onChoose={onChoose}
      >
        {words}
      </SettingWord>
    </span>
  );
}

/** The rail's mark, production's (`settings-rows.tsx`'s `RailMark`), quoted. */
function RailMark({
  n,
  done,
  last,
}: {
  n: number;
  done: boolean;
  last?: boolean;
}) {
  return (
    <span
      aria-hidden
      className="pointer-events-none relative flex w-5 shrink-0 justify-center self-stretch"
    >
      {!last && (
        <span
          className={cn(
            "absolute top-7 -bottom-4 w-px",
            done ? "bg-success/50" : "bg-border",
          )}
        />
      )}
      {done ? (
        <span className="relative mt-0.5 flex size-5 items-center justify-center rounded-full bg-success text-success-foreground">
          <Check className="size-3" strokeWidth={3} />
        </span>
      ) : (
        <span className="relative mt-0.5 flex size-5 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground tabular-nums">
          {n}
        </span>
      )}
    </span>
  );
}

/** One step on the rail, production's markup (`SettingsStep`), its sentence handed in. */
function Step({
  n,
  title,
  done,
  last,
  children,
}: {
  n: number;
  title: string;
  done: boolean;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      role="listitem"
      data-settings-row={title}
      className="relative flex gap-3 px-4 py-3"
    >
      <RailMark n={n} done={done} last={last} />
      <span className="pointer-events-none relative min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span
          className="block text-caption leading-5 text-pretty text-muted-foreground"
          data-settings-sentence=""
        >
          {children}
        </span>
      </span>
      {last ? null : (
        <ChevronRight
          aria-hidden
          className="pointer-events-none relative mt-0.5 size-4 shrink-0 self-center text-muted-foreground"
        />
      )}
    </div>
  );
}

/** A production sentence's parts, its live words drawn as words and the rest as prose. */
function Said({
  parts,
  roll,
}: {
  parts: readonly SentencePart[];
  /** The roll said as a live word of its own, where the sentence says the camera's roll. */
  roll?: ReactNode;
}) {
  return (
    <>
      {parts.map((part, i) => {
        if (!part.word) {
          const m = roll ? /(\d+) shots each/.exec(part.text) : null;
          if (!m) return <span key={i}>{part.text}</span>;
          return (
            <span key={i}>
              {part.text.slice(0, m.index)}
              {roll}
              {part.text.slice(m.index + m[0].length)}
            </span>
          );
        }
        return (
          <span
            key={i}
            className="font-medium text-foreground underline decoration-foreground/35 decoration-dotted decoration-2 underline-offset-4"
          >
            {part.text}
          </span>
        );
      })}
    </>
  );
}

/**
 * SETTINGS' FIRST SCREEN, THE PARTY IN SENTENCES (production's rows,
 * `SettingsRows`, quoted so a sentence can take a word of its own): the head
 * that says whether guests can arrive, the steps on their rail, the code, and
 * the note. `words` adds the `home` ask's own: the roll a live word in What
 * guests can add, and a step of its own, The album, saying the order and
 * what guests take home.
 */
export function FirstScreen({
  words,
  open,
}: {
  /** The `words` option's sentences, or production's as they stand. */
  words: boolean;
  /** Which new word the frame opens: the frame shows the press, its menu up. */
  open?: "roll" | "order" | "take";
}) {
  const s = useSettings();
  const { r } = useSettingsReadiness(READY);
  const head = readyHead(r);
  const code = r.items.find((i) => i.id === "code");
  const [roll, setRoll] = useState(WEDDING_ROLL);
  const [order, setOrder] = useState("turns");
  const [take, setTake] = useState("own");

  const rollWord = (
    <LiveWord
      title="Shots each"
      choices={[
        { id: "12", label: "12 shots", note: "Film's short roll." },
        { id: "24", label: "24 shots", note: "Partyreel's usual." },
        { id: "36", label: "36 shots", note: "Film's long roll." },
        { id: "other", label: "Another number", note: "From 1 to 99." },
      ]}
      value={String(roll)}
      onChoose={(id) => id !== "other" && setRoll(Number(id))}
      words={`${roll} shots`}
      open={open === "roll"}
    />
  );

  const groups: { title: string; body: ReactNode }[] = [
    {
      title: SETTINGS_GROUP_TITLES.door,
      body: <Said parts={settingsSentence("door", s.facts)} />,
    },
    {
      title: SETTINGS_GROUP_TITLES.adds,
      body: (
        <Said
          parts={settingsSentence("adds", {
            ...s.facts,
            develop: s.facts.develop
              ? { ...s.facts.develop, rollSize: roll }
              : s.facts.develop,
          })}
          roll={words ? <>{rollWord} each</> : undefined}
        />
      ),
    },
    ...(words
      ? [
          {
            title: "The album",
            body: (
              <>
                <span>Guests see it </span>
                <LiveWord
                  title="How the album runs"
                  choices={ORDER_CHOICES}
                  value={order}
                  onChoose={setOrder}
                  words={orderWords[order]!}
                  open={open === "order"}
                />
                <span>, and take home </span>
                <LiveWord
                  title="What guests take home"
                  choices={TAKE_CHOICES}
                  value={take}
                  onChoose={setTake}
                  words={takeWords[take]!}
                  open={open === "take"}
                />
                <span>.</span>
              </>
            ),
          },
        ]
      : []),
    {
      title: SETTINGS_GROUP_TITLES.reel,
      body: <Said parts={settingsSentence("reel", s.facts)} />,
    },
    {
      title: SETTINGS_GROUP_TITLES.event,
      body: <Said parts={settingsSentence("event", s.facts)} />,
    },
  ];

  return (
    <div className="space-y-1.5" data-cz-first={words ? "words" : "today"}>
      <div
        data-settings-head=""
        data-ready={r.ready ? "" : undefined}
        className="space-y-0.5 px-1 pb-1"
      >
        <p className="flex items-center gap-1.5 text-sm font-medium">
          {r.ready ? (
            <Check
              className="size-4 shrink-0 text-success"
              strokeWidth={3}
              aria-hidden
            />
          ) : null}
          {head.title}
        </p>
        <p className="text-caption text-pretty text-muted-foreground">
          {head.line}
        </p>
      </div>
      <div
        role="list"
        aria-label="Steps"
        className="divide-y divide-border overflow-hidden rounded-lg bg-card text-card-foreground ring-1 ring-foreground/10"
      >
        {groups.map((g, i) => (
          <Step key={g.title} n={i + 1} title={g.title} done>
            {g.body}
          </Step>
        ))}
        <Step n={groups.length + 1} title="The code" done last>
          {code?.line ?? ""}
        </Step>
      </div>
      <SettingsNote>{SAVES_NOTE}</SettingsNote>
    </div>
  );
}

/* ── a choice's own radio card, the page's idiom ──────────────────────── */

/** One radio card, after `radio-cards.tsx`'s `RadioCard`: the whole card the choice, its name and one line. */
export function ChoiceCard({
  on,
  label,
  line,
  onChoose,
}: {
  on: boolean;
  label: string;
  line?: string;
  onChoose: () => void;
}) {
  return (
    <div
      data-state={on ? "on" : "off"}
      className={cn(
        "relative rounded-lg border px-3 py-2.5 transition-colors duration-150 motion-reduce:transition-none",
        on
          ? "border-foreground/30 bg-muted/40"
          : "border-border hover:border-foreground/20",
      )}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          role="radio"
          aria-checked={on}
          onClick={onChoose}
          className="absolute inset-0 focus-halo rounded-lg outline-none halo-inset"
        >
          <span className="sr-only">{label}</span>
        </button>
        <span
          aria-hidden
          className={cn(
            "pointer-events-none relative mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
            on ? "border-foreground" : "border-muted-foreground/50",
          )}
        >
          {on ? <span className="size-2 rounded-full bg-foreground" /> : null}
        </span>
        <span className="pointer-events-none relative min-w-0 flex-1">
          <span className="block text-sm font-medium">{label}</span>
          {line ? (
            <span className="block text-caption text-pretty text-muted-foreground">
              {line}
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}

/** A radio group of choice cards, its name over it. */
function ChoiceGroup({
  label,
  choices,
  value,
  onChoose,
}: {
  label: string;
  choices: readonly Choice[];
  value: string;
  onChoose: (id: string) => void;
}) {
  const id = useId();
  return (
    <section className="space-y-2" aria-labelledby={id}>
      <p id={id} className="text-sm font-medium">
        {label}
      </p>
      <div role="radiogroup" aria-labelledby={id} className="space-y-1.5">
        {choices.map((c) => (
          <ChoiceCard
            key={c.id}
            on={c.id === value}
            label={c.label}
            line={c.note}
            onChoose={() => onChoose(c.id)}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * THE ALBUM, A PAGE OF ITS OWN (the `rows` option): how the album runs for
 * guests and what they take home, each a group of the page's radio cards,
 * in the page's one card.
 */
export function AlbumPage() {
  const [order, setOrder] = useState("turns");
  const [take, setTake] = useState("own");
  return (
    <div data-cz-album-page="" className="space-y-6">
      <SettingsCard label="The album">
        <div className="space-y-4 px-4 py-3">
          <ChoiceGroup
            label="How the album runs"
            choices={ORDER_CHOICES}
            value={order}
            onChoose={setOrder}
          />
          <div className="border-t border-border pt-3">
            <ChoiceGroup
              label="What guests take home"
              choices={TAKE_CHOICES}
              value={take}
              onChoose={setTake}
            />
          </div>
        </div>
      </SettingsCard>
      <SettingsNote>
        Each saves the moment you choose it. Your own album keeps its own order.
      </SettingsNote>
    </div>
  );
}

/**
 * MORE FOR THIS PARTY (the `more` option): a quiet fold at the page's foot,
 * opened here, holding the roll's row and the album's two in one card.
 */
export function MoreFold({ way }: { way: RollWay }) {
  const [roll, setRoll] = useState(WEDDING_ROLL);
  const [order, setOrder] = useState("turns");
  const [take, setTake] = useState("own");
  // The page is scrolled to More, opened, the card above it in sight: the frame shows the press, never its search.
  const ref = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    const scroller = el?.closest<HTMLElement>("[data-settings-page]");
    if (!el || !scroller) return;
    const go = () => {
      scroller.scrollTop +=
        el.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top -
        96;
    };
    go();
    const t = window.setTimeout(go, 450);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <section ref={ref} className="space-y-2" data-cz-more="open">
      <p className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1.5 text-sm text-muted-foreground">
        <span>More for this party</span>
        <ChevronDown aria-hidden className="size-4 shrink-0 rotate-180" />
      </p>
      <SettingsCard label="More for this party">
        <RollRow way={way} value={roll} onChange={setRoll} />
        <div className="px-4 py-3">
          <ChoiceGroup
            label="How the album runs"
            choices={ORDER_CHOICES}
            value={order}
            onChoose={setOrder}
          />
        </div>
        <div className="px-4 py-3">
          <ChoiceGroup
            label="What guests take home"
            choices={TAKE_CHOICES}
            value={take}
            onChoose={setTake}
          />
        </div>
      </SettingsCard>
    </section>
  );
}
