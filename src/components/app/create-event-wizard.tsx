"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
  createEventInWizard,
  type CreatedEvent,
} from "@/app/(app)/dashboard/actions";
import { DEFAULT_QR_PRESET, type QrStyleKey } from "@/lib/constants/qr-presets";
import { type Tier } from "@/lib/constants/tiers";
import {
  newEventFacts,
  type Readiness,
  readiness,
} from "@/lib/events/readiness";
import { eventUrl, previewJoinUrl } from "@/lib/events/share-urls";
import { createEventSchema } from "@/lib/validation/event";
import { trackAttrs } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { settingsPageHref } from "@/components/app/event-settings/settings-pages";
import { PricingSheet } from "@/components/app/pricing/pricing-sheet";

import { AddStep, useAddChoice } from "./create-event-wizard/add-step";
import { BeatActs, BeatClose, BeatCode } from "./create-event-wizard/beat";
import { CapDoor, type CappedEvent } from "./create-event-wizard/cap-door";
import { useCarry } from "./create-event-wizard/carry";
import {
  DEVELOP_QUESTION,
  DEVELOP_SUB,
  DevelopStep,
} from "./create-event-wizard/develop-step";
import {
  type Held,
  HELD_QUESTION,
  heldFailure,
} from "./create-event-wizard/held";
import { rememberJustMade } from "./create-event-wizard/just-made";
import { LookStep } from "./create-event-wizard/look-step";
import { NameStep } from "./create-event-wizard/name-step";
import {
  footButton,
  RoomFoot,
  RoomGround,
  RoomHead,
  RoomPage,
  RoomStage,
} from "./create-event-wizard/room";

export type { CappedEvent };

type Step = "name" | "add" | "develop" | "look" | "beat";

/**
 * CREATE'S SCREENS, IN ORDER: the name, the album's style (the add step, create-wizard r3's `add=styles`), the
 * code's look and the beat; and while Disposable is picked, its own screen after the style (r4's `styles=focused`),
 * so the steppers grow by one when she picks it. Every hairline, Back and the carry count from the list in force.
 */
const STEPS: readonly Step[] = ["name", "add", "look", "beat"];
const DISPOSABLE_STEPS: readonly Step[] = [
  "name",
  "add",
  "develop",
  "look",
  "beat",
];

/** Where a field the create refused is answered, so a refusal sends her to the screen that holds it. */
const FIELD_SCREENS: Partial<Record<string, Step>> = {
  name: "name",
  qr_style: "look",
  develops_at: "develop",
  roll_size: "develop",
};

type CreateEventWizardProps = {
  siteUrl: string;
  planName: string;
  tier: Tier;
  /** Server-computed with the dashboard's own cap math. */
  atCap: boolean;
  /** The plan's event limit. null = unlimited, so the door never renders. */
  maxEvents: number | null;
  /** The events already filling the plan, so the door can name one. */
  cappedEvents: CappedEvent[];
  /** The account's storage used, as a whole percent: room joins what is left past the threshold. */
  storagePct?: number;
  /**
   * The Server Action that makes the event: the route's own. A specimen hands a stand-in that answers
   * after a real round trip's wait and makes nothing (the review room's Library precedent), so Create can
   * be drawn whole, its beat included, with no row written.
   */
  create?: typeof createEventInWizard;
};

/**
 * THE CREATE FLOW, AS A ROOM OF ITS OWN (create-wizard r1 to r4, Will 2026-10-02 to 07, over the
 * `first-event` board's verdicts of 2026-09-21).
 *
 * What his picks made of it, each in its own file beside this one:
 *
 *  ★ `shape=screen`, in his layout (`room.tsx`): the whole screen, dark, the subtle steppers on top, the
 *    question just under them in one place, the answer in the centre, one button at the foot.
 *  ★ `flow=carry` (`carry.ts`): each answer rises into the head, above hairlines that press back; the
 *    name she typed titles the room from then on, and the head is the way back.
 *  ★ `add=styles` (`add-step.tsx`, r3) and `styles=focused` (r4): the album's style, between the name and the
 *    look: Live, Review and Disposable as three cards, each a small album moving through the night, nothing
 *    opening under them; picking Disposable adds its own screen after it, when the photos develop and the roll
 *    (`develop-step.tsx`). The event is born with the style's three columns in the one insert
 *    (`createFieldsOf`), so Create and Settings say and write one thing.
 *  ★ `look=places` (`look-step.tsx`): her code where guests meet it, her phone and the room's screen,
 *    four swatches re-dressing both (`qr-preset-picker.tsx`).
 *  ★ `beat=develop` (`beat.tsx`) and `wait=breath` (r4, as built): the sample develops into her code where it
 *    stands while Create runs; Print and Share as rounds; Get it ready at the foot.
 *  ★ `close=next` (r4, `beat.tsx`'s `BeatClose`): under Print and Share, one line saying what guests still need,
 *    read off the new event's readiness, where Settings' five marks stood.
 *  ★ `failed=held` (r4, `held.ts`): a failed Create holds the beat she is watching, says nothing was lost and the
 *    way to put it right, and the foot becomes that way (Try again, or Upgrade at the plan's limit), with Back for
 *    a change. A toast never carries a failure here.
 *
 * And the verdicts it keeps: `asks=one` (the name alone), `style=step` (the look a step of its own, on
 * samples), `landing=beat` (Create ends on ONE screen, once in an event's life, by construction: only
 * Create event reaches it), `create=hand` (it hands over into Settings' first step) and `limit=door`
 * (`cap-door.tsx`: the refusal before the work).
 *
 * The event is still created ONCE, at commit, so an abandoned Create leaves no row
 * (`createEventInWizard` RETURNS the event rather than redirecting, which is what lets the beat draw the
 * real code).
 */
export function CreateEventWizard({
  siteUrl,
  planName,
  tier,
  atCap,
  maxEvents,
  cappedEvents,
  storagePct = 0,
  create = createEventInWizard,
}: CreateEventWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [look, setLook] = useState<QrStyleKey>(DEFAULT_QR_PRESET);
  // The album's style, its develop time and its roll: held here so a Back and a Continue never lose them.
  const add = useAddChoice();
  // The add step's night plays once in a Create, as the step first opens.
  const [nightPlayed, setNightPlayed] = useState(false);
  const onNightPlayed = useCallback(() => setNightPlayed(true), []);
  const [created, setCreated] = useState<CreatedEvent | null>(null);
  // A Create that made nothing, held on the beat with its words and its way out until she tries again or goes back.
  const [held, setHeld] = useState<Held | null>(null);
  // What is left on the new event, read from what Create sent (the schema's defaults filled) and the
  // account's storage, known the moment Create is pressed.
  const [left, setLeft] = useState<Readiness | null>(null);
  // The plans' sheet, opened by the cap door's See Pro, the close's room line and a held limit's Upgrade
  // (`first=trigger`), each knowing the host ran out of room.
  const [pricingOpen, setPricingOpen] = useState(false);
  const [, startTransition] = useTransition();
  const creating = useRef(false);
  /**
   * ★ THE KEY OF THIS CREATE, MADE AT ITS FIRST PRESS AND SENT WITH EVERY TRY (20261007120000, `events.create_key`): a Create
   * whose answer is lost after the server made the event is held as failed, and a Try again that made a second event spent a
   * Free host's one event on a duplicate. The server returns the event the first try made for the key it has seen, so the
   * key is one for the whole room, never one per press, and it survives a Back and a change of her answers: a retry after she
   * changed the name still gets the first event (she renames it in Settings) rather than a duplicate or a plan's-limit
   * refusal over the event that stands on her dashboard. A new Create is a new room, which is a new key.
   */
  const attempt = useRef<string | null>(null);
  const room = useRef<HTMLDivElement | null>(null);
  const carry = useCarry();
  const questionId = useId();
  const formId = useId();
  const errorId = useId();

  /**
   * ★ THE DOOR IS DECIDED ONCE, AT MOUNT, AND THAT IS LOAD-BEARING
   * (`limit=door`, Will: "Letting them do the work of creating a second event,
   * then finding out they can't create it on the free plan is bad user
   * experience design").
   *
   * Creating an event puts a Free host AT their cap, and a Server Action
   * refreshes the route it was called from — so the RSC refresh that follows
   * `createEventInWizard` re-renders /dashboard/new with `atCap` now TRUE. React
   * keeps this island's STATE across that refresh but hands it fresh PROPS, so
   * reading the live prop would swap the beat the host just earned for a
   * refusal. The same fact once made an at-cap `redirect` on this route bounce a
   * host away mid-create (it shipped, and live testing caught it); this is that
   * bug's second shape, and the snapshot answers both.
   */
  const [wasAtCap] = useState(() => atCap);

  // The screen just changed: play the change, then put her where the new screen begins. Never on the
  // first paint, which belongs to the name's field (`autoFocus`).
  const moved = useRef(false);
  const { land, take, settle } = carry;
  useLayoutEffect(() => {
    land(room.current);
  }, [step, land]);
  useEffect(() => {
    if (!moved.current) return;
    if (step === "name") {
      room.current
        ?.querySelector<HTMLInputElement>("[data-room-name-input]")
        ?.focus({ preventScroll: true });
    } else if (step !== "beat") {
      document.getElementById(questionId)?.focus({ preventScroll: true });
    }
  }, [step, questionId]);
  // The beat's question takes focus once it is true, not while the code develops. A held failure leaves focus
  // where it is: the foot's key she pressed is the same key, now Try again (a working key keeps its focus).
  useEffect(() => {
    if (created) {
      document.getElementById(questionId)?.focus({ preventScroll: true });
    }
  }, [created, questionId]);

  const trimmed = name.trim();
  const sampleUrl = previewJoinUrl(siteUrl);
  const steps = add.style === "disposable" ? DISPOSABLE_STEPS : STEPS;
  // Where a Disposable's time is answered: its own screen, while it is picked.
  const timeStep: Step = add.style === "disposable" ? "develop" : "add";

  function goTo(next: Step) {
    if (next === step) return;
    take(room.current, steps.indexOf(next) > steps.indexOf(step) ? 1 : -1);
    moved.current = true;
    setStep(next);
  }

  function refuseName(message: string) {
    setNameError(message);
    room.current
      ?.querySelector<HTMLInputElement>("[data-room-name-input]")
      ?.focus();
  }

  function onContinue() {
    const parsed = createEventSchema.shape.name.safeParse(name);
    if (!parsed.success) {
      refuseName(parsed.error.issues[0]?.message ?? "Give your event a name.");
      return;
    }
    setNameError(null);
    goTo("add");
  }

  function onDevelop() {
    // A Disposable's develop time is judged here, once she has finished it: it says why under its row and stays.
    if (!add.confirm()) return;
    goTo("look");
  }

  function onCreate() {
    if (creating.current) return;
    // A time she picked may have passed while she stood on a later screen: back to its row, with the words under it.
    if (!add.confirm()) {
      goTo(timeStep);
      return;
    }
    const parsed = createEventSchema.safeParse({
      name,
      qr_style: look,
      ...add.fields(),
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      // Nothing of hers is wrong but what that screen holds: its own words stand there already.
      const at = issue
        ? (FIELD_SCREENS[String(issue.path[0])] ?? "add")
        : "name";
      goTo(at === "develop" ? timeStep : at);
      if (at === "name") setNameError(issue?.message ?? null);
      return;
    }
    const values = parsed.data;
    creating.current = true;
    // Made once, here, after her answers have passed: a press the schema refused made no key.
    const key = (attempt.current ??= crypto.randomUUID());
    setHeld(null);
    setLeft(readiness(newEventFacts(values, storagePct)));
    if (step !== "beat") {
      // The beat lands at once, the sample developing while the event is made: the change into it is the
      // code's own arrival, never a carry. A held failure's Try again is already on it.
      settle();
      moved.current = true;
      setStep("beat");
    }
    startTransition(async () => {
      // ★ A DROPPED CONNECTION REJECTS THE ACTION RATHER THAN ANSWERING IT, and the beat must never
      // develop for ever over a promise that failed: no answer at all is held as the failure it is.
      const result = await create(values, key).then(
        (answer) => answer,
        () => null,
      );
      creating.current = false;
      if (result?.ok) {
        // Her dashboard's lit stage ignites its lamp once, the first time it draws this event (`just-made.ts`).
        rememberJustMade(result.event.id);
        setCreated(result.event);
        return;
      }
      // Nothing was made: the beat holds, her name, style and look as she left them, and says so.
      setHeld(heldFailure(result, { planName, maxEvents }));
    });
  }

  const pricing = (
    <PricingSheet
      open={pricingOpen}
      onOpenChange={setPricingOpen}
      trigger={{ kind: "room" }}
      plan={{ tier, hasBilling: false }}
      returnTo="/dashboard"
    />
  );

  // THE DOOR, before the room opens — and never after a creation in this session.
  if (wasAtCap && !created) {
    return (
      <>
        {pricing}
        <CapDoor
          planName={planName}
          maxEvents={maxEvents}
          events={cappedEvents}
          onUpgrade={() => setPricingOpen(true)}
        />
      </>
    );
  }

  const at = steps.indexOf(step) + 1;
  // The name titles the room from the second screen until the event exists (and over a held failure, whose
  // question does not name her event); Back and the hairlines are the way back.
  const titled = step === "add" || step === "develop" || step === "look";
  const onBeat = step === "beat";
  const arrived = onBeat && created !== null;
  const heldNow = onBeat && !arrived ? held : null;
  const eventName = created?.name ?? trimmed;
  const realUrl = created ? eventUrl(siteUrl, created.qr_token) : null;

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
          onSubmit={onContinue}
        />
      </RoomPage>
    );
    foot = (
      <Button type="submit" form={formId} size="cta" className={footButton}>
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
        <AddStep choice={add} played={nightPlayed} onPlayed={onNightPlayed} />
      </RoomPage>
    );
    // A Disposable goes on to its own screen, where its time is judged; Live and Review have nothing to judge.
    foot = (
      <Button
        type="button"
        size="cta"
        onClick={() => goTo(add.style === "disposable" ? "develop" : "look")}
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
        onClick={onDevelop}
        className={footButton}
      >
        Continue
      </Button>
    );
  } else if (step === "look") {
    page = (
      <RoomPage
        key="look"
        question="Pick the code's look"
        questionId={questionId}
        sub="Change it any time from Share"
      >
        <LookStep
          look={look}
          onLook={setLook}
          name={trimmed}
          siteUrl={siteUrl}
          joinUrl={sampleUrl}
        />
      </RoomPage>
    );
    foot = (
      <Button
        type="button"
        size="cta"
        onClick={onCreate}
        className={footButton}
      >
        Create event
      </Button>
    );
  } else {
    page = (
      <RoomPage
        key="beat"
        question={heldNow ? HELD_QUESTION : `${eventName} is live`}
        questionId={questionId}
        questionHidden={!arrived && !heldNow}
      >
        <div
          data-beat={arrived ? "arrived" : heldNow ? "failed" : "developing"}
          className="flex w-full flex-col items-center"
        >
          <BeatCode
            look={look}
            name={eventName}
            sampleUrl={sampleUrl}
            realUrl={realUrl}
          />
          {/* ★ WHAT STANDS UNDER THE CODE SHARES ONE CELL, so the code never moves between the wait, a held
              failure and the arrival: the doors and the close keep their place unseen and out of reach until
              the event exists, and a failure's words stand in that same place while it is held. */}
          <div className="cr-beat-under mt-9 w-full md:mt-11">
            <div
              aria-hidden={arrived ? undefined : true}
              inert={!arrived}
              className="cr-beat-below flex w-full flex-col items-center gap-7 md:gap-9"
            >
              <BeatActs
                eventId={created?.id ?? ""}
                eventName={eventName}
                joinUrl={realUrl ?? sampleUrl}
              />
              {left ? (
                <BeatClose r={left} onPlans={() => setPricingOpen(true)} />
              ) : null}
            </div>
            {heldNow ? (
              <p
                data-beat-held=""
                className="cr-beat-held mx-auto max-w-[19rem] text-center text-working text-pretty text-muted-foreground"
              >
                {heldNow.line}
              </p>
            ) : null}
          </div>
        </div>
      </RoomPage>
    );
    // ★ WORKING = WORDS (identity r5): while the event is made the foot is the key it becomes, working
    // ("Creating your event", with the arc), and it turns to Get it ready in place when the event exists,
    // holding the wider of its faces throughout, so nothing in the foot moves. A held failure turns the same
    // key into its way out, so the focus a press left on it is already on Try again (or Upgrade at the limit).
    const upgrade = heldNow?.way === "upgrade";
    foot = (
      <Button
        type="button"
        size="cta"
        onClick={
          heldNow
            ? upgrade
              ? () => setPricingOpen(true)
              : onCreate
            : () => {
                if (created) router.push(settingsPageHref(created.id, "door"));
              }
        }
        working={!arrived && !heldNow}
        workingLabel="Creating your event"
        className={cn(footButton, arrived && "cr-beat-go")}
        {...(heldNow
          ? upgrade
            ? trackAttrs("cta_click", {
                cta: "upgrade",
                location: "create-held",
              })
            : {}
          : trackAttrs("cta_click", {
              cta: "get-it-ready",
              location: "create-beat",
            }))}
      >
        {heldNow ? (upgrade ? "Upgrade" : "Try again") : "Get it ready"}
      </Button>
    );
  }

  return (
    <>
      {pricing}
      <RoomGround
        onRoom={(el) => {
          room.current = el;
        }}
        screen={step}
        light={onBeat ? "low" : "floor"}
        busy={onBeat && !arrived && !heldNow}
      >
        <RoomHead
          step={{ at, of: steps.length }}
          name={titled || heldNow ? trimmed : undefined}
          onBack={
            titled
              ? () => goTo(steps[steps.indexOf(step) - 1] ?? "name")
              : heldNow
                ? // Back is there for a change: the look, everything she chose as she left it.
                  () => goTo("look")
                : undefined
          }
          onStep={titled ? (n) => goTo(steps[n - 1] ?? "name") : undefined}
          onName={titled ? () => goTo("name") : undefined}
          close={
            arrived
              ? { href: `/dashboard/${created.id}`, label: "Go to your event" }
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
            ? arrived
              ? `${eventName} is live`
              : heldNow
                ? `${HELD_QUESTION}. ${heldNow.line}`
                : `Creating ${trimmed}…`
            : ""}
        </span>
      </RoomGround>
    </>
  );
}
