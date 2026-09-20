"use client";

import { useRef, useState } from "react";

import { ExplorationBoard } from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  EXPORT_FAILED,
  EXPORT_LOADING,
  EXPORT_SUCCESS,
  GUEST_FAILED_DESC,
  GUEST_FAILED_TITLE,
  GUEST_SENT,
  HOST_APPROVED,
  HOST_HIDDEN,
  HOST_PLAN,
  PRICING_REFUSAL_ACTION,
  PRICING_REFUSAL_DESC,
  PRICING_REFUSAL_TITLE,
  RETIRED_INFO,
} from "./fixtures";
import { Scene, TwoUp } from "./scene";
import {
  AlbumBackdrop,
  CopyShareLink,
  CopyShareLinkRedesigned,
  GuestCreditPill,
  GuestFloatingAdd,
  HostActionBarPill,
  RULE_COPY_URL,
  ToastMock,
  TopBar,
} from "./toast-parts";
import type { ToastKind, ToastMaterial } from "./toast-parts";
import { TOASTS } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every option is the real fixed chrome
 * (`FloatingAddButton`, `CopyShareLink`) plus a faithful toast replica
 * (`toast-parts.tsx`'s own WHY-comment says why it is a replica and not a
 * live sonner call: a real Toaster is fixed to the BROWSER's viewport, which
 * breaks out of a scaled 375/1440 `Frame`), on a real `Frame`, at true size.
 */

/** "IF THE CONTROL CAN SHOW IT, NO TOAST" - the board's own first line, drawn
 *  once on `where`'s three options so it is the first thing pressed either
 *  way. `CopyShareLink` is the real, unmodified, live component: press it. */
function RuleStrip() {
  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-dashed border-border p-3">
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        The first line: if the control can show it, no toast
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-muted-foreground">Today: flips AND toasts</span>
          <CopyShareLink url={RULE_COPY_URL} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-muted-foreground">
            The rule applied: flips, says nothing
          </span>
          <CopyShareLinkRedesigned url={RULE_COPY_URL} />
        </div>
      </div>
    </div>
  );
}

/* ── where ─────────────────────────────────────────────────────────────── */

function WhereScene({ position }: { position: "today" | "top" | "foot" }) {
  const hostToast = (
    <ToastMock
      kind="success"
      title={HOST_APPROVED(5)}
      action={position === "today" ? undefined : "Undo"}
    />
  );
  const guestToast = <ToastMock kind="success" title={GUEST_SENT} />;

  const desktopTop = position === "top";
  const desktopFoot = position === "foot";
  const phoneTop = position === "top";

  return (
    <TwoUp
      id={`toasts-where-${position}`}
      phoneH={780}
      captionDesktop={
        desktopFoot
          ? "Bottom-center: directly over the host's own action bar."
          : desktopTop
            ? "Top-right, clear of the action bar below."
            : "Bottom-right, as today: clear, because the bar is bottom-CENTER."
      }
      captionPhone={
        phoneTop
          ? "Under the header: the floating Add pill stays clear."
          : "Full width at the very foot: sitting on the floating Add pill."
      }
      desktop={
        <>
          {position === "today" && <RuleStrip />}
          <div className="relative flex-1">
            <AlbumBackdrop dense />
            <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
              <HostActionBarPill />
            </div>
            {desktopTop ? (
              <>
                <TopBar label="Partyreel / Theo's 30th / Review" />
                <div className="absolute top-16 right-4">{hostToast}</div>
              </>
            ) : (
              <div
                className={
                  desktopFoot
                    ? "absolute bottom-4 left-1/2 -translate-x-1/2"
                    : "absolute right-4 bottom-4"
                }
              >
                {hostToast}
              </div>
            )}
          </div>
        </>
      }
      phone={
        <div className="relative flex-1">
          <TopBar label="Theo's 30th" />
          <AlbumBackdrop />
          <GuestCreditPill />
          <GuestFloatingAdd />
          <div
            className={
              phoneTop
                ? "absolute inset-x-0 top-12 px-3"
                : "absolute inset-x-0 bottom-0 z-50 px-3 pb-3"
            }
          >
            {guestToast}
          </div>
        </div>
      }
    />
  );
}

/* ── material ──────────────────────────────────────────────────────────── */

/** The lab's own dock defaults to dark, and `ink` forces the exact same dark
 *  tokens `.dark` already resolves to there: dark-on-dark is dark, so the
 *  three materials read as one until the SCENE'S OWN ground is pinned light
 *  (`.surface-paper`, `design-system.md`'s "force the paper theme" hook),
 *  regardless of whatever theme the reader's dock happens to be in. Proven
 *  live: identical computed styles across all three options were measured on
 *  the unpinned scene before this fix (`getComputedStyle` byte for byte). */
function MaterialScene({ material }: { material: ToastMaterial }) {
  const stack = (
    <div className="flex flex-col items-end gap-2">
      <ToastMock kind="info" title={RETIRED_INFO} material={material} />
      <ToastMock kind="warning" title={HOST_HIDDEN} material={material} />
      <ToastMock kind="success" title={HOST_APPROVED(5)} action="Undo" material={material} />
    </div>
  );
  return (
    <TwoUp
      id={`toasts-material-${material}`}
      captionDesktop="Bottom-right, today's position; pinned to a light page so ink's own contrast is provable whatever theme you are reading in."
      captionPhone="The same three, at true size on a phone."
      desktop={
        <div className="surface-paper relative flex-1 bg-background text-foreground">
          <AlbumBackdrop dense />
          <div className="absolute right-4 bottom-4">{stack}</div>
        </div>
      }
      phone={
        <div className="surface-paper relative flex-1 bg-background text-foreground">
          <AlbumBackdrop />
          <div className="absolute inset-x-0 bottom-3 flex justify-center px-3">{stack}</div>
        </div>
      }
    />
  );
}

/* ── life ──────────────────────────────────────────────────────────────── */

type LifeMode = "fixed" | "length" | "persist";

/** The export mint (`use-export-download.ts`): the same call, morphing from
 *  loading to success (fixed/length) or to a failure that has no timeout of
 *  its own today (persist) - the ROADMAP's own finding about this exact call. */
function LifeDemo({ mode }: { mode: LifeMode }) {
  const [sentOn, setSentOn] = useState(false);
  const [mintPhase, setMintPhase] = useState<"off" | "loading" | "done" | "failed">("off");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function fire() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setSentOn(true);
    setMintPhase("loading");
    timers.current.push(setTimeout(() => setSentOn(false), 4000));
    timers.current.push(
      setTimeout(
        () => setMintPhase(mode === "persist" ? "failed" : "done"),
        1200,
      ),
    );
    if (mode !== "persist") {
      const clear = mode === "length" ? 8000 : 4000;
      timers.current.push(setTimeout(() => setMintPhase("off"), 1200 + clear));
    }
  }

  const caption =
    mode === "fixed"
      ? "Both clear in four seconds flat, however long the sentence is."
      : mode === "length"
        ? "The confirmation clears in ~3s; the mint's own sentence holds nearer 8s."
        : "The confirmation clears in four seconds; a failed mint waits for Dismiss.";

  return (
    <div className="flex flex-1 flex-col gap-3 p-4">
      <button
        type="button"
        onClick={fire}
        className="w-fit rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
      >
        Fire both
      </button>
      <p className="text-[11px] text-muted-foreground">{caption}</p>
      <div className="flex flex-1 flex-col justify-end gap-2">
        {sentOn && <ToastMock kind="success" title={GUEST_SENT} />}
        {mintPhase === "loading" && <ToastMock kind="loading" title={EXPORT_LOADING} />}
        {mintPhase === "done" && <ToastMock kind="success" title={EXPORT_SUCCESS} />}
        {mintPhase === "failed" && (
          <ToastMock
            kind="error"
            title={EXPORT_FAILED}
            dismissible
            onDismiss={() => setMintPhase("off")}
          />
        )}
      </div>
    </div>
  );
}

function LifeScene({ mode }: { mode: LifeMode }) {
  return (
    <TwoUp
      id={`toasts-life-${mode}`}
      captionDesktop="Press Fire, then read the clock rather than the words."
      captionPhone="The same press, at a phone's width."
      desktop={<LifeDemo mode={mode} />}
      phone={<LifeDemo mode={mode} />}
    />
  );
}

/* ── stack ─────────────────────────────────────────────────────────────── */

type StackMode = "collapsed" | "expanded" | "one";
type Piece = { id: number; kind: ToastKind; title: string; description?: string };

/** The one real batch every mode draws, resting or fired: two sends and a
 *  refusal, half a second apart in `fire()` below. */
const BATCH: readonly Omit<Piece, "id">[] = [
  { kind: "success", title: GUEST_SENT },
  { kind: "success", title: GUEST_SENT },
  { kind: "error", title: GUEST_FAILED_TITLE, description: GUEST_FAILED_DESC },
];

/** Negative, so `fire()`'s own ids (0, 1, 2, ...) never collide with these
 *  and its cleanup timers never touch them: a resting picture, not a frozen
 *  one. Without this, every mode's stage was blank until a press - the exact
 *  "nothing to compare" gap `lab:demo` exists to catch. */
const restingPieces = (mode: StackMode): Piece[] => {
  const rested = mode === "one" ? BATCH.slice(-1) : BATCH;
  return rested.map((p, i) => ({ ...p, id: -(i + 1) }));
};

function StackDemo({ mode }: { mode: StackMode }) {
  const [pieces, setPieces] = useState<Piece[]>(() => restingPieces(mode));
  const seq = useRef(0);

  function fire() {
    const batch = BATCH;
    batch.forEach((p, i) => {
      setTimeout(() => {
        const id = seq.current++;
        setPieces((cur) => {
          const next = [...cur, { ...p, id }];
          return mode === "one" ? next.slice(-1) : next.slice(-4);
        });
        setTimeout(
          () => setPieces((cur) => cur.filter((x) => x.id !== id)),
          5000 + i * 500,
        );
      }, i * 550);
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-3 p-4">
      <button
        type="button"
        onClick={fire}
        className="w-fit rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
      >
        Simulate a batch
      </button>
      <div className="relative flex flex-1 flex-col justify-end">
        {mode === "collapsed" ? (
          <div className="relative h-[8.5rem]">
            {pieces.map((p, i) => {
              const fromFront = pieces.length - 1 - i;
              const front = fromFront === 0;
              return (
                <div
                  key={p.id}
                  className="absolute inset-x-0 bottom-0 origin-bottom transition-[transform,opacity] duration-300"
                  style={{
                    transform: `translateY(${-fromFront * 14}px) scale(${1 - fromFront * 0.05})`,
                    zIndex: 10 - fromFront,
                    opacity: front ? 1 : 0.9,
                  }}
                >
                  <ToastMock kind={p.kind} title={p.title} description={p.description} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col-reverse gap-2">
            {pieces.map((p) => (
              <ToastMock key={p.id} kind={p.kind} title={p.title} description={p.description} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StackScene({ mode }: { mode: StackMode }) {
  return (
    <TwoUp
      id={`toasts-stack-${mode}`}
      captionDesktop="At rest already: the same three outcomes. Press Simulate a batch to watch a fresh run arrive half a second apart."
      captionPhone="No hover here. Collapsed can only be judged on a screen that cannot open it."
      desktop={<StackDemo mode={mode} />}
      phone={<StackDemo mode={mode} />}
    />
  );
}

/* ── action ────────────────────────────────────────────────────────────── */

function ActionScene({ mode }: { mode: "always" | "never" | "errors" }) {
  const successAction = mode === "always" ? "Undo" : undefined;
  const errorAction = mode === "never" ? undefined : PRICING_REFUSAL_ACTION;
  const pair = (
    <div className="flex flex-col gap-2">
      <ToastMock kind="success" title={HOST_APPROVED(5)} action={successAction} />
      <ToastMock
        kind="error"
        title={PRICING_REFUSAL_TITLE(HOST_PLAN)}
        description={PRICING_REFUSAL_DESC}
        action={errorAction}
      />
    </div>
  );
  return (
    <TwoUp
      id={`toasts-action-${mode}`}
      captionDesktop="A bulk success beside a real refusal: the two toasts already asking for a button."
      captionPhone="The same pair, at a phone's width."
      desktop={
        <div className="relative flex-1">
          <AlbumBackdrop dense />
          <div className="absolute right-4 bottom-4">{pair}</div>
        </div>
      }
      phone={
        <div className="relative flex-1">
          <AlbumBackdrop />
          <div className="absolute inset-x-0 bottom-3 px-3">{pair}</div>
        </div>
      }
    />
  );
}

/* ── the map ───────────────────────────────────────────────────────────── */

const PREVIEWS: PreviewsFor<typeof TOASTS> = {
  "where.today": <WhereScene position="today" />,
  "where.top": <WhereScene position="top" />,
  "where.foot": <WhereScene position="foot" />,
  "material.card": <MaterialScene material="card" />,
  "material.ink": <MaterialScene material="ink" />,
  "material.shadow": <MaterialScene material="shadow" />,
  "life.fixed": <LifeScene mode="fixed" />,
  "life.length": <LifeScene mode="length" />,
  "life.persist": <LifeScene mode="persist" />,
  "stack.collapsed": <StackScene mode="collapsed" />,
  "stack.expanded": <StackScene mode="expanded" />,
  "stack.one": <StackScene mode="one" />,
  "action.always": <ActionScene mode="always" />,
  "action.never": <ActionScene mode="never" />,
  "action.errors": <ActionScene mode="errors" />,
};

export function ToastsBoard() {
  return <ExplorationBoard spec={TOASTS} previews={PREVIEWS} />;
}

// `Scene` (the single-frame export) is unused here: every option draws a pair
// via `TwoUp`. Kept imported and re-exported as a type-check that `scene.tsx`
// still exports it, since a future decision on this board may want just one.
export type { SceneMode } from "./scene";
void Scene;
