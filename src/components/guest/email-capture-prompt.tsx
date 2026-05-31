"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Soft, one-time post-upload email capture (growth loop). The guest leaves an
// email so the host can share the album + an optional newsletter opt-in. The
// session_token is the capability; the capture_guest_email RPC is authoritative.

function promptKey(qrToken: string) {
  return `pr_email_prompt_${qrToken}`;
}

// Same-tab subscribers — the native `storage` event only fires in OTHER tabs.
const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}

// One-time gate: once the guest submits OR dismisses, never show again (this
// browser + event). Mirrors the localStorage useSyncExternalStore pattern in
// lib/guest/use-stored-session — the server snapshot is `true` so the prompt
// never flashes before hydration.
function useDismissed(key: string): [boolean, () => void] {
  const subscribe = useCallback((cb: () => void) => {
    listeners.add(cb);
    window.addEventListener("storage", cb);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", cb);
    };
  }, []);

  const dismissed = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key) === "1",
    () => true,
  );

  const dismiss = useCallback(() => {
    localStorage.setItem(key, "1");
    emit();
  }, [key]);

  return [dismissed, dismiss];
}

export function EmailCapturePrompt({
  qrToken,
  sessionToken,
}: {
  qrToken: string;
  sessionToken: string;
}) {
  const [dismissed, dismiss] = useDismissed(promptKey(qrToken));
  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (dismissed) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    // Light client check for UX; the route + RPC are authoritative.
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setError("Enter a valid email.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/guests/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_token: sessionToken,
          email: trimmed,
          newsletter_opt_in: optIn,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(
          data?.message ?? "Couldn't save your email. Please try again.",
        );
        setSubmitting(false);
        return;
      }
      dismiss(); // success → never prompt this guest again
    } catch {
      setError("Couldn't save your email. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-lg border border-border bg-card p-4 text-left"
    >
      <div className="space-y-1">
        <p className="text-sm font-medium">Want a copy of the album?</p>
        <p className="text-xs text-muted-foreground">
          Leave your email and the host can share the gallery with you — they
          may keep this event private.
        </p>
      </div>
      <Input
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="Email"
        aria-invalid={error ? true : undefined}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex items-center gap-2">
        <Switch
          id="pr-newsletter"
          size="sm"
          checked={optIn}
          onCheckedChange={setOptIn}
        />
        <Label
          htmlFor="pr-newsletter"
          className="text-xs font-normal text-muted-foreground"
        >
          Send me occasional Partyreel updates
        </Label>
      </div>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={dismiss}
          className="text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          Maybe later
        </button>
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? "Saving…" : "Save email"}
        </Button>
      </div>
    </form>
  );
}
