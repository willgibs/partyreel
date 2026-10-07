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
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

import {
  createEventInWizard,
  type CreatedEvent,
} from "@/app/(app)/dashboard/actions";
import {
  openAlbumCardPath,
  openAlbumWords,
} from "@/app/(guest)/e/[token]/card/words";
import {
  DEFAULT_QR_PRESET,
  QR_PRESETS,
  type QrStyleKey,
} from "@/lib/constants/qr-presets";
import { type Tier, videosAllowedForTier } from "@/lib/constants/tiers";
import { STYLE_NAMES } from "@/lib/disposable/album-style";
import {
  newEventFacts,
  type Readiness,
  readiness,
} from "@/lib/events/readiness";
import { eventUrl, previewJoinUrl } from "@/lib/events/share-urls";
import { privateEventCardPath } from "@/lib/guest/event-card";
import { createEventSchema } from "@/lib/validation/event";
import { trackAttrs } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PricingSheet } from "@/components/app/pricing/pricing-sheet";

import { AddStep, useAddChoice } from "./create-event-wizard/add-step";
import {
  BeatActs,
  BeatCode,
  BeatLink,
  BeatRoom,
} from "./create-event-wizard/beat";
import { CapDoor, type CappedEvent } from "./create-event-wizard/cap-door";
import { useCarry } from "./create-event-wizard/carry";
import {
  DEVELOP_QUESTION,
  DEVELOP_SUB,
  DevelopStep,
} from "./create-event-wizard/develop-step";
import { enterEvent } from "./create-event-wizard/entry";
import {
  type Held,
  HELD_QUESTION,
  heldFailure,
} from "./create-event-wizard/held";
import { rememberJustMade } from "./create-event-wizard/just-made";
import { type CreateLike, forgetLike } from "./create-event-wizard/like";
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

export type { CappedEvent, CreateLike };

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

/**
 * ★ AN ALBUM'S STYLE, CARRIED, ANSWERS ITS TWO STYLE SCREENS (after-party r1's `bridge=end`): the style and the look are
 * the album's, so Create asks only her name, then makes it; a Disposable keeps its own screen, since its develop time is
 * her party's and never the album's. Change puts the two screens back, the album's answers picked on them.
 */
const CARRIED: readonly Step[] = ["add", "look"];

/** Where a field the create refused is answered, so a refusal sends her to the screen that holds it. */
const FIELD_SCREENS: Partial<Record<string, Step>> = {
  name: "name",
  qr_style: "look",
  develops_at: "develop",
  roll_size: "develop",
};

/** The beat's one line, under its question once the event exists: the share, said as an invitation (r5's `enter`). */
export const BEAT_SUB = "Share it, and guests can start adding photos";

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
   * An album's style Create opens in (`?like=`, the guest's Make one like this): read by the route, through the
   * album's door, as the style alone (`like.ts`). Null opens Create as it always does.
   */
  like?: CreateLike | null;
  /**
   * The Server Action that makes the event: the route's own. A specimen hands a stand-in that answers
   * after a real round trip's wait and makes nothing (the review room's Library precedent), so Create can
   * be drawn whole, its beat included, with no row written.
   */
  create?: typeof createEventInWizard;
};

/**
 * THE CREATE FLOW, AS A ROOM OF ITS OWN (create-wizard r1 to r5, Will 2026-10-02 to 07, over the
 * `first-event` board's verdicts of 2026-09-21).
 *
 * What his picks made of it, each in its own file beside this one:
 *
 *  ★ `shape=screen`, in his layout (`room.tsx`): the whole screen, dark, the subtle steppers on top, the
 *    question just under them in one place, the answer in the centre, one button at the foot. ★ Unlit until her
 *    code (signature r1's `create=dark`): the room's first light is the code's, in the event's seed.
 *  ★ `flow=carry` (`carry.ts`): each answer rises into the head, above hairlines that press back; the
 *    name she typed titles the room from then on, and the head is the way back.
 *  ★ `add=styles` (`add-step.tsx`, r3), `styles=focused` (r4) and `previews=one` (r5): the album's style, between the
 *    name and the look: Live, Review and Disposable as three cards resting on the moment they differ, the picked one
 *    playing its story once (`style-story.ts`); picking Disposable adds its own screen after it, when the photos
 *    develop and the roll (`develop-step.tsx`). The event is born with the style's three columns in the one insert
 *    (`createFieldsOf`), so Create and Settings say and write one thing.
 *  ★ `look=places` (`look-step.tsx`): her code where guests meet it, her phone and the room's screen,
 *    four swatches re-dressing both (`qr-preset-picker.tsx`).
 *  ★ `beat=develop` (`beat.tsx`) and `wait=breath` (r4, as built): the sample develops into her code where it
 *    stands while Create runs.
 *  ★ `close=enter` (r5): the beat is the payoff of a made event (PRD's core loop: Create finishes the event), its line
 *    under the question the share said as an invitation, her link as guests will receive it and Print and Share under
 *    her code, and one press, Go to your event, that opens the room into her event, her code flying to its place there
 *    (`entry.ts`). The head's close steps aside once the event exists: the foot is the one way on.
 *  ★ `failed=held` (r4, `held.ts`): a failed Create holds the beat she is watching, says nothing was lost and the
 *    way to put it right, and the foot becomes that way (Try again, or Upgrade at the plan's limit), with Back for
 *    a change. A toast never carries a failure here.
 *  ★ `bridge=end` (after-party r1, `like.ts`): from a guest's Make one like this, Create opens in that album's style,
 *    its two style screens answered, and asks only her name.
 *
 * And the verdicts it keeps: `asks=one` (the name alone), `style=step` (the look a step of its own, on
 * samples), `landing=beat` (Create ends on ONE screen, once in an event's life, by construction: only
 * Create event reaches it) and `limit=door` (`cap-door.tsx`: the refusal before the work).
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
  like = null,
  create = createEventInWizard,
}: CreateEventWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [look, setLook] = useState<QrStyleKey>(like?.look ?? DEFAULT_QR_PRESET);
  // The album's style, its develop time and its roll: held here so a Back and a Continue never lose them. A like opens
  // on the album's own style and roll.
  const add = useAddChoice(
    like ? { style: like.style, roll: like.roll } : undefined,
  );
  // The album's two style screens stand answered while a like is carried, until she asks to change them.
  const [carried, setCarried] = useState(like !== null);
  // The picked card's story plays once in a Create, as the add step first opens.
  const [storyPlayed, setStoryPlayed] = useState(false);
  const onStoryPlayed = useCallback(() => setStoryPlayed(true), []);
  const [created, setCreated] = useState<CreatedEvent | null>(null);
  // A Create that made nothing, held on the beat with its words and its way out until she tries again or goes back.
  const [held, setHeld] = useState<Held | null>(null);
  // What is left on the new event, read from what Create sent (the schema's defaults filled) and the
  // account's storage, known the moment Create is pressed.
  const [left, setLeft] = useState<Readiness | null>(null);
  // Whether the new event was born taking photos where a guest can see them: the card its link unfurls as.
  const [born, setBorn] = useState<{ open: boolean; adding: boolean } | null>(
    null,
  );
  // The plans' sheet, opened by the cap door's See Pro, the beat's room line and a held limit's Upgrade
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

  // The like rode a cookie through her sign-up (`like.ts`): Create has opened in its style, so it is put down.
  useEffect(() => {
    if (like) forgetLike();
  }, [like]);

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
  const full = add.style === "disposable" ? DISPOSABLE_STEPS : STEPS;
  const steps = carried ? full.filter((s) => !CARRIED.includes(s)) : full;
  // Where a Disposable's time is answered: its own screen, while it is picked.
  const timeStep: Step = add.style === "disposable" ? "develop" : "add";
  const nextOf = (from: Step): Step => steps[steps.indexOf(from) + 1] ?? "beat";
  const prevOf = (from: Step): Step => steps[steps.indexOf(from) - 1] ?? "name";

  function goTo(next: Step) {
    if (next === step) return;
    // A screen the carried style answered is asked again the moment she is sent to it.
    if (!steps.includes(next)) setCarried(false);
    const order = steps.includes(next) ? steps : full;
    take(room.current, order.indexOf(next) > order.indexOf(step) ? 1 : -1);
    moved.current = true;
    setStep(next);
  }

  function refuseName(message: string) {
    setNameError(message);
    room.current
      ?.querySelector<HTMLInputElement>("[data-room-name-input]")
      ?.focus();
  }

  /** On from a screen: to the next one, or, where the next is the beat, Create event itself. */
  function onwards(from: Step) {
    const next = nextOf(from);
    if (next === "beat") onCreate();
    else goTo(next);
  }

  function onContinue() {
    const parsed = createEventSchema.shape.name.safeParse(name);
    if (!parsed.success) {
      refuseName(parsed.error.issues[0]?.message ?? "Give your event a name.");
      return;
    }
    setNameError(null);
    onwards("name");
  }

  function onDevelop() {
    // A Disposable's develop time is judged here, once she has finished it: it says why under its row and stays.
    if (!add.confirm()) return;
    onwards("develop");
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
    setBorn({
      open: values.visibility === "open",
      adding: values.accepting_uploads,
    });
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

  /**
   * GO TO YOUR EVENT: the room opens into it, her code flying to its place on her cover (`entry.ts`). A modified click
   * is the browser's own, a new tab on her event, as any link's.
   */
  function goIn(e: MouseEvent<HTMLAnchorElement>) {
    if (!created) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    e.preventDefault();
    enterEvent(
      `/dashboard/${created.id}`,
      (href) => router.push(href),
      room.current?.querySelector<HTMLElement>("[data-beat-plate]") ?? null,
    );
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

  const at = Math.max(1, steps.indexOf(step) + 1);
  // The name titles the room from the second screen until the event exists (and over a held failure, whose
  // question does not name her event); Back and the hairlines are the way back.
  const titled = step === "add" || step === "develop" || step === "look";
  const onBeat = step === "beat";
  const arrived = onBeat && created !== null;
  const heldNow = onBeat && !arrived ? held : null;
  const eventName = created?.name ?? trimmed;
  const realUrl = created ? eventUrl(siteUrl, created.qr_token) : null;

  /** The foot's words on a screen before the beat: Continue, or Create event where the beat is next. */
  const onwardWords = (from: Step) =>
    nextOf(from) === "beat" ? "Create event" : "Continue";

  let page: ReactNode;
  let foot: ReactNode;
  if (step === "name") {
    page = (
      <RoomPage
        key="name"
        question="Name your event"
        questionId={questionId}
        sub={
          carried && like ? (
            <Carried like={like} onChange={() => setCarried(false)} />
          ) : undefined
        }
      >
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
        {onwardWords("name")}
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
        <AddStep choice={add} played={storyPlayed} onPlayed={onStoryPlayed} />
      </RoomPage>
    );
    // A Disposable goes on to its own screen, where its time is judged; Live and Review have nothing to judge.
    foot = (
      <Button
        type="button"
        size="cta"
        onClick={() => onwards("add")}
        className={footButton}
      >
        {onwardWords("add")}
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
        {onwardWords("develop")}
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
        {onwardWords("look")}
      </Button>
    );
  } else {
    const roomLine = left?.items.find((i) => i.id === "room") ?? null;
    page = (
      <RoomPage
        key="beat"
        question={heldNow ? HELD_QUESTION : `${eventName} is live`}
        questionId={questionId}
        questionHidden={!arrived && !heldNow}
        sub={heldNow ? undefined : BEAT_SUB}
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
            seed={created?.id}
          />
          {/* ★ WHAT STANDS UNDER THE CODE SHARES ONE CELL, so the code never moves between the wait, a held
              failure and the arrival: her link, the doors and the room line keep their place unseen and out of
              reach until the event exists, and a failure's words stand in that same place while it is held. */}
          <div className="cr-beat-under mt-3 w-full md:mt-4">
            <div
              aria-hidden={arrived ? undefined : true}
              inert={!arrived}
              className="cr-beat-below flex w-full flex-col items-center"
            >
              {created ? (
                <BeatLink
                  joinUrl={realUrl ?? sampleUrl}
                  cardSrc={
                    born?.open === false
                      ? privateEventCardPath(created.qr_token)
                      : openAlbumCardPath(
                          created.qr_token,
                          born?.adding ?? true,
                        )
                  }
                  title={
                    openAlbumWords(created.name, born?.adding ?? true).title
                  }
                />
              ) : (
                // Its place, held while the code develops, so nothing moves when it arrives.
                <span aria-hidden className="cr-link-place" />
              )}
              <div className="mt-7 flex flex-col items-center gap-5 md:mt-8">
                <BeatActs
                  eventId={created?.id ?? ""}
                  eventName={eventName}
                  joinUrl={realUrl ?? sampleUrl}
                  videos={videosAllowedForTier(tier)}
                  copyLink={false}
                />
                <BeatRoom
                  room={roomLine}
                  onPlans={() => setPricingOpen(true)}
                />
              </div>
            </div>
            {heldNow ? (
              <p
                data-beat-held=""
                className="cr-beat-held mx-auto mt-6 max-w-[19rem] text-center text-working text-pretty text-muted-foreground"
              >
                {heldNow.line}
              </p>
            ) : null}
          </div>
        </div>
      </RoomPage>
    );
    // ★ WORKING = WORDS (identity r5): while the event is made the foot is the key it becomes, working ("Creating
    // your event", with the arc). Once the event exists it is Go to your event, a link that prefetches her event in
    // full (Next's `prefetch`), so the room opens into a page already in hand (`entry.ts`). A held failure turns the
    // working key into its way out, so the focus a press left on it is already on Try again (or Upgrade at the limit).
    const upgrade = heldNow?.way === "upgrade";
    foot = arrived ? (
      <Button asChild size="cta" className={cn(footButton, "cr-beat-go")}>
        <Link
          href={`/dashboard/${created.id}`}
          prefetch
          onClick={goIn}
          data-beat-go=""
          {...trackAttrs("cta_click", {
            cta: "go-to-event",
            location: "create-beat",
          })}
        >
          Go to your event
        </Link>
      </Button>
    ) : (
      <Button
        type="button"
        size="cta"
        onClick={
          heldNow
            ? upgrade
              ? () => setPricingOpen(true)
              : onCreate
            : undefined
        }
        working={!heldNow}
        workingLabel="Creating your event"
        className={footButton}
        {...(heldNow && upgrade
          ? trackAttrs("cta_click", {
              cta: "upgrade",
              location: "create-held",
            })
          : {})}
      >
        {heldNow ? (upgrade ? "Upgrade" : "Try again") : "Go to your event"}
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
        busy={onBeat && !arrived && !heldNow}
      >
        <RoomHead
          step={{ at, of: steps.length }}
          name={titled || heldNow ? trimmed : undefined}
          onBack={
            titled
              ? () => goTo(prevOf(step))
              : heldNow
                ? // Back is there for a change: the screen before the beat, everything she chose as she left it.
                  () => goTo(prevOf("beat"))
                : undefined
          }
          onStep={titled ? (n) => goTo(steps[n - 1] ?? "name") : undefined}
          onName={titled ? () => goTo("name") : undefined}
          close={
            arrived
              ? // The carried `close-x`: where the foot is the way into her event, the head offers no second way.
                {
                  href: `/dashboard/${created.id}`,
                  label: "Go to your event",
                  gone: true,
                }
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

/**
 * WHAT CREATE CARRIED FROM THE ALBUM, under the name's question (after-party r1's `bridge=end`, as the board drew it):
 * a tick for answered, the album's style and its code's look by the names Create's own screens give them, and Change,
 * which puts the two screens back with the album's answers picked on them.
 */
function Carried({
  like,
  onChange,
}: {
  like: CreateLike;
  onChange: () => void;
}) {
  return (
    <span data-room-carried="" className="cr-carried text-sm">
      <Check aria-hidden className="cr-carried-tick" />
      <span data-room-carried-words="">
        {STYLE_NAMES[like.style]} · {QR_PRESETS[like.look].label} code
      </span>
      <button
        type="button"
        onClick={onChange}
        className="cr-carried-change focus-halo rounded-sm outline-none"
      >
        Change
      </button>
    </span>
  );
}
