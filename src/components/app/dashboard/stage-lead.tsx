"use client";

import {
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type Ref,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { CalendarDays, Check, ChevronDown, X } from "lucide-react";

import { Stage } from "@/components/app/dashboard/stage";
import { lampLight, nextLamp } from "@/components/app/dashboard/stage-lit";
import type { HomeContext } from "@/lib/dashboard/home-event";
import type { HostedEvent, StageView } from "@/lib/dashboard/home-view";
import { RULES, type RuleId } from "@/lib/dashboard/lead";
import { RULE_WORDS } from "@/lib/dashboard/lead-words";
import type { LeadChoice } from "@/lib/dashboard/leading";
import { lampOf } from "@/lib/dashboard/stage";
import { cn } from "@/lib/utils";

/**
 * THE STAGE'S OWN WORDS (host-dashboard r4, Will 2026-10-05: `chooser=words`): nothing over the picture. The stage's first
 * line says why its event leads ("YOUR NEWEST", "LATEST PHOTOS", "IN 18 DAYS"), and that reason is the control that
 * chooses what leads: the house's word that is a control, in the line's own capitals, with its chevron. It stands only
 * where there is a choice to make (more than one event, none on its day: `hasChoice`); everywhere else the stage says its
 * phase as it always did.
 *
 * ★ PRESSING IT TURNS THE STAGE TO CHOOSE: the words column becomes the four rules in the stage's own type, each with the
 * event it would lead with today and the fact that picked it, and the picture side shows the event under the pointer or
 * the focus, in its own light. Choosing turns the stage back with its new lead, its new reason first. No surface floats
 * over the page, and at a phone the rules stand where the words stood, under the picture, at the thumb.
 *
 * ★ A ROW IS THE ACT, AS IN EVERY QUICK CHOICE: pointing or arrowing only shows; a press (Enter, Space, a tap) keeps the
 * rule and turns back; Escape, the close, a press anywhere else or a Tab out of the four turn back with nothing changed,
 * and the focus goes back to the phrase from inside.
 *
 * ★ HOW IT IS DRAWN THROUGH THE STAGE'S SLOTS (`stage.tsx`): the phrase is the `eyebrow`; while turned the band hides its own
 * words (`className`, the sheet below) and the rules stand over that column, measured off the band and drawn outside it,
 * so a band redrawn for another event never takes the focus with it, and the whole band is inert beneath them (a press
 * on its picture only turns back, and never opens the event).
 *
 * ★ THE WORDS ARE THE SERVER'S (`leading.ts`, `lead-words.ts`): every row and the phrase are text it decided beside the
 * rules, so what a row says and what choosing it leads with cannot disagree, and nothing here reads a rule.
 */

/**
 * THE TURN'S MOTION, each step an occasional one (bible 5: under 300 ms) and none under reduced motion, where every state
 * stands complete:
 *  - turning to choose: the band's words go, the rules rise in their place, 20 ms apart (the last lands at 280 ms);
 *  - another event shown while choosing (or chosen at a phone): its light and its picture come up out of the band's dark
 *    in 200 ms;
 *  - turning back: the band's words rise in 240 ms, the new reason first.
 * The curve is the house's `--ease-emphasis`.
 */
const SHEET = `
.sl-reason [data-stage-phase]{display:none}
@keyframes sl-turn-in{from{opacity:0;transform:translateY(10px)}}
@keyframes sl-words-in{from{opacity:0;transform:translateY(8px)}}
@keyframes sl-light-in{from{opacity:0}}
[data-stage-lead] [data-stage]>div:has([data-stage-word]){transition:min-height 200ms cubic-bezier(.23,1,.32,1)}
.sl-turned>div:has([data-stage-word]){opacity:0;min-height:var(--sl-turn-h,0px)}
.sl-arrive>div:has([data-stage-word]){animation:sl-words-in 240ms cubic-bezier(.23,1,.32,1) both}
.sl-swap>div[aria-hidden]:first-child,.sl-swap>div:has([data-stage-word])~div{animation:sl-light-in 200ms ease-out both}
[data-stage-choosing] [data-stage-turn]{animation:sl-turn-in 180ms cubic-bezier(.23,1,.32,1) both;animation-delay:calc(var(--i,0)*20ms)}
@media (prefers-reduced-motion:reduce){.sl-arrive>div,.sl-swap>div,[data-stage-choosing] [data-stage-turn]{animation:none!important}[data-stage-lead] [data-stage]>div{transition:none!important}}
`;

type Box = { top: number; left: number; width: number; height: number };

const near = (a: Box | null, b: Box) =>
  a !== null &&
  Math.abs(a.top - b.top) < 0.5 &&
  Math.abs(a.left - b.left) < 0.5 &&
  Math.abs(a.width - b.width) < 0.5 &&
  Math.abs(a.height - b.height) < 0.5;

/**
 * AN EVENT'S FACE, SMALL: its cover where it has photographs, else its own lamp's light on the gallery's dark (the light its
 * empty stage stands in), so a rule's row previews the stage it would draw.
 */
function Face({
  event,
  className,
}: {
  event: HostedEvent;
  className?: string;
}) {
  const cover = event.stills[0];
  const lamp = lampOf(event.id);
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gallery",
        className,
      )}
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL, not optimizable
        <img
          src={cover}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <>
          <span
            className="absolute inset-0"
            style={{
              background: `radial-gradient(70% 70% at 65% 45%, ${lampLight(lamp, 70)}, transparent 75%), radial-gradient(60% 60% at 95% 105%, ${lampLight(nextLamp(lamp), 45)}, transparent 70%)`,
            }}
          />
          <CalendarDays className="relative size-3.5 text-white/80" />
        </>
      )}
    </span>
  );
}

/**
 * THE PHRASE THAT IS THE CONTROL: the reason the stage's first line gives, drawn as the house's word that is a control
 * (underlined like a link's quieter cousin, its dots brightening under the pointer), in the line's own small capitals,
 * white where the line is muted, and a chevron after it, so it reads as a choice and never as a glossary's mark. It stands
 * alone in the line: the phase word gives way to it while the control shows (the date is said a line below, under the name).
 *
 * ★ A THUMB'S TARGET ON A LABEL'S TYPE: the words are 16 px high, the press reaches 44 (an invisible `after:` box), and the
 * line's height never moves.
 */
function Phrase({
  rule,
  label,
  open,
  controls,
  onPress,
  ref,
}: {
  rule: RuleId;
  label: string;
  open: boolean;
  /** The chooser's id, while it is showing. */
  controls?: string;
  onPress: () => void;
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      type="button"
      data-stage-rule={rule}
      data-stage-phrase=""
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? controls : undefined}
      onClick={onPress}
      className={cn(
        "relative -mx-1 rounded-md px-1 font-medium text-white uppercase outline-none",
        "underline decoration-white/40 decoration-dotted decoration-[1.5px] underline-offset-[5px]",
        "transition-[text-decoration-color] duration-150 hover:decoration-white motion-reduce:transition-none",
        "focus-halo",
        "after:absolute after:-inset-x-1 after:-inset-y-3.5 after:content-['']",
      )}
    >
      {label}
      <ChevronDown
        className="ml-1 inline size-3 -translate-y-px align-middle opacity-80"
        aria-hidden
      />
      <span className="sr-only">: choose what leads</span>
    </button>
  );
}

export function StageLead({
  stage,
  ctx,
  rule,
  choices,
  stageOf,
  onRule,
}: {
  /** The event on the stage now, as the page composed it around the rule she keeps. */
  stage: StageView;
  ctx: HomeContext;
  /** The rule she keeps. */
  rule: RuleId;
  /** What each rule would lead with today, and what it says of it (`leading.ts`). */
  choices: Record<RuleId, LeadChoice>;
  /** The stage of any event a rule leads with, for the picture a row shows. */
  stageOf: (eventId: string) => StageView;
  /**
   * A row pressed, the kept rule's included: the stage follows at once and her account keeps it, where there is anything
   * to keep (`home-body.tsx` decides).
   */
  onRule: (rule: RuleId) => void;
}) {
  const [turned, setTurned] = useState(false);

  /* ── what the band shows ─────────────────────────────────────────────── */

  // The rule under the pointer or the focus while turned: its event takes the picture side.
  const [preview, setPreview] = useState<RuleId | null>(null);
  // The row the keyboard stands on (one tab stop for the four).
  const [focusRule, setFocusRule] = useState<RuleId>(rule);
  // Once the band has shown another event, every band after it arrives out of the dark.
  const [moved, setMoved] = useState(false);
  // The band's words rising back as it turns back.
  const [arrive, setArrive] = useState(false);
  const shownRule = turned ? (preview ?? rule) : rule;
  const shown = turned ? stageOf(choices[shownRule].eventId) : stage;

  const show = (r: RuleId) => {
    setPreview(r);
    if (choices[r].eventId !== shown.event.id) setMoved(true);
  };

  /* ── turning and turning back ────────────────────────────────────────── */

  const wrapRef = useRef<HTMLDivElement>(null);
  const phraseRef = useRef<HTMLButtonElement>(null);
  const chooserRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Opened by her press (focus goes to her rule), not drawn open by anything else.
  const pressed = useRef(false);
  // Turning back hands the focus to the phrase when the focus was in the turn.
  const giveBack = useRef(false);
  // The four's menu, which the phrase controls while the stage is turned.
  const chooserId = useId();
  const titleId = useId();

  const close = useCallback((back: boolean) => {
    giveBack.current = back;
    pressed.current = false;
    setPreview(null);
    setArrive(true);
    setTurned(false);
  }, []);

  // ★ A PRESS IS ALWAYS SAID, EVEN OF THE RULE SHE KEEPS: whether it owes the account a write is the page's to decide (a
  // press that changes nothing owes none, and a press that follows a refused write is her trying again).
  const choose = (r: RuleId) => {
    if (r !== rule && choices[r].eventId !== shown.event.id) setMoved(true);
    onRule(r);
    close(true);
  };

  // The phrase stands only while the stage is unturned (the band is inert while it is turned).
  const press = () => {
    pressed.current = true;
    setFocusRule(rule);
    setPreview(null);
    setTurned(true);
  };

  // The focus back on the phrase once the band stands again (a new band's phrase, if she chose).
  useEffect(() => {
    if (turned || !giveBack.current) return;
    giveBack.current = false;
    phraseRef.current?.focus({ preventScroll: true });
  }, [turned]);

  /* ── where the rules stand: over the band's own words column ─────────── */

  const [box, setBox] = useState<Box | null>(null);
  const [need, setNeed] = useState(0);

  useLayoutEffect(() => {
    if (!turned) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => {
      const col = wrap
        .querySelector("[data-stage-word]")
        ?.closest("[data-stage] > div");
      if (!col) return;
      const w = wrap.getBoundingClientRect();
      const c = col.getBoundingClientRect();
      const next = {
        top: c.top - w.top,
        left: c.left - w.left,
        width: c.width,
        height: c.height,
      };
      setBox((b) => (near(b, next) ? b : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [turned, shown.event.id]);

  // The rules' own height, so a short column (a phone's photographed stage) grows to hold them.
  useLayoutEffect(() => {
    if (!turned) return;
    const outer = chooserRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const measure = () => {
      const cs = getComputedStyle(outer);
      setNeed(
        Math.ceil(
          inner.offsetHeight +
            parseFloat(cs.paddingTop) +
            parseFloat(cs.paddingBottom),
        ),
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [turned]);

  // Her rule takes the focus as the stage turns, when she turned it, and all four come into view (a phone scrolled so the
  // phrase sits low on the screen).
  useLayoutEffect(() => {
    if (!turned || !box || !pressed.current) return;
    pressed.current = false;
    menuRef.current
      ?.querySelector<HTMLElement>("[aria-checked='true']")
      ?.focus({ preventScroll: true });
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The four's own box: the column around them may still be growing to hold them.
    innerRef.current?.scrollIntoView({
      block: "nearest",
      behavior: still ? "auto" : "smooth",
    });
  }, [turned, box]);

  // A press anywhere else, or Escape from anywhere, turns it back with nothing changed.
  useEffect(() => {
    if (!turned) return;
    const down = (e: PointerEvent) => {
      if (!chooserRef.current?.contains(e.target as Node)) close(false);
    };
    const key = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        e.preventDefault();
        close(chooserRef.current?.contains(document.activeElement) ?? false);
      }
    };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("keydown", key);
    };
  }, [turned, close]);

  /* ── the keys of the four ────────────────────────────────────────────── */

  const onRowKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = RULES.length - 1;
    const to =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? i === last
          ? 0
          : i + 1
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? i === 0
            ? last
            : i - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : null;
    if (to === null) return;
    e.preventDefault();
    menuRef.current
      ?.querySelectorAll<HTMLElement>("[data-stage-rule-item]")
      [to]?.focus();
  };

  // A Tab out of the four leaves the turn: it turns back as the focus goes on.
  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    const to = e.relatedTarget as Node | null;
    if (to && !e.currentTarget.contains(to)) close(false);
  };

  /* ── the drawing ─────────────────────────────────────────────────────── */

  return (
    <div
      ref={wrapRef}
      data-stage-lead=""
      className="relative"
      style={
        turned && need
          ? ({ "--sl-turn-h": `${need}px` } as CSSProperties)
          : undefined
      }
      onAnimationEnd={(e) => {
        if (e.animationName === "sl-words-in") setArrive(false);
      }}
    >
      <style>{SHEET}</style>
      <div inert={turned || undefined}>
        <Stage
          // A new party of the moment is a new stage: its live state never carries over.
          key={shown.event.id}
          event={shown.event}
          ctx={ctx}
          guests={shown.guests}
          photos={shown.photos}
          share={shown.share}
          qrToken={shown.event.qrToken}
          eyebrow={
            <Phrase
              ref={phraseRef}
              rule={rule}
              label={choices[rule].reason}
              open={turned}
              controls={chooserId}
              onPress={press}
            />
          }
          className={cn(
            // The reason stands alone in the first line while it is the control.
            "sl-reason",
            turned && "sl-turned",
            arrive && !turned && "sl-arrive",
            moved && "sl-swap",
          )}
          plateCaption={
            turned && shown.event.id !== stage.event.id
              ? choices[shownRule].line
              : undefined
          }
        />
      </div>
      {turned && (
        <div
          ref={chooserRef}
          data-stage-choosing=""
          onBlur={onBlur}
          className="dark absolute z-10 flex flex-col p-5 text-gallery-foreground sm:p-8 lg:p-10"
          style={box ?? { visibility: "hidden" }}
        >
          <div ref={innerRef} className="flex flex-col">
            <div
              data-stage-turn=""
              className="flex items-center justify-between gap-3"
            >
              <p
                id={titleId}
                className="text-label text-gallery-muted uppercase"
              >
                Lead with
              </p>
              <button
                type="button"
                aria-label="Close"
                onClick={() => close(true)}
                className="flex items-center justify-center rounded-full text-white/70 outline-none hover:bg-white/10 hover:text-white focus-halo max-lg:-my-3.5 max-lg:-mr-3 max-lg:size-11 lg:-my-2 lg:-mr-2 lg:size-8"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div
              ref={menuRef}
              id={chooserId}
              role="menu"
              aria-labelledby={titleId}
              // The pointer gone, the picture goes back to the row the keyboard stands on.
              onPointerLeave={() => setPreview(focusRule)}
              className="flex flex-col gap-0.5 max-lg:mt-2 lg:mt-5"
            >
              {RULES.map((r, i) => {
                const on = r === rule;
                const choice = choices[r];
                // A face only where choosing the rule would put another event on the stage.
                const face =
                  choice.eventId !== stage.event.id
                    ? stageOf(choice.eventId).event
                    : null;
                return (
                  <button
                    key={r}
                    type="button"
                    role="menuitemradio"
                    aria-checked={on}
                    data-stage-rule-item={r}
                    data-stage-turn=""
                    tabIndex={r === focusRule ? 0 : -1}
                    style={{ "--i": i + 1 } as CSSProperties}
                    onClick={() => choose(r)}
                    onKeyDown={(ev) => onRowKey(ev, i)}
                    onFocus={() => {
                      setFocusRule(r);
                      show(r);
                    }}
                    onPointerEnter={(ev) => {
                      if (ev.pointerType !== "touch") show(r);
                    }}
                    className="group -mx-3 flex items-center gap-3 rounded-xl px-3 text-left outline-none hover:bg-white/[0.06] focus-halo max-lg:min-h-12 max-lg:py-1 lg:min-h-14 lg:py-1.5"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full",
                        on ? "bg-white text-gallery" : "border border-white/30",
                      )}
                    >
                      {on && <Check className="size-3" strokeWidth={3.5} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block font-heading text-subsection lg:text-page",
                          // The kept rule and the one whose event the picture shows are lit.
                          on || r === preview
                            ? "text-white"
                            : "text-white/60 group-hover:text-white group-focus-visible:text-white",
                        )}
                      >
                        {RULE_WORDS[r]}
                      </span>
                      <span className="block text-sm text-gallery-muted">
                        {choice.line}
                      </span>
                    </span>
                    {face && (
                      <Face event={face} className="size-10 rounded-lg" />
                    )}
                  </button>
                );
              })}
            </div>
            <p
              data-stage-turn=""
              style={{ "--i": RULES.length + 1 } as CSSProperties}
              className="text-xs text-gallery-muted max-lg:mt-3 lg:mt-5"
            >
              A party on its own day always leads.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
