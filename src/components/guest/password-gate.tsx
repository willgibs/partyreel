"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordGateProps = {
  // The event's qr_token (the single link); the unlock cookie is event-scoped.
  token: string;
  eventName: string;
  // Kept for the polished view-only redesign (Part 2); /e/ uses the default light.
  variant?: "light" | "dark";
  /** Fired the instant the unlock succeeds, so the entry surface can hold the
   *  "You're in" beat over the router.refresh() roundtrip (Phase 4.5 S5). */
  onUnlocked?: () => void;
  /** The held beat ran past the watchdog (the refresh hung): show Retry.
   *  The unlock cookie is set, so retrying always recovers. */
  stalled?: boolean;
  onRetry?: () => void;
};

export function PasswordGate({
  token,
  eventName,
  variant = "light",
  onUnlocked,
  stalled = false,
  onRetry,
}: PasswordGateProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const dark = variant === "dark";

  // Client-side first barrier (cost/DDoS): after a burst of wrong guesses, impose a short cooldown
  // BEFORE the next server hit, so honest hammering doesn't cost a Vercel invocation per try. The
  // server-side limiter (now the sole, unbypassable throttle once verify_event_password is
  // service-role-only) is the real guard; this just keeps honest-traffic load + cost down.
  const failsRef = useRef(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const id = setTimeout(
      () => setCooldownLeft((s) => Math.max(0, s - 1)),
      1000,
    );
    return () => clearTimeout(id);
  }, [cooldownLeft]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password.trim() || pending || cooldownLeft > 0 || done) return;
    setError(null);
    start(async () => {
      const res = await fetch("/api/guests/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_token: token, password }),
      });
      // Wait for the Set-Cookie before refreshing so the RSC sees it.
      if (res.ok) {
        // Blur FIRST so the iOS keyboard retracts during the success beat,
        // never mid-exit (the visualViewport jump). Then hold the beat (the
        // entry surface masks the refresh) and refresh in parallel. `done`
        // disables the form so a second submit can't fire.
        inputRef.current?.blur();
        setDone(true);
        onUnlocked?.();
        router.refresh();
        return;
      }
      // Client throttle: after every 5 wrong guesses, a 20s cooldown before the next server hit.
      failsRef.current += 1;
      if (failsRef.current % 5 === 0) setCooldownLeft(20);
      setError("That password didn't work. Give it another try.");
    });
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Rendered as the entry modal's password STEP (the modal provides the
          surface + entrance + the back chevron); no full-screen wrapper. The
          warm "almost in" framing: protection, not a wall. The form + the
          5-wrong/20s cooldown + the unlock call are unchanged. */}
      <div className="flex flex-col">
        <p
          className={cn(
            "flex items-center justify-center gap-1.5 text-label font-medium uppercase",
            dark ? "text-white/60" : "text-muted-foreground",
          )}
        >
          <Lock className="size-3" aria-hidden />
          Almost in
        </p>
        {/* The guest title step (`page`), the same one the entry sheet's
            event name and the album's own h1 wear. */}
        <h1 className="mt-1.5 text-center font-heading text-page text-balance">
          {eventName} is private
        </h1>
        <p
          className={cn(
            "mt-2 text-center text-base leading-relaxed",
            dark ? "text-white/60" : "text-muted-foreground",
          )}
        >
          {/* album, not gallery: the `noun=album` pick (Will, 2026-09-17). */}
          The host keeps this album private for guests. Enter the password from
          your invite to come in.
        </p>
      </div>
      <form onSubmit={onSubmit} className="w-full space-y-3">
        <div className="relative">
          <Input
            ref={inputRef}
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            disabled={done}
            placeholder="Password"
            autoComplete="off"
            // NO autofocus (Phase 4.5 R3): on iOS the keyboard ambushed the
            // mid-transition sheet and covered it. The keyboard now rises only
            // on an intentional tap; the drawer's repositionInputs lifts the
            // focused field above it.
            aria-label="Event password"
            aria-invalid={error ? true : undefined}
            // Point at the message below so the failure is READ OUT, not just
            // reddened: aria-invalid alone announces "invalid" without ever
            // saying why, and the cooldown countdown is the one thing a guest
            // who can't see the screen most needs to hear.
            aria-describedby={
              (cooldownLeft > 0 || error) && !done
                ? "password-gate-error"
                : undefined
            }
            className={cn(
              // h-11 + 16px text: the ratified gate input size (16px also
              // stops the iOS focus auto-zoom).
              "h-11 pr-10 text-base",
              dark &&
                "border-white/20 bg-white/5 text-white placeholder:text-white/40",
            )}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className={cn(
              "absolute inset-y-0 right-0 flex items-center px-3 transition active:scale-90",
              dark
                ? "text-white/50 hover:text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {(cooldownLeft > 0 || error) && !done && (
          <p
            id="password-gate-error"
            // role="alert" so a wrong password is ANNOUNCED the moment it
            // renders. Without it the only failure signal was colour.
            role="alert"
            className={cn(
              "text-sm",
              dark ? "text-red-300" : "text-destructive",
            )}
          >
            {cooldownLeft > 0
              ? `Too many tries. You can go again in ${cooldownLeft}s.`
              : error}
          </p>
        )}
        {/* THE RATIFIED SUCCESS MORPH (the lab pick Will judged): the gate
            stays PLANTED and the Unlock button itself morphs to --success
            green with a re-keyed check + "You're in" for the whole held beat;
            the subtext says what's happening. If the refresh hangs past the
            watchdog, the button becomes the Retry (the cookie is set, so it
            always recovers; the form never re-enables). */}
        {done && stalled ? (
          <Button
            type="button"
            onClick={onRetry}
            size="cta"
            className="w-full"
          >
            Open the album
          </Button>
        ) : (
          <Button
            type="submit"
            size="cta"
            className={cn(
              "w-full transition-colors duration-200",
              done &&
                "bg-success text-success-foreground hover:bg-success disabled:opacity-100",
            )}
            disabled={pending || done || !password.trim() || cooldownLeft > 0}
          >
            {done ? (
              <span
                key="in"
                data-unlock-success
                className="flex items-center gap-2"
              >
                <Check className="size-4.5" />
                You&rsquo;re in
              </span>
            ) : pending ? (
              "Unlocking…"
            ) : cooldownLeft > 0 ? (
              `Wait ${cooldownLeft}s`
            ) : (
              "Unlock"
            )}
          </Button>
        )}
        {done && (
          <p
            className={cn(
              "text-center text-sm",
              dark ? "text-white/60" : "text-muted-foreground",
            )}
          >
            {stalled
              ? "You're unlocked, the album just didn't open. Give it one more tap."
              : "Opening the album"}
          </p>
        )}
      </form>
    </div>
  );
}
