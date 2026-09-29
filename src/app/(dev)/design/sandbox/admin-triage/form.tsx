"use client";

import type { ReactNode } from "react";
import { BadgeCheck, Flag, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { marketingImage } from "@/lib/constants/marketing-media";
import { cn } from "@/lib/utils";

import {
  DAUGHTER,
  ENTRIES,
  FORM_KINDS,
  type HarmShape,
  type Kind,
  KIND_WORDS,
  MOTHER,
  type ProofShape,
} from "./fixtures";

/**
 * THE GUEST'S REPORT, ON HER PHONE, AS EACH ANSWER WOULD HAVE IT.
 *
 * Today it is `ReportDialog` (`report-dialog.tsx`): a small centred dialog
 * (`popups` r1, `forms=dialog`) titled Report this event, one optional
 * reason, and the line "Reports are anonymous." Two asks on this board would
 * change it, and each moves only its own part, so a form is judged on one
 * change at a time:
 *
 *  - `harm` asks whether it names a kind (five, or Something else), and under
 *    `steer` whether Something else is filed at all;
 *  - `proof` asks whether it lets her be reached: a confirmed address she
 *    confirms as she reports (`confirm`), or nothing new (`none`, and
 *    `account`, which reaches only a
 *    signed-in guest, and she is signed out).
 *
 * ★ QUOTED, NOT MOUNTED. The real dialog is a Radix portal that would leave
 * this frame for the lab page's body and POSTs to `/api/reports`, so it is
 * drawn on the same classes: the overlay's wash and blur, the dialog's width,
 * corner and ring, the header, the body and the banded foot.
 *
 * Her words are the mother's from the night's first report, so the form she
 * filled in is the report the queue then shows.
 */

/** The album behind the dialog: the page she reported from, dimmed by the overlay. */
function AlbumBehind() {
  const stills = [
    "wedding-toast",
    "wedding-golden",
    "reception-table",
    "wedding-petals",
    "wedding-arch",
    "wedding-rings",
  ].map((id) => marketingImage(id));
  return (
    <div aria-hidden className="tri-album-behind">
      <div className="px-4 pt-5 pb-3">
        <p className="text-caption text-muted-foreground">Maya&rsquo;s album</p>
        <p className="font-heading text-page font-semibold tracking-tight">
          Hannah and Theo
        </p>
        <p className="text-caption text-muted-foreground">
          212 photos and videos
        </p>
      </div>
      <div className="grid grid-cols-2 gap-1 px-1">
        {stills.map((s, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- a local still standing in for a presigned original
          <img
            key={`${s.id}-${i}`}
            src={s.src}
            alt=""
            className="aspect-[4/5] w-full rounded-tile object-cover"
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
}

/** A choice row, drawn as the product's radio rows: the dot, the words. */
function KindRow({ kind, on }: { kind: Kind; on: boolean }) {
  return (
    <li
      data-tri-kind={kind}
      className={cn(
        "flex items-center gap-2.5 rounded-md border px-3 py-2 text-working",
        on ? "border-foreground bg-muted/60" : "border-border",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full border",
          on ? "border-foreground" : "border-muted-foreground/50",
        )}
      >
        {on ? <span className="size-2 rounded-full bg-foreground" /> : null}
      </span>
      {KIND_WORDS[kind]}
    </li>
  );
}

/** The dialog's shell: the portal's own centred form shape, drawn still. */
function Dialog({
  title,
  lede,
  children,
  foot,
}: {
  title: string;
  lede: ReactNode;
  children: ReactNode;
  foot: ReactNode;
}) {
  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-xs"
      />
      <section
        role="dialog"
        aria-label={title}
        data-tri-form
        className="fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-float bg-popover text-sm text-popover-foreground shadow-layer ring-1 ring-foreground/10"
      >
        <div className="flex shrink-0 flex-col gap-1 p-4 pr-12">
          <h2 className="font-heading text-card-title font-medium text-pretty text-foreground">
            {title}
          </h2>
          <div className="text-sm text-pretty text-muted-foreground">
            {lede}
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          {children}
        </div>
        <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-muted/50 p-4">
          {foot}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Close"
          className="absolute top-2 right-2"
        >
          <X />
        </Button>
      </section>
    </>
  );
}

const TODAY_LEDE = (
  <>
    Tell us what&rsquo;s wrong and our team will review it. Reports are
    anonymous.
  </>
);

/**
 * The lede each world says. Today's word for word, and only an answer that
 * keeps something of her changes its anonymity line: an address she confirms
 * is kept from the host, not from us.
 */
function ledeFor(proof: ProofShape): ReactNode {
  if (proof !== "confirm") return TODAY_LEDE;
  return (
    <>
      Tell us what&rsquo;s wrong and our team will review it. The host is never
      told who reported.
    </>
  );
}

/** The other guest: the one who looks awful in a photo (the night's two reports on it). */
const OTHER_WORDS =
  ENTRIES.find((e) => e.reports.length > 1)?.reports.at(-1)?.reason ?? "";

/**
 * ONE GUEST'S REPORT, in the world the asks describe: the mother (`who`
 * "mother", whose kind is Me or my child), or the guest who looks awful in a
 * photo ("other", whose kind is Something else, and whom `steer` sends to the
 * host instead of filing).
 */
export function ReportForm({
  harm,
  proof,
  who = "mother",
}: {
  harm: HarmShape;
  proof: ProofShape;
  who?: "mother" | "other";
}) {
  const kinds = harm !== "eye";
  const chosen: Kind = who === "other" ? "other" : "consent";
  const reason =
    who === "other" ? OTHER_WORDS : (DAUGHTER.reports[0].reason ?? "");
  const steered = harm === "steer" && who === "other";

  // ★ UNDER `steer`, SOMETHING ELSE IS NOT A REPORT. The form answers in its
  // own place: the host is the door for a photo she would rather not see, and
  // Contact for anything else, and nothing is filed.
  if (steered)
    return (
      <div className="tri-scope relative min-h-screen bg-background text-foreground">
        <AlbumBehind />
        <Dialog
          title="Report this event"
          lede={ledeFor(proof)}
          foot={
            <>
              <Button type="button" variant="outline">
                Close
              </Button>
              <Button type="button">Write to us</Button>
            </>
          }
        >
          <div className="space-y-1.5">
            <Label>What is it?</Label>
            <ul className="space-y-1.5">
              {FORM_KINDS.map((k) => (
                <KindRow key={k} kind={k} on={k === chosen} />
              ))}
            </ul>
          </div>
          <div
            data-tri-steer
            className="space-y-1.5 rounded-lg border bg-muted/40 px-3 py-2.5"
          >
            <p className="text-working font-medium">Ask the host first</p>
            <p className="text-caption text-muted-foreground">
              Reports are for harm. Maya can remove any photo from her album in
              one tap, so a photo you&rsquo;d rather not see is quickest with
              her. For anything else, write to us.
            </p>
          </div>
        </Dialog>
      </div>
    );

  return (
    <div className="tri-scope relative min-h-screen bg-background text-foreground">
      <AlbumBehind />
      <Dialog
        title="Report this event"
        lede={ledeFor(proof)}
        foot={
          <>
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="button">
              <Flag />
              Submit report
            </Button>
          </>
        }
      >
        {kinds ? (
          <div className="space-y-1.5">
            <Label>What is it?</Label>
            <ul className="space-y-1.5">
              {FORM_KINDS.map((k) => (
                <KindRow key={k} kind={k} on={k === chosen} />
              ))}
            </ul>
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="tri-reason">
            Reason{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Textarea
            id="tri-reason"
            rows={kinds ? 3 : 4}
            readOnly
            value={reason}
            className="resize-none"
          />
        </div>
        {/* ★ CONFIRMED, NEVER TYPED AND TRUSTED. His emails pick keeps only
            a confirmed address on a report, so the field is the door's own
            Confirm your email (the code the album's door already sends), drawn
            after she has confirmed it. */}
        {proof === "confirm" ? (
          <div data-tri-field="email" className="space-y-1.5">
            <Label htmlFor="tri-email">
              Your email{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <div className="relative">
              <Input
                id="tri-email"
                readOnly
                value={MOTHER.address}
                className="pr-24"
              />
              <span className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1 text-caption font-medium text-success">
                <BadgeCheck className="size-3.5" aria-hidden />
                Confirmed
              </span>
            </div>
            <p className="text-caption text-muted-foreground">
              Confirmed with the code we sent it. We write only if we need more
              from you, and once when it&rsquo;s handled; it&rsquo;s gone when
              the report closes.
            </p>
          </div>
        ) : null}
        {proof === "account" ? (
          <p data-tri-reach className="text-caption text-muted-foreground">
            You&rsquo;re signed out, so we can&rsquo;t ask you more. A signed-in
            guest can be asked.
          </p>
        ) : null}
      </Dialog>
    </div>
  );
}
