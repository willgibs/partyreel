"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { switchEmail } from "@/components/guest/door/switch-email";
import { Button } from "@/components/ui/button";
import { askToJoinEvent } from "@/lib/guest/join";
import { setStoredSession } from "@/lib/guest/use-stored-session";
import { markWelcomeSeen } from "@/lib/guest/use-welcome-seen";

/**
 * THE UNLISTED READER'S TWO WORDS (event-safety r1, `unlisted=ask`: "Ask Maya to let me in" as the
 * primary, "Use a different email" as the secondary, which "handles both the 'hey host, could you let
 * me in' and 'oops wrong email' situations"). The host is named rather than given a pronoun: a display
 * name can be anyone's ("Maya", "The Chens").
 */
export function unlistedAskCopy(hostName?: string | null): {
  primary: string;
  secondary: string;
} {
  const host = hostName?.trim() || null;
  return {
    primary: host ? `Ask ${host} to let me in` : "Ask the host to let me in",
    secondary: "Use a different email",
  };
}

/**
 * THE SHUT DOOR'S FOOT FOR SOMEONE THE INVITE LIST DOES NOT NAME (`locked-door` r2 places it there:
 * under the one message every cause reads, as this reader's own foot, so the message never moves and a
 * block still reads as the other causes do). Asking mints her a waiting ticket (`ask_to_join`), and the
 * refresh lands on the held door; an address the list names after all comes straight in instead. A
 * declined ask is a block, which meets the shut door with no foot.
 */
export function UnlistedAsk({
  qrToken,
  hostName,
}: {
  qrToken: string;
  hostName?: string | null;
}) {
  const router = useRouter();
  const copy = unlistedAskCopy(hostName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    setBusy(true);
    setError(null);
    const result = await askToJoinEvent({ qrToken });
    if (!result.ok) {
      setBusy(false);
      setError(result.refusal.message);
      return;
    }
    // The ticket rides this device as a join's does (the cookie half came back on the response), so
    // the held door's check-in carries it beside the account.
    setStoredSession(qrToken, result.guest.sessionToken);
    // ★ SHE HAS MET THE EVENT AT ITS DOOR AND ASKED (build 23's NIT-1): the refresh lands on the held door
    // with no welcome in front of it, as the ask where the host lets each guest in already does (that
    // one comes after the welcome).
    markWelcomeSeen(qrToken);
    router.refresh();
  }

  return (
    <div data-shut-door-ask className="flex w-full flex-col gap-2">
      <Button
        type="button"
        size="cta"
        className="w-full"
        disabled={busy}
        onClick={() => void ask()}
      >
        {busy ? "Asking…" : copy.primary}
      </Button>
      {error && (
        <p role="alert" className="text-reading text-destructive">
          {error}
        </p>
      )}
      <Button
        type="button"
        variant="ghost"
        className="w-full text-muted-foreground"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void switchEmail();
        }}
      >
        {copy.secondary}
      </Button>
    </div>
  );
}
