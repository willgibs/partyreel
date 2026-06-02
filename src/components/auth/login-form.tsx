"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { EmailSignIn } from "@/components/auth/email-sign-in";
import { PasswordAuth } from "@/components/auth/password-sign-in";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { isAdminHost, loginTarget } from "@/lib/auth/admin-host";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

// Absolute callback URL. Must match an entry in Supabase Auth's redirect
// allow-list, or the redirect is rejected and Supabase falls back to the Site
// URL. So we send the BARE `/auth/callback` (no query — a `?next=` breaks an
// exact, non-wildcard allow-list entry) and let the callback choose where to land
// based on the host it runs on (the admin subdomain → /admin). This is the
// magic-LINK + Google redirect target; the password + OTP CODE paths verify
// in-page (no redirect) and navigate via router below.
//
// On the admin subdomain we MUST use the live origin (NOT the configured apex
// NEXT_PUBLIC_SITE_URL) so the session cookie lands on admin.<domain> and the
// admin session stays host-isolated. Everywhere else, prefer the configured site
// origin and fall back to the live origin so local dev (where NEXT_PUBLIC_SITE_URL
// may be unset) still works.
function callbackUrl() {
  const onAdminHost =
    typeof window !== "undefined" && isAdminHost(window.location.host);
  const origin = onAdminHost
    ? window.location.origin
    : (env.NEXT_PUBLIC_SITE_URL ?? window.location.origin);
  return `${origin}/auth/callback`;
}

// lucide-react dropped brand glyphs, so the Google "G" is inlined here.
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  // Lead with email + password (ADR-0011). The email-code path is the alternative AND the
  // forgot-password route (verify ownership, then land on /account to set a new password).
  const [view, setView] = useState<"password" | "code">("password");
  // True when the code view was opened via "Forgot password?": after verifying, land on
  // /account in set mode (no current-password field) instead of the dashboard.
  const [codeReset, setCodeReset] = useState(false);

  async function signInWithGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
    // On success the browser navigates to Google — we only get here on error.
    if (error) {
      toast.error("Couldn't start Google sign-in", {
        description: error.message,
      });
      setGoogleLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {view === "password" ? (
        // The lead: email + password sign-in, plus account creation (which proves ownership
        // via the OTP path then sets the password). Forgot / "use a code" switch the view.
        <PasswordAuth
          emailRedirectTo={callbackUrl()}
          onUseCode={() => {
            setCodeReset(false);
            setView("code");
          }}
          onForgot={() => {
            setCodeReset(true);
            setView("code");
          }}
        />
      ) : (
        // The alternative: the shared dual-path email sign-in (6-digit code + magic-link
        // fallback). On a successful in-page verify, land host-aware — or, when we got here
        // via "Forgot password?", on /account?reset=1 so the host can set a new password.
        <div className="space-y-3">
          {codeReset && (
            <p className="text-sm text-muted-foreground">
              Enter your email and we&rsquo;ll send a code. After you verify,
              you can set a new password.
            </p>
          )}
          <EmailSignIn
            emailRedirectTo={callbackUrl()}
            onVerified={() => {
              router.push(
                codeReset
                  ? "/account?reset=1"
                  : loginTarget(window.location.host),
              );
              router.refresh();
            }}
          />
          <button
            type="button"
            onClick={() => {
              setCodeReset(false);
              setView("password");
            }}
            className="block w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Back to password sign-in
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={signInWithGoogle}
        disabled={googleLoading}
      >
        <GoogleIcon />
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </Button>
    </div>
  );
}
