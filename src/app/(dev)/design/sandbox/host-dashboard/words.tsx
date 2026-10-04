"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { Face, type LeadProps } from "./chooser";
import { type RuleId, RULES } from "./model";
import { StageView } from "./stage-view";
import { WordsMenuLead } from "./words-menu";
import { Phrase, reasonOf, rowOf, SAID, stageOf } from "./words-say";

/**
 * THE STAGE'S OWN WORDS (`chooser=words`, round four): nothing over the
 * picture. The stage's first line says why its event leads ("YOUR NEWEST · NO
 * DATE YET"), and that reason is the control: the house's word that is a
 * control (`SettingWord`), in the line's own capitals.
 *
 * ★ PRESSING IT TURNS THE STAGE TO CHOOSE (the direction's way (b), picked
 * over the house's quick choice, way (a), `words-menu.tsx`): the words column
 * becomes the four rules, in the stage's own type, each with the event it
 * would lead with today, and the picture side shows the one under the pointer
 * or the focus, in its own light. Choosing turns the stage back with its new
 * lead, its new reason first. No surface floats over the page, and at a phone
 * the rules stand where the words stood, under the picture, at the thumb.
 *
 * ★ A ROW IS THE ACT, AS IN EVERY QUICK CHOICE: pointing or arrowing only
 * shows; a press (Enter, Space, a tap) keeps the rule and turns back; Escape,
 * the close, a press anywhere else or a Tab out of the four turn back with
 * nothing changed, and the focus goes back to the phrase from inside.
 *
 * ★ HOW IT IS DRAWN THROUGH THE STAGE'S SLOTS: the phrase is the `eyebrow`;
 * while turned the band hides its own words (`className`, the sheet below)
 * and the rules stand over that column, measured off the band, outside it, so
 * a band redrawn for another event never takes the focus with it. The wiring
 * gives production's stage a slot for the column instead (the report's
 * shared change).
 */

/** Which of the direction's two ways the board draws. */
const WAYS = { turn: TurnLead, menu: WordsMenuLead } as const;
const WAY: keyof typeof WAYS = "turn";

export function WordsLead(p: LeadProps) {
  const Lead = WAYS[WAY];
  return <Lead {...p} />;
}

/**
 * THE TURN'S MOTION, each step an occasional one (bible 5: under 300 ms) and
 * none under reduced motion, where every state stands complete:
 *  - turning to choose: the band's words go, the rules rise in their place,
 *    20 ms apart (the last lands at 280 ms);
 *  - another event shown while choosing (or chosen at a phone): its light and
 *    its picture come up out of the band's dark in 200 ms;
 *  - turning back: the band's words rise in 240 ms, the new reason first.
 */
const SHEET = `
@keyframes hd-turn-in{from{opacity:0;transform:translateY(10px)}}
@keyframes hd-words-in{from{opacity:0;transform:translateY(8px)}}
@keyframes hd-light-in{from{opacity:0}}
[data-hd-words] [data-stage]>div:has([data-stage-word]){transition:min-height 200ms cubic-bezier(.23,1,.32,1)}
.hd-turned>div:has([data-stage-word]){opacity:0;min-height:var(--hd-turn-h,0px)}
.hd-arrive>div:has([data-stage-word]){animation:hd-words-in 240ms cubic-bezier(.23,1,.32,1) both}
.hd-swap>div[aria-hidden]:first-child,.hd-swap>div:has([data-stage-word])~div{animation:hd-light-in 200ms ease-out both}
[data-hd-choosing] [data-hd-turn]{animation:hd-turn-in 180ms cubic-bezier(.23,1,.32,1) both;animation-delay:calc(var(--i,0)*20ms)}
@media (prefers-reduced-motion:reduce){.hd-arrive>div,.hd-swap>div,[data-hd-choosing] [data-hd-turn]{animation:none!important}[data-hd-words] [data-stage]>div{transition:none!important}}
`;

type Box = { top: number; left: number; width: number; height: number };

const near = (a: Box | null, b: Box) =>
  a !== null &&
  Math.abs(a.top - b.top) < 0.5 &&
  Math.abs(a.left - b.left) < 0.5 &&
  Math.abs(a.width - b.width) < 0.5 &&
  Math.abs(a.height - b.height) < 0.5;

function TurnLead(p: LeadProps) {
  const today = p.ctx.today;
  const turned = p.hand && p.open;
  const { onOpen, onRule } = p;

  /* ── what the band shows ─────────────────────────────────────────────── */

  // The rule under the pointer or the focus while turned: its event takes the picture side.
  const [preview, setPreview] = useState<RuleId | null>(null);
  // The row the keyboard stands on (one tab stop for the four).
  const [focusRule, setFocusRule] = useState<RuleId>(p.rule);
  // Once the band has shown another event, every band after it arrives out of the dark.
  const [moved, setMoved] = useState(false);
  // The band's words rising back as it turns back.
  const [arrive, setArrive] = useState(false);
  const shownRule = turned ? (preview ?? p.rule) : p.rule;
  const shownEvent = p.picks[shownRule] ?? p.stage.event;
  const shown = stageOf(shownEvent, p.stage);

  const show = (r: RuleId) => {
    setPreview(r);
    const e = p.picks[r];
    if (e && e.id !== shownEvent.id) setMoved(true);
  };

  /* ── turning and turning back ────────────────────────────────────────── */

  const wrapRef = useRef<HTMLDivElement>(null);
  const phraseRef = useRef<HTMLButtonElement>(null);
  const chooserRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  // Opened by her press (focus goes to her rule), not drawn open by a frame.
  const pressed = useRef(false);
  // Turning back hands the focus to the phrase when the focus was in the turn.
  const giveBack = useRef(false);
  // The four's menu, which the phrase controls while the stage is turned.
  const chooserId = useId();
  const titleId = useId();

  const close = useCallback(
    (back: boolean) => {
      giveBack.current = back;
      pressed.current = false;
      setPreview(null);
      setArrive(true);
      onOpen(false);
    },
    [onOpen],
  );

  const choose = (r: RuleId) => {
    if (r !== p.rule) {
      const e = p.picks[r];
      if (e && e.id !== shownEvent.id) setMoved(true);
      onRule(r);
    }
    close(true);
  };

  // The phrase stands only while the stage is unturned (the band is inert while it is turned).
  const press = () => {
    pressed.current = true;
    setFocusRule(p.rule);
    setPreview(null);
    onOpen(true);
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
    const win = wrap?.ownerDocument.defaultView;
    if (!wrap || !win) return;
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
    const ro = new win.ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [turned, shown.event.id]);

  // The rules' own height, so a short column (a phone's photographed stage) grows to hold them.
  useLayoutEffect(() => {
    if (!turned) return;
    const outer = chooserRef.current;
    const inner = innerRef.current;
    const win = outer?.ownerDocument.defaultView;
    if (!outer || !inner || !win) return;
    const measure = () => {
      const cs = win.getComputedStyle(outer);
      setNeed(
        Math.ceil(
          inner.offsetHeight +
            parseFloat(cs.paddingTop) +
            parseFloat(cs.paddingBottom),
        ),
      );
    };
    measure();
    const ro = new win.ResizeObserver(measure);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [turned]);

  // Her rule takes the focus as the stage turns, when she turned it, and all
  // four come into view (a phone scrolled so the phrase sits low on the screen).
  useLayoutEffect(() => {
    if (!turned || !box || !pressed.current) return;
    pressed.current = false;
    menuRef.current
      ?.querySelector<HTMLElement>("[aria-checked='true']")
      ?.focus({ preventScroll: true });
    const still = chooserRef.current?.ownerDocument.defaultView?.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    // The four's own box: the column around them may still be growing to hold them.
    innerRef.current?.scrollIntoView({
      block: "nearest",
      behavior: still ? "auto" : "smooth",
    });
  }, [turned, box]);

  // A press anywhere else, or Escape from anywhere, turns it back with nothing changed.
  useEffect(() => {
    if (!turned) return;
    const doc = wrapRef.current?.ownerDocument;
    if (!doc) return;
    const down = (e: PointerEvent) => {
      if (!chooserRef.current?.contains(e.target as Node)) close(false);
    };
    const key = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        e.preventDefault();
        close(chooserRef.current?.contains(doc.activeElement) ?? false);
      }
    };
    doc.addEventListener("pointerdown", down, true);
    doc.addEventListener("keydown", key);
    return () => {
      doc.removeEventListener("pointerdown", down, true);
      doc.removeEventListener("keydown", key);
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
      ?.querySelectorAll<HTMLElement>("[data-hd-rule-item]")
      [to]?.focus();
  };

  // A Tab out of the four leaves the turn: it turns back as the focus goes on.
  const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const to = e.relatedTarget as Node | null;
    if (to && !e.currentTarget.contains(to)) close(false);
  };

  /* ── the drawing ─────────────────────────────────────────────────────── */

  const eyebrow = p.hand ? (
    <Phrase
      ref={phraseRef}
      rule={p.rule}
      label={reasonOf(p.rule, p.stage.event, today)}
      open={turned}
      controls={chooserId}
      onPress={press}
    />
  ) : null;

  return (
    <div
      ref={wrapRef}
      data-hd-words=""
      className="relative"
      style={
        turned && need
          ? ({ "--hd-turn-h": `${need}px` } as CSSProperties)
          : undefined
      }
      onAnimationEnd={(e) => {
        if (e.animationName === "hd-words-in") setArrive(false);
      }}
    >
      <style>{SHEET}</style>
      <div inert={turned || undefined}>
        <StageView
          key={shown.event.id}
          stage={shown}
          ctx={p.ctx}
          ends={p.ends}
          fresh={p.fresh && shown === p.stage && !moved}
          countWord={p.countWord}
          eyebrow={eyebrow}
          className={cn(
            turned && "hd-turned",
            arrive && !turned && "hd-arrive",
            moved && "hd-swap",
          )}
        />
      </div>
      {turned && (
        <div
          ref={chooserRef}
          data-hd-choosing=""
          onBlur={onBlur}
          className="dark absolute z-10 flex flex-col p-5 text-gallery-foreground sm:p-8 lg:p-10"
          style={box ?? { visibility: "hidden" }}
        >
          <div ref={innerRef} className="flex flex-col">
            <div
              data-hd-turn=""
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
                className="flex items-center justify-center rounded-full text-white/70 outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/60 max-lg:-my-3.5 max-lg:-mr-3 max-lg:size-11 lg:-my-2 lg:-mr-2 lg:size-8"
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
                const on = r.id === p.rule;
                // Its line, and a face only where choosing it would put another event on the stage.
                const row = rowOf(
                  r.id,
                  p.picks,
                  p.stage.event.id,
                  p.rule,
                  p.ends,
                  today,
                );
                return (
                  <button
                    key={r.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={on}
                    data-hd-rule-item={r.id}
                    data-hd-turn=""
                    tabIndex={r.id === focusRule ? 0 : -1}
                    style={{ "--i": i + 1 } as CSSProperties}
                    onClick={() => choose(r.id)}
                    onKeyDown={(ev) => onRowKey(ev, i)}
                    onFocus={() => {
                      setFocusRule(r.id);
                      show(r.id);
                    }}
                    onPointerEnter={(ev) => {
                      if (ev.pointerType !== "touch") show(r.id);
                    }}
                    className="group -mx-3 flex items-center gap-3 rounded-xl px-3 text-left outline-none hover:bg-white/[0.06] focus-visible:ring-2 focus-visible:ring-white/60 max-lg:min-h-12 max-lg:py-1 lg:min-h-14 lg:py-1.5"
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
                          on
                            ? "text-white"
                            : "text-white/60 group-hover:text-white group-focus-visible:text-white",
                        )}
                      >
                        {SAID[r.id].label}
                      </span>
                      <span className="block text-sm text-gallery-muted">
                        {row.line}
                      </span>
                    </span>
                    {row.face && (
                      <Face e={row.face} className="size-10 rounded-lg" />
                    )}
                  </button>
                );
              })}
            </div>
            <p
              data-hd-turn=""
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
