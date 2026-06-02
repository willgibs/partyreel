"use client";

import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";

import { EmailSignIn } from "@/components/auth/email-sign-in";

// require_email gate (Phase 2c): the host asks guests to verify an email before uploading.
// The gallery is still visible (EventExperience renders it) — this only replaces the upload
// area. After a successful in-page code verify, router.refresh() re-runs the /e/ RSC, which
// now sees the confirmed session and renders the real upload panel. The magic-link path
// returns to /e/[token] via /auth/callback?next=... instead.
export function VerifyEmailPrompt({ qrToken }: { qrToken: string }) {
  const router = useRouter();
  const emailRedirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=/e/${qrToken}`
      : `/auth/callback?next=/e/${qrToken}`;

  return (
    <div className="rounded-xl border border-border bg-card p-5 text-center">
      <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand">
        <MailCheck className="size-5" />
      </div>
      <p className="text-sm font-medium">Verify your email to upload</p>
      <p className="mx-auto mt-1 mb-4 max-w-xs text-sm text-muted-foreground">
        This event asks guests to verify an email before adding photos.
      </p>
      <div className="mx-auto max-w-xs text-left">
        <EmailSignIn
          emailRedirectTo={emailRedirectTo}
          onVerified={() => router.refresh()}
        />
      </div>
    </div>
  );
}
