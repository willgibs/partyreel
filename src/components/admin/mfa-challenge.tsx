"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

// Step-up for an admin whose account already has a TOTP factor but whose current
// session is only AAL1 (e.g. a fresh magic-link sign-in). Verifying upgrades the
// session to AAL2; we refresh so the layout renders the portal.
export function MfaChallenge() {
  const router = useRouter();
  const supabase = createClient();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function verify() {
    if (code.length !== 6) return;
    setBusy(true);
    try {
      const list = await supabase.auth.mfa.listFactors();
      const factor = list.data?.totp?.[0];
      if (!factor) {
        toast.error("No authenticator is set up on this account.");
        return;
      }
      const challenge = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      });
      if (challenge.error || !challenge.data) {
        toast.error("Couldn't start the check", {
          description: challenge.error?.message,
        });
        return;
      }
      const { error } = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: challenge.data.id,
        code,
      });
      if (error) {
        toast.error("That code didn't match", { description: error.message });
        return;
      }
      toast.success("Verified.");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Enter the 6-digit code from your authenticator app to continue.
      </p>
      <Input
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="123456"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        className="text-center tracking-[0.4em]"
      />
      <Button
        className="w-full"
        disabled={busy || code.length !== 6}
        onClick={verify}
      >
        {busy ? "Verifying..." : "Verify"}
      </Button>
    </div>
  );
}
