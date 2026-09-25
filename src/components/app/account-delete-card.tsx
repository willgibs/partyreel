"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteMyAccountAction,
  sendDeletionCodeAction,
} from "@/app/(app)/account/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";

// Lockstep with the Supabase "Email OTP Length" setting, exactly like
// email-sign-in.tsx. The two are hand-synced; the code will not verify if they
// drift.
const OTP_LENGTH = 6;

/**
 * Account · Danger zone. The self-serve deletion the privacy policy promises.
 *
 * The ruling (Will, 2026-09-02) is IMMEDIATE, NO UNDO, plan auto-cancelled, so
 * the copy says exactly that and the dialog names real numbers instead of a
 * vague "your events". This is the one place in the product where being a
 * little slower is the point: the consequence list, then a re-verification,
 * then a destructive button.
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
  const [done, setDone] = useState(false);

  function reset() {
    setPassword("");
    setCode("");
    setCodeSent(false);
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

  function onDelete() {
    startDeleting(async () => {
      const result = await deleteMyAccountAction(
        hasPassword
          ? { method: "password", password }
          : { method: "code", code },
      );
      if (!result.ok) {
        toast.error(result.message);
        if (!hasPassword) setCode("");
        return;
      }
      // The action already signed us out. Show the confirmation where the
      // person is looking, then leave: every signed-in route would bounce them
      // to /login, which reads like an error rather than a goodbye.
      setDone(true);
      setTimeout(() => window.location.assign("/"), 1600);
    });
  }

  const canDelete = hasPassword
    ? password.length > 0
    : code.length === OTP_LENGTH;

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">Delete account</CardTitle>
        <CardDescription>
          Closing your account is immediate and permanent. Download anything you
          want to keep first.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            if (done) return; // never yank the confirmation out from under them
            setOpen(next);
            if (!next) reset();
          }}
        >
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 /> Delete account
            </Button>
          </DialogTrigger>
          <DialogContent>
            {done ? (
              <DialogHeader>
                <DialogTitle>Your account is deleted</DialogTitle>
                <DialogDescription>
                  You are signed out. Thanks for trying Partyreel.
                </DialogDescription>
              </DialogHeader>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Delete your account?</DialogTitle>
                  <DialogDescription>
                    This happens right away and cannot be undone.
                  </DialogDescription>
                </DialogHeader>

                <ul className="space-y-2 text-sm text-muted-foreground">
                  {eventCount > 0 && (
                    <li>
                      <span className="text-foreground">
                        {eventCount === 1
                          ? "Your event is deleted"
                          : `Your ${eventCount} events are deleted`}
                      </span>
                      , with everything guests uploaded to them.
                    </li>
                  )}
                  {hasPlan && (
                    <li>
                      <span className="text-foreground">
                        Your plan is cancelled
                      </span>{" "}
                      as part of this. You will not be billed again.
                    </li>
                  )}
                  <li>
                    Photos you added to{" "}
                    <span className="text-foreground">
                      other people&rsquo;s events
                    </span>{" "}
                    stay in those albums, without your name or email. Ask the
                    host if you want them removed.
                  </li>
                  <li>
                    Your account cannot be restored, and this email can start
                    over only as a brand new account.
                  </li>
                </ul>

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
                      maxLength={OTP_LENGTH}
                      autoFocus
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={code}
                      disabled={deleting}
                      onChange={setCode}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: OTP_LENGTH }, (_, i) => (
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
                      disabled={sending}
                      onClick={onSendCode}
                    >
                      {sending ? "Sending…" : "Send code"}
                    </Button>
                  </div>
                )}
              </>
            )}

            {!done && (
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Keep my account</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  disabled={deleting || !canDelete}
                  onClick={onDelete}
                >
                  {deleting ? "Deleting…" : "Delete my account"}
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
