"use client";

import { useState } from "react";
import { DoorOpen } from "lucide-react";

import { DoorHeading } from "@/components/guest/door/heading";
import { DoorGlyph } from "@/components/guest/door/lit";
import { switchEmail } from "@/components/guest/door/switch-email";
import { Button } from "@/components/ui/button";
import { askToJoinEvent, type JoinedGuest } from "@/lib/guest/join";

/**
 * THE ASK'S WORDS, at a door where the host lets each guest in. The host is named again rather than
 * given a pronoun: a display name can be anyone's ("Maya", "The Chens").
 */
export function askCopy(hostName?: string | null): {
  title: string;
  reason: string;
  primary: string;
} {
  const host = hostName?.trim() || null;
  return {
    title: host ? `${host} lets each guest in` : "The host lets each guest in",
    reason: `Ask to join, and the album opens right here the moment ${host ?? "the host"} lets you in.`,
    primary: "Ask to join",
  };
}

/**
 * THE ASK, for someone who arrives already confirmed at a door where the host lets each guest in: one
 * tap mints her a waiting ticket (the join), and the page refreshes onto the held door. Someone who
 * confirms her email at that door never meets it: confirming there is the ask (the confirmation's own
 * join). The invite list's ask is the shut door's foot instead (`door/unlisted-ask.tsx`).
 */
export function AskStep({
  qrToken,
  hostName,
  onAsked,
}: {
  qrToken: string;
  hostName?: string | null;
  /** The ask landed: adopt the ticket, then refresh onto the held door. */
  onAsked: (guest: JoinedGuest) => void;
}) {
  const copy = askCopy(hostName);
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
    onAsked(result.guest);
  }

  return (
    <div data-door-ask className="flex flex-col gap-6">
      <DoorHeading
        eyebrow={
          <>
            <DoorGlyph icon={DoorOpen} hue={1} className="size-3" />
            Ask to join
          </>
        }
        title={copy.title}
        reason={copy.reason}
        // The shell announces the same two sentences as the sheet's name.
        hidden
      />
      <div className="flex flex-col gap-2">
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
          Use a different email
        </Button>
      </div>
    </div>
  );
}
