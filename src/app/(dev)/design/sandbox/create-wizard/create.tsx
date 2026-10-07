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

import { useAddChoice } from "@/components/app/create-event-wizard/add-step";
import { BeatCode } from "@/components/app/create-event-wizard/beat";
import { useCarry } from "@/components/app/create-event-wizard/carry";
import {
  DEVELOP_QUESTION,
  DEVELOP_SUB,
  DevelopStep,
} from "@/components/app/create-event-wizard/develop-step";
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
import type { AlbumStyle } from "@/lib/disposable/album-style";
import { cn } from "@/lib/utils";

import type { ArrivalWay } from "./arrival";
import {
  BEAT_GO,
  BEAT_SUB,
  BeatUnder,
  type CloseWay,
  GO_IN,
  INVITE_QUESTION,
  INVITE_SUB,
  InviteScreen,
  PHOTOS_WORKING,
  type PhotosPhase,
} from "./close";
import { motionIn, playEntry } from "./entry";
import {
  CREATE_MS,
  EVENT,
  HER_PHOTOS,
  LANDED_MS,
  PHOTO_MS,
  REAL_LINK,
  SAMPLE_LINK,
  SITE,
} from "./fixtures";
import { Hub } from "./hub";
import type { Moment } from "./pictures";
import { PreviewsCentre, type PreviewsWay } from "./previews";

/**
 * CREATE, RUNNING, IN PRODUCTION'S OWN ROOM, AND ON INTO HER EVENT.
 *
 * Composed as `create-event-wizard.tsx` composes it (the room, the head, its hairlines and Back, the question, the foot,
 * the carry, the name, the style step, Disposable's own screen, the look and the beat, all imported), with this round's
 * three answers threaded through: what the beat says and where its button leads (`close`), how her event first greets
 * her (`arrival`), and how the style step's pictures tell the three apart (`previews`). Past the beat it goes where
 * production does not yet: an invite screen of the room, her photos going up, and the room opening into her event
 * (`entry.ts`), where the hub stands as production draws it (`hub.tsx`).
 *
 * ★ NOTHING HERE REACHES A SESSION, A SERVER FUNCTION OR THE NETWORK beyond the stills and the code's renderer: Create
 * event answers after a wait with a stand-in event, her photos "go up" on a clock, and every link (the close, Print,
 * the hub's doors) is held, so a press in a frame never leaves the board. In her event, the app bar's logo starts the
 * run again, as New event would.
 */

export type Ways = {
  close: CloseWay;
  arrival: ArrivalWay;
  previews: PreviewsWay;
};

type Step = "name" | "add" | "develop" | "look" | "beat" | "invite" | "hub";

/** The code's ways out in Create: the beat's rounds and the invite's. A press of one is a share she made. */
const SHARES = "[data-beat-rounds] .cr-act, [data-cw-invite-acts] .cr-act";

/**
 * Holds every link in the frame; the app bar's logo (Partyreel, home) starts the run again. It notes a press of the
 * code's ways out, so her event knows she has already sent it.
 */
function Held({
  children,
  again,
  onShared,
  ...data
}: {
  children: ReactNode;
  again: () => void;
  onShared?: () => void;
} & Record<`data-${string}`, string | undefined>) {
  const hold = (e: MouseEvent) => {
    const target = e.target as Element | null;
    if (target?.closest?.(SHARES)) onShared?.();
    const link = target?.closest?.("a");
    if (!link) return;
    e.preventDefault();
    if (link.getAttribute("aria-label") === "Partyreel dashboard") again();
  };
  return (
    <div onClickCapture={hold} className="contents" {...data}>
      {children}
    </div>
  );
}

export type RunProps = {
  ways: Ways;
  /** The screen the run opens on; `beat`, `invite` and `hub` open with the event already made. */
  opens: Step;
  /** The style picked as the run opens (Live, as production opens). */
  style?: AlbumStyle;
  /** The picked card's story pinned at a moment, for a frame read still (`previews`). */
  pin?: Moment;
  /** Her photos, pinned: going up on the beat, or in her event (`close=photos`). */
  photos?: "going" | "in";
};

/**
 * CREATE FROM THE MOMENT ASKED. Back and the hairlines go back; Continue goes on (carrying the pick into its hairline);
 * Create event makes the stand-in event after a round trip's wait; the beat's button does what the answer asks; the
 * room opens into her event; the logo in her event's bar starts it all again.
 */
export function CreateRun(props: RunProps) {
  const [run, setRun] = useState(0);
  const again = useCallback(() => setRun((n) => n + 1), []);
  return <Run key={run} {...props} again={again} />;
}

function Run({
  ways,
  opens,
  style,
  pin,
  photos,
  again,
}: RunProps & { again: () => void }) {
  const made0 = opens === "beat" || opens === "invite" || opens === "hub";
  const [step, setStep] = useState<Step>(opens);
  const [name, setName] = useState<string>(EVENT.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [look, setLook] = useState<QrStyleKey>(DEFAULT_QR_PRESET);
  const [made, setMade] = useState(made0);
  const [phase, setPhase] = useState<PhotosPhase>(
    photos === "going" ? "going" : photos === "in" ? "landed" : "none",
  );
  const [up, setUp] = useState(photos === "going" ? 2 : 0);
  const [entering, setEntering] = useState(false);
  // A press of Print, Share or Copy link in Create: her event greets her as one who has sent it.
  const [shared, setShared] = useState(false);
  const onShared = useCallback(() => setShared(true), []);
  const add = useAddChoice();
  const [played, setPlayed] = useState(opens !== "add");
  const onPlayed = useCallback(() => setPlayed(true), []);
  const timers = useRef<number[]>([]);
  const room = useRef<HTMLDivElement | null>(null);
  const moved = useRef(false);
  const carry = useCarry();
  const questionId = useId();
  const formId = useId();
  const errorId = useId();

  const { land, take, settle } = carry;
  const { pick } = add;
  useLayoutEffect(() => {
    if (step !== "hub") land(room.current);
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
    } else if (step !== "beat" && step !== "hub") {
      doc?.getElementById(questionId)?.focus({ preventScroll: true });
    }
  }, [step, questionId]);

  useEffect(
    () => () => {
      for (const t of timers.current) window.clearTimeout(t);
    },
    [],
  );
  const later = (ms: number, fn: () => void) =>
    timers.current.push(window.setTimeout(fn, ms));

  // Disposable's own screen is a step only while it is picked (production's `DISPOSABLE_STEPS`).
  const steps: Step[] =
    add.style === "disposable"
      ? ["name", "add", "develop", "look", "beat"]
      : ["name", "add", "look", "beat"];
  const at =
    step === "invite" || step === "hub"
      ? steps.length
      : steps.indexOf(step) + 1;

  function goTo(next: Step) {
    if (next === step) return;
    const order: Step[] = [...steps, "invite"];
    take(room.current, order.indexOf(next) > order.indexOf(step) ? 1 : -1);
    moved.current = true;
    setStep(next);
  }

  function onCreate() {
    if (!add.confirm()) {
      goTo(add.style === "disposable" ? "develop" : "add");
      return;
    }
    // The beat lands at once, the sample developing while the event is made: the code's own arrival, never a carry.
    settle();
    moved.current = true;
    setMade(false);
    setStep("beat");
    later(CREATE_MS, () => setMade(true));
  }

  /** The room opens into her event: the hub mounted under it, the flight played, the room gone. */
  const enter = useCallback(() => {
    const doc = room.current?.ownerDocument;
    if (!motionIn(doc)) {
      setStep("hub");
      return;
    }
    setEntering(true);
  }, []);
  useLayoutEffect(() => {
    if (!entering) return;
    const el = room.current;
    let gone = false;
    // A frame for the hub under the room to lay out, then the flight from what stands to where it lands.
    const raf = el?.ownerDocument.defaultView?.requestAnimationFrame(() => {
      if (!el) return;
      void playEntry(el).then(() => {
        if (gone) return;
        setEntering(false);
        setStep("hub");
      });
    });
    return () => {
      gone = true;
      if (raf !== undefined)
        el?.ownerDocument.defaultView?.cancelAnimationFrame(raf);
    };
  }, [entering]);

  function onBeatGo() {
    if (!made) return;
    if (ways.close === "invite") {
      goTo("invite");
      return;
    }
    if (ways.close === "photos") {
      if (phase !== "none") return;
      setPhase("going");
      HER_PHOTOS.forEach((_, i) =>
        later(PHOTO_MS * (i + 1), () => setUp((n) => Math.max(n, i + 1))),
      );
      later(PHOTO_MS * HER_PHOTOS.length + LANDED_MS, () => {
        setPhase("landed");
        enter();
      });
      return;
    }
    enter();
  }

  // A frame opened on the beat, the invite or her event stands with the event already made.
  useEffect(() => {
    if (made0) moved.current = true;
  }, [made0]);

  const trimmed = name.trim() || EVENT.name;
  const titled = step === "add" || step === "develop" || step === "look";
  const onBeat = step === "beat";
  const realUrl = made ? REAL_LINK : null;

  if (step === "hub") {
    return (
      <Held again={again} data-cw-run="hub">
        <Hub
          name={trimmed}
          look={look}
          arrival={ways.arrival}
          photos={phase === "landed"}
          shared={shared}
        />
      </Held>
    );
  }

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
        <PreviewsCentre
          way={ways.previews}
          choice={add}
          played={played}
          onPlayed={onPlayed}
          pin={pin}
        />
      </RoomPage>
    );
    foot = (
      <Button
        type="button"
        size="cta"
        data-cw-go=""
        onClick={() =>
          goTo(add.style === "disposable" ? "develop" : "look")
        }
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
        <DevelopStep choice={add} />
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
        onClick={onCreate}
        className={footButton}
      >
        Create event
      </Button>
    );
  } else if (step === "invite") {
    page = (
      <RoomPage
        key="invite"
        question={INVITE_QUESTION}
        questionId={questionId}
        sub={INVITE_SUB}
      >
        <InviteScreen name={trimmed} joinUrl={REAL_LINK} />
      </RoomPage>
    );
    foot = (
      <Button
        type="button"
        size="cta"
        data-cw-go=""
        onClick={enter}
        className={footButton}
      >
        {GO_IN}
      </Button>
    );
  } else {
    const sub = BEAT_SUB[ways.close];
    page = (
      <RoomPage
        key="beat"
        question={`${trimmed} is live`}
        questionId={questionId}
        questionHidden={!made}
        sub={
          sub ? (
            <span data-cw-sub="" data-held={made ? undefined : ""}>
              {sub}
            </span>
          ) : undefined
        }
      >
        <div
          data-beat={made ? "arrived" : "developing"}
          className="flex w-full flex-col items-center"
        >
          <BeatCode
            look={look}
            name={trimmed}
            sampleUrl={SAMPLE_LINK}
            realUrl={realUrl}
          />
          <div className="cr-beat-under mt-9 w-full md:mt-11">
            <div
              aria-hidden={made ? undefined : true}
              inert={!made}
              className="cr-beat-below flex w-full flex-col items-center"
            >
              <BeatUnder
                way={ways.close}
                eventName={trimmed}
                joinUrl={realUrl ?? SAMPLE_LINK}
                phase={phase}
                up={up}
              />
            </div>
          </div>
        </div>
      </RoomPage>
    );
    const going = ways.close === "photos" && phase !== "none";
    foot = (
      <Button
        type="button"
        size="cta"
        data-cw-go=""
        onClick={onBeatGo}
        working={!made || going}
        workingLabel={going ? PHOTOS_WORKING : "Creating your event"}
        className={cn(footButton, made && "cr-beat-go")}
      >
        {BEAT_GO[ways.close]}
      </Button>
    );
  }

  const back = (() => {
    if (titled && step !== "add")
      return () => goTo(steps[steps.indexOf(step) - 1] ?? "name");
    if (step === "add") return () => goTo("name");
    return undefined;
  })();

  const exists = made && (onBeat || step === "invite");
  return (
    <Held
      again={again}
      onShared={onShared}
      data-cw-run={step}
      data-cw-close-way={ways.close}
      data-cw-made={exists ? "" : undefined}
    >
      {entering ? (
        <Hub
          name={trimmed}
          look={look}
          arrival={ways.arrival}
          photos={phase === "landed"}
          shared={shared}
        />
      ) : null}
      <RoomGround
        onRoom={(el) => {
          room.current = el;
        }}
        screen={step}
        light={onBeat ? "low" : "floor"}
        busy={(onBeat && !made) || (ways.close === "photos" && phase === "going")}
      >
        <RoomHead
          step={{ at, of: steps.length }}
          name={titled || step === "invite" ? trimmed : undefined}
          onBack={back}
          onStep={titled ? (n) => goTo(steps[n - 1] ?? "name") : undefined}
          onName={titled ? () => goTo("name") : undefined}
          close={
            exists
              ? { href: "/dashboard/create-wizard-r5", label: "Go to your event" }
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
              : `Creating ${trimmed}…`
            : ""}
        </span>
      </RoomGround>
    </Held>
  );
}
