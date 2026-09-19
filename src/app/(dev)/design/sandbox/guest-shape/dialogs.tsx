"use client";

import type { ReactNode } from "react";
import { Copy, Download, Flag, Share2 } from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { cn } from "@/lib/utils";

import { EVENT } from "./fixtures";
import type { ScreenId } from "./page-parts";

/**
 * THE FOUR OTHER GUEST SURFACES: Invite, Save, Report and Download all.
 *
 * One phone-native drawer was built for the door and four desktop dialogs were
 * inherited from the host's app for everything else, so a guest on a phone
 * meets two different objects on one page. This decision is which object the
 * guest surface has.
 *
 * ★ THE SHELLS ARE QUOTED, THE CONTENTS ARE REAL. Every one of the four is a
 * radix `Dialog`, which portals to `document.body` and so leaves any lab frame
 * it is mounted in; the boxes below reproduce `DialogContent`'s position and
 * material (guest-shape.css) and nothing else. Inside them the QR is the
 * shipped `StyledQr` on the host's own preset, and the fields are the shipped
 * `Textarea`, `Label` and `Button`.
 *
 * ★ TWO CONTENTS, BECAUSE THEY BRACKET THE RANGE. Invite is the tallest of the
 * four (a 232px code and three buttons) and Report the shortest (a label, a
 * box and two buttons). A shell that holds both holds Save and Download all.
 */

export type DialogShape = "today" | "sheet" | "inline";
export type DialogWhich = "invite" | "report";

export const dialogOf = (v: string | undefined): DialogShape =>
  v === "today" ? "today" : v === "inline" ? "inline" : "sheet";

export const whichOf = (v: string | undefined): DialogWhich =>
  v === "report" ? "report" : "invite";

/* ── the two contents ────────────────────────────────────────────────────── */

const JOIN_URL = "https://partyreel.com/e/maya-and-jay";

function InviteBody() {
  return (
    <>
      <div>
        <p className="text-base font-semibold">Invite guests</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Share the link or let them scan the code to join {EVENT.name} and add
          photos.
        </p>
      </div>
      <div className="flex flex-col items-center gap-4">
        <div className="rounded-xl bg-white p-3">
          <StyledQr
            value={JOIN_URL}
            size={232}
            style={resolveQrPreset("classic")}
          />
        </div>
        <div className="flex w-full flex-wrap justify-center gap-2">
          <Button type="button" size="sm">
            <Share2 /> Share
          </Button>
          <Button type="button" variant="outline" size="sm">
            <Copy /> Copy link
          </Button>
          <Button type="button" variant="outline" size="sm">
            <Download /> Download
          </Button>
        </div>
      </div>
    </>
  );
}

function ReportBody() {
  return (
    <>
      <div>
        <p className="text-base font-semibold">Report this album</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Nothing is hidden by a report. It reaches an operator, who looks.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="gs-report">What is wrong? (optional)</Label>
        <Textarea id="gs-report" rows={3} placeholder="Tell us what you saw" />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="button">
          <Flag /> Send report
        </Button>
      </div>
    </>
  );
}

function Body({ which }: { which: DialogWhich }) {
  return which === "invite" ? <InviteBody /> : <ReportBody />;
}

/* ── the three shells ────────────────────────────────────────────────────── */

/** `DialogContent`'s own box: centred, `sm:max-w-xs`, the float corner. */
function CentredDialog({ children }: { children: ReactNode }) {
  return (
    <div className="gs-dialog" style={{ maxWidth: "20rem" }}>
      {children}
    </div>
  );
}

/** The door's sheet, promoted: the foot of a phone, centred from 640 up. */
function GuestSheet({
  screen,
  children,
}: {
  screen: ScreenId;
  children: ReactNode;
}) {
  if (screen === "1440")
    return (
      <div className="gs-dialog" style={{ maxWidth: "24rem" }}>
        {children}
      </div>
    );
  return (
    <div className="gs-sheet">
      <div className="gs-handle" aria-hidden />
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

/**
 * The surface with no overlay at all: it opens in the page, under the button
 * that asked for it, and the album stays where it was.
 */
export function InlinePanel({
  which,
  className,
}: {
  which: DialogWhich;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // `Card`'s own surface: the 8px radius token and the hairline ring.
        "mt-3 flex flex-col gap-4 rounded-lg bg-card p-5 ring-1 ring-foreground/10",
        className,
      )}
    >
      <Body which={which} />
    </div>
  );
}

/** The overlay-bearing shells, for the two options that have one. */
export function DialogOverlay({
  shape,
  screen,
  which,
}: {
  shape: Exclude<DialogShape, "inline">;
  screen: ScreenId;
  which: DialogWhich;
}) {
  const body = <Body which={which} />;
  return (
    <>
      <div className="gs-scrim" />
      {shape === "today" ? (
        <CentredDialog>{body}</CentredDialog>
      ) : (
        <GuestSheet screen={screen}>{body}</GuestSheet>
      )}
    </>
  );
}
