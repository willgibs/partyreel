"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import { AlmostIn, DoorHeading } from "@/components/guest/door/heading";
import { DoorCheckStroke, useDoorLitVars } from "@/components/guest/door/lit";
import { Button } from "@/components/ui/button";
import { ClientForm } from "@/components/ui/client-form";
import { floatingKeyboardFoot } from "@/components/ui/floating-layer";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordGateProps = {
  // The event's qr_token (the single link); the unlock cookie is event-scoped.
  token: string;
  eventName: string;
  /** Fired the instant the unlock succeeds, so the entry surface can hold the
   *  "You're in" beat over the router.refresh() roundtrip. */
  onUnlocked?: () => void;
  /** The held beat ran past the watchdog (the refresh hung): show Retry.
   *  The unlock cookie is set, so retrying always recovers. */
  stalled?: boolean;
  onRetry?: () => void;
};

export function PasswordGate({
  token,
  eventName,
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
  // The album's light for the unlock's fill (`beat=lit`): the house five here, since a locked
  // album shows nothing to sample before it opens.
  const litVars = useDoorLitVars();

  // Client-side first barrier (cost/DDoS): after a burst of wrong guesses, impose a short cooldown
  // BEFORE the next server hit, so honest hammering doesn't cost a Vercel invocation per try. The
  // server-side limiter (the sole, unbypassable throttle, since verify_event_password is
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
          warm "almost in" framing: protection, not a wall.
          ★ FROM THE LEFT (the carried call `password-left`, identity-door r3):
          it reads the way every other step of the door reads, lit like them
          (the Lock in the lamp's light), its words untouched (voice-guest's
          `ask` asks them). The title keeps its h1, the guest title step the
          album's own h1 wears. */}
      <DoorHeading
        eyebrow={<AlmostIn>Almost in</AlmostIn>}
        titleAs="h1"
        title={`${eventName} is private`}
        // album, not gallery: the site, the app and the reel all say album.
        // voice-guest r1 `ask=warm`: the shipped gate's own cadence (identify-step.tsx's "One tap
        // and you're in") — why, then the cost, then "and you're in".
        reason="This album is just for the guests. One password and you're in."
      />
      <ClientForm onSubmit={onSubmit} className="w-full space-y-3">
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
            // NO autofocus: on iOS the keyboard would ambush the mid-transition
            // sheet and cover it. The keyboard rises only on an intentional
            // tap; the drawer's repositionInputs lifts the focused field above
            // it.
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
            // h-11 + 16px text: the gate input size (16px also stops the iOS
            // focus auto-zoom).
            className="h-11 pr-10 text-base"
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
        {(cooldownLeft > 0 || error) && !done && (
          <p
            id="password-gate-error"
            // role="alert" so a wrong password is ANNOUNCED the moment it
            // renders. Without it the only failure signal would be colour.
            role="alert"
            className="text-sm text-destructive"
          >
            {cooldownLeft > 0
              ? `Too many tries. You can go again in ${cooldownLeft}s.`
              : error}
          </p>
        )}
        {/* THE SUCCESS MORPH, IN THE ALBUM'S LIGHT (`identity-door` r3, Will's `beat=lit`): the
            gate stays PLANTED and the Unlock button itself fills with the lamp's hues (the house
            five: a locked album shows nothing to sample), its check drawing in and "You're in"
            revealed, for the whole held beat; the subtext says what's happening. If the refresh
            hangs past the watchdog, the button becomes the Retry (the cookie is set, so it always
            recovers; the form never re-enables). */}
        <div
          data-sheet-primary
          className={cn("relative", floatingKeyboardFoot)}
        >
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
              data-unlock-lit={done ? "" : undefined}
              className={cn(
                "relative w-full",
                done && "door-bloom-button disabled:opacity-100",
              )}
              style={done ? litVars : undefined}
              disabled={pending || done || !password.trim() || cooldownLeft > 0}
            >
              {done ? (
                <span
                  key="in"
                  data-unlock-success
                  className="flex items-center gap-2"
                >
                  <DoorCheckStroke className="size-4.5" />
                  <span
                    data-door-line
                    style={
                      {
                        "--door-line-rise": "6px",
                        "--door-line-base": "60ms",
                      } as CSSProperties
                    }
                  >
                    You&rsquo;re in
                  </span>
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
        </div>
        {done && (
          // Keyed by what it says, so a stall's sentence arrives with the same reveal.
          <p
            key={stalled ? "stalled" : "opening"}
            data-door-line
            style={
              {
                "--door-line-base": stalled ? "0ms" : "140ms",
              } as CSSProperties
            }
            className="text-center text-sm text-muted-foreground"
          >
            {stalled
              ? "You're unlocked, the album just didn't open. Give it one more tap."
              : "Opening the album"}
          </p>
        )}
      </ClientForm>
    </div>
  );
}
