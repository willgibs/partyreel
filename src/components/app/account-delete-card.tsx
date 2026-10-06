"use client";

import { useId, useRef, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteMyAccountAction,
  getDeletionFactsAction,
  sendDeletionCodeAction,
  type DeletionFactsResult,
} from "@/app/(app)/account/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
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
import { Switch } from "@/components/ui/switch";
import { CODE_LENGTH } from "@/lib/auth/code-length";
import type { UploadsElsewhere } from "@/lib/db/mutations/account";
import { formatCount } from "@/lib/format/count";
import {
  browserZone,
  nextPurgeWindow,
  purgeTimeLabel,
} from "@/lib/lifecycle/purge-time";

/**
 * "Also remove the 12 photos I added to other people’s albums" (Will's words), and the line
 * under it that says what leaving it off means. Photos and videos are named for what they are,
 * and one upload is in one album.
 */
export function uploadsElsewhereChoice({ photos, videos }: UploadsElsewhere): {
  label: string;
  hint: string;
} {
  if (photos + videos === 1) {
    return {
      label: `Also remove the ${photos ? "photo" : "video"} I added to someone else’s album`,
      hint: "Otherwise it stays there, without your name or email.",
    };
  }
  const noun = [
    photos ? `${formatCount(photos)} ${photos === 1 ? "photo" : "photos"}` : "",
    videos ? `${formatCount(videos)} ${videos === 1 ? "video" : "videos"}` : "",
  ]
    .filter(Boolean)
    .join(" and ");
  return {
    label: `Also remove the ${noun} I added to other people’s albums`,
    hint: "Otherwise they stay there, without your name or email.",
  };
}

type Facts = Extract<DeletionFactsResult, { ok: true }>;

/** How long one answer serves the openings after it (a hover, then the press a moment later). */
const FACTS_FRESH_MS = 30_000;

/**
 * Account · Danger zone. The self-serve deletion the privacy policy promises.
 *
 * WHAT THE DIALOG SAYS is Will's list (2026-10-03), each line plain and short enough to read
 * before pressing: the plan cancelled now and never refunded; her events deleted right away; the
 * nightly cleanup erasing the rest by a time in her own zone, this email locked out until then and
 * free to start fresh after; and, when she has any, her photos in other people's albums, which stay
 * there nameless unless she turns on taking them out too (off by default: she can delete them
 * herself at any time). His worry was a person who deletes to start fresh, is refused a new
 * account at once and leaves, so the time is said twice: in the list, and on the done screen,
 * which stays until she leaves it rather than flashing past.
 *
 * ★ THE TIME AND THE COUNT ARE THE SERVER'S. The dialog asks for them as it opens (and on the
 * trigger's hover or focus, so they are usually there first): the count of her uploads elsewhere
 * is never trusted back (the removal re-reads its own set), and the purge's time comes off the
 * server's clock, the done screen's off the stamp itself. Until the answer lands, the time is this
 * device's own reckoning of the same window (`purge-time.ts`), so the list is never blank.
 *
 * ★ A CONFIRMATION, AND ONE THAT IS TYPED INTO (`popups` r1, `confirm=dialog`,
 * `md` since it lists what leaves). Its password field used to sit under an
 * iPhone's keyboard, because the Dialog centred in the layout viewport; the
 * confirm kind stands in the band the keyboard leaves, and on a phone it opens
 * with focus on itself, so the keyboard rises only when the field is tapped.
 *
 * ★ The re-verification here is the PROMPT, not the enforcement. The proof is
 * sent with the request and checked inside deleteMyAccountAction, because a
 * server action is a public endpoint and the attack this step exists to stop is
 * a borrowed session. Never "simplify" this into a client-side-only check.
 */
export function AccountDeleteCard({
  eventCount,
  hasPassword,
  hasPlan,
  email,
}: {
  /** Live events the account hosts. 0 renders a shorter, honest list. */
  eventCount: number;
  /** From has_password(): password re-verification, or an emailed code. */
  hasPassword: boolean;
  /** A paid plan that the request will cancel. */
  hasPlan: boolean;
  /** Shown so the person can see which address the code goes to. */
  email: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sending, startSending] = useTransition();
  const [deleting, startDeleting] = useTransition();
  /** The moment the dialog opened: the "now" its words are reckoned from. */
  const [openedAt, setOpenedAt] = useState(0);
  const [facts, setFacts] = useState<Facts | null>(null);
  const [removeElsewhere, setRemoveElsewhere] = useState(false);
  /** The purge's time from the stamp, and the moment the deletion landed. */
  const [done, setDone] = useState<{ purgeBy: string; at: number } | null>(
    null,
  );
  // When the server was last asked: the trigger's hover, its focus and the opening share one
  // question, and a later opening asks again (she may have taken photos back since).
  const askedAt = useRef(0);
  const choiceId = useId();

  function askForFacts() {
    const now = Date.now();
    if (now - askedAt.current < FACTS_FRESH_MS) return;
    askedAt.current = now;
    getDeletionFactsAction()
      .then((result) => setFacts(result.ok ? result : null))
      .catch(() => setFacts(null));
  }

  function reset() {
    setPassword("");
    setCode("");
    setCodeSent(false);
    setRemoveElsewhere(false);
  }

  function onSendCode() {
    startSending(async () => {
      const result = await sendDeletionCodeAction();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setCodeSent(true);
    });
  }

  const elsewhere = facts?.uploadsElsewhere ?? { photos: 0, videos: 0 };
  const hasElsewhere = elsewhere.photos + elsewhere.videos > 0;

  function onDelete() {
    startDeleting(async () => {
      const result = await deleteMyAccountAction(
        hasPassword
          ? { method: "password", password }
          : { method: "code", code },
        { removeUploadsElsewhere: hasElsewhere && removeElsewhere },
      );
      if (!result.ok) {
        toast.error(result.message);
        if (!hasPassword) setCode("");
        return;
      }
      // The action already signed us out. The done screen stays where the person
      // is looking until she leaves it: it carries the one time she needs.
      setDone({ purgeBy: result.purgeBy, at: Date.now() });
    });
  }

  const canDelete = hasPassword
    ? password.length > 0
    : code.length === CODE_LENGTH;

  const zone = browserZone();
  const purgeBy = facts
    ? Date.parse(facts.purgeBy)
    : nextPurgeWindow(openedAt).end;
  const choice = uploadsElsewhereChoice(elsewhere);

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">Delete account</CardTitle>
        <CardDescription>
          Closing your account is permanent. Download anything you want to keep
          first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Popup
          open={open}
          onOpenChange={(next) => {
            // Never yank the done screen out from under her, and never a dead ×:
            // dismissing it is leaving, as its Done is (she is signed out).
            if (done) {
              if (!next) window.location.assign("/");
              return;
            }
            if (next) {
              setOpenedAt(Date.now());
              askForFacts();
            } else {
              reset();
            }
            setOpen(next);
          }}
        >
          <PopupTrigger asChild>
            <Button
              variant="destructive"
              // Asked on intent, so the count is usually there before the dialog is.
              onPointerEnter={askForFacts}
              onFocus={askForFacts}
            >
              <Trash2 /> Delete account
            </Button>
          </PopupTrigger>
          <PopupContent kind="confirm" size="md">
            {done ? (
              <>
                <PopupHeader
                  title="Your account is deleted"
                  description={
                    <>
                      {
                        "You’re signed out, and this email can start a new account after "
                      }
                      <span className="text-foreground">
                        {purgeTimeLabel(
                          Date.parse(done.purgeBy),
                          done.at,
                          zone,
                        )}
                      </span>
                      {". Thanks for trying Partyreel."}
                    </>
                  }
                />
                <PopupFooter>
                  <Button onClick={() => window.location.assign("/")}>
                    Done
                  </Button>
                </PopupFooter>
              </>
            ) : (
              <>
                <PopupHeader
                  title="Delete your account?"
                  description="This can’t be undone."
                />

                <PopupBody className="space-y-4">
                  <ul
                    data-deletion-terms=""
                    className="space-y-2 text-sm text-muted-foreground"
                  >
                    {hasPlan && (
                      <li>
                        <span className="text-foreground">
                          Your plan is cancelled now.
                        </span>
                        {
                          " You won’t be billed again, and the rest of this period isn’t refunded."
                        }
                      </li>
                    )}
                    {eventCount > 0 && (
                      <li>
                        <span className="text-foreground">
                          {eventCount === 1
                            ? "Your event is deleted right away"
                            : `Your ${formatCount(eventCount)} events are deleted right away`}
                        </span>
                        {eventCount === 1
                          ? ", with every photo and video in it."
                          : ", with every photo and video in them."}
                      </li>
                    )}
                    <li>
                      <span className="text-foreground">
                        {`Your account is erased for good by ${purgeTimeLabel(purgeBy, openedAt, zone)}`}
                      </span>
                      {
                        ", in our nightly cleanup. Until then this email can’t sign in or start a new account. After that, it can start fresh."
                      }
                    </li>
                  </ul>

                  {hasElsewhere && (
                    <div
                      data-uploads-elsewhere=""
                      className="flex items-start justify-between gap-4 rounded-lg border px-3 py-2.5"
                    >
                      <div className="space-y-0.5">
                        <Label htmlFor={choiceId} className="leading-snug">
                          {choice.label}
                        </Label>
                        <p className="text-caption text-muted-foreground">
                          {choice.hint}
                        </p>
                      </div>
                      <Switch
                        id={choiceId}
                        className="mt-0.5"
                        checked={removeElsewhere}
                        onCheckedChange={setRemoveElsewhere}
                        disabled={deleting}
                      />
                    </div>
                  )}

                  {hasPassword ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="delete-password">
                        Enter your password to confirm
                      </Label>
                      <Input
                        id="delete-password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  ) : codeSent ? (
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        Enter the 6-digit code we sent to{" "}
                        <span className="font-medium text-foreground">
                          {email}
                        </span>
                        .
                      </p>
                      {/* Deliberately NO onComplete, unlike the sign-in OTP:
                        auto-submitting on the sixth keystroke would delete an
                        account without a final deliberate press. */}
                      <InputOTP
                        maxLength={CODE_LENGTH}
                        autoFocus
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={code}
                        disabled={deleting}
                        onChange={setCode}
                      >
                        <InputOTPGroup>
                          {Array.from({ length: CODE_LENGTH }, (_, i) => (
                            <InputOTPSlot key={i} index={i} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        We will email a confirmation code to{" "}
                        <span className="font-medium text-foreground">
                          {email}
                        </span>
                        .
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onSendCode}
                        working={sending}
                        workingLabel="Sending"
                      >
                        Send code
                      </Button>
                    </div>
                  )}
                </PopupBody>

                <PopupFooter>
                  <PopupClose asChild>
                    <Button variant="outline">Keep my account</Button>
                  </PopupClose>
                  <Button
                    variant="destructive"
                    disabled={!canDelete}
                    onClick={onDelete}
                    working={deleting}
                    workingLabel="Deleting"
                  >
                    Delete my account
                  </Button>
                </PopupFooter>
              </>
            )}
          </PopupContent>
        </Popup>
      </CardContent>
    </Card>
  );
}
