"use client";

import { useId, useState, type ReactNode } from "react";
import { Check, ChevronDown, Clock } from "lucide-react";

import {
  SettingsCard,
  SettingsNote,
  StackSetting,
} from "@/components/app/event-settings/settings-furniture";
import { useSettings } from "@/components/app/event-settings/settings-state";
import { GUEST_GHOST_FRAMES } from "@/components/guest/gallery-empty-state";
import { Button } from "@/components/ui/button";
import { ConsequenceLine } from "@/components/ui/consequence-line";
import { Input } from "@/components/ui/input";
import {
  ALBUM_STYLES,
  type AlbumStyle,
  patchForStyle,
  type StyleConsequence,
  styleLine,
  STYLE_NAMES,
  styleOf,
  styleSwitchConsequence,
} from "@/lib/disposable/album-style";
import { developTimeWords } from "@/lib/disposable/develop-words";
import type { Capture } from "@/lib/disposable/facts";
import {
  defaultDevelopAt,
  developState,
  developTimeWithinReach,
  revealOf,
  type Reveal,
} from "@/lib/disposable/reveal";
import { ROLL_SHOTS } from "@/lib/disposable/roll";
import { useWaitClock } from "@/lib/disposable/use-wait-clock";
import { developsWhen } from "@/lib/guest/camera/words";
import { useHydrated } from "@/lib/shared/use-hydrated";
import { cn } from "@/lib/utils";

/**
 * WHAT GUESTS CAN ADD, AS ALBUM STYLES (the-wait r1, Will's desk on build 45: "the option 2 album styles settings design
 * seems far superior - cleaner design/presentation, difference feels more clear"). One pick of a named album, each a
 * card with its picture: Live (free uploads, each shown the moment it's added), Reviewed (free uploads, each held until
 * the host lets it in) and Disposable (the album's camera with a develop time; Will's `name=disposable`). Under them the
 * develop time, where the album has one, the page's switches, and Customize, where the event's two answers stand apart
 * (how guests add; when everyone sees) for a mix outside the three. A style is words over those columns
 * (`lib/disposable/album-style.ts`), never a column, and each press is ONE save of all three, so no half-state is ever
 * stored.
 *
 * ★ APPROVAL NEVER STANDS WITH A DEVELOP (Will's `both=never`): a disposable keeps only its develop time, and a note says
 * how a host checks it before it develops (her hub's cover, Look); the develop time still moves whenever she needs
 * longer. The database refuses the pair (`events_approval_never_develops`, 20261003100000).
 *
 * ★ A CHANGE THAT SHOWS PEOPLE SOMETHING SAYS SO FIRST (the door's `ConsequenceLine`; nothing else asks): leaving a
 * develop still ahead, or Develop now, puts every photo taken so far in front of every guest; leaving Reviewed with
 * photos held approves them, shown now, or (★ settled with Will the night of build 45) into a develop time they join
 * the roll, approved and sealed, developing with everyone's (the database releases them in the same save,
 * `events_hold_released`).
 *
 * ★ MOUNTABLE: `AlbumStyles` and `CaptureAndReveal` take the values and a save, so the Library, the lab and the create
 * wizard's later wiring mount the same controls; `AlbumStyleSettings` binds them to Settings' one state.
 *
 * Times are the host's own: the develop time is shown and picked in her browser's zone (`datetime-local`), and stays
 * blank until hydration, since the server cannot know what "9 am" means to her.
 */

export type CaptureAndRevealValue = {
  capture: Capture;
  /** Uploads wait for the host (`moderation_mode = hold_for_approval`). */
  review: boolean;
  developsAt: string | null;
};

const people = (n: number) => (n === 1 ? "1 photo" : `${n} photos`);

/* ── bound to Settings ───────────────────────────────────────────────── */

/** The album styles over Settings' one state, the page's switches handed in to stand in its card. */
export function AlbumStyleSettings({ children }: { children?: ReactNode }) {
  const s = useSettings();
  return (
    <AlbumStyles
      value={{
        capture: s.values.capture,
        review: s.values.review,
        developsAt: s.values.developsAt,
      }}
      rollSize={s.values.rollSize}
      eventDate={s.values.eventDate || null}
      eventEndDate={s.values.eventEndDate || null}
      heldCount={s.pendingCount}
      savingCapture={s.saving("capture")}
      savingReveal={s.saving("review") || s.saving("developsAt")}
      onSave={(patch) => void s.saveEvent(patch)}
    >
      {children}
    </AlbumStyles>
  );
}

/** The two answers apart, bound to Settings (Customize's own control, standing alone). */
export function CameraSettings() {
  const s = useSettings();
  return (
    <CaptureAndReveal
      value={{
        capture: s.values.capture,
        review: s.values.review,
        developsAt: s.values.developsAt,
      }}
      rollSize={s.values.rollSize}
      eventDate={s.values.eventDate || null}
      eventEndDate={s.values.eventEndDate || null}
      heldCount={s.pendingCount}
      savingCapture={s.saving("capture")}
      savingReveal={s.saving("review") || s.saving("developsAt")}
      onSave={(patch) => void s.saveEvent(patch)}
    />
  );
}

/* ── album styles ────────────────────────────────────────────────────── */

type ControlProps = {
  value: CaptureAndRevealValue;
  /** The camera's roll as the row has it (the database fills in 24), or null before it lands. */
  rollSize: number | null;
  /** The party's date (`YYYY-MM-DD`), which the default develop time follows. */
  eventDate: string | null;
  /** A range's last day, which it follows instead (9 am the morning after it); absent reads as one day. */
  eventEndDate?: string | null;
  /** Uploads held for the host's approval now: leaving approval releases them, so it asks first. */
  heldCount: number;
  savingCapture: boolean;
  savingReveal: boolean;
  onSave: (patch: Partial<CaptureAndRevealValue>) => void;
};

/** What a style switch waiting on its consequence line would write. */
type PendingStyle = {
  style: AlbumStyle;
  patch: CaptureAndRevealValue;
  consequence: StyleConsequence;
};

/** The consequence line's sentence and its button, in one place; the develop's time in her clock once it is known. */
export function styleConsequenceWords(
  c: StyleConsequence,
  developsAt: string | null,
  nowMs: number | null,
): { line: string; confirm: string } {
  if (c.kind === "show-waiting") {
    return {
      line: "Every photo added so far shows now, to every guest.",
      confirm: "Show them now",
    };
  }
  const one = c.count === 1;
  if (c.kind === "approve-held") {
    return {
      line: `${people(c.count)} under review ${one ? "is" : "are"} approved and ${one ? "shows" : "show"} to everyone now.`,
      confirm: "Approve and show them",
    };
  }
  const when =
    nowMs !== null && developsAt ? ` ${developsWhen(developsAt, nowMs)}` : "";
  return {
    line: `${people(c.count)} under review ${one ? "joins" : "join"} the roll: approved, ${one ? "it develops" : "they develop"} with everyone's${when}, and ${one ? "its guest" : "their guests"} can still take ${one ? "it" : "them"} back before then.`,
    confirm: "Add them to the roll",
  };
}

export function AlbumStyles({
  value,
  rollSize,
  eventDate,
  eventEndDate,
  heldCount,
  savingCapture,
  savingReveal,
  onSave,
  children,
}: ControlProps & {
  /** The page's own switches (accepting uploads, videos), standing in the develop time's card. */
  children?: ReactNode;
}) {
  const hydrated = useHydrated();
  const nowMs = useWaitClock();
  const labelId = useId();
  const style = styleOf(value);
  const [pending, setPending] = useState<PendingStyle | null>(null);
  // Customize stands open where the album holds a mix outside the styles; a host opens it otherwise.
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const saving = savingCapture || savingReveal;
  const waiting =
    nowMs !== null && developState(value.developsAt, nowMs).kind === "waiting";

  const choose = (to: AlbumStyle) => {
    setPending(null);
    if (to === style) return;
    const patch = patchForStyle(to, value, { eventDate, eventEndDate });
    const consequence = styleSwitchConsequence({
      from: value,
      to: patch,
      heldCount,
    });
    if (consequence) {
      setPending({ style: to, patch, consequence });
      return;
    }
    onSave(patch);
  };

  const words = pending
    ? styleConsequenceWords(
        pending.consequence,
        pending.patch.developsAt,
        nowMs,
      )
    : null;

  return (
    <div className="space-y-4" data-album-styles={style ?? "mix"}>
      <section className="space-y-2" aria-labelledby={labelId}>
        <p id={labelId} className="px-1 text-sm font-medium">
          Album style
        </p>
        <div role="radiogroup" aria-labelledby={labelId} className="space-y-2">
          {ALBUM_STYLES.map((st) => (
            <StyleCard
              key={st}
              style={st}
              on={style === st}
              line={styleLine(st, { rollSize })}
              disabled={saving}
              onChoose={() => choose(st)}
            />
          ))}
        </div>
        {pending && words ? (
          <ConsequenceLine
            confirmLabel={words.confirm}
            onConfirm={() => {
              setPending(null);
              onSave(pending.patch);
            }}
            onCancel={() => setPending(null)}
            busy={saving}
          >
            {words.line}
          </ConsequenceLine>
        ) : null}
      </section>

      <SettingsCard label="What guests can add">
        {value.developsAt !== null ? (
          <StackSetting
            label="Develop time"
            line="Everyone's photos appear at once."
          >
            <DevelopTimeControl
              developsAt={value.developsAt}
              review={value.review}
              hydrated={hydrated}
              saving={savingReveal}
              onSave={(developsAt) => onSave({ developsAt })}
            />
          </StackSetting>
        ) : null}
        {children}
      </SettingsCard>

      {waiting && value.developsAt ? (
        // Will's `both=never`: a disposable's check is her cover, lifted before it develops; never a queue to clear.
        <SettingsNote>
          <span data-look-note="">
            {`Before it develops ${developsWhen(value.developsAt, nowMs!)}, look under the cover on your event page to take anything out. Need longer? Move the develop time.`}
          </span>
        </SettingsNote>
      ) : null}

      <Customize
        open={customizeOpen || style === null}
        mix={style === null}
        onOpenChange={setCustomizeOpen}
      >
        <SettingsCard label="How guests add, and when everyone sees">
          <CaptureAndReveal
            value={value}
            rollSize={rollSize}
            eventDate={eventDate}
            eventEndDate={eventEndDate}
            heldCount={heldCount}
            savingCapture={savingCapture}
            savingReveal={savingReveal}
            onSave={onSave}
            timeElsewhere
          />
        </SettingsCard>
      </Customize>
    </div>
  );
}

/** One album style: its picture, its name and its line, the whole card the choice. */
function StyleCard({
  style,
  on,
  line,
  disabled,
  onChoose,
}: {
  style: AlbumStyle;
  on: boolean;
  line: string;
  disabled: boolean;
  onChoose: () => void;
}) {
  return (
    <div
      data-album-style={style}
      data-state={on ? "on" : "off"}
      className={cn(
        "relative flex items-center gap-3 rounded-xl border p-2.5 transition-colors duration-150 motion-reduce:transition-none",
        on
          ? "border-foreground/40 bg-muted/40 ring-1 ring-foreground/15"
          : "border-border hover:border-foreground/20",
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={on}
        disabled={disabled && !on}
        onClick={onChoose}
        className="absolute inset-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-wait"
      >
        <span className="sr-only">{`${STYLE_NAMES[style]}. ${line}`}</span>
      </button>
      <StylePicture style={style} />
      <span aria-hidden className="pointer-events-none relative min-w-0 flex-1">
        <span className="block font-heading text-base">
          {STYLE_NAMES[style]}
        </span>
        <span className="block text-caption text-pretty text-muted-foreground">
          {line}
        </span>
      </span>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none relative flex size-5 shrink-0 items-center justify-center rounded-full border",
          on
            ? "border-foreground bg-foreground text-background"
            : "border-muted-foreground/40",
        )}
      >
        {on ? <Check className="size-3" /> : null}
      </span>
    </div>
  );
}

/**
 * A STYLE'S PICTURE, a small album in its own light (the board's mini-albums), from the guest ghost pack every empty
 * album already ships (no new asset): Live all lit; Reviewed lit but for one held under a clock and one fading in;
 * Disposable dark but for one, hers.
 */
function StylePicture({ style }: { style: AlbumStyle }) {
  const frames = GUEST_GHOST_FRAMES.slice(0, 6);
  return (
    <span
      aria-hidden
      data-style-picture={style}
      className="relative grid h-[72px] w-[88px] shrink-0 grid-cols-3 gap-[2px] overflow-hidden rounded-[10px] bg-gallery p-[3px]"
    >
      {frames.map((frame, i) => {
        const lit =
          style === "live"
            ? true
            : style === "approval"
              ? i % 3 !== 2
              : i === 4;
        return (
          <span
            key={frame.src}
            className={cn(
              "relative overflow-hidden rounded-[2px] bg-white/10",
              style === "disposable" && lit && "shadow-[0_0_0_1px_#fff]",
            )}
          >
            {lit ? (
              // eslint-disable-next-line @next/next/no-img-element -- a ghost-pack still, the style's picture
              <img
                src={frame.src}
                alt=""
                loading="lazy"
                decoding="async"
                className={cn(
                  "absolute inset-0 size-full object-cover",
                  style === "approval" && i % 3 === 1 && "opacity-40",
                )}
              />
            ) : style === "approval" ? (
              <Clock className="absolute inset-0 m-auto size-3 text-white/60" />
            ) : null}
          </span>
        );
      })}
    </span>
  );
}

/** Customize: the two answers apart, folded under the styles until a host opens it (or the album holds a mix). */
function Customize({
  open,
  mix,
  onOpenChange,
  children,
}: {
  open: boolean;
  /** The album holds a mix outside the styles: it stands open, and says so. */
  mix: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  const bodyId = useId();
  return (
    <section className="space-y-2" data-customize={open ? "open" : "closed"}>
      {mix ? (
        <p className="px-1 text-sm text-muted-foreground">
          Your own mix: how guests add, and when everyone sees
        </p>
      ) : (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => onOpenChange(!open)}
          className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1.5 text-left text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span>Customize how guests add and when everyone sees</span>
          <ChevronDown
            aria-hidden
            className={cn(
              "size-4 shrink-0 transition-transform duration-150 motion-reduce:transition-none",
              open && "rotate-180",
            )}
          />
        </button>
      )}
      <div id={bodyId} hidden={!open}>
        {open ? children : null}
      </div>
    </section>
  );
}

/* ── the two answers, apart (Customize) ──────────────────────────────── */

/** The one consequence a pending change opens, keyed by what it would do. */
type Pending =
  | { kind: "show-waiting"; to: Exclude<Reveal, "develop"> }
  | { kind: "approve-held"; to: Exclude<Reveal, "approve"> }
  | null;

/**
 * HOW GUESTS ADD, AND WHEN EVERYONE SEES WHAT'S ADDED, APART (the foundation's control, 20261002200000): free uploads or
 * the album's camera; and one three-way choice, right away, once you approve each, or at a develop time (never
 * approval with one: Will's `both=never`). Settings mounts it under Customize, where its develop time stands in the
 * page's own row (`timeElsewhere`); alone it carries its own.
 */
export function CaptureAndReveal({
  value,
  rollSize,
  eventDate,
  eventEndDate,
  heldCount,
  savingCapture,
  savingReveal,
  onSave,
  timeElsewhere = false,
}: ControlProps & {
  /** The develop time and Develop now stand elsewhere on the page (Settings' own row): this control asks only which. */
  timeElsewhere?: boolean;
}) {
  const hydrated = useHydrated();
  const [pending, setPending] = useState<Pending>(null);
  const reveal = revealOf(value);
  const develop = developState(value.developsAt);
  const waiting = develop.kind === "waiting";
  const howId = useId();
  const whenId = useId();

  /** The patch each answer writes: both columns together, one save, so no half-state is ever stored. */
  const patchFor = (to: Reveal): Partial<CaptureAndRevealValue> => {
    if (to === "right-away") return { review: false, developsAt: null };
    if (to === "approve") return { review: true, developsAt: null };
    // A develop keeps a time still ahead, or offers 9 am the day after the party.
    return {
      review: false,
      developsAt: waiting
        ? value.developsAt
        : defaultDevelopAt({ eventDate, eventEndDate }).toISOString(),
    };
  };

  const chooseReveal = (to: Reveal) => {
    setPending(null);
    if (to === reveal) return;
    if (waiting && to !== "develop") {
      setPending({ kind: "show-waiting", to });
      return;
    }
    if (value.review && heldCount > 0 && to !== "approve") {
      setPending({ kind: "approve-held", to });
      return;
    }
    onSave(patchFor(to));
  };

  const confirm = (patch: Partial<CaptureAndRevealValue>) => {
    setPending(null);
    onSave(patch);
  };

  const roll = rollSize ?? ROLL_SHOTS;

  return (
    <div data-capture-and-reveal="" className="space-y-4 px-4 py-3">
      <section className="space-y-2" aria-labelledby={howId}>
        <p id={howId} className="text-sm font-medium">
          How guests add
        </p>
        <div role="radiogroup" aria-labelledby={howId} className="space-y-1.5">
          <Choice
            on={value.capture === "upload"}
            label="Free uploads"
            line="Guests add as many photos as they like."
            onChoose={() =>
              value.capture !== "upload" && onSave({ capture: "upload" })
            }
            disabled={savingCapture}
            data="upload"
          />
          <Choice
            on={value.capture === "camera"}
            label="The album's camera"
            line={`A roll of ${roll} shots each. Removing one frees its frame.`}
            onChoose={() =>
              value.capture !== "camera" && onSave({ capture: "camera" })
            }
            disabled={savingCapture}
            data="camera"
          />
        </div>
      </section>

      <section
        className="space-y-2 border-t border-border pt-3"
        aria-labelledby={whenId}
      >
        <p id={whenId} className="text-sm font-medium">
          {"When everyone sees what's added"}
        </p>
        <div role="radiogroup" aria-labelledby={whenId} className="space-y-1.5">
          <Choice
            on={reveal === "right-away"}
            label="Right away"
            line="Each photo shows the moment it's added."
            onChoose={() => chooseReveal("right-away")}
            disabled={savingReveal}
            data="right-away"
          />
          <Choice
            on={reveal === "approve"}
            label="Once you approve each"
            line="Hold new photos until you approve or reject them, instead of showing them live."
            onChoose={() => chooseReveal("approve")}
            disabled={savingReveal}
            data="approve"
          />
          <Choice
            on={reveal === "develop"}
            label="At a develop time"
            line="Hidden until then, and everyone sees them at once."
            onChoose={() => chooseReveal("develop")}
            disabled={savingReveal}
            data="develop"
          >
            {reveal === "develop" && !timeElsewhere ? (
              <DevelopTimeControl
                developsAt={value.developsAt}
                review={value.review}
                hydrated={hydrated}
                saving={savingReveal}
                onSave={(developsAt) => onSave({ developsAt })}
              />
            ) : null}
          </Choice>
        </div>

        {pending?.kind === "show-waiting" ? (
          <ConsequenceLine
            confirmLabel="Show them now"
            onConfirm={() => confirm(patchFor(pending.to))}
            onCancel={() => setPending(null)}
            busy={savingReveal}
          >
            Every photo added so far shows now, to every guest.
          </ConsequenceLine>
        ) : null}
        {pending?.kind === "approve-held" ? (
          <ConsequenceLine
            confirmLabel={
              pending.to === "develop"
                ? "Add them to the roll"
                : "Approve and show them"
            }
            onConfirm={() => confirm(patchFor(pending.to))}
            onCancel={() => setPending(null)}
            busy={savingReveal}
          >
            {pending.to === "develop"
              ? `${people(heldCount)} under review ${heldCount === 1 ? "joins" : "join"} the roll: approved, ${heldCount === 1 ? "it develops" : "they develop"} with everyone's.`
              : `${people(heldCount)} under review ${heldCount === 1 ? "is" : "are"} approved and ${heldCount === 1 ? "shows" : "show"} to everyone now.`}
          </ConsequenceLine>
        ) : null}
      </section>
    </div>
  );
}

/** One radio card, the door page's own idiom: the whole card is the choice, its name and one line inside. */
function Choice({
  on,
  label,
  line,
  onChoose,
  disabled,
  data,
  children,
}: {
  on: boolean;
  label: string;
  line: string;
  onChoose: () => void;
  disabled?: boolean;
  data: string;
  children?: ReactNode;
}) {
  return (
    <div
      data-choice={data}
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
          disabled={disabled && !on}
          onClick={onChoose}
          className="absolute inset-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-wait"
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
          <span className="block text-caption text-pretty text-muted-foreground">
            {line}
          </span>
        </span>
      </div>
      {children ? (
        <div className="relative z-10 mt-2.5 pl-6.5">{children}</div>
      ) : null}
    </div>
  );
}

/* ── the develop time, in one place ──────────────────────────────────── */

/** `YYYY-MM-DDTHH:mm` in the browser's own time zone, the value a `datetime-local` field holds. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * THE DEVELOP TIME, picked in her own zone and saved when she leaves the field, and Develop now while it waits (asking
 * first: every photo added so far shows at once). It still moves whenever she needs longer (Will's `both=never`: "the
 * date can always be pushed back by the host if more review time is needed").
 */
function DevelopTimeControl({
  developsAt,
  review,
  hydrated,
  saving,
  onSave,
}: {
  developsAt: string | null;
  review: boolean;
  hydrated: boolean;
  saving: boolean;
  onSave: (developsAt: string) => void;
}) {
  const shown = hydrated && developsAt ? toLocalInput(developsAt) : "";
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [askingNow, setAskingNow] = useState(false);
  const value = draft ?? shown;
  const state = hydrated ? developState(developsAt).kind : "none";
  const fieldId = useId();
  // Said in her own zone, so only after hydration: the server cannot know what "9 am" means to her.
  const when = hydrated ? developTimeWords(developsAt) : null;

  const commit = () => {
    if (draft === null || draft === shown) {
      setDraft(null);
      return;
    }
    const at = new Date(draft);
    const iso = Number.isFinite(at.getTime()) ? at.toISOString() : null;
    if (!iso || !developTimeWithinReach(iso)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    setDraft(null);
    onSave(iso);
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <label className="sr-only" htmlFor={fieldId}>
          Develop time
        </label>
        <Input
          id={fieldId}
          type="datetime-local"
          value={value}
          disabled={!hydrated || saving}
          aria-invalid={invalid || undefined}
          onChange={(e) => {
            setInvalid(false);
            setDraft(e.target.value);
          }}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
          }}
          className="max-w-60"
        />
        <p className="text-caption text-muted-foreground">
          {!when
            ? " "
            : invalid
              ? "Pick a time within a year."
              : state === "developed"
                ? `Developed ${when}. ${review ? "New ones wait for your approval." : "New ones show straight away."}`
                : `Develops ${when}.`}
        </p>
      </div>
      {state === "waiting" ? (
        askingNow ? (
          <ConsequenceLine
            confirmLabel="Develop now"
            onConfirm={() => {
              setAskingNow(false);
              // The database stores a develop time this close to its own clock as its own now.
              onSave(new Date().toISOString());
            }}
            onCancel={() => setAskingNow(false)}
            busy={saving}
          >
            Every photo added so far shows now, to every guest. New ones show
            straight away.
          </ConsequenceLine>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={saving}
            data-develop-now=""
            onClick={() => setAskingNow(true)}
          >
            Develop now
          </Button>
        )
      ) : null}
    </div>
  );
}
