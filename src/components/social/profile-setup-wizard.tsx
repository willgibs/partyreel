"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

import { updateDisplayNameAction } from "@/app/(app)/account/actions";
import {
  finishProfileSetupAction,
  type FinishSetupResult,
  type SetupEventsChoice,
} from "@/app/(app)/account/profile/actions";
import { PAGE_CHOICES_PATH } from "@/app/(app)/account/profile/invite";
import { AccountAvatarForm } from "@/components/app/account-avatar-form";
import { AttendedEventTiles } from "@/components/social/attended-events-visibility";
import {
  HandleField,
  HandleStatusLine,
  useHandleStatus,
} from "@/components/social/handle-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { AttendedEventPick } from "@/lib/db/queries/social";
import {
  DISPLAY_NAME_GUIDANCE,
  DISPLAY_NAME_MAX_LENGTH,
} from "@/lib/validation/profile";
import { cn } from "@/lib/utils";

const STEP_LABELS = ["Handle", "You", "Events"] as const;
type Step = 1 | 2 | 3;

const STEP_COPY: Record<Step, { title: string; description: string }> = {
  1: {
    title: "Claim your page",
    description: "This is your address on Partyreel.",
  },
  2: { title: "You", description: "How you'll show up on it." },
  3: {
    title: "Choose what shows",
    description: "Nothing shows on your page until you choose it.",
  },
};

/**
 * THE PAGE SETUP (`identity-profile` r1, `setup=wizard`, and Will's note: "Their first profile
 * setup should be a guided wizard to provide all helpful context. Then, follow-up edits can feel
 * more like account settings for quick direct edits."). Three screens, one at a time, the way the
 * event wizard (`/dashboard/new`) works: the handle; then name and photo; then which events show.
 * It is the FIRST time only: once a page exists its route sends her to Account's card, where every
 * later edit is direct.
 *
 * ★ NOTHING IS PUBLIC UNTIL FINISH, AND FINISH CLAIMS THE HANDLE LAST. The handle is the consent act
 * that makes the page exist, so screen one only checks it; Finish writes her choices and then claims
 * it (`finishProfileSetupAction`), and an abandoned setup leaves no page behind. The name and photo
 * on screen two are her ACCOUNT's (they credit her wherever she uploads), so they save as she makes
 * them, exactly as Account's own forms do.
 *
 * ★ THE ONE-TIME CHOICE (`default=off`, with his note: "a one-time selection ... to select and show
 * all/hide all initially, then direct handling of events under profile from there"). Screen three
 * opens on every event private (the default, off every time), with Show all and Keep all private
 * above the covers and a tap on any cover choosing one by one. The pair lives here alone: Account's
 * picker is the direct handling that follows, one cover at a time. Show all is sent as a MODE, so
 * Finish applies it to the events she has at that moment; events she adds photos to later still
 * start private.
 */
export function ProfileSetupWizard({
  siteUrl,
  suggestedHandle,
  displayName,
  email,
  avatarUrl,
  seed,
  events,
  hostsEvents,
}: {
  siteUrl: string;
  /** Her display name as a free handle, or "" (handle-suggestion.ts). */
  suggestedHandle: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  /** `seedFor(profile.id)`, computed server-side. */
  seed: string;
  events: AttendedEventPick[];
  /** She hosts events of her own: screen three says where their switch lives. */
  hostsEvents: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [handle, setHandle] = useState(suggestedHandle);
  const { status, markTaken } = useHandleStatus(handle, null);
  const [name, setName] = useState(displayName);
  const [savedName, setSavedName] = useState(displayName);
  const [picks, setPicks] = useState<Set<string>>(
    () => new Set(events.filter((e) => e.shownOnProfile).map((e) => e.id)),
  );
  const [savingName, startSaveName] = useTransition();
  const [finishing, startFinish] = useTransition();

  const host = siteUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const copy = STEP_COPY[step];

  // ★ A NEW SCREEN MOVES FOCUS TO ITS TITLE, so a screen reader hears where it is and a keyboard
  // starts from the top; screen one's field takes focus itself. Skipped on the first paint, which
  // belongs to the field.
  const titleRef = useRef<HTMLDivElement>(null);
  const firstPaint = useRef(true);
  useEffect(() => {
    if (firstPaint.current) {
      firstPaint.current = false;
      return;
    }
    if (step !== 1) titleRef.current?.focus();
  }, [step]);

  const everyId = events.map((e) => e.id);
  const mode: SetupEventsChoice["mode"] =
    picks.size === 0
      ? "none"
      : everyId.every((id) => picks.has(id))
        ? "all"
        : "chosen";

  function togglePick(id: string, show: boolean) {
    setPicks((current) => {
      const next = new Set(current);
      if (show) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function continueFromName() {
    const trimmed = name.trim();
    if (trimmed === savedName.trim()) {
      setStep(3);
      return;
    }
    startSaveName(async () => {
      const result = await updateDisplayNameAction(trimmed).catch(() => ({
        ok: false as const,
        message: "Couldn't save your name. Please try again.",
      }));
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setSavedName(trimmed);
      router.refresh(); // the account menu's name reads it too
      setStep(3);
    });
  }

  function finish() {
    const choice: SetupEventsChoice =
      mode === "chosen" ? { mode, eventIds: [...picks] } : { mode };
    startFinish(async () => {
      // A dropped connection answers like any refusal: her choices stay on screen to try again.
      const result = await finishProfileSetupAction({
        slug: handle,
        events: choice,
      }).catch(
        (): FinishSetupResult => ({
          ok: false,
          step: "events",
          message: "Couldn't finish just now. Please try again.",
        }),
      );
      if (result.ok) {
        toast.success("Your page is live.");
        router.push(`/u/${result.slug}`);
        return;
      }
      if (result.step === "done") {
        toast.info(result.message);
        router.push(PAGE_CHOICES_PATH);
        return;
      }
      if (result.step === "handle") {
        if (result.taken) markTaken(handle.trim().toLowerCase());
        setStep(1);
        toast.error("Couldn't claim that handle.", {
          description: result.message,
        });
        return;
      }
      toast.error(result.message);
    });
  }

  const handleReady = status.kind === "available";

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle ref={titleRef} tabIndex={-1} className="outline-none">
          {copy.title}
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
        {/* The event wizard's own indicator, quoted: the step it is, the steps done, what is left. */}
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-xs">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <li
                key={label}
                className="flex items-center gap-2"
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex size-5 items-center justify-center rounded-full text-micro font-medium",
                    active
                      ? "bg-brand text-brand-foreground"
                      : done
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3" /> : n}
                </span>
                <span
                  className={cn(
                    active
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
                {n < STEP_LABELS.length && (
                  <ArrowRight className="size-3 text-muted-foreground" />
                )}
              </li>
            );
          })}
        </ol>
      </CardHeader>

      {step === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (handleReady) setStep(2);
          }}
          className="contents"
        >
          <CardContent className="space-y-2">
            <Label htmlFor="setup-handle">Profile handle</Label>
            <HandleField
              id="setup-handle"
              value={handle}
              onChange={setHandle}
              status={status}
              autoFocus
            />
            <HandleStatusLine
              id="setup-handle-status"
              status={status}
              host={host}
              idleHint="Lowercase letters, numbers, and hyphens. You can change it later."
            />
          </CardContent>
          <CardFooter className="justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/account")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!handleReady}>
              Continue <ArrowRight />
            </Button>
          </CardFooter>
        </form>
      )}

      {step === 2 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            continueFromName();
          }}
          className="contents"
        >
          <CardContent className="space-y-6">
            <AccountAvatarForm
              avatarUrl={avatarUrl}
              displayName={savedName}
              email={email}
              seed={seed}
            />
            <div className="space-y-1.5">
              <Label htmlFor="setup-name">Display name</Label>
              <Input
                id="setup-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={DISPLAY_NAME_MAX_LENGTH}
                autoComplete="name"
              />
              <p className="text-xs text-muted-foreground">
                {DISPLAY_NAME_GUIDANCE}
              </p>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>
              <ArrowLeft /> Back
            </Button>
            <Button type="submit" disabled={savingName || !name.trim()}>
              {savingName ? "Saving…" : "Continue"}
              {!savingName && <ArrowRight />}
            </Button>
          </CardFooter>
        </form>
      )}

      {step === 3 && (
        <>
          <CardContent className="space-y-4">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Events you add photos to will be here to choose from. Each one
                starts private.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  {/* THE ONE-TIME CHOICE, drawn as the state it leaves: "Keep all private" stands
                      pressed while nothing is chosen (the default), "Show all" once everything is,
                      neither while she chooses one by one. */}
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    size="sm"
                    value={mode === "chosen" ? "" : mode}
                    onValueChange={(value) => {
                      if (value === "all") setPicks(new Set(everyId));
                      else if (value === "none") setPicks(new Set());
                      // A press on the item already pressed says nothing new.
                    }}
                    aria-label="Show your events on your page"
                  >
                    <ToggleGroupItem value="all">
                      Show all {events.length}
                    </ToggleGroupItem>
                    <ToggleGroupItem value="none">
                      Keep all private
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <p className="text-xs text-muted-foreground">
                    Or tap a cover to choose one by one. Events you add photos
                    to later start private.
                  </p>
                </div>
                <AttendedEventTiles
                  events={events}
                  isShown={(id) => picks.has(id)}
                  onToggle={togglePick}
                  disabled={finishing}
                />
              </>
            )}
            {hostsEvents && (
              <p className="text-xs text-muted-foreground">
                Events you host show when you turn on Show on my profile in
                their settings.
              </p>
            )}
          </CardContent>
          <CardFooter className="justify-between">
            <Button
              type="button"
              variant="ghost"
              disabled={finishing}
              onClick={() => setStep(2)}
            >
              <ArrowLeft /> Back
            </Button>
            <Button type="button" disabled={finishing} onClick={finish}>
              {finishing ? "Finishing…" : "Finish"}
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
