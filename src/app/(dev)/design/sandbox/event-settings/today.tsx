"use client";

import { type ReactNode } from "react";
import { Clapperboard, ShieldCheck, Trash2, Users } from "lucide-react";

import { VisibilitySelector } from "@/components/app/visibility-selector";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { guestExperienceSummary } from "@/lib/events/guest-experience-summary";
import { VISIBILITY_HINTS } from "@/lib/events/visibility-labels";
import { UPLOAD_CAP_PRESETS } from "@/lib/media/limits";
import { cn } from "@/lib/utils";

import { AccessBody } from "./bodies";
import { EVENT } from "./fixtures";
import { type Model, photoFirstLive } from "./model";
import { HoldSteps, LockChipQuote, Looks, SelectQuote } from "./parts";
import { ScrollHere } from "./scene";

/**
 * TODAY'S SEVEN CARDS, AS THEY SHIP, THE STRUCTURE QUESTION'S REFERENCE
 * (`event-settings-sheet.tsx` over `EventSettingsForm`): Details, Visibility &
 * access and Guest uploads behind the form's one Save, then the Highlight
 * reel, Profile & guests and the Danger zone, each saving itself. Every card
 * is in its own order with its own words, redrawn from the same primitives
 * (`Card`, `Switch`, the shipped `VisibilitySelector` itself, the summary line
 * from `guestExperienceSummary`): the real form needs a `FormProvider`, Server
 * Functions and `ConfirmSwitch`'s dialog, which would open on the lab page.
 *
 * ★ HIS ANSWERS WORN, NOTHING ELSE CHANGED: the guest list's switch is gone
 * from Profile & guests (`room=always`, `safety-wiring`), and the password is
 * free, so the Password segment carries no lock (`pricing-wiring`). Videos
 * keep their lock chip on Free, which is today's.
 *
 * ★ WHERE A STAGED ASK IS DRAWN IN TODAY'S STRUCTURE (he picked it), who can
 * get in stands in Visibility & access in the form the `join` ask offers, as
 * event-safety drew it; `asBuilt` is the structure question's own tile, with
 * no join modes at all, because today has none.
 */

/** A form row's label, quoted (`FormLabel`: the `Label` primitive's classes). */
function FormLabelQuote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-sm leading-none font-medium select-none">
      {children}
    </p>
  );
}

/** `FormDescription`, quoted. */
function Desc({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

/** A switch row as the form lays one out (`FormItem` over `Switch`), still. */
function PlainSwitch({
  label,
  desc,
  checked,
  reach = false,
}: {
  label: string;
  desc: string;
  checked: boolean;
  reach?: boolean;
}) {
  return (
    <div
      data-set-setting=""
      className="flex items-center justify-between gap-4"
    >
      <div className="space-y-0.5">
        <FormLabelQuote>{label}</FormLabelQuote>
        <Desc>{desc}</Desc>
      </div>
      <span data-set-reach={reach ? "" : undefined} className="flex shrink-0">
        <Switch checked={checked} tabIndex={-1} />
      </span>
    </div>
  );
}

/** `ConfirmSwitch`'s row, quoted: its shield after the label, its dialog never mounted. */
function GuardedSwitch({
  label,
  desc,
  checked,
  after,
  idle = false,
}: {
  label: string;
  desc: string;
  checked: boolean;
  after?: ReactNode;
  idle?: boolean;
}) {
  return (
    <div
      data-set-setting=""
      data-set-idle={idle ? "" : undefined}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <FormLabelQuote>
            {label}
            <ShieldCheck
              aria-hidden
              className="size-3.5 text-muted-foreground"
            />
          </FormLabelQuote>
          <Desc>{desc}</Desc>
        </div>
        <Switch checked={checked} tabIndex={-1} />
      </div>
      {after}
    </div>
  );
}

/** A card the form holds, in its own head. */
function FormCard({
  title,
  description,
  children,
  className,
  Icon,
  group,
}: {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  Icon?: typeof Clapperboard;
  /** What the frames' `holds` counts (`data-set-group`). */
  group?: string;
}) {
  return (
    <Card className={className} data-set-group={group}>
      <CardHeader>
        <CardTitle>
          {Icon ? (
            <span className="flex items-center gap-2">
              <Icon className="size-4 text-muted-foreground" aria-hidden />
              {title}
            </span>
          ) : (
            title
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** The instant cards' own row (`highlight-reel-card.tsx`, `profile-social-card.tsx`). */
function InstantSwitch({
  label,
  desc,
  checked,
  first = false,
}: {
  label: string;
  desc: string;
  checked: boolean;
  first?: boolean;
}) {
  return (
    <div
      data-set-setting=""
      className={cn(
        "flex items-start justify-between gap-4",
        !first && "border-t border-border/60 pt-5",
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs leading-relaxed text-muted-foreground">
          {desc}
        </span>
      </span>
      <Switch checked={checked} tabIndex={-1} />
    </div>
  );
}

export function TodayPanel({ m }: { m: Model }) {
  const door = !m.asBuilt && m.join === "steps";
  const idleLive = m.asBuilt || m.idle === "live";
  const reelIdle = !m.reel;
  const photoIdle = !photoFirstLive(m);
  const summary = guestExperienceSummary({
    visibility:
      m.rung === "password"
        ? "password"
        : m.rung === "private"
          ? "private"
          : "open",
    requireVerifiedEmail: m.email,
    acceptingUploads: m.uploads,
    requireUploadToView: m.photoFirst,
  });
  const photoFirst =
    photoIdle && !idleLive && m.idle === "hidden" ? null : (
      <div
        className={cn(
          photoIdle && m.idle === "greyed" && !m.asBuilt && "opacity-50",
        )}
      >
        <GuardedSwitch
          label="Require an upload to view"
          desc="On: guests add one photo or video before they can see the full album, so nobody just looks. Off (the default): the album opens once a guest has given a name, or confirmed their email."
          checked={m.photoFirst}
          idle={photoIdle}
          after={
            photoIdle ? (
              <p className="text-xs text-muted-foreground">
                {idleLive
                  ? "Has no effect while uploads are closed."
                  : "Uploads are closed, so nobody can add one."}
              </p>
            ) : null
          }
        />
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-6">
        {m.focus === "event" && <ScrollHere />}
        <FormCard
          title="Details"
          description="What guests see when they land on the join page."
        >
          <div className="space-y-4">
            <div data-set-setting="" className="grid gap-2">
              <FormLabelQuote>Event name</FormLabelQuote>
              <Input readOnly tabIndex={-1} value={EVENT.name} />
            </div>
            <div data-set-setting="" className="grid gap-2">
              <FormLabelQuote>
                Description{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </FormLabelQuote>
              <Textarea readOnly tabIndex={-1} rows={3} value={EVENT.note} />
            </div>
            <div data-set-setting="" className="grid gap-2">
              <FormLabelQuote>
                Event date{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </FormLabelQuote>
              <Input readOnly tabIndex={-1} type="date" value={EVENT.isoDate} />
              <Desc>For your reference only: events never expire.</Desc>
            </div>
          </div>
        </FormCard>

        {m.focus === "access" && <ScrollHere />}
        {m.asBuilt ? (
          <FormCard
            title="Visibility & access"
            description="Control who can see the album."
          >
            <div data-set-setting="" className="space-y-3">
              <FormLabelQuote>Who can see this album?</FormLabelQuote>
              <VisibilitySelector value="open" onValueChange={() => {}} />
              <Desc>{VISIBILITY_HINTS.open}</Desc>
            </div>
          </FormCard>
        ) : (
          <FormCard
            title={door ? "The door" : "Visibility & access"}
            description={
              door
                ? "Everything a guest passes, in the order they meet it."
                : "Control who can see the album."
            }
          >
            {/* The join ask's form, as a card of today's, the rows its own. */}
            <div className="-mx-4 -my-3">
              <AccessBody m={m} as="rows" switches={door} />
            </div>
          </FormCard>
        )}

        {m.focus === "adds" && <ScrollHere />}
        <FormCard
          title="Guest uploads"
          description="Control whether and how guests contribute."
          group="adds"
        >
          <div className="space-y-4">
            <PlainSwitch
              label="Accepting uploads"
              desc="Turn off to freeze the album. Guests can still view it."
              checked={m.uploads}
            />
            <div data-set-setting="" className="grid gap-2">
              <FormLabelQuote>Max size per upload</FormLabelQuote>
              <SelectQuote value={UPLOAD_CAP_PRESETS[0].label} />
              <Desc>
                Cap how large any single guest upload can be, so one guest
                can&rsquo;t fill your storage. Your own uploads aren&rsquo;t
                affected.
              </Desc>
            </div>
            <GuardedSwitch
              label="Review uploads before they appear"
              desc="Hold new photos until you approve or reject them, instead of showing them live."
              checked={m.review}
            />
            {!door && (
              <>
                <GuardedSwitch
                  label="Require verified emails"
                  desc="On (recommended): guests confirm their email once before they see the full album or add photos (a few previews show first), so every upload has a verified email behind it. Off: guests type a display name and add photos straight away, with nothing to prove who they are."
                  checked={m.email}
                />
                {photoFirst}
              </>
            )}
            <p className="text-sm text-muted-foreground">{summary}</p>
            {m.asBuilt || m.lock === "chip" ? (
              <div
                data-set-setting=""
                className="flex items-center justify-between gap-4"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Video uploads</p>
                  <p className="text-sm text-muted-foreground">
                    {m.plan === "pro"
                      ? "Guests and you can upload photos and video."
                      : "This event accepts photos only."}
                  </p>
                </div>
                {m.plan === "pro" ? (
                  <span className="shrink-0 rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                    Photos &amp; video
                  </span>
                ) : (
                  <LockChipQuote
                    name="Video uploads"
                    reach={m.mark === "lock"}
                  />
                )}
              </div>
            ) : m.lock === "switch" ? (
              <div
                data-set-setting=""
                className="flex items-center justify-between gap-4"
              >
                <div className="space-y-0.5">
                  <FormLabelQuote>
                    Video uploads
                    {m.plan === "pro" ? null : (
                      <span className="rounded-full border border-border px-1.5 py-px text-[10px] font-semibold text-muted-foreground">
                        Pro
                      </span>
                    )}
                  </FormLabelQuote>
                  <Desc>
                    {m.plan === "pro"
                      ? "Guests and you can upload video as well as photos."
                      : "Guests and you can upload video as well as photos. Opens the plans."}
                  </Desc>
                </div>
                <span
                  data-set-reach={m.mark === "lock" ? "" : undefined}
                  className="flex shrink-0"
                >
                  <Switch checked={m.plan === "pro"} tabIndex={-1} />
                </span>
              </div>
            ) : m.plan === "pro" ? null : (
              <p
                data-set-reach={m.mark === "lock" ? "" : undefined}
                className="text-sm text-muted-foreground"
              >
                Videos come with Pro.{" "}
                <span className="font-medium text-foreground underline underline-offset-4">
                  See what Pro adds
                </span>
              </p>
            )}
          </div>
        </FormCard>

        <div className="flex justify-end">
          <span data-set-reach={m.mark === "save" ? "" : undefined}>
            <Button tabIndex={-1} disabled={!m.dirty}>
              Save changes
            </Button>
          </span>
        </div>
      </div>

      {m.focus === "reel" && <ScrollHere />}
      <FormCard
        title="Highlight reel"
        group="reel"
        Icon={Clapperboard}
        description="The album’s own reel, made from every photo guests can see."
      >
        <div className="space-y-5">
          <InstantSwitch
            first
            label="Show the reel"
            desc="It plays on the album from the second photo, for everyone with the link. Off hides it everywhere: the album, the view and any screen."
            checked={m.reel}
          />
          {reelIdle && !idleLive && m.idle === "hidden" ? null : (
            <>
              <div
                data-set-setting=""
                data-set-idle={reelIdle ? "" : undefined}
                className={cn(
                  "space-y-2 border-t border-border/60 pt-5",
                  reelIdle && !idleLive && "opacity-50",
                )}
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Look</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Where every guest starts. Anyone can pick their own on their
                    device.
                  </p>
                  {reelIdle && !idleLive ? (
                    <p className="text-xs text-muted-foreground">
                      Turn the reel on to choose.
                    </p>
                  ) : null}
                </div>
                <Looks value={m.look} />
              </div>
              <div
                data-set-setting=""
                data-set-idle={reelIdle ? "" : undefined}
                className={cn(
                  "space-y-2 border-t border-border/60 pt-5",
                  reelIdle && !idleLive && "opacity-50",
                )}
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Hold</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Seconds each photo stays on screen. 3 unless you choose.
                  </p>
                </div>
                <HoldSteps value={m.hold} />
              </div>
            </>
          )}
        </div>
      </FormCard>

      <FormCard
        title="Profile & guests"
        Icon={Users}
        description="How this event shows up beyond its own link."
      >
        <InstantSwitch
          first
          label="Show on my profile"
          desc="Lists this event, with its album link, on your public profile page."
          checked={m.profile}
        />
      </FormCard>

      <FormCard
        title="Danger zone"
        description="Deleting an event removes it and frees up a slot on your plan."
        className="border-destructive/30"
      >
        <Button variant="destructive" tabIndex={-1}>
          <Trash2 /> Delete event
        </Button>
      </FormCard>
    </div>
  );
}
