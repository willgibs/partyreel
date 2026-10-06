"use client";

import {
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import { useAddChoice } from "@/components/app/create-event-wizard/add-step";
import {
  BeatActs,
  BeatCode,
} from "@/components/app/create-event-wizard/beat";
import { useCarry } from "@/components/app/create-event-wizard/carry";
import { LookStep } from "@/components/app/create-event-wizard/look-step";
import { NameStep } from "@/components/app/create-event-wizard/name-step";
import {
  footButton,
  RoomFoot,
  RoomGround,
  RoomHead,
  RoomPage,
  RoomStage,
} from "@/components/app/create-event-wizard/room";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { DEFAULT_QR_PRESET, type QrStyleKey } from "@/lib/constants/qr-presets";
import type { AlbumStyle } from "@/lib/disposable/album-style";
import { DEFAULT_ERROR_MESSAGE } from "@/lib/errors/codes";
import { cn } from "@/lib/utils";

import { Close, type CloseWay } from "./close";
import {
  CREATE_MS,
  EVENT,
  FAILED_TITLE,
  LEFT,
  REAL_LINK,
  SAMPLE_LINK,
  SITE,
} from "./fixtures";
import {
  DEVELOP_QUESTION,
  DEVELOP_SUB,
  DevelopScreen,
  StylesCentre,
  type StylesWay,
} from "./styles";

/**
 * CREATE, RUNNING, IN PRODUCTION'S OWN ROOM, ONE OPTION'S WAY AT A TIME.
 *
 * Composed as `create-event-wizard.tsx` composes it (the room, the head, its
 * hairlines and Back, the question, the foot, the carry, the name, the add
 * step, the look and the beat, all imported), with the four answers this
 * round asks threaded through: the style step's arrangement, what the beat
 * closes on, the wait while the event is made, and where a failure lands.
 * Every option draws the room as built on the three axes it does not ask
 * (`TODAY`), or as he answered them where a decision waits on another.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK beyond
 * the stills and the code's renderer: Create event answers after a wait with
 * a stand-in event (or a failure, or nothing at all), and every link in the
 * room (the close, Print) is held, so a press in a frame never leaves the
 * board. A frame's toasts go to its own toaster (sonner's `toasterId`), never
 * the lab's.
 */

export type WaitWay = "breath" | "tray" | "inplace";
export type FailWay = "back" | "held" | "line";
export type Ways = {
  styles: StylesWay;
  close: CloseWay;
  wait: WaitWay;
  failed: FailWay;
};

/** Production as built on every axis: what an option wears on the axes it does not ask. */
export const TODAY: Ways = {
  styles: "built",
  close: "marks",
  wait: "breath",
  failed: "back",
};

/**
 * What Create event does: makes the event, fails every time, fails once and
 * then makes it (the line came back), or never answers (the wait, held).
 */
export type Outcome = "made" | "fails" | "fails-once" | "hangs";

type Step = "name" | "add" | "develop" | "look" | "beat";

/** The beat's moment: the event being made, made, or held after a failure (`held`). */
type Beat = "making" | "made" | "failed";

/** The room's own words for a failure said in the room (`line`, and `held` on the look). */
const FAILED_LINE = "Couldn't create the event. Nothing was lost.";
const HELD_QUESTION = "Couldn't create it yet";
const HELD_LINE =
  "Nothing was lost: your name, style and look are kept. Check your connection and try again.";

/** Holds every link in the room: a frame's press never navigates the lab. */
function Held({ children }: { children: ReactNode }) {
  const hold = (e: MouseEvent) => {
    if ((e.target as Element | null)?.closest?.("a")) e.preventDefault();
  };
  return (
    <div onClickCapture={hold} className="contents">
      {children}
    </div>
  );
}

export type RunProps = {
  ways: Ways;
  /** The screen the run opens on. */
  opens: Exclude<Step, "beat">;
  /** What Create event does. */
  outcome: Outcome;
  /** How long Create takes to answer, ms. */
  ms?: number;
  /** The style picked as the run opens (Live, as production opens). */
  style?: AlbumStyle;
  /** Press Create event as the run opens: a frame that rests on the wait, the beat or the failure. */
  pressed?: boolean;
};

/**
 * CREATE FROM THE MOMENT ASKED. Back and the hairlines go back; Continue
 * goes on (carrying the pick into its hairline); Create event plays the wait
 * in the way asked and answers as `outcome` says; Get it ready, or Try again
 * once the line is back, runs it again from where it opened.
 */
export function CreateRun(props: RunProps) {
  const [run, setRun] = useState(0);
  return (
    <Run key={run} {...props} again={() => setRun((n) => n + 1)} />
  );
}

function Run({
  ways,
  opens,
  outcome,
  ms = CREATE_MS,
  style,
  pressed = false,
  again,
}: RunProps & { again: () => void }) {
  const [step, setStep] = useState<Step>(opens);
  const [name, setName] = useState<string>(EVENT.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [look, setLook] = useState<QrStyleKey>(DEFAULT_QR_PRESET);
  const [beat, setBeat] = useState<Beat>("making");
  // The wait on the look (`inplace`), and a failure held there.
  const [working, setWorking] = useState(false);
  const [lookFailed, setLookFailed] = useState(false);
  // A failure said in the room, under the look's question (`line`).
  const [lookLine, setLookLine] = useState<string | null>(null);
  const add = useAddChoice();
  const [played, setPlayed] = useState(opens !== "add");
  const onPlayed = useCallback(() => setPlayed(true), []);
  const tries = useRef(0);
  const timer = useRef<number | null>(null);
  const room = useRef<HTMLDivElement | null>(null);
  const moved = useRef(false);
  const carry = useCarry();
  const questionId = useId();
  const formId = useId();
  const errorId = useId();
  const toasterId = useId();
  // The frame's own toast, so a dismissal never reaches the lab's.
  const said = useRef<string | number | null>(null);
  const unsay = () => {
    if (said.current !== null) toast.dismiss(said.current);
    said.current = null;
  };

  const { land, take, settle } = carry;
  const { pick } = add;
  useLayoutEffect(() => {
    land(room.current);
  }, [step, land]);

  // The style she arrives with, picked once as the run opens.
  useEffect(() => {
    if (style) pick(style);
  }, [style, pick]);

  // Where she is put once the screen changes: the field on the name, the question elsewhere.
  useEffect(() => {
    if (!moved.current) return;
    const doc = room.current?.ownerDocument;
    if (step === "name") {
      room.current
        ?.querySelector<HTMLInputElement>("[data-room-name-input]")
        ?.focus({ preventScroll: true });
    } else if (step !== "beat") {
      doc?.getElementById(questionId)?.focus({ preventScroll: true });
    }
  }, [step, questionId]);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      if (said.current !== null) toast.dismiss(said.current);
    },
    [],
  );

  // The focused screen is a step only while Disposable is picked.
  const steps: Step[] =
    ways.styles === "focused" && add.style === "disposable"
      ? ["name", "add", "develop", "look", "beat"]
      : ["name", "add", "look", "beat"];
  const at = steps.indexOf(step) + 1;
  // Read by what answers after a wait, so it goes from where she is then, never where she pressed.
  const now = useRef({ step, steps });
  useLayoutEffect(() => {
    now.current = { step, steps };
  });

  function goTo(next: Step) {
    const { step: from, steps: order } = now.current;
    if (next === from) return;
    take(room.current, order.indexOf(next) > order.indexOf(from) ? 1 : -1);
    moved.current = true;
    now.current = { step: next, steps: order };
    setStep(next);
  }

  function fail() {
    const f = ways.failed;
    if (f === "held") {
      if (ways.wait === "inplace") {
        setWorking(false);
        setLookFailed(true);
      } else setBeat("failed");
      return;
    }
    setWorking(false);
    goTo("look");
    if (f === "line") {
      setLookLine(FAILED_LINE);
      return;
    }
    said.current = toast.error(FAILED_TITLE, {
      description: DEFAULT_ERROR_MESSAGE,
      toasterId,
    });
  }

  function answer() {
    tries.current += 1;
    const ok =
      outcome === "made" || (outcome === "fails-once" && tries.current > 1);
    if (outcome === "hangs") return;
    timer.current = window.setTimeout(
      () => {
        timer.current = null;
        if (!ok) {
          fail();
          return;
        }
        setWorking(false);
        if (ways.wait === "inplace") {
          settle();
          moved.current = true;
          setStep("beat");
        }
        setBeat("made");
      },
      pressed && tries.current === 1 && outcome !== "fails-once" ? 0 : ms,
    );
  }

  function onCreate() {
    if (working || (step === "beat" && beat === "making")) return;
    if (!add.confirm()) {
      goTo("add");
      return;
    }
    unsay();
    setLookLine(null);
    setLookFailed(false);
    if (ways.wait === "inplace") {
      setWorking(true);
    } else {
      // The beat lands at once, the code's own arrival, never a carry.
      settle();
      moved.current = true;
      setBeat("making");
      setStep("beat");
    }
    answer();
  }

  function retryHeld() {
    setBeat("making");
    answer();
  }

  // A frame that rests on the wait, the beat or the failure presses Create event as it opens (a tick
  // later, so a remount in development presses once, never twice).
  const press = useRef(onCreate);
  useLayoutEffect(() => {
    press.current = onCreate;
  });
  useEffect(() => {
    if (!pressed) return;
    const t = window.setTimeout(() => press.current(), 0);
    return () => window.clearTimeout(t);
  }, [pressed]);

  const trimmed = name.trim() || EVENT.name;
  const titled = step === "add" || step === "develop" || step === "look";
  const onBeat = step === "beat";
  const made = onBeat && beat === "made";
  const heldFail = onBeat && beat === "failed";

  let page: ReactNode;
  let foot: ReactNode;
  if (step === "name") {
    page = (
      <RoomPage key="name" question="Name your event" questionId={questionId}>
        <NameStep
          formId={formId}
          questionId={questionId}
          errorId={errorId}
          name={name}
          error={nameError}
          onName={(v) => {
            setName(v);
            if (nameError) setNameError(null);
          }}
          onSubmit={() => {
            if (!name.trim()) {
              setNameError("Give your event a name.");
              return;
            }
            goTo("add");
          }}
        />
      </RoomPage>
    );
    foot = (
      <Button
        type="submit"
        form={formId}
        size="cta"
        data-cw-go=""
        className={footButton}
      >
        Continue
      </Button>
    );
  } else if (step === "add") {
    page = (
      <RoomPage
        key="add"
        question="Pick your album's style"
        questionId={questionId}
        sub="Change it any time in Settings"
      >
        <StylesCentre
          way={ways.styles}
          choice={add}
          played={played}
          onPlayed={onPlayed}
        />
      </RoomPage>
    );
    foot = (
      <Button
        type="button"
        size="cta"
        data-cw-go=""
        onClick={() => {
          const focused =
            ways.styles === "focused" && add.style === "disposable";
          if (!focused && !add.confirm()) return;
          goTo(focused ? "develop" : "look");
        }}
        className={footButton}
      >
        Continue
      </Button>
    );
  } else if (step === "develop") {
    page = (
      <RoomPage
        key="develop"
        question={DEVELOP_QUESTION}
        questionId={questionId}
        sub={DEVELOP_SUB}
      >
        <DevelopScreen choice={add} />
      </RoomPage>
    );
    foot = (
      <Button
        type="button"
        size="cta"
        data-cw-go=""
        onClick={() => {
          if (!add.confirm()) return;
          goTo("look");
        }}
        className={footButton}
      >
        Continue
      </Button>
    );
  } else if (step === "look") {
    page = (
      <RoomPage
        key="look"
        question="Pick the code’s look"
        questionId={questionId}
        sub={
          lookLine ? (
            <span data-cw-failed="line" role="alert" className="text-destructive">
              {lookLine}
            </span>
          ) : (
            "Change it any time from Share"
          )
        }
      >
        <LookStep
          look={look}
          onLook={setLook}
          name={trimmed}
          siteUrl={SITE}
          joinUrl={SAMPLE_LINK}
        />
      </RoomPage>
    );
    foot = (
      <div className="flex w-full flex-col items-center gap-2.5">
        {lookFailed ? (
          <p
            data-cw-failed="held"
            role="alert"
            className="text-center text-caption text-pretty text-destructive"
          >
            {FAILED_LINE}
          </p>
        ) : null}
        <Button
          type="button"
          size="cta"
          data-cw-go=""
          onClick={onCreate}
          working={working}
          workingLabel="Creating your event"
          className={footButton}
        >
          {lookFailed ? "Try again" : "Create event"}
        </Button>
      </div>
    );
  } else {
    page = (
      <RoomPage
        key="beat"
        question={heldFail ? HELD_QUESTION : `${trimmed} is live`}
        questionId={questionId}
        questionHidden={!made && !heldFail}
      >
        <div
          data-beat={made ? "arrived" : heldFail ? "failed" : "developing"}
          data-cw-wait={ways.wait}
          className="flex w-full flex-col items-center"
        >
          <BeatCode
            look={look}
            name={trimmed}
            sampleUrl={SAMPLE_LINK}
            realUrl={made ? REAL_LINK : null}
          />
          {heldFail ? (
            <p
              data-cw-failed="held"
              role="alert"
              className="mt-9 max-w-[19rem] text-center text-working text-pretty text-muted-foreground md:mt-11"
            >
              {HELD_LINE}
            </p>
          ) : (
            <div
              aria-hidden={made ? undefined : true}
              inert={!made}
              className="cr-beat-below mt-9 flex w-full flex-col items-center gap-7 md:mt-11 md:gap-9"
            >
              <BeatActs
                eventId="maya-jay"
                eventName={trimmed}
                joinUrl={made ? REAL_LINK : SAMPLE_LINK}
              />
              <Close way={ways.close} r={LEFT} />
            </div>
          )}
        </div>
      </RoomPage>
    );
    foot = heldFail ? (
      <Button
        type="button"
        size="cta"
        data-cw-go=""
        onClick={retryHeld}
        className={footButton}
      >
        Try again
      </Button>
    ) : (
      <Button
        type="button"
        size="cta"
        data-cw-go=""
        onClick={() => {
          if (made) again();
        }}
        working={!made}
        workingLabel="Creating your event"
        className={cn(footButton, made && "cr-beat-go")}
      >
        Get it ready
      </Button>
    );
  }

  const back = (() => {
    if (titled && step !== "add")
      return () => goTo(steps[steps.indexOf(step) - 1] ?? "name");
    if (step === "add") return () => goTo("name");
    if (heldFail) return () => goTo("look");
    return undefined;
  })();

  return (
    <Held>
      <RoomGround
        onRoom={(el) => {
          room.current = el;
        }}
        screen={step}
        light={onBeat ? "low" : "floor"}
        busy={(onBeat && beat === "making") || working}
      >
        <RoomHead
          step={{ at, of: steps.length }}
          name={titled || heldFail ? trimmed : undefined}
          onBack={back}
          onStep={titled ? (n) => goTo(steps[n - 1]!) : undefined}
          onName={titled ? () => goTo("name") : undefined}
          close={
            made
              ? { href: "/dashboard", label: "Go to your event" }
              : { href: "/dashboard", label: "Close" }
          }
        />
        <div
          data-room-body=""
          className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
        >
          {page}
          <RoomStage ghostRef={carry.ghosts} flyerRef={carry.flyers} />
        </div>
        <RoomFoot>{foot}</RoomFoot>
        <span role="status" className="sr-only">
          {onBeat
            ? made
              ? `${trimmed} is live`
              : heldFail
                ? HELD_QUESTION
                : `Creating ${trimmed}…`
            : working
              ? `Creating ${trimmed}…`
              : ""}
        </span>
      </RoomGround>
      <Toaster id={toasterId} position="top-center" />
    </Held>
  );
}
