"use client";

import {
  type MouseEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  BeatActs,
  BeatCode,
  BeatSteps,
} from "@/components/app/create-event-wizard/beat";
import { CARRY_MS, useCarry } from "@/components/app/create-event-wizard/carry";
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
import { DEFAULT_QR_PRESET, type QrStyleKey } from "@/lib/constants/qr-presets";
import { newEventFacts, readiness } from "@/lib/events/readiness";
import { eventUrl } from "@/lib/events/share-urls";
import { cn } from "@/lib/utils";

import { AddCentre, type AddWay, type DevelopAt, DEVELOPS } from "./add";
import {
  EVENT,
  type MomentId,
  SAMPLE_LINK,
  SITE,
  type StyleId,
} from "./fixtures";

/**
 * THE ADD STEP IN THE ROOM AS WIRED: production's own room (`RoomGround`,
 * `RoomHead`, `RoomPage`, `RoomFoot`, the carry, the name, the look and the
 * beat, `wizard-wiring`'s, merged at feca808e) with the add step standing in
 * its place between the name and the look, so every option is judged in the
 * very room it will ship in, its light the Aurora's own field.
 *
 * ★ COMPOSED AS `create-event-wizard.tsx` COMPOSES IT, one step longer: the
 * steps are the name, the add step, the look and the beat (four hairlines),
 * the name titles the room from the add step on, and Back, the hairlines and
 * the name are the way back. What this board adds is the add step's centre
 * (`add.tsx`) and its own carry, which `carry.ts` leaves to this round: the
 * pick drops into its hairline as the look arrives.
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK beyond
 * the stills and the code's renderer: Create event answers after a round
 * trip's wait with a stand-in event, and every link in the room (the close,
 * Print) is held, so a press in a frame never leaves the board.
 */

/** The add step's question, Settings' own word for the choice, and its one quiet line. */
export const ADD_QUESTION = "Pick your album's style";
export const ADD_SUB = "Change it any time in Settings";

const STEPS = ["name", "add", "look", "beat"] as const;
type Step = (typeof STEPS)[number];
const OF = STEPS.length;

/** The stand-in event Create event answers with: a 32-hex token, as the database writes one. */
const REAL_LINK = eventUrl(SITE, "7f3a9c2e5b8d4f1a9e6c3b7d2a5f8e1c");

/** What is left on the new wedding the moment Create returns it: production's readiness over the schema's defaults. */
const LEFT = readiness(
  newEventFacts({ visibility: "open", accepting_uploads: true }),
);

/** A round trip's wait before the stand-in event answers. */
const CREATE_MS = 1100;

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

function motionWelcome(el: Element | null): boolean {
  const win = el?.ownerDocument.defaultView;
  if (!el || !win || typeof (el as HTMLElement).animate !== "function")
    return false;
  return !win.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ── the add step, standing still ─────────────────────────────────────── */

export type AddState = {
  picked: StyleId;
  moment: MomentId;
  develop?: DevelopAt;
};

/** The add step at rest in the wired room: the head, its question, the centre, Continue. */
export function AddRoom({ way, state }: { way: AddWay; state: AddState }) {
  const questionId = useId();
  const none = () => {};
  return (
    <Held>
      <RoomGround screen="add">
        <RoomHead
          step={{ at: 2, of: OF }}
          name={EVENT.name}
          onBack={none}
          onStep={none}
          onName={none}
          close={{ href: "/dashboard", label: "Close" }}
        />
        <div
          data-room-body=""
          className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
        >
          <RoomPage
            question={ADD_QUESTION}
            questionId={questionId}
            sub={ADD_SUB}
          >
            <AddCentre
              way={way}
              picked={state.picked}
              moment={state.moment}
              develop={state.develop}
            />
          </RoomPage>
        </div>
        <RoomFoot>
          <Button
            type="button"
            size="cta"
            tabIndex={-1}
            data-cw-go=""
            className={footButton}
          >
            Continue
          </Button>
        </RoomFoot>
      </RoomGround>
    </Held>
  );
}

/* ── the pick's own carry ─────────────────────────────────────────────── */

type Drop = { picture: HTMLElement; from: DOMRect } | null;

/** Photographs the pick before its screen leaves (`take`'s partner, forward off the add step). */
function takePick(room: HTMLElement | null, drop: RefObject<Drop>) {
  drop.current = null;
  if (!room || !motionWelcome(room)) return;
  const pick = room.querySelector<HTMLElement>(
    '[data-room-page] [data-cw-carry="pick"]',
  );
  if (!pick) return;
  const from = pick.getBoundingClientRect();
  if (from.width < 2) return;
  const picture = pick.cloneNode(true) as HTMLElement;
  for (const el of [picture, ...picture.querySelectorAll<HTMLElement>("[id]")])
    el.removeAttribute("id");
  picture.setAttribute("aria-hidden", "true");
  picture.setAttribute("data-cw-flight", "");
  drop.current = { picture, from };
}

/**
 * THE PICK DROPS INTO ITS HAIRLINE (`carry.ts`'s line left to this round: "the
 * add step joins with its own carry, the pick dropping into its hairline"):
 * its picture lifts off the leaving screen and flies into the add step's
 * hairline, shrinking to the line and going out as it lands, while the line
 * fills. Measured, never guessed: from where the pick stood to where the line
 * stands now. Reduced motion takes nothing and flies nothing.
 */
function landPick(
  room: HTMLElement | null,
  layer: HTMLElement | null,
  drop: RefObject<Drop>,
) {
  const d = drop.current;
  drop.current = null;
  if (!room || !layer || !d) return;
  const line = room.querySelector<HTMLElement>('[data-room-step="2"]');
  if (!line) return;
  const to = line.getBoundingClientRect();
  if (to.width < 2) return;
  const { picture, from } = d;
  Object.assign(picture.style, {
    position: "fixed",
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    margin: "0",
    pointerEvents: "none",
    transformOrigin: "center",
    zIndex: "60",
  });
  layer.append(picture);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  const k = Math.max(0.04, to.width / from.width);
  const strong =
    getComputedStyle(room).getPropertyValue("--ease-in-out-strong").trim() ||
    "cubic-bezier(0.77, 0, 0.175, 1)";
  const fly = picture.animate(
    [
      { transform: "translate(0px, 0px) scale(1)", opacity: 1 },
      {
        transform: `translate(${dx * 0.7}px, ${dy * 0.7}px) scale(${0.3 + k})`,
        opacity: 0.9,
        offset: 0.7,
      },
      { transform: `translate(${dx}px, ${dy}px) scale(${k})`, opacity: 0 },
    ],
    { duration: CARRY_MS, easing: strong, fill: "forwards" },
  );
  const gone = () => picture.remove();
  void fly.finished.then(gone, gone);
}

/* ── Create, running, the add step in its place ───────────────────────── */

/**
 * TRY IT: CREATE AS WIRED, THE ADD STEP IN ITS PLACE, opening on the add step
 * as a host meets it from the name (the night plays once, from guests
 * arriving to the party, where motion is welcome; reduced motion opens on the
 * party). Back and the name go to the name; Continue carries the pick into its
 * hairline and opens the look; Create event plays the beat over a stand-in
 * event; Get it ready starts it again.
 */
export function TryIt({ way }: { way: AddWay }) {
  const [run, setRun] = useState(0);
  const [step, setStep] = useState<Step>("add");
  const [name, setName] = useState<string>(EVENT.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [picked, setPicked] = useState<StyleId>("live");
  const [moment, setMoment] = useState<MomentId>("party");
  const [develop, setDevelop] = useState<DevelopAt>(DEVELOPS[0]);
  const [look, setLook] = useState<QrStyleKey>(DEFAULT_QR_PRESET);
  const [arrived, setArrived] = useState(false);
  const room = useRef<HTMLDivElement | null>(null);
  const drop = useRef<Drop>(null);
  const moved = useRef(false);
  const carry = useCarry();
  const questionId = useId();
  const formId = useId();
  const errorId = useId();

  const { land, take, settle } = carry;
  useLayoutEffect(() => {
    land(room.current);
    landPick(room.current, carry.flyers.current, drop);
  }, [step, land, carry.flyers]);

  // The night plays once as the add step opens, then rests on the party for her hand.
  useEffect(() => {
    const el = room.current;
    const win = el?.ownerDocument.defaultView;
    if (!el || !win || !motionWelcome(el)) return;
    setMoment("arrive");
    const t = win.setTimeout(() => setMoment("party"), 900);
    return () => win.clearTimeout(t);
  }, [run]);

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

  // The stand-in event answers after a round trip's wait.
  useEffect(() => {
    if (step !== "beat" || arrived) return;
    const win = room.current?.ownerDocument.defaultView;
    if (!win) return;
    const t = win.setTimeout(() => setArrived(true), CREATE_MS);
    return () => win.clearTimeout(t);
  }, [step, arrived]);

  function goTo(next: Step) {
    if (next === step) return;
    const dir = STEPS.indexOf(next) > STEPS.indexOf(step) ? 1 : -1;
    take(room.current, dir);
    if (step === "add" && next === "look") takePick(room.current, drop);
    moved.current = true;
    setStep(next);
  }

  function again() {
    settle();
    moved.current = false;
    setName(EVENT.name);
    setNameError(null);
    setPicked("live");
    setMoment("party");
    setDevelop(DEVELOPS[0]);
    setLook(DEFAULT_QR_PRESET);
    setArrived(false);
    setStep("add");
    setRun((n) => n + 1);
  }

  const trimmed = name.trim();
  const titled = step === "add" || step === "look";
  const at = STEPS.indexOf(step) + 1;

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
        question={ADD_QUESTION}
        questionId={questionId}
        sub={ADD_SUB}
      >
        <AddCentre
          way={way}
          picked={picked}
          moment={moment}
          develop={develop}
          onPick={setPicked}
          onMoment={setMoment}
          onDevelop={setDevelop}
        />
      </RoomPage>
    );
    foot = (
      <Button
        type="button"
        size="cta"
        data-cw-go=""
        onClick={() => goTo("look")}
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
        sub="Change it any time from Share"
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
      <Button
        type="button"
        size="cta"
        data-cw-go=""
        onClick={() => {
          settle();
          moved.current = true;
          setArrived(false);
          setStep("beat");
        }}
        className={footButton}
      >
        Create event
      </Button>
    );
  } else {
    page = (
      <RoomPage
        key="beat"
        question={`${trimmed || EVENT.name} is live`}
        questionId={questionId}
        questionHidden={!arrived}
      >
        <div
          data-beat={arrived ? "arrived" : "developing"}
          className="flex w-full flex-col items-center"
        >
          <BeatCode
            look={look}
            name={trimmed || EVENT.name}
            sampleUrl={SAMPLE_LINK}
            realUrl={arrived ? REAL_LINK : null}
          />
          <div
            aria-hidden={arrived ? undefined : true}
            inert={!arrived}
            className="cr-beat-below mt-9 flex w-full flex-col items-center gap-7 md:mt-11 md:gap-9"
          >
            <BeatActs
              eventId="maya-jay"
              eventName={trimmed || EVENT.name}
              joinUrl={arrived ? REAL_LINK : SAMPLE_LINK}
            />
            <BeatSteps r={LEFT} onPlans={() => {}} />
          </div>
        </div>
      </RoomPage>
    );
    foot = arrived ? (
      <Button
        type="button"
        size="cta"
        data-cw-go=""
        onClick={again}
        className={cn(footButton, "cr-beat-go")}
      >
        Get it ready
      </Button>
    ) : (
      <p aria-hidden className="text-working text-muted-foreground">
        Creating your event…
      </p>
    );
  }

  return (
    <Held>
      <RoomGround
        key={run}
        onRoom={(el) => {
          room.current = el;
        }}
        screen={step}
        light={step === "beat" ? "low" : "floor"}
        busy={step === "beat" && !arrived}
      >
        <RoomHead
          step={{ at, of: OF }}
          name={titled ? trimmed : undefined}
          onBack={
            step === "add"
              ? () => goTo("name")
              : step === "look"
                ? () => goTo("add")
                : undefined
          }
          onStep={titled ? (n) => goTo(STEPS[n - 1]!) : undefined}
          onName={titled ? () => goTo("name") : undefined}
          close={
            step === "beat" && arrived
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
      </RoomGround>
    </Held>
  );
}
