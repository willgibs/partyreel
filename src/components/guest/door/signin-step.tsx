"use client";

import { AccountDoor } from "@/components/auth/account-door";
import type { DoorVerified } from "@/components/auth/email-sign-in";

/**
 * LOG IN, AT THE DOOR: the chooser's third way in, for a guest who already has an account.
 *
 * ★ `AccountDoor` IN ITS `signin` WEAR, WITH A DOOR LINE OF ITS OWN. The wear's own reason speaks
 * of the photos a guest adds to an album they are already inside; at the door nothing has been
 * added yet, so the screen says what logging in does from here instead.
 *
 * ★ EVERY WAY A MEMBER CAN PROVE THEY ARE ONE LIVES HERE (a call for Will to overrule): the code,
 * Google and the quiet password link. The verification door and Create account carry the code
 * alone, so a guest who wants Google finds it where members look for it.
 *
 * No "you already had an account" line: somebody who pressed Log in knows, and saying so is noise
 * (the `signin` intent). A code or a password lands the modal's four writes; Google and the
 * emailed link leave the page and come back to the album's own mount-time claim.
 */
export function SigninStep({
  qrToken,
  onVerified,
}: {
  qrToken: string;
  onVerified: (result: DoorVerified) => void | Promise<void>;
}) {
  const copy = signinCopy();
  const emailRedirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=/e/${qrToken}`
      : `/auth/callback?next=/e/${qrToken}`;

  return (
    <div data-signin-step className="flex flex-col gap-4">
      {/* For the eye; the shell announces the same two sentences as the sheet's name. */}
      <div aria-hidden>
        <p className="font-heading text-page text-balance">{copy.title}</p>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          {copy.reason}
        </p>
      </div>
      <AccountDoor
        wear="signin"
        methods={{ code: true, google: true, password: true }}
        emailRedirectTo={emailRedirectTo}
        // The welcome carries the Terms line every guest passes once.
        consent={false}
        chrome="none"
        intent="signin"
        inputClassName="h-11 text-base"
        buttonSize="cta"
        buttonClassName="h-11"
        onVerified={onVerified}
      />
    </div>
  );
}

/** Log in's two sentences: true before a single photo is added. */
export function signinCopy(): { title: string; reason: string } {
  return {
    title: "Log in",
    reason:
      "Use your Partyreel email, and every photo you add here joins your account.",
  };
}
