"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { floatingPanel } from "@/components/ui/floating-layer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { PRIYA, THEO } from "./fixtures";
import { GuestAlbum, PersonPage } from "./grounds";
import { type PhoneScene, Scenes } from "./scene";
import {
  BottomSheet,
  CentredDialog,
  FOCUSED,
  forSize,
  PageOnKeyboard,
  type Parts,
  PhoneScreen,
  SidePanel,
  type Size,
} from "./surfaces";
import { Keyboard } from "./keyboard";

/**
 * SHORT FORMS: reporting the wedding from the album's foot (`report-dialog.tsx`,
 * a sheet today), reporting a person from their page (`profile-actions-menu.tsx`,
 * a centred dialog today), and changing her name from the line that told her
 * what it is (`guest-door`'s `name=told`, being built: "a simple 'Change' link
 * to actually do so"). Every one is typed into, so every phone draws its field
 * focused and the keyboard up.
 */

export type FormOption = "sheet" | "dialog" | "screen" | "inline";
export type FormScreen = "event" | "person" | "name";

export const formAtOf = (v: string | undefined): FormScreen =>
  v === "person" || v === "name" ? v : "event";

const OPTION_TITLE: Record<FormOption, string> = {
  sheet: "The one Sheet, on the keyboard",
  dialog: "A small centred dialog",
  screen: "Its own screen in a hand",
  inline: "In place",
};

const SCREEN_TITLE: Record<FormScreen, string> = {
  event: "reporting the wedding",
  person: "reporting a person",
  name: "changing her name",
};

const TYPED = "Someone keeps adding photos that aren't from this wedding";

function Reason({ id }: { id: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        Reason{" "}
        <span className="font-normal text-muted-foreground">(optional)</span>
      </Label>
      <Textarea
        id={id}
        rows={4}
        readOnly
        tabIndex={-1}
        defaultValue={TYPED}
        placeholder="What's the problem here?"
        data-pop-field=""
        className={FOCUSED}
      />
    </div>
  );
}

function NameField({ id }: { id: string }) {
  return (
    <Input
      id={id}
      aria-label="Your name"
      readOnly
      tabIndex={-1}
      defaultValue="Priya S"
      data-pop-field=""
      className={cn("h-10 text-base", FOCUSED)}
    />
  );
}

const PARTS: Record<FormScreen, Parts> = {
  event: {
    title: "Report this event",
    description:
      "Tell us what’s wrong and our team will review it. Reports are anonymous.",
    body: <Reason id="reason-event" />,
    act: { label: "Submit report" },
    cancel: "Cancel",
    typing: true,
  },
  person: {
    title: `Report ${THEO.name}?`,
    description:
      "Tell us what’s wrong and our team will review it. They won’t be told who reported them. Reporting someone doesn’t block them, and it doesn’t change what you see.",
    body: <Reason id="reason-person" />,
    act: { label: "Send report" },
    cancel: "Cancel",
    typing: true,
  },
  name: {
    title: "Change your name",
    description: "Your new name shows on everything you have already added.",
    body: <NameField id="name-field" />,
    act: { label: "Save name" },
    cancel: "Cancel",
    typing: true,
    enter: "done",
  },
};

/* ── the forms in place ──────────────────────────────────────────────────── */

/** The footer's Report, grown into the form where it stood. */
function ReportInPlace() {
  return (
    <div
      data-pop-surface="inline"
      className="w-full max-w-md space-y-3 px-2 pt-1 text-left"
    >
      <p className="font-heading text-card-title font-medium">
        Report this event
      </p>
      <p className="text-sm text-muted-foreground">
        Tell us what’s wrong and our team will review it. Reports are anonymous.
      </p>
      <Reason id="reason-inline" />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" tabIndex={-1}>
          Cancel
        </Button>
        <Button tabIndex={-1} data-pop-primary="">
          Submit report
        </Button>
      </div>
    </div>
  );
}

/** Report, grown under the page's head once the More menu's row is pressed. */
function PersonReportInPlace() {
  return (
    <div
      data-pop-surface="inline"
      className="mt-6 space-y-3 rounded-xl border bg-card p-4"
    >
      <p className="font-heading text-card-title font-medium">{`Report ${THEO.name}?`}</p>
      <p className="text-sm text-pretty text-muted-foreground">
        They won’t be told who reported them. Reporting someone doesn’t block
        them.
      </p>
      <Reason id="reason-person-inline" />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" tabIndex={-1}>
          Cancel
        </Button>
        <Button tabIndex={-1} data-pop-primary="">
          Send report
        </Button>
      </div>
    </div>
  );
}

/** The line that told her the name (a toast, top centre), grown into the
 *  field it names: Change is pressed, and the line becomes the answer. A desk
 *  grows it the same way, with no keyboard to raise. */
function ToldInPlace({ phone }: { phone: boolean }) {
  return (
    <>
      <div
        data-pop-surface="inline"
        className={cn(
          "fixed top-20 left-1/2 z-50 w-[min(356px,calc(100%-2rem))] -translate-x-1/2 space-y-3 p-4 text-sm",
          floatingPanel,
        )}
      >
        <p className="text-muted-foreground">
          {`You're on as ${PRIYA.name}. Your new name shows on everything you've added.`}
        </p>
        <NameField id={phone ? "name-inline" : "name-desk"} />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" tabIndex={-1}>
            Cancel
          </Button>
          <Button size="sm" tabIndex={-1} data-pop-primary="">
            Save name
          </Button>
        </div>
      </div>
      {phone && <Keyboard enter="done" />}
    </>
  );
}

/* ── the grounds, and the four shapes ────────────────────────────────────── */

function ground(screen: FormScreen, size: Size, overlay?: ReactNode) {
  if (screen === "event")
    return <GuestAlbum size={size} view="foot" overlay={overlay} />;
  if (screen === "person") return <PersonPage size={size} overlay={overlay} />;
  return <GuestAlbum size={size} view="top" overlay={overlay} />;
}

function draw(option: FormOption, screen: FormScreen, size: Size): ReactNode {
  const parts = forSize(PARTS[screen], size);
  const phone = size === "phone";
  if (option === "inline") {
    if (screen === "name")
      return (
        <GuestAlbum
          size={size}
          view="top"
          overlay={<ToldInPlace phone={phone} />}
        />
      );
    const page =
      screen === "event" ? (
        <GuestAlbum
          size={size}
          view="foot"
          report={{ replace: <ReportInPlace /> }}
        />
      ) : (
        <PersonPage size={size} below={<PersonReportInPlace />} />
      );
    return phone ? <PageOnKeyboard>{page}</PageOnKeyboard> : page;
  }
  const surface =
    option === "sheet" ? (
      phone ? (
        <BottomSheet parts={parts} />
      ) : (
        <SidePanel parts={parts} />
      )
    ) : option === "screen" && phone ? (
      <PhoneScreen parts={parts} bar="compose" />
    ) : (
      <CentredDialog parts={parts} />
    );
  return ground(screen, size, surface);
}

const PHONES: readonly FormScreen[] = ["event", "person", "name"];

export function FormsPreview({
  option,
  at,
}: {
  option: FormOption;
  at: FormScreen;
}) {
  const phones: PhoneScene[] = PHONES.map((screen) => ({
    title: `${SCREEN_TITLE[screen]}, the field focused`,
    node: draw(option, screen, "phone"),
  }));
  return (
    <Scenes
      id={`forms-${option}-${at}`}
      title={OPTION_TITLE[option]}
      laptop={draw(option, at, "desk")}
      laptopTitle={SCREEN_TITLE[at]}
      phones={phones}
    />
  );
}
