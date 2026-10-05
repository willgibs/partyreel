"use client";

import { useState, useTransition } from "react";
import { Flag, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import {
  RELATION_FACE,
  useRelation,
} from "@/components/social/relation-toggle";
import { useMediaQuery } from "@/lib/use-media-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { floatingGutter } from "@/components/ui/floating-layer";
import { Label } from "@/components/ui/label";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupFooter,
  PopupHeader,
} from "@/components/ui/popup";
import { Textarea } from "@/components/ui/textarea";

/**
 * The menu on /u/[slug] for a signed-in, non-self viewer: report this person,
 * or block them.
 *
 * ★ TWO ROWS, BECAUSE SOMEONE WHO WANTS TO BLOCK USUALLY WANTS TO TELL SOMEBODY
 * (Will, `block=report`, 2026-09-19: "This establishes a more scalable
 * pattern/menu for other usage as well"). Blocking is a private act between two
 * people and changes nothing for anyone else; reporting is how a person reaches
 * the operator. Offering only the first told everybody that Partyreel had
 * nowhere to take a complaint about a person, which was true until this round
 * and is not any more: the row writes a real row into the same queue that holds
 * reported photographs (/admin/reports).
 *
 * ★ EACH ROW OPENS THE KIND IT IS (`popups` r1): Report is a FORM, a small
 * centred dialog that stands above the keyboard while its reason is typed (it
 * sat under an iPhone keyboard before the Dialog learned the Sheet's rule), and
 * Block is a CONFIRMATION, a centred dialog that asks before it acts.
 *
 * ★ THE BLOCK ROW IS A FACE OF THE ONE RELATION CONTROL (`relation-toggle.tsx`,
 * crumbs-44): the same hook as the profile's Follow and the Connections card's
 * rows, so the same flip, the same ask (`BlockConfirm`, rendered outside the
 * menu so it outlives the menu closing) and the same quiet on success. It waited
 * and toasted "Blocked Maya." of its own before.
 *
 * Blocking is PRIVATE: the other side is never notified and can't see it, so
 * the ask says so (profiles-social.md). After a block the Server Function's
 * re-render hides the follow button (the server's blocked-either-way gate)
 * while the profile itself stays public-by-existence, and THIS MENU STAYS
 * VISIBLE under a block in either direction: a menu that vanished would tell
 * the other side they had been blocked, which is the one thing a block promises
 * it will not do.
 */
export function ProfileActionsMenu({
  profileId,
  displayName,
  blocked,
}: {
  profileId: string;
  displayName: string | null;
  /** Whether *I* currently block this profile (drives Block vs Unblock). */
  blocked: boolean;
}) {
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reporting, startReport] = useTransition();
  const name = displayName ?? "this person";
  const block = useRelation({
    relation: "block",
    profileId,
    on: blocked,
    person: name,
  });
  const blockFace = RELATION_FACE.block[block.on ? "on" : "off"];
  const BlockIcon = blockFace.icon;
  // The width at which the page's actions leave the name's row for their own (its `max-sm:`).
  const actionsBesideName = useMediaQuery("(min-width: 40rem)");

  // The same endpoint and the same shape as a reported photograph, with a
  // person in place of the album: one queue, one rate limit, one status
  // machine. The route re-verifies the signed-in viewer, so nothing sent from
  // here is trusted.
  function runReport() {
    startReport(async () => {
      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile_id: profileId,
            reason: reason.trim() || undefined,
          }),
        });
        if (!res.ok) {
          const data: unknown = await res.json().catch(() => null);
          const message =
            data && typeof data === "object" && "message" in data
              ? String((data as { message: unknown }).message)
              : "Please try again.";
          throw new Error(message);
        }
        setReportOpen(false);
        setReason("");
        toast.success("Thanks. Your report has been sent for review.");
      } catch (err) {
        toast.error("Couldn't send your report.", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="More options"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        {/* Two rows, and still no title row or footer rail: Card's parts are for
            a menu with something to say, and each of these is one verb. The
            destructive variant is the whole signal on the block, and each row's
            dialog is where the act is actually explained. */}
        {/* ★ WIDE ENOUGH FOR ITS LONGEST ROW: the icon trigger's own width falls
            back to the panel's `min-w-32` (128px, `ui/dropdown-menu.tsx`), which
            wraps "Report this person" onto two lines. `w-56`, the same override
            every other icon-triggered menu in the app uses, fits it on one. */}
        {/* ★ IT HANGS FROM ITS TRIGGER'S OWN SIDE (crumbs-44). Beside the name
            (from `sm`) the trigger ends the row, so the panel aligns to its end.
            At a phone the actions take a row of their own from its left, and an
            end-aligned panel hung 77px off the screen: Radix pushed it back to
            the glass's very edge, under Follow rather than its own trigger, with
            no gutter at all (measured at 375: left 0, the trigger at 115). So a
            phone aligns it to the trigger's start, and the floating layer's
            gutter (`floatingGutter`, the sub-menu's and the responsive menu's
            too) keeps it off the edge wherever it lands. (The board that found
            it drew the panel over the name, in a frame with nothing under the
            row; on the page it opens down.) */}
        <DropdownMenuContent
          align={actionsBesideName ? "end" : "start"}
          collisionPadding={floatingGutter}
          className="w-56"
        >
          <DropdownMenuItem onSelect={() => setReportOpen(true)}>
            <Flag /> Report this person
          </DropdownMenuItem>
          <DropdownMenuItem
            variant={block.on ? "default" : "destructive"}
            onSelect={block.press}
            disabled={block.pending}
          >
            <BlockIcon /> {blockFace.label}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Popup open={reportOpen} onOpenChange={setReportOpen}>
        <PopupContent kind="form">
          <PopupHeader
            title={`Report ${name}?`}
            description={
              <>
                Tell us what&rsquo;s wrong and our team will review it. They
                won&rsquo;t be told who reported them. Reporting someone
                doesn&rsquo;t block them, and it doesn&rsquo;t change what you
                see.
              </>
            }
          />
          <PopupBody className="space-y-2">
            <Label htmlFor="profile-report-reason">
              Reason{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="profile-report-reason"
              rows={4}
              maxLength={2000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What's the problem here?"
            />
          </PopupBody>
          <PopupFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReportOpen(false)}
              disabled={reporting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={runReport} disabled={reporting}>
              {reporting ? "Sending…" : "Send report"}
            </Button>
          </PopupFooter>
        </PopupContent>
      </Popup>

      {block.ask}
    </>
  );
}
