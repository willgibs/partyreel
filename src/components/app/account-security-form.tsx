"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { verifyCurrentPasswordAction } from "@/app/(app)/account/actions";
import { PasswordStrengthMeter } from "@/components/shared/password-strength-meter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MIN_PASSWORD_LENGTH,
  changePasswordSchema,
  setPasswordSchema,
} from "@/lib/validation/auth";
import { createClient } from "@/lib/supabase/client";

type AccountSecurityFormProps = {
  // From the server has_password() RPC. Drives Set vs Change copy + whether the
  // current-password field is shown.
  hasPassword: boolean;
  // From /account?reset=1 after a fresh OTP verify in the forgot-password flow: the host
  // just proved ownership and by definition doesn't know the current password, so force
  // SET mode (no current-password field) even when a password already exists. Safe because
  // updateUser() requires the live session anyway, so a stale ?reset=1 URL does nothing.
  resetMode: boolean;
};

export function AccountSecurityForm({
  hasPassword,
  resetMode,
}: AccountSecurityFormProps) {
  const router = useRouter();
  // "change" re-confirms the current password; "set" (first-time OR a forgot-reset) does not.
  const mode: "set" | "change" = hasPassword && !resetMode ? "change" : "set";

  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, startSave] = useTransition();

  function onSubmit() {
    // Validate with the mode's schema (length 8..72 + confirm match; change also needs the
    // current password). Server-side, Supabase additionally enforces min length + leaked-
    // password protection on the updateUser write.
    const parsed =
      mode === "change"
        ? changePasswordSchema.safeParse({
            currentPassword: current,
            password,
            confirm,
          })
        : setPasswordSchema.safeParse({ password, confirm });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form.");
      return;
    }

    startSave(async () => {
      // CHANGE: re-confirm the current password server-side FIRST. The RPC only reads, so
      // the session isn't disrupted; we only proceed to the write on a match.
      if (mode === "change") {
        const check = await verifyCurrentPasswordAction(current);
        if (!check.ok) {
          toast.error(check.message);
          return;
        }
      }

      // The password WRITE is updateUser on the BROWSER client: it rotates the session and
      // the browser client's cookie write is unconditional (the same place EmailSignIn
      // calls verifyOtp). Doing it server-side would need an extra router.refresh to re-sync.
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error("Couldn't update your password.", {
          description: error.message,
        });
        return;
      }

      // Stamp our own "user set a password" flag so has_password() flips to true. We can't
      // trust auth.users.encrypted_password — GoTrue gives OTP/magic-link signups a
      // placeholder hash (live-verified), so this flag is the only honest signal of a
      // user-chosen password. Best-effort; the next visit re-derives from it.
      await supabase.rpc("mark_password_set");

      toast.success(mode === "change" ? "Password changed." : "Password set.");
      setCurrent("");
      setPassword("");
      setConfirm("");
      // Re-derive has_password on the server (set -> change) and drop any ?reset=1.
      router.replace("/account");
      router.refresh();
    });
  }

  const disabled =
    saving || !password || !confirm || (mode === "change" && !current);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-4"
    >
      {mode === "change" && (
        <div className="space-y-1.5">
          <Label htmlFor="current-password">Current password</Label>
          <Input
            id="current-password"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="new-password">
          {mode === "change" ? "New password" : "Password"}
        </Label>
        <div className="relative">
          <Input
            id="new-password"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-foreground active:scale-90"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          At least {MIN_PASSWORD_LENGTH} characters.
        </p>
        <PasswordStrengthMeter value={password} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Confirm password</Label>
        <Input
          id="confirm-password"
          type={show ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
        />
      </div>

      <Button type="submit" disabled={disabled}>
        {saving
          ? "Saving…"
          : mode === "change"
            ? "Change password"
            : "Set password"}
      </Button>
    </form>
  );
}
