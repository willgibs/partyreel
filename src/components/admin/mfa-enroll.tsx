"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

// First-time TOTP enrollment for the operations portal. Reachable at AAL1 so the
// owner is never locked out (you can always enroll your first factor). On success
// the session is upgraded to AAL2 and we refresh so the server layout drops the
// gate and renders the portal. Break-glass if the authenticator is lost: delete the
// factor via the Supabase dashboard / MCP (auth.mfa_factors) — see the plan.
export function MfaEnroll() {
  const router = useRouter();
  const supabase = createClient();
  const started = useRef(false);

  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function startEnroll() {
    setBusy(true);
    try {
      // Clear any stale UNVERIFIED totp factor from an abandoned attempt so a fresh
      // enroll doesn't collide (verified factors are left untouched).
      const list = await supabase.auth.mfa.listFactors();
      const stale = (list.data?.all ?? []).filter(
        (f) => f.factor_type === "totp" && f.status !== "verified",
      );
      for (const f of stale)
        await supabase.auth.mfa.unenroll({ factorId: f.id });

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      if (error || !data) {
        toast.error("Couldn't start two-factor setup", {
          description: error?.message,
        });
        return;
      }
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!factorId || code.length !== 6) return;
    setBusy(true);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error || !challenge.data) {
        toast.error("Couldn't verify the code", {
          description: challenge.error?.message,
        });
        return;
      }
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code,
      });
      if (error) {
        toast.error("That code didn't match", { description: error.message });
        return;
      }
      toast.success("Two-factor authentication is on.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  // Auto-start enrollment on mount so the setup code appears immediately.
  // StrictMode double-invokes effects in dev; the ref + stale-factor cleanup keep
  // this idempotent.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void startEnroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!qr) {
    return (
      <p className="text-sm text-muted-foreground">
        {busy ? "Preparing your setup code..." : "Setting up two-factor..."}
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>
          Open an authenticator app (1Password, Authy, Google Authenticator).
        </li>
        <li>Scan this code, or paste the key below.</li>
        <li>Enter the 6-digit code it shows.</li>
      </ol>

      <div className="flex flex-col items-center gap-3">
        {/* Supabase-generated SVG (trusted output, not user input). */}
        <div
          className="size-44 rounded-lg bg-white p-2 [&>svg]:size-full"
          dangerouslySetInnerHTML={{ __html: qr }}
        />
        {secret && (
          <code className="rounded bg-muted px-2 py-1 text-center text-xs break-all">
            {secret}
          </code>
        )}
      </div>

      <div className="space-y-2">
        <Input
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          maxLength={6}
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          className="text-center tracking-[0.4em]"
        />
        <Button
          className="w-full"
          disabled={busy || code.length !== 6}
          onClick={verify}
        >
          {busy ? "Verifying..." : "Turn on two-factor"}
        </Button>
      </div>
    </div>
  );
}
