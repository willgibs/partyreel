"use client";

import { useCallback, useEffect, useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Flag } from "lucide-react";
import { toast } from "sonner";

import { AccountDoor } from "@/components/auth/account-door";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popup,
  PopupBody,
  PopupClose,
  PopupContent,
  PopupFooter,
  PopupHeader,
  PopupTrigger,
} from "@/components/ui/popup";
import { Textarea } from "@/components/ui/textarea";
import { maskEmail } from "@/lib/auth/remembered-email";
import {
  onPhotoReportRequest,
  type PhotoReportRequest,
} from "@/lib/guest/report-door";
import {
  INSTANT_HIDE_KIND,
  KIND_WORDS,
  REPORT_KINDS,
  type ReportKind,
} from "@/lib/reports/kinds";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/**
 * THE REPORT FORM: the discreet control at the foot of the event page, and the one form every photo's own Report
 * opens with that photo named (admin-triage r2: "A photo can be reported"; the viewer's capsule asks through
 * `report-door.ts`). It POSTs the event's `qr_token` (its capability), the item when there is one, the kind and an
 * optional reason to /api/reports. The trigger stays a muted link.
 *
 * His round-two picks, each in its own part:
 *  - `harm=kinds`: "The form asks one of five kinds or Something else." One tap sorts the night before anyone
 *    reads it; the kind is asked before Submit report can send (`kinds.ts` holds the words and the order).
 *  - `proof=confirm`: "The form offers Confirm your email with the door's own code, so a signed-out guest can be
 *    asked too, on the address kept until it closes." The confirm is the account door itself, code only (a
 *    Google round trip would leave the page and lose what she typed), so confirming makes a free account, and the
 *    form says so. A signed-in, confirmed guest is shown the address it keeps, masked. The address is the
 *    server's to read (`getUser()`), never a field this form sends.
 *  - The instant hide (his yes in chat): a child-abuse report of a photo from a confirmed address hides it at
 *    once, and the form says that a confirmed email hides it right away, so the report is never gated on the
 *    confirm and the confirm is never a secret.
 *
 * ★ IT IS A FORM, AND OPENS AS ONE (`popups` r1, `forms=dialog`, Will 2026-09-27): a small centred dialog, the
 * same object as a confirmation. It stands in what the keyboard leaves while the reason is typed (the Dialog
 * learned the Sheet's keyboard rule, `use-keyboard-inset.ts`), and on a phone it opens with focus on itself, so
 * the keyboard rises only when the field is tapped. Opened from the viewer it stacks over it (the popup's own
 * stacking rule), and closing it lands back in the viewer.
 */

type Subject =
  | { kind: "album" }
  | {
      kind: "item";
      mediaId: string;
      type: "photo" | "video";
      previewUrl: string | null;
    };

/** What the session proves, read when the form opens: nobody, an unconfirmed account, or a confirmed address. */
type Reporter = { email: string | null; confirmed: boolean } | null;

const ALBUM: Subject = { kind: "album" };

/** The form's title, by what it reports (the help center's pictures quote the first). */
const TITLE: Record<"event" | "photo" | "video", string> = {
  event: "Report this event",
  photo: "Report this photo",
  video: "Report this video",
};

/** The one line under the kinds when the worst is picked, true of what sending will do. */
export function instantHideLine(
  subject: Subject["kind"],
  confirmed: boolean,
): string {
  if (subject === "album") {
    return "Report the photo itself, from its own Report, and a confirmed email hides it right away.";
  }
  return confirmed
    ? "It's hidden from everyone the moment you send this, while we look."
    : "Confirm your email and it's hidden from everyone the moment you send this, while we look.";
}

export function ReportDialog({ qrToken }: { qrToken: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState<Subject>(ALBUM);
  const [kind, setKind] = useState<ReportKind | null>(null);
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [reporter, setReporter] = useState<Reporter>(null);
  const [isPending, startTransition] = useTransition();
  const kindsId = useId();

  /** Who is reporting, as this browser's session says (the server reads it again, and only its word counts). */
  const readReporter = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await createClient().auth.getUser();
      setReporter(
        user
          ? {
              email: user.email ?? null,
              confirmed: Boolean(user.email && user.email_confirmed_at),
            }
          : null,
      );
    } catch {
      setReporter(null);
    }
  }, []);

  const reset = useCallback(() => {
    setSubject(ALBUM);
    setKind(null);
    setReason("");
    setStep("form");
  }, []);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) void readReporter();
    else reset();
  }

  // A photo's own Report (the viewer's capsule) opens this same form with that photo named.
  useEffect(
    () =>
      onPhotoReportRequest((request: PhotoReportRequest) => {
        setSubject({
          kind: "item",
          mediaId: request.mediaId,
          type: request.type,
          previewUrl: request.previewUrl,
        });
        setKind(null);
        setReason("");
        setStep("form");
        setOpen(true);
        void readReporter();
      }),
    [readReporter],
  );

  function onSubmit() {
    if (!kind) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            qr_token: qrToken,
            media_id: subject.kind === "item" ? subject.mediaId : undefined,
            kind,
            reason: reason.trim() || undefined,
          }),
        });
        const data: unknown = await res.json().catch(() => null);
        if (!res.ok) {
          const message =
            data && typeof data === "object" && "message" in data
              ? String((data as { message: unknown }).message)
              : "Please try again.";
          throw new Error(message);
        }
        const hid =
          Boolean(data) &&
          typeof data === "object" &&
          (data as { hid?: unknown }).hid === true;
        setOpen(false);
        reset();
        toast.success(
          hid
            ? "Thanks. It's hidden from everyone while we look."
            : "Thanks. Your report has been sent for review.",
        );
        // A confirm on the form signed her in, and a hide took a photo down: the page catches up.
        if (reporter?.confirmed || hid) router.refresh();
      } catch (err) {
        toast.error("Couldn't submit your report.", {
          description: err instanceof Error ? err.message : undefined,
        });
      }
    });
  }

  const isItem = subject.kind === "item";
  const noun = isItem ? subject.type : "event";
  const confirmed = Boolean(reporter?.confirmed);

  return (
    <Popup open={open} onOpenChange={onOpenChange}>
      <PopupTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Flag /> Report
        </Button>
      </PopupTrigger>
      <PopupContent kind="form">
        {step === "confirm" ? (
          <>
            <PopupHeader
              title="Confirm your email"
              description="We'll write only if we need more from you, and your address is deleted when the report closes. Confirming makes a free account."
            />
            <PopupBody className="space-y-4">
              <AccountDoor
                wear="keep"
                chrome="none"
                methods={{ code: true }}
                emailRedirectTo={
                  typeof window === "undefined" ? "/" : window.location.href
                }
                hintEmail={reporter?.email ?? undefined}
                onVerified={async () => {
                  await readReporter();
                  setStep("form");
                }}
              />
            </PopupBody>
            <PopupFooter>
              <Button variant="outline" onClick={() => setStep("form")}>
                Back to the report
              </Button>
            </PopupFooter>
          </>
        ) : (
          <>
            <PopupHeader
              title={TITLE[noun]}
              description={
                <>
                  Tell us what&rsquo;s wrong and our team will review it. The
                  host is never told who reported.
                </>
              }
            />
            <PopupBody className="space-y-4">
              {isItem ? (
                <div
                  data-report-subject
                  className="flex items-center gap-3 rounded-lg border bg-muted/40 p-2"
                >
                  {subject.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- a presigned preview already on screen in the viewer
                    <img
                      src={subject.previewUrl}
                      alt=""
                      className="size-12 shrink-0 rounded-md object-cover"
                      draggable={false}
                    />
                  ) : null}
                  <p className="text-working">
                    This {subject.type}, and only this one
                  </p>
                </div>
              ) : null}

              <fieldset className="space-y-1.5" aria-describedby={kindsId}>
                <legend className="mb-1.5 text-sm leading-none font-medium">
                  What is it?
                </legend>
                <ul className="space-y-1.5">
                  {REPORT_KINDS.map((k) => (
                    <li key={k}>
                      <label
                        data-report-kind={k}
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-working transition-colors",
                          kind === k
                            ? "border-foreground bg-muted/60"
                            : "border-border hover:bg-muted/40",
                        )}
                      >
                        <input
                          type="radio"
                          name={`report-kind-${kindsId}`}
                          value={k}
                          checked={kind === k}
                          onChange={() => setKind(k)}
                          className="size-4 shrink-0 accent-foreground"
                        />
                        {KIND_WORDS[k]}
                      </label>
                    </li>
                  ))}
                </ul>
                {kind === INSTANT_HIDE_KIND ? (
                  <p
                    id={kindsId}
                    data-report-instant-hide
                    className="rounded-md bg-muted/60 px-3 py-2 text-caption text-pretty"
                  >
                    {instantHideLine(subject.kind, confirmed)}
                  </p>
                ) : (
                  <span id={kindsId} hidden />
                )}
              </fieldset>

              <div className="space-y-2">
                <Label htmlFor="report-reason">
                  Reason{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="report-reason"
                  rows={3}
                  maxLength={2000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="What's the problem here?"
                />
              </div>

              <div data-report-email className="space-y-1.5">
                {confirmed && reporter?.email ? (
                  <p className="flex items-start gap-2 text-caption text-pretty text-muted-foreground">
                    <BadgeCheck
                      className="mt-px size-3.5 shrink-0 text-success"
                      aria-hidden
                    />
                    <span>
                      {`We can write to ${maskEmail(reporter.email)} if we need more from you. It’s deleted when the report closes.`}
                    </span>
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        Your email{" "}
                        <span className="font-normal text-muted-foreground">
                          (optional)
                        </span>
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setStep("confirm")}
                      >
                        Confirm your email
                      </Button>
                    </div>
                    <p className="text-caption text-pretty text-muted-foreground">
                      Only so we can ask for more if we need it. It&rsquo;s
                      deleted when the report closes.
                    </p>
                  </>
                )}
              </div>
            </PopupBody>
            <PopupFooter>
              <PopupClose asChild>
                <Button variant="outline">Cancel</Button>
              </PopupClose>
              <Button disabled={isPending || !kind} onClick={onSubmit}>
                {isPending ? "Sending…" : "Submit report"}
              </Button>
            </PopupFooter>
          </>
        )}
      </PopupContent>
    </Popup>
  );
}
