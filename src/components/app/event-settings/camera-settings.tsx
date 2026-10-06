"use client";

import {
  type ChangeEvent,
  type FocusEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, ChevronDown } from "lucide-react";

import {
  DEVELOP_NOW_QUESTION,
  judgeDevelopTime,
  TIME_UNFINISHED,
  toLocalInput,
} from "@/components/app/event-settings/camera-settings-develop-time";
import { useFinishedFields } from "@/components/app/event-settings/camera-settings-finish";
import { StylePicture } from "@/components/app/event-settings/camera-settings-style-picture";
import {
  RollControl,
  type RollChange,
} from "@/components/app/event-settings/roll-control";
import {
  SettingsCard,
  SettingsNote,
  StackSetting,
} from "@/components/app/event-settings/settings-furniture";
import { useSettings } from "@/components/app/event-settings/settings-state";
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
 * card with its picture: Live (free uploads, each shown the moment it's added), Review (free uploads, each held until
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
 * develop still ahead, or Develop now, puts every photo taken so far in front of every guest; leaving Review with
 * photos held approves them, shown now, or (★ settled with Will the night of build 45) into a develop time they join
 * the roll, approved and sealed, developing with everyone's (the database releases them in the same save,
 * `events_hold_released`).
 *
 * ★ MOUNTABLE: `AlbumStyles` and `CaptureAndReveal` take the values and a save, so the Library and the lab mount the
 * same controls; `AlbumStyleSettings` binds them to Settings' one state. Create's add step (`create-event-wizard/
 * add-step.tsx`) draws its own cards, which share this page's names, lines and columns (`album-style.ts`), its
 * pictures (`camera-settings-style-picture.tsx`) and its develop time's own judgement
 * (`camera-settings-develop-time.ts`), so the two never say different things.
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
      roll={<RollSetting />}
    >
      {children}
    </AlbumStyles>
  );
}

/** How long the stepper rests before its count is saved: a run of presses is one save, never one a press. */
export const ROLL_REST_MS = 600;

/**
 * SHOTS EACH, ON THE PAGE (customize r1's `roll=both`, and `home=words`: the sentence's "12 shots" is the quick swap, this
 * row the whole control): film's three and Other, over Settings' one state.
 *
 * ★ A BOX SAVES AT ONCE, A RUN OF STEPS ONCE SHE RESTS. Every save is a Server Action that re-renders the hub, so a held
 * plus that sent each count would send dozens. Each count is laid over the row at once (`lay`: the stepper, the
 * Disposable card's line and the first screen's sentence all say it as she steps), and the one she lands on is saved
 * `ROLL_REST_MS` after her last step, or the moment the page goes (Next, the back arrow, a close), since the state
 * outlives the panel. A refused save puts the row's own count back, with the provider's sentence.
 */
export function RollSetting() {
  const s = useSettings();
  const labelId = useId();
  const value = s.values.rollSize ?? ROLL_SHOTS;
  // "Another number" sent her here: the stepper opens, in focus, and the way here is spent.
  const [openOther] = useState(() => s.opening === "roll");
  const { openAt, saveEvent, lay } = s;
  useEffect(() => {
    if (openOther) openAt(null);
  }, [openOther, openAt]);

  // The count that waits for her to rest, and how to send it now.
  const waiting = useRef<{ n: number; timer: number } | null>(null);
  const save = useRef(saveEvent);
  useEffect(() => {
    save.current = saveEvent;
  });
  const flush = useRef(() => {
    const w = waiting.current;
    if (!w) return;
    window.clearTimeout(w.timer);
    waiting.current = null;
    void save.current({ rollSize: w.n });
  });
  useEffect(() => {
    const send = flush.current;
    return () => send();
  }, []);

  const onChange = (n: number, how: RollChange) => {
    lay({ rollSize: n });
    if (waiting.current) window.clearTimeout(waiting.current.timer);
    const timer =
      how === "step"
        ? window.setTimeout(() => flush.current(), ROLL_REST_MS)
        : 0;
    waiting.current = { n, timer };
    if (how === "pick") flush.current();
  };

  return (
    <StackSetting
      label="Shots each"
      labelId={labelId}
      line="Each guest's roll on the album's camera."
    >
      <div data-roll-setting="">
        <RollControl
          value={value}
          onChange={onChange}
          openOther={openOther}
          labelledBy={labelId}
        />
      </div>
    </StackSetting>
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
  roll,
  children,
}: ControlProps & {
  /**
   * The camera's roll, its row (`RollSetting`, over Settings' state): drawn under the develop time while guests add with
   * the camera, and gone with it. Absent, there is no roll row (a frame that draws its own).
   */
  roll?: ReactNode;
  /** The page's own switches (accepting uploads, videos), standing in the develop time's card. */
  children?: ReactNode;
}) {
  const hydrated = useHydrated();
  const nowMs = useWaitClock();
  const labelId = useId();
  const style = styleOf(value);
  const [pending, setPending] = useState<PendingStyle | null>(null);
  // ★ THE TIME'S FIELD STATE STANDS HERE, not in the row that comes and goes with the time: a style switch that clears
  // the time removes the row, and what she had typed over it must go with the time, never write itself back at the close.
  const time = useDevelopTime({
    developsAt: value.developsAt,
    hydrated,
    onSave: (developsAt) => onSave({ developsAt }),
  });
  /** Every write but the time's own: one that changes when everyone sees makes whatever she was typing moot. */
  const save = (patch: Partial<CaptureAndRevealValue>) => {
    if (patch.review !== undefined || patch.developsAt !== undefined) {
      time.drop();
    }
    onSave(patch);
  };
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
    save(patch);
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
              save(pending.patch);
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
              time={time}
              developsAt={value.developsAt}
              review={value.review}
              hydrated={hydrated}
              saving={savingReveal}
            />
          </StackSetting>
        ) : null}
        {value.capture === "camera" ? roll : null}
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
            onSave={save}
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
      <StylePicture style={style} className="h-[72px] w-[88px]" />
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
  // The develop time standing in this control's own card (`timeElsewhere` leaves it to the page's row, where it is idle).
  const time = useDevelopTime({
    developsAt: value.developsAt,
    hydrated,
    onSave: (developsAt) => onSave({ developsAt }),
  });
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
    time.drop();
    onSave(patchFor(to));
  };

  const confirm = (patch: Partial<CaptureAndRevealValue>) => {
    setPending(null);
    time.drop();
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
                time={time}
                developsAt={value.developsAt}
                review={value.review}
                hydrated={hydrated}
                saving={savingReveal}
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

/** The develop time is one field, so the one key `useFinishedFields` holds a draft under. */
const TIME_FIELD = ["time"] as const;

/**
 * THE DEVELOP TIME'S FIELD, picked in her own zone and saved once she has finished it. It still moves whenever she
 * needs longer (Will's `both=never`: "the date can always be pushed back by the host if more review time is needed").
 *
 * ★ A DEVELOP CANNOT BE UNDONE, SO A TIME REACHES THE WRITE ONLY WHEN IT IS PLAINLY MEANT (crumbs-60, the date field's
 * twin): the database stores a time at or before its own now as now and opens every sealed row in that same save, so a
 * year left half typed (Chrome types 2027 as 0002, 0020, 0202, each a whole time) or any past time was Develop now with
 * no question asked. What she types is a draft the field shows and nothing sends; it is judged once, when she has finished
 * it, by `judgeDevelopTime`:
 *   - A year outside the date's window (`isSaneDay`), a blank or half filled field, a time beyond a year ahead, and a
 *     past time on an album that has already developed are said under the field in words and never written.
 *   - A time the database would store as now, on an album that still waits, asks Develop now's own question (the button's,
 *     the hub's: one sentence, one answer), and Develop now writes now, never the time she typed.
 *   - A time plainly meant (ahead, within reach) is saved.
 *
 * ★ WHEN SHE HAS FINISHED IT IS THE DATE'S OWN (crumbs-72: `useFinishedFields`, the one beat and the one close-save of
 * both): leaving the field, Return, a picker's choice resting a beat (a phone's picker may never blur it), or the panel
 * closing (Escape or Back must not drop a typed time). A close judges the same way and writes only what it would write
 * unasked: a time plainly meant is saved, and one that would ask, or is refused in words, writes nothing, since a close
 * cannot ask and there is nobody left to read the words.
 *
 * ★ ITS STATE STANDS IN THE COMPONENT THAT STAYS MOUNTED while the time comes and goes (`AlbumStyles`, `CaptureAndReveal`):
 * another control clears the time (a style switch), the field goes with it, and a typed time still pending would write
 * itself back over her choice at the close. So every write that changes when everyone sees `drop`s the draft first.
 */
function useDevelopTime({
  developsAt,
  hydrated,
  onSave,
}: {
  developsAt: string | null;
  hydrated: boolean;
  onSave: (developsAt: string) => void;
}) {
  const shown = hydrated && developsAt ? toLocalInput(developsAt) : "";
  // What she typed and has not finished: the field shows it, nothing sends it.
  const [draft, setDraft] = useState<string | null>(null);
  // Why what she finished is not saved, said under the field.
  const [refusal, setRefusal] = useState<string | null>(null);
  // Develop now's question: the button's own, or the one a time that would develop the album at once brings.
  const [asking, setAsking] = useState<"button" | "time" | null>(null);

  /** She has finished the field: what it holds is judged, once. */
  const finished = (typed: string) => {
    const verdict = judgeDevelopTime({
      typed,
      shown,
      developsAt,
      nowMs: Date.now(),
    });
    if (verdict.kind === "refuse") {
      // The draft stays in the field, marked, until she types again.
      setRefusal(verdict.words);
      return;
    }
    setRefusal(null);
    if (verdict.kind === "ask") {
      setAsking("time");
      return;
    }
    setDraft(null);
    if (verdict.kind === "save") onSave(verdict.iso);
  };

  const fields = useFinishedFields(
    TIME_FIELD,
    (_key, typed) => finished(typed),
    () => setRefusal(TIME_UNFINISHED),
  );

  /** The draft, its words and its question are moot: another control moved the time, or Develop now wrote now. */
  const drop = () => {
    fields.settle("time");
    setDraft(null);
    setRefusal(null);
    setAsking(null);
  };

  return {
    value: draft ?? shown,
    refusal,
    asking,
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      // A new time is a new question: the old words and the old question go.
      setRefusal(null);
      setAsking((a) => (a === "time" ? null : a));
      setDraft(e.target.value);
      fields.draft("time", e.target);
    },
    onBlur: (e: FocusEvent<HTMLInputElement>) =>
      fields.finish("time", e.currentTarget),
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) =>
      fields.keyDown("time", e),
    ask: () => setAsking("button"),
    developNow: () => {
      drop();
      // The database stores a develop time this close to its own clock as its own now: it writes now, never the time she typed.
      onSave(new Date().toISOString());
    },
    /** Keep it as it is: the question goes, and a time it asked about goes with it, back to what is saved. */
    keepAsItIs: () => {
      if (asking === "time") setDraft(null);
      setAsking(null);
    },
    drop,
  };
}

type DevelopTimeField = ReturnType<typeof useDevelopTime>;

/** The develop time's field, and Develop now while it waits (asking first: every photo added so far shows at once). */
function DevelopTimeControl({
  time,
  developsAt,
  review,
  hydrated,
  saving,
}: {
  time: DevelopTimeField;
  developsAt: string | null;
  review: boolean;
  hydrated: boolean;
  saving: boolean;
}) {
  const state = hydrated ? developState(developsAt).kind : "none";
  const fieldId = useId();
  const lineId = `${fieldId}-line`;
  const refusalId = `${fieldId}-refusal`;
  // Said in her own zone, so only after hydration: the server cannot know what "9 am" means to her.
  const when = hydrated ? developTimeWords(developsAt) : null;

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <label className="sr-only" htmlFor={fieldId}>
          Develop time
        </label>
        {/* ★ A SAVE NEVER DISABLES THE FIELD: a picker's choice saves a beat after it (`useFinishedFields`), and a field that
            went dead as that save went out would close the picker under her mid-pick (a calendar's day, then its time). */}
        <Input
          id={fieldId}
          type="datetime-local"
          value={time.value}
          disabled={!hydrated}
          aria-invalid={time.refusal ? true : undefined}
          aria-describedby={time.refusal ? `${lineId} ${refusalId}` : lineId}
          onChange={time.onChange}
          onBlur={time.onBlur}
          onKeyDown={time.onKeyDown}
          className="max-w-60"
        />
        <p id={lineId} className="text-caption text-muted-foreground">
          {!when
            ? " "
            : state === "developed"
              ? `Developed ${when}. ${review ? "New ones wait for your approval." : "New ones show straight away."}`
              : `Develops ${when}.`}
        </p>
        <p
          id={refusalId}
          aria-live="polite"
          className="text-caption text-pretty text-destructive empty:hidden"
        >
          {time.refusal ?? ""}
        </p>
      </div>
      {state === "waiting" ? (
        time.asking ? (
          <ConsequenceLine
            confirmLabel="Develop now"
            onConfirm={time.developNow}
            onCancel={time.keepAsItIs}
            busy={saving}
          >
            {DEVELOP_NOW_QUESTION}
          </ConsequenceLine>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={saving}
            data-develop-now=""
            onClick={time.ask}
          >
            Develop now
          </Button>
        )
      ) : null}
    </div>
  );
}
