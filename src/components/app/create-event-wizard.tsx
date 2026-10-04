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
import { toast } from "sonner";

import {
  createEventInWizard,
  type CreatedEvent,
} from "@/app/(app)/dashboard/actions";
import { DEFAULT_QR_PRESET, type QrStyleKey } from "@/lib/constants/qr-presets";
import { DEFAULT_ERROR_MESSAGE } from "@/lib/errors/codes";
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
import { BeatActs, BeatCode, BeatSteps } from "./create-event-wizard/beat";
import { CapDoor, type CappedEvent } from "./create-event-wizard/cap-door";
import { useCarry } from "./create-event-wizard/carry";
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

/**
 * CREATE'S SCREENS, IN ORDER: the name, the album's style (the add step, create-wizard r3's `add=styles`), the
 * code's look and the beat. Every hairline, Back and the carry count from this list.
 */
const STEPS = ["name", "add", "look", "beat"] as const;
type Step = (typeof STEPS)[number];

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
 * THE CREATE FLOW, AS A ROOM OF ITS OWN (create-wizard r1 and r2, Will 2026-10-02/03, over the
 * `first-event` board's verdicts of 2026-09-21).
 *
 * What his picks made of it, each in its own file beside this one:
 *
 *  ★ `shape=screen`, in his layout (`room.tsx`): the whole screen, dark, the subtle steppers on top, the
 *    question just under them in one place, the answer in the centre, one button at the foot.
 *  ★ `flow=carry` (`carry.ts`): each answer rises into the head, above hairlines that press back; the
 *    name she typed titles the room from then on, and the head is the way back.
 *  ★ `add=styles` (`add-step.tsx`, create-wizard r3, Will 2026-10-04): the album's style, between the name
 *    and the look: Live, Review and Disposable as three cards, each a small album moving through the night,
 *    the Disposable's develop time directly under its card. The event is born with the style's three columns
 *    in the one insert (`createFieldsOf`), so Create and Settings say and write one thing.
 *  ★ `look=places` (`look-step.tsx`): her code where guests meet it, her phone and the room's screen,
 *    four swatches re-dressing both (`qr-preset-picker.tsx`).
 *  ★ `beat=develop` (`beat.tsx`): the sample develops into her code where it stands while Create runs;
 *    Print and Share as rounds; Settings' steps beneath, kept minimal; Get it ready at the foot.
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
  // The album's style and its develop time: held here so a Back and a Continue never lose them.
  const add = useAddChoice();
  // The add step's night plays once in a Create, as the step first opens.
  const [nightPlayed, setNightPlayed] = useState(false);
  const onNightPlayed = useCallback(() => setNightPlayed(true), []);
  const [created, setCreated] = useState<CreatedEvent | null>(null);
  // What is left on the new event, read from what Create sent (the schema's defaults filled) and the
  // account's storage, known the moment Create is pressed.
  const [left, setLeft] = useState<Readiness | null>(null);
  // The cap refusal's Upgrade and room's See plans open the sheet here (`first=trigger`), knowing the
  // host ran out of room; a toast's action has no element to hang a trigger on, so this one is controlled.
  const [pricingOpen, setPricingOpen] = useState(false);
  const [, startTransition] = useTransition();
  const creating = useRef(false);
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
    } else if (step === "add" || step === "look") {
      document.getElementById(questionId)?.focus({ preventScroll: true });
    }
  }, [step, questionId]);
  // The beat's question takes focus once it is true, not while the code develops.
  useEffect(() => {
    if (created) {
      document.getElementById(questionId)?.focus({ preventScroll: true });
    }
  }, [created, questionId]);

  const trimmed = name.trim();
  const sampleUrl = previewJoinUrl(siteUrl);

  function goTo(next: Step) {
    if (next === step) return;
    take(room.current, STEPS.indexOf(next) > STEPS.indexOf(step) ? 1 : -1);
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

  function onAdd() {
    // A Disposable's develop time is judged here, once she has finished it: it says why under its row and stays.
    if (!add.confirm()) return;
    goTo("look");
  }

  function onCreate() {
    if (creating.current) return;
    // A time she picked may have passed while she stood on the look: back to it, with the words under its row.
    if (!add.confirm()) {
      goTo("add");
      return;
    }
    const parsed = createEventSchema.safeParse({
      name,
      qr_style: look,
      ...add.fields(),
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      if (issue?.path[0] === "name" || !issue) {
        goTo("name");
        setNameError(issue?.message ?? null);
      } else {
        // Nothing of hers is wrong but what the add step holds: its own words stand there already.
        goTo("add");
      }
      return;
    }
    const values = parsed.data;
    creating.current = true;
    // The beat lands at once, the sample developing while the event is made: the change into it is the
    // code's own arrival, never a carry.
    settle();
    moved.current = true;
    setLeft(readiness(newEventFacts(values, storagePct)));
    setStep("beat");
    startTransition(async () => {
      // ★ A DROPPED CONNECTION REJECTS THE ACTION RATHER THAN ANSWERING IT, and the beat must never
      // develop for ever over a promise that failed: a throw reads as the failure it is.
      const result = await create(values).catch(
        (): Awaited<ReturnType<typeof create>> => ({
          ok: false,
          code: "unknown",
          message: DEFAULT_ERROR_MESSAGE,
        }),
      );
      creating.current = false;
      if (result.ok) {
        setCreated(result.event);
        return;
      }
      // Nothing was made: back to the look, her name and her look as she left them.
      setStep("look");
      if (result.code === "limit_reached") {
        // The server's enforce_event_limit stays the guard BEHIND the door: a
        // second tab, a slot spent elsewhere, a page left open for an hour.
        toast.error(`Event limit reached on the ${planName} plan.`, {
          description: "Delete an event or upgrade to add more.",
          action: { label: "Upgrade", onClick: () => setPricingOpen(true) },
        });
        router.push("/dashboard");
        return;
      }
      toast.error("Couldn't create the event.", {
        description: result.message,
      });
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

  const at = STEPS.indexOf(step) + 1;
  // The name titles the room from the second screen until the event exists; Back and the hairlines are the way back.
  const titled = step === "add" || step === "look";
  const onBeat = step === "beat";
  const arrived = onBeat && created !== null;
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
    foot = (
      <Button type="button" size="cta" onClick={onAdd} className={footButton}>
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
        question={`${eventName} is live`}
        questionId={questionId}
        questionHidden={!arrived}
      >
        <div
          data-beat={arrived ? "arrived" : "developing"}
          className="flex w-full flex-col items-center"
        >
          <BeatCode
            look={look}
            name={eventName}
            sampleUrl={sampleUrl}
            realUrl={realUrl}
          />
          {/* Held, unseen and out of reach, until the event exists: its place kept, so the code never
              moves when the doors and the steps arrive under it. */}
          <div
            aria-hidden={arrived ? undefined : true}
            inert={!arrived}
            className="cr-beat-below mt-9 flex w-full flex-col items-center gap-7 md:mt-11 md:gap-9"
          >
            <BeatActs
              eventId={created?.id ?? ""}
              eventName={eventName}
              joinUrl={realUrl ?? sampleUrl}
            />
            {left ? (
              <BeatSteps r={left} onPlans={() => setPricingOpen(true)} />
            ) : null}
          </div>
        </div>
      </RoomPage>
    );
    foot = arrived ? (
      <Button
        type="button"
        size="cta"
        onClick={() => router.push(settingsPageHref(created.id, "door"))}
        className={cn(footButton, "cr-beat-go")}
        {...trackAttrs("cta_click", {
          cta: "get-it-ready",
          location: "create-beat",
        })}
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
    <>
      {pricing}
      <RoomGround
        onRoom={(el) => {
          room.current = el;
        }}
        screen={step}
        light={onBeat ? "low" : "floor"}
        busy={onBeat && !arrived}
      >
        <RoomHead
          step={{ at, of: STEPS.length }}
          name={titled ? trimmed : undefined}
          onBack={
            titled
              ? () => goTo(STEPS[STEPS.indexOf(step) - 1] ?? "name")
              : undefined
          }
          onStep={titled ? (n) => goTo(STEPS[n - 1]) : undefined}
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
              : `Creating ${trimmed}…`
            : ""}
        </span>
      </RoomGround>
    </>
  );
}
