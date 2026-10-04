"use client";

import {
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import type {
  HostedEvent,
  StageView as Stage,
} from "@/lib/dashboard/home-view";
import { cn } from "@/lib/utils";

import { Face, type LeadProps, type Picks } from "./chooser";
import {
  lampLight,
  lampOf,
  nextLamp,
  type RuleId,
  RULES,
  whenFor,
} from "./model";
import { StageView } from "./stage-view";

/**
 * THE DECK (`chooser=deck`, round four): the four leads as a small deck. The
 * stage is its top card; the cards behind it stand up past its top edge as
 * tabs, each lit by its own event's light (its cover, or its lamp), and each
 * tab names the rule that leads with it. Pressing a tab turns the deck: that
 * card comes forward and the rule is kept.
 *
 * ★ A CARD IS AN EVENT, A TAB IS A RULE. Rules that lead with the same event
 * today share one card, so its tab names them together ("Newest · Upcoming ·
 * Last opened" on Nia's wedding): the deck holds as many cards as there are
 * different leads, and it never draws one event twice. Choosing a rule on the
 * card already in front keeps it without a turn, because nothing would move.
 *
 * ★ THE FRONT TAB IS THE STAGE'S OWN EDGE. It is drawn in front of the band and
 * lit by the band's own light (the lead photograph blurred, or the lamp's glow
 * over the plate), placed in the band's own box, so the tab and the stage read
 * as one card. The tabs behind are tucked under the band's edge.
 *
 * ★ QUIET AT REST, A SMALL DELIGHT IN USE (bible 5). At rest the deck is four
 * small words, the kept one lit. A pointer over a tab lifts its card and says
 * what it would lead with and why; a press turns the deck in 260 ms (the new
 * card unrolls from its tab over the old one, which settles back); the
 * keyboard turns it at once (a key is pressed too often to wait on a motion),
 * and so does reduced motion.
 */

/* ── the deck's cards ─────────────────────────────────────────────────── */

type Card = {
  /** Its first rule: stable while the grouping holds, so a turn keeps the element. */
  key: RuleId;
  event: HostedEvent;
  rules: RuleId[];
  /** It is the stage. */
  front: boolean;
};

/** Neighbouring rules that lead with the same event share a card. */
function cardsOf(picks: Picks, front: string): Card[] {
  const out: Card[] = [];
  for (const r of RULES) {
    const e = picks[r.id];
    if (!e) continue;
    const last = out[out.length - 1];
    if (last && last.event.id === e.id) last.rules.push(r.id);
    else
      out.push({ key: r.id, event: e, rules: [r.id], front: e.id === front });
  }
  return out;
}

/**
 * WHY A RULE LEADS WITH WHAT IT DOES, in its own words, honest about the
 * fallback (Upcoming with no dated party ahead leads with the newest).
 */
function whyOf(rule: RuleId, e: HostedEvent, today: string): string {
  if (rule === "upcoming")
    return e.date && e.date > today
      ? "Your next party, by its date"
      : "No party ahead has a date, so your newest";
  if (rule === "photos")
    return e.lastArrival
      ? "Where photos last landed"
      : "No photos yet, so your newest";
  if (rule === "opened") return "The event you were in last";
  return "Your newest, or a party within a month";
}

const label = (r: RuleId) => RULES.find((x) => x.id === r)!.label;

/* ── light ────────────────────────────────────────────────────────────── */

/** A tab behind the stage, lit by its own event: its cover, or its lamp. */
function TabLight({ e }: { e: HostedEvent }) {
  const cover = e.stills[0];
  if (cover)
    return (
      <span aria-hidden className="deck-light">
        {/* eslint-disable-next-line @next/next/no-img-element -- a fixture still at a crop, drawn as light */}
        <img src={cover} alt="" />
      </span>
    );
  const h = lampOf(e.id);
  return (
    <span
      aria-hidden
      className="deck-light"
      style={{
        background: `radial-gradient(90% 150% at 30% 125%, ${lampLight(h, 85)}, transparent 75%), radial-gradient(70% 130% at 100% 125%, ${lampLight(nextLamp(h), 55)}, transparent 72%)`,
      }}
    />
  );
}

/**
 * THE FRONT TAB'S LIGHT IS THE BAND'S, IN THE BAND'S OWN BOX: the lead
 * photograph blurred as the stage blurs it, or the lamp's glow over the plate,
 * placed exactly where the band places it (the deck is its containing block),
 * so what shows in the tab is the light continuing past the band's edge.
 */
function FrontLight({ stage }: { stage: Stage }) {
  const lead = stage.photos[0];
  if (lead)
    return (
      <span aria-hidden className="deck-band-light">
        <span className="deck-band-photo">
          {/* eslint-disable-next-line @next/next/no-img-element -- the stage's own lead, as its light */}
          <img src={lead.url} alt="" />
        </span>
        <span className="deck-band-dim" />
      </span>
    );
  const h = lampOf(stage.event.id);
  return (
    <span aria-hidden className="deck-band-light">
      <span
        className="deck-band-glow"
        style={{ background: lampLight(h, 34) }}
      />
    </span>
  );
}

/* ── the shapes and the motion ────────────────────────────────────────── */

const CSS = `
[data-hd-deck]{--deck-h:36px;--deck-tuck:8px;--deck-r:10px;--deck-gap:3px;--deck-x:0px;--deck-pad:7px;--deck-cpad:3px;position:relative;isolation:isolate}
@media (min-width:1024px){[data-hd-deck]{--deck-h:32px;--deck-gap:6px;--deck-x:28px;--deck-pad:8px;--deck-cpad:4px}}
[data-hd-deck] .deck-row{display:flex;align-items:flex-end;gap:16px;height:var(--deck-h);padding-left:var(--deck-x)}
[data-hd-deck] .deck-tabs{display:flex;align-items:flex-end;gap:var(--deck-gap);height:100%}
/* In a hand the tabs span the deck's top edge, the first and the last flush with its sides. */
@media (max-width:1023.98px){[data-hd-deck] .deck-tabs{flex:1;justify-content:space-between}}

/* A card's tab: tucked behind the band, its lower edge under the band's top. */
[data-hd-deck] .deck-card{position:relative;z-index:1;display:flex;align-items:flex-start;height:calc(100% + var(--deck-tuck));margin-bottom:calc(var(--deck-tuck) * -1);padding:0 var(--deck-cpad);border-radius:var(--deck-r) var(--deck-r) 0 0;background:var(--gallery);outline:1px solid var(--gallery-border);outline-offset:-1px;transition:transform 180ms var(--ease-emphasis)}
/* The front card's tab: in front of the band, its foot over the band's ring, the band's light in it. */
[data-hd-deck] .deck-card[data-front]{position:static;z-index:3;height:calc(100% + 1px);margin-bottom:-1px;outline-offset:0;clip-path:inset(-1px -1px 1px -1px round calc(var(--deck-r) + 1px) calc(var(--deck-r) + 1px) 0 0)}
[data-hd-deck] .deck-card[data-lift]{transform:translateY(-4px)}

[data-hd-deck] .deck-light{position:absolute;inset:0;overflow:hidden;border-radius:inherit;opacity:.7;transition:opacity 180ms var(--ease-emphasis)}
[data-hd-deck] .deck-light img{position:absolute;inset:-60%;width:220%;height:220%;max-width:none;object-fit:cover;filter:blur(8px) saturate(1.3)}
[data-hd-deck] .deck-light::after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,color-mix(in oklch,var(--gallery) 62%,transparent),color-mix(in oklch,var(--gallery) 18%,transparent) 70%)}
[data-hd-deck] .deck-card[data-lift] .deck-light{opacity:1}

/* The band's light, in the band's box (its top is the tab row's height down). */
[data-hd-deck] .deck-band-light{position:absolute;left:0;right:0;top:var(--deck-h);bottom:var(--deck-foot,0px);pointer-events:none}
[data-hd-deck] .deck-band-photo{position:absolute;inset:0}
@media (min-width:1024px){[data-hd-deck] .deck-band-photo{right:45%}}
[data-hd-deck] .deck-band-photo img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;scale:1.5;opacity:.7;filter:blur(64px) saturate(1.5)}
[data-hd-deck] .deck-band-dim{position:absolute;inset:calc(var(--deck-h) * -1) 0 0 0;background:color-mix(in oklch,var(--gallery) 53%,transparent)}
[data-hd-deck] .deck-band-glow{position:absolute;left:50%;top:144px;width:320px;height:320px;translate:-50% -50%;border-radius:9999px;filter:blur(64px)}
@media (min-width:1024px){[data-hd-deck] .deck-band-glow{left:70.83%;top:50%}}

/* A rule's word: a thumb's 44 px in a hand (the tab and the strip above it). */
[data-hd-deck] .deck-word{position:relative;z-index:1;display:flex;align-items:center;gap:6px;height:var(--deck-h);padding:0 var(--deck-pad);border-radius:8px;font-size:12px;line-height:16px;font-weight:500;white-space:nowrap;color:var(--gallery-muted);outline:none;transition:color 150ms var(--ease-emphasis)}
[data-hd-deck] .deck-word[aria-checked="true"]{color:var(--gallery-foreground)}
[data-hd-deck] .deck-word:focus-visible{box-shadow:inset 0 0 0 2px rgb(255 255 255 / .75)}
[data-hd-deck] .deck-word:active{scale:.97}
@media (hover:hover) and (pointer:fine){[data-hd-deck] .deck-word:hover{color:var(--gallery-foreground)}}
@media (max-width:1023.98px){[data-hd-deck] .deck-word::before{content:"";position:absolute;inset:-8px 0 0}}
/* The kept rule is lit: a small light under its word, which takes no room, so no tab ever moves under a thumb. */
[data-hd-deck] .deck-word[aria-checked="true"]::after{content:"";position:absolute;left:50%;bottom:4px;width:16px;height:2px;margin-left:-8px;border-radius:2px;background:var(--gallery-foreground);box-shadow:0 0 8px 1px rgb(255 255 255 / .45)}
[data-hd-deck] .deck-sep{margin-top:calc(var(--deck-h) / 2 - 8px);font-size:12px;line-height:16px;color:var(--gallery-muted);opacity:.5;pointer-events:none}

/* At a desk: what the lifted tab would lead with and why, and the party rule. */
[data-hd-deck] .deck-say{display:flex;align-items:center;gap:8px;height:var(--deck-h);min-width:0;font-size:12px;line-height:16px;color:var(--muted-foreground);opacity:0;translate:-4px 0;transition:opacity 150ms var(--ease-emphasis),translate 150ms var(--ease-emphasis)}
[data-hd-deck] .deck-say[data-on]{opacity:1;translate:0 0}
[data-hd-deck] .deck-say b{font-weight:500;color:var(--foreground)}
[data-hd-deck] .deck-note{margin-left:auto;display:flex;align-items:center;height:var(--deck-h);white-space:nowrap;font-size:12px;color:var(--muted-foreground);opacity:0;transition:opacity 150ms var(--ease-emphasis)}
[data-hd-deck] .deck-note[data-on]{opacity:1}
/* In a hand: the lifted card's event, one line over its tab. */
[data-hd-deck] .deck-peek{position:absolute;bottom:calc(100% + 4px);left:0;display:flex;align-items:center;gap:8px;max-width:calc(100vw - 24px);height:28px;padding:0 12px 0 4px;border-radius:9999px;white-space:nowrap;font-size:12px;line-height:16px;font-weight:500;pointer-events:none;animation:deck-peek 140ms var(--ease-emphasis) 160ms both}
@keyframes deck-peek{from{opacity:0;translate:0 4px}}
[data-hd-deck] .deck-card[data-end] .deck-peek{left:auto;right:0}

/* The cards behind, at the band's foot: each a thin lit edge, a step narrower, as a stack stands. */
[data-hd-deck] .deck-edge{position:absolute;top:var(--deck-h);overflow:hidden;border-radius:12px;background:var(--gallery);outline:1px solid var(--gallery-border);outline-offset:-1px;pointer-events:none}
[data-hd-deck] .deck-edge .deck-light{inset:auto 0 0 0;height:28px;border-radius:0;opacity:.55}
[data-hd-deck] .deck-edge .deck-light::after{background:none}
[data-hd-deck] .deck-edge[data-lift] .deck-light{opacity:1}
/* The stage, and the turn: the card coming forward unrolls from the tab row over the one going back (one edge, so the two never mix). */
[data-hd-deck] .deck-band{z-index:2}
@media (max-width:1023.98px){[data-hd-deck] .deck-sq-l{border-top-left-radius:0}[data-hd-deck] .deck-sq-r{border-top-right-radius:0}}
[data-hd-deck] .deck-in{animation:deck-in 260ms var(--ease-emphasis) both}
/* The stage going back keeps to the box of the one coming forward, so a taller one never hangs over the page below. */
[data-hd-deck] .deck-ghost{position:absolute;left:0;right:0;top:var(--deck-h);bottom:var(--deck-foot,0px);z-index:1;pointer-events:none;transform-origin:50% 0;clip-path:inset(-16px -16px 0 -16px);animation:deck-out 260ms var(--ease-emphasis) both}
@keyframes deck-in{from{clip-path:inset(0 -2px 100% -2px round 14px);translate:0 -10px}to{clip-path:inset(-2px -2px -2px -2px round 14px);translate:0 0}}
@keyframes deck-out{to{opacity:.3;scale:.97;translate:0 -4px}}
@keyframes deck-peek-at{from{opacity:0}}
@media (prefers-reduced-motion:reduce){
  [data-hd-deck] .deck-in{animation:none}
  [data-hd-deck] .deck-ghost{display:none}
  [data-hd-deck] .deck-card,[data-hd-deck] .deck-light,[data-hd-deck] .deck-word,[data-hd-deck] .deck-say,[data-hd-deck] .deck-note{transition:none}
  [data-hd-deck] .deck-word:active{scale:none}
  /* A press held a moment still names the card (a delay, not a motion), so a quick tap never flashes it. */
  [data-hd-deck] .deck-peek{animation:deck-peek-at 0s 160ms both}
}
`;

/* ── the deck ─────────────────────────────────────────────────────────── */

/** How far each card behind stands below the one in front of it, at the deck's foot. */
const EDGE = 5;

export function DeckLead(p: LeadProps) {
  const front = p.stage.event.id;
  const cards = cardsOf(p.picks, front);
  const today = p.ctx.today;
  const noteId = useId();

  // The rule a pointer or the keyboard rests on: its card lifts and the deck says what it leads with.
  // Drawn open, the deck rests on the first card behind the stage (Nia's: Latest photos).
  const [peek, setPeek] = useState<RuleId | null>(() =>
    p.open && p.hand ? (cards.find((c) => !c.front)?.key ?? null) : null,
  );
  // A pointer's turn: the event coming forward (its band unrolls) and the stage going back.
  const [turnTo, setTurnTo] = useState<string | null>(null);
  const [ghost, setGhost] = useState<Stage | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const words = useRef<Partial<Record<RuleId, HTMLButtonElement | null>>>({});
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const settle = () => {
    setPeek(null);
    if (p.open) p.onOpen(false);
  };

  function choose(r: RuleId, el: HTMLElement | null) {
    const to = p.picks[r];
    const still =
      el?.ownerDocument.defaultView?.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches ?? true;
    if (el && !still && to && to.id !== front) {
      setTurnTo(to.id);
      setGhost(p.stage);
      // The ghost leaves on its own animation's end; this only catches a frame that never paints.
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setGhost(null), 1000);
    } else if (!el) setTurnTo(null);
    p.onRule(r);
  }

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      settle();
      return;
    }
    const at = (e.target as HTMLElement).dataset.hdRuleItem ?? p.rule;
    const i = RULES.findIndex((r) => r.id === at);
    const step =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? -1
          : 0;
    const to =
      step !== 0
        ? RULES[(i + step + RULES.length) % RULES.length]!.id
        : e.key === "Home"
          ? RULES[0]!.id
          : e.key === "End"
            ? RULES[RULES.length - 1]!.id
            : null;
    if (!to) return;
    e.preventDefault();
    // A key turns the deck at once: a key is pressed too often to wait on a motion.
    choose(to, null);
    setPeek(to);
    words.current[to]?.focus();
  }

  const peeked = peek ? cards.find((c) => c.rules.includes(peek)) : undefined;
  // A card lifts whole: rules that share an event without being neighbours are one card in two tabs.
  const lifted = peeked && !peeked.front ? peeked.event.id : null;
  const last = cards.length - 1;

  const deck = p.hand ? (
    <div className="deck-row">
      <div
        role="radiogroup"
        aria-label="Lead your dashboard with"
        aria-describedby={noteId}
        data-hd-rule={p.rule}
        data-hd-choosing=""
        className="deck-tabs"
        onKeyDown={onKey}
        onPointerLeave={(e: PointerEvent) => {
          if (e.pointerType === "mouse") settle();
        }}
      >
        {cards.map((c, n) => (
          <div
            key={c.key}
            className="deck-card"
            data-front={c.front ? "" : undefined}
            data-lift={lifted === c.event.id ? "" : undefined}
            data-end={n > 0 && n >= last / 2 ? "" : undefined}
          >
            {c.front ? (
              <FrontLight stage={p.stage} />
            ) : (
              <TabLight e={c.event} />
            )}
            {!p.wide && lifted && peeked?.key === c.key && (
              <span
                aria-hidden
                className="deck-peek surface-display bg-popover text-popover-foreground shadow-layer ring-1 ring-border"
              >
                <Face e={c.event} className="size-5 rounded-full" />
                <span className="truncate">{c.event.name}</span>
              </span>
            )}
            {c.rules.map((r, i) => {
              const on = r === p.rule;
              return (
                <span key={r} className="contents">
                  {i > 0 && (
                    <span aria-hidden className="deck-sep">
                      ·
                    </span>
                  )}
                  <button
                    ref={(el) => {
                      words.current[r] = el;
                    }}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-describedby={`${noteId}-${r}`}
                    tabIndex={on ? 0 : -1}
                    data-hd-rule-item={r}
                    className="deck-word"
                    onClick={(e: MouseEvent<HTMLButtonElement>) =>
                      choose(r, e.detail > 0 ? e.currentTarget : null)
                    }
                    onPointerEnter={(e: PointerEvent) => {
                      if (e.pointerType === "mouse") setPeek(r);
                    }}
                    onPointerDown={(e: PointerEvent) => {
                      if (e.pointerType !== "mouse") setPeek(r);
                    }}
                    onPointerUp={(e: PointerEvent) => {
                      if (e.pointerType !== "mouse") setPeek(null);
                    }}
                    onPointerCancel={() => setPeek(null)}
                    onFocus={(e) => {
                      if (e.currentTarget.matches(":focus-visible")) setPeek(r);
                    }}
                    onBlur={() => setPeek((x) => (x === r ? null : x))}
                  >
                    {label(r)}
                  </button>
                  {/* Read as the radio's description: "Newest, radio, checked, leads with ...". */}
                  <span id={`${noteId}-${r}`} hidden>
                    {`Leads with ${c.event.name}${c.front ? ", on the stage now" : ""}. ${whyOf(r, c.event, today)}.`}
                  </span>
                </span>
              );
            })}
          </div>
        ))}
      </div>
      {p.wide && (
        <>
          <p aria-hidden className="deck-say" data-on={peeked ? "" : undefined}>
            {peeked && peek && (
              <>
                <Face e={peeked.event} className="size-5 rounded-[5px]" />
                <b className="truncate">{peeked.event.name}</b>
                {peeked.event.date && (
                  <span className="shrink-0">
                    {whenFor(peeked.event, p.ends, today)}
                  </span>
                )}
                <span className="ml-2 truncate">
                  {whyOf(peek, peeked.event, today)}
                </span>
              </>
            )}
          </p>
          <p
            aria-hidden
            className="deck-note"
            data-on={peeked ? "" : undefined}
          >
            A party on its own day always leads.
          </p>
        </>
      )}
      <p id={noteId} className="sr-only">
        A party on its own day always leads.
      </p>
    </div>
  ) : null;

  // The cards behind the stage, nearest first and each event once: their edges stand at the band's foot.
  const behind = p.hand
    ? cards.filter(
        (c, i) =>
          !c.front && cards.findIndex((x) => x.event.id === c.event.id) === i,
      )
    : [];

  return (
    <div
      data-hd-deck=""
      // The edges of the cards behind stand under the band: their depth is the deck's, so the gap under them stays the page's.
      style={
        {
          "--deck-foot": `${EDGE * behind.length}px`,
          paddingBottom: EDGE * behind.length,
        } as CSSProperties
      }
    >
      <style>{CSS}</style>
      {deck}
      {[...behind].reverse().map((c) => {
        const d = behind.indexOf(c) + 1;
        return (
          <span
            key={c.key}
            aria-hidden
            className="deck-edge"
            data-lift={lifted === c.event.id ? "" : undefined}
            style={{
              left: d * 14,
              right: d * 14,
              bottom: EDGE * (behind.length - d),
            }}
          >
            <TabLight e={c.event} />
          </span>
        );
      })}
      <StageView
        key={front}
        stage={p.stage}
        ctx={p.ctx}
        ends={p.ends}
        fresh={p.fresh}
        countWord={p.countWord}
        className={cn(
          "deck-band",
          p.hand && cards[0]?.front && "deck-sq-l",
          p.hand && last > 0 && cards[last]?.front && "deck-sq-r",
          turnTo === front && "deck-in",
        )}
      />
      {ghost && (
        <div
          key={ghost.event.id}
          aria-hidden
          inert
          className="deck-ghost"
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget) setGhost(null);
          }}
        >
          <StageView
            stage={ghost}
            ctx={p.ctx}
            ends={p.ends}
            countWord={p.countWord}
          />
        </div>
      )}
    </div>
  );
}
