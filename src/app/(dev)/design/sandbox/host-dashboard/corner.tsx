"use client";

import {
  type KeyboardEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown } from "lucide-react";

import {
  ResponsiveMenu,
  ResponsiveMenuItem,
  ResponsiveMenuNote,
  useResponsiveMenuShape,
} from "@/components/ui/responsive-menu";
import type { HostedEvent } from "@/lib/dashboard/home-view";
import { GLASS } from "@/lib/glass";
import { cn } from "@/lib/utils";

import type { LeadProps } from "./chooser";
import { factOf, lampLight, lampOf, nextLamp, type RuleId, RULES } from "./model";
import { StageView } from "./stage-view";

/**
 * THE CORNER, REFINED (`chooser`, round four): Will's round-three pick, the
 * rule on the stage's glass at its top right, drawn again from the ground up.
 *
 * ★ IT SAYS WHAT IT SETS, NOT WHAT THE EVENT IS. A lone "Newest" over a
 * photograph reads as a tag on the event (this one is new), so the pill says
 * the setting and its value, "Lead with Newest", the menu's own sentence cut
 * short: the value is the blank she fills. No glyph: a sparkle was decoration,
 * and every glyph drawn for "what leads" (a spotlight, a sort, a top panel)
 * read as something else at 14 px.
 *
 * ★ QUIET ON THE LAMP, LEGIBLE ON A PHOTOGRAPH. On the lit stage's dark the
 * pill is a hairline of glass and its "Lead with" a muted voice; over a
 * photograph the glass takes the photograph's colour, and a muted word there
 * reads under 3:1 over the brightest sky, so both words are white and the
 * value is told apart by weight alone.
 *
 * ★ CHOOSING IS SEEING, IN THE HOUSE'S QUICK CHOICE. The four open in
 * production's `ResponsiveMenu` (a menu under the pill at a desk, rows rising to
 * the thumb in a hand, Cancel beneath), each row its rule's word over the stage
 * it would draw today: the event's face (its cover, or its plate in its own
 * lamp's light), its name and its when. A row is the act.
 *
 * ★ EVERY ROW SAYS WHY (Nia: three of four lead with her wedding today):
 * each names the event its rule leads with and the fact it read ("made
 * yesterday", "nothing dated ahead", "opened last"), so three rules agreeing
 * read as three reasons, and a date is how she changes one. The kept rule
 * wears the house's chosen fill and its check; the outline is the keyboard's.
 *
 * ★ THE STAGE FOLLOWS AT ONCE, AND ARRIVES. The next event's stage rises in
 * (240 ms) while its light comes up a beat slower behind it, and the pill's
 * word slides to its new width; nothing moves under reduced motion. The pill
 * stands outside the keyed stage, so it keeps its place and its focus through
 * the change.
 */

/* ── what each rule would lead with today ─────────────────────────────── */

type Row = {
  id: RuleId;
  label: string;
  event: HostedEvent;
  /** The fact its rule read ("made yesterday", "nothing dated ahead"), beside the name; never cut. */
  fact: string;
};

/**
 * EVERY ROW ONE SHAPE: the event a rule leads with today and the fact it read
 * (the fresh-eyes pass, round four), so three rules agreeing on Nia's wedding
 * say why each does ("made yesterday", "nothing dated ahead", "opened last")
 * rather than "Same as Newest today".
 */
function rowsOf(p: LeadProps): Row[] {
  const out: Row[] = [];
  for (const r of RULES) {
    const lead = p.leads[r.id];
    if (!lead) continue;
    out.push({
      id: r.id,
      label: r.label,
      event: lead.event,
      fact: factOf(lead, p.ctx.today),
    });
  }
  return out;
}

/* ── an event's face, as the stage it would draw ──────────────────────── */

/**
 * THE STAGE IN SMALL: its cover where it has photographs; else its own lamp's
 * light with its code's plate in the middle of it, as the lit stage stands.
 */
function StageFace({ e, hand }: { e: HostedEvent; hand: boolean }) {
  const cover = e.stills[0];
  const h = lampOf(e.id);
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-gallery after:absolute after:inset-0 after:rounded-[inherit] after:ring-1 after:ring-white/10 after:ring-inset",
        // The light comes up on the stage the pointer is on.
        "transition-[filter] duration-150 ease-emphasis group-hover/rule:brightness-125 group-focus-visible/rule:brightness-125 motion-reduce:transition-none",
        hand ? "size-11 rounded-[10px]" : "size-9 rounded-lg",
      )}
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element -- a fixture still at a crop
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
              background: `radial-gradient(70% 70% at 50% 46%, ${lampLight(h, 95)}, transparent 85%), radial-gradient(55% 55% at 100% 105%, ${lampLight(nextLamp(h), 55)}, transparent 75%)`,
            }}
          />
          <svg
            viewBox="0 0 12 12"
            className="relative size-[42%] drop-shadow-[0_1px_2px_rgb(0_0_0/0.35)]"
          >
            <rect width="12" height="12" rx="2" fill="white" />
            <g fill="#0b0b10">
              <rect x="2" y="2" width="3" height="3" rx="0.6" />
              <rect x="7" y="2" width="3" height="3" rx="0.6" />
              <rect x="2" y="7" width="3" height="3" rx="0.6" />
              <rect x="7.4" y="7.4" width="1.3" height="1.3" />
              <rect x="8.7" y="8.7" width="1.3" height="1.3" />
            </g>
          </svg>
        </>
      )}
    </span>
  );
}

/* ── the four ─────────────────────────────────────────────────────────── */

function Rows({
  rows,
  rule,
  onPick,
  focusKept,
}: {
  rows: Row[];
  rule: RuleId;
  onPick: (r: RuleId) => void;
  /** Opened from the keyboard: focus lands on the kept rule (a pointer's open leaves it to the menu). */
  focusKept: boolean;
}) {
  const hand = useResponsiveMenuShape() === "rows";
  const group = useRef<HTMLDivElement>(null);
  // Opened from the keyboard, the menu opens on the kept rule: Radix lands
  // focus on the first tabbable, which is it, but in a lab frame (whose portal
  // Radix's own document cannot see) it lands on the panel, so it is set a
  // frame later wherever it fell. Opened by a pointer (or drawn open by a
  // frame), focus stays in the four without a row's keyboard outline, as a
  // pointer's open shows it: on the group, where the arrows still reach them.
  useEffect(() => {
    const el = group.current;
    const doc = el?.ownerDocument;
    const win = doc?.defaultView;
    if (!el || !doc || !win) return;
    const id = win.requestAnimationFrame(() => {
      if (focusKept) {
        const kept = el.querySelector<HTMLElement>("[aria-checked='true']");
        if (kept && !el.contains(doc.activeElement))
          kept.focus({ preventScroll: true });
      } else if (doc.activeElement !== el) el.focus({ preventScroll: true });
    });
    return () => win.cancelAnimationFrame(id);
  }, [focusKept]);
  // Up and Down move between the four, Home and End to either end (the menu's
  // own keys reach `menuitem`s only, and these are `menuitemradio`s). Focus is
  // read off the frame's own document, which a lab frame's portal is not.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const all = [
      ...e.currentTarget.querySelectorAll<HTMLElement>(
        "[role='menuitemradio']",
      ),
    ];
    if (all.length === 0) return;
    e.preventDefault();
    const at = all.indexOf(
      e.currentTarget.ownerDocument.activeElement as HTMLElement,
    );
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? all.length - 1
          : e.key === "ArrowDown"
            ? (at + 1) % all.length
            : at < 0
              ? all.length - 1
              : (at - 1 + all.length) % all.length;
    all[next]?.focus();
  };
  return (
    <div
      ref={group}
      role="group"
      aria-label="Lead your dashboard with"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="outline-none"
    >
      {rows.map((r) => {
        const on = r.id === rule;
        return (
          <ResponsiveMenuItem
            key={r.id}
            role="menuitemradio"
            aria-checked={on}
            data-hd-rule-item={r.id}
            // Focus opens on the kept rule; the arrows reach the rest.
            tabIndex={on ? 0 : -1}
            icon={<StageFace e={r.event} hand={hand} />}
            hint={
              on ? (
                <Check
                  className={cn("text-foreground", hand ? "size-5" : "size-4")}
                  aria-hidden
                />
              ) : undefined
            }
            onSelect={() => onPick(r.id)}
            // The kept rule wears the house's chosen fill and its check; the
            // outline is the keyboard's alone.
            className={cn(
              "group/rule",
              hand ? "py-2" : "py-1.5",
              on && "bg-accent",
            )}
          >
            <span className="block font-medium">{r.label}</span>
            <span
              className={cn(
                "flex min-w-0 text-muted-foreground",
                hand ? "text-sm" : "text-xs",
              )}
            >
              <span className="truncate">{r.event.name}</span>
              <span className="ml-[0.3em] shrink-0 whitespace-nowrap">
                · {r.fact}
              </span>
            </span>
          </ResponsiveMenuItem>
        );
      })}
    </div>
  );
}

/* ── the pill's word, sliding to its new width ────────────────────────── */

/**
 * THE VALUE, WHICH MOVES WHEN SHE CHOOSES: the new word rises in (the text
 * swap) while its box travels from the old word's width to its own. The width
 * is written only for the trip and released after it, so at rest the box is
 * the word's own width whatever font has landed since.
 */
function Word({ text, className }: { text: string; className?: string }) {
  const box = useRef<HTMLSpanElement>(null);
  const last = useRef<number | null>(null);
  useLayoutEffect(() => {
    const el = box.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win) return;
    // Mid-trip, it leaves from where it is drawn; at rest, from the last word's width.
    const from =
      el.style.width !== "" ? el.getBoundingClientRect().width : last.current;
    el.style.width = "";
    const to = el.getBoundingClientRect().width;
    last.current = to;
    if (
      from === null ||
      Math.abs(from - to) < 1 ||
      win.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    el.style.width = `${from}px`;
    void el.offsetWidth;
    el.style.width = `${to}px`;
    const settle = win.setTimeout(() => {
      el.style.width = "";
    }, 260);
    return () => win.clearTimeout(settle);
  }, [text]);
  return (
    <span ref={box} className="hd-corner-wordbox inline-flex overflow-hidden">
      <span key={text} className={cn("hd-corner-word w-max shrink-0", className)}>
        {text}
      </span>
    </span>
  );
}

/* ── the corner ───────────────────────────────────────────────────────── */

// The frame's own sheet: the pill's size at each width, and the keyframes and
// the transition the band and the pill wear, every one still under reduced
// motion. ★ A BREAKPOINT LIVES HERE, NOT IN A CLASS: the lab compiles a
// board's own utilities into a sub-layer that production's classes outrank
// (design.css), so a board's "sm:h-8" never reaches a frame; this sheet is
// unlayered. The wiring lane writes these back as the classes they are.
const STYLE = `
.hd-corner-at { top: 10px; right: 10px; }
.hd-corner-pill { height: 28px; gap: 4px; padding: 0 8px 0 10px; font-size: 11px; }
/* A thumb's 44 px, around a pill the eye reads at 28 in a hand and 32 at a desk. */
.hd-corner-pill::after { content: ""; position: absolute; inset: -8px -6px; }
@media (max-width: 639.98px) {
  .hd-corner-room { padding-top: 24px; }
}
@media (min-width: 640px) {
  .hd-corner-at { top: 12px; right: 12px; }
  .hd-corner-pill { height: 32px; gap: 6px; padding: 0 10px 0 12px; font-size: 12px; }
  .hd-corner-pill::after { inset: -6px; }
}
@media (min-width: 1024px) {
  .hd-corner-at { top: 16px; right: 16px; }
}
@keyframes hd-corner-rise {
  from { opacity: 0; transform: translateY(6px); }
}
@keyframes hd-corner-light {
  from { opacity: 0; }
}
@keyframes hd-corner-word {
  from { opacity: 0; transform: translateY(4px); filter: blur(2px); }
}
.hd-corner-arrive > * {
  animation: hd-corner-rise 240ms var(--ease-emphasis) backwards;
}
.hd-corner-arrive > :first-child {
  animation: hd-corner-light 300ms var(--ease-in-out-strong) backwards;
}
.hd-corner-word {
  animation: hd-corner-word 180ms var(--ease-emphasis) backwards;
}
.hd-corner-wordbox {
  transition: width 220ms var(--ease-emphasis);
}
@media (prefers-reduced-motion: reduce) {
  .hd-corner-arrive > *,
  .hd-corner-arrive > :first-child,
  .hd-corner-word { animation: none; }
  .hd-corner-wordbox { transition: none; }
}
`;

export function CornerLead(p: LeadProps) {
  const anchor = useRef<HTMLButtonElement>(null);
  // Whether the menu was opened from the keyboard, so focus goes to the kept rule only then.
  const [byKeys, setByKeys] = useState(false);
  // A rule chosen here moves the stage: its next event arrives. The page's first drawing never does.
  const [moved, setMoved] = useState(false);
  const rows = rowsOf(p);
  const label = RULES.find((r) => r.id === p.rule)?.label ?? p.rule;
  const lit = p.stage.photos.length === 0;

  const pick = (r: RuleId) => {
    if (r === p.rule) return;
    if (p.picks[r]?.id !== p.stage.event.id) setMoved(true);
    p.onRule(r);
  };

  const control = p.hand ? (
    <div className="hd-corner-at absolute z-10">
      <button
        ref={anchor}
        type="button"
        data-hd-rule={p.rule}
        aria-haspopup="menu"
        aria-expanded={p.open}
        aria-label={`Lead your dashboard with ${label}`}
        onPointerDown={() => setByKeys(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")
            setByKeys(true);
        }}
        onClick={() => p.onOpen(!p.open)}
        className={cn(
          "hd-corner-pill group/corner relative flex items-center rounded-full leading-none whitespace-nowrap text-white outline-none select-none",
          "transition-[background-color,scale] duration-150 ease-emphasis hover:bg-white/15 active:scale-[0.97] aria-expanded:bg-white/15 motion-reduce:active:scale-100",
          "focus-visible:ring-2 focus-visible:ring-white/60",
          GLASS,
        )}
      >
        <span className={lit ? "text-white/60" : "text-white"}>Lead with</span>
        <Word text={label} className="font-semibold" />
        <ChevronDown
          className="size-3.5 opacity-70 transition-transform duration-200 ease-emphasis glass-mark-lit group-aria-expanded/corner:rotate-180 motion-reduce:transition-none"
          aria-hidden
        />
      </button>
      <ResponsiveMenu
        open={p.open}
        onOpenChange={p.onOpen}
        anchor={anchor}
        title="Lead your dashboard with"
        showTitle
        align="end"
        className="w-[21rem]"
      >
        <Rows
          rows={rows}
          rule={p.rule}
          onPick={pick}
          focusKept={byKeys}
        />
        <ResponsiveMenuNote>
          A party on its own day always leads.
        </ResponsiveMenuNote>
      </ResponsiveMenu>
    </div>
  ) : null;

  return (
    <div className="relative" data-hd-corner="">
      <style>{STYLE}</style>
      <StageView
        key={p.stage.event.id}
        stage={p.stage}
        ctx={p.ctx}
        countWord={p.countWord}
        className={cn(
          moved && "hd-corner-arrive",
          // A phone's lit stage centres its plate under the corner: the band makes the pill a row of its own.
          lit && p.hand && "hd-corner-room",
        )}
      />
      {control}
    </div>
  );
}
