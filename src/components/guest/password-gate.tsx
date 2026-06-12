"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordGateProps = {
  // The event's qr_token (the single link); the unlock cookie is event-scoped.
  token: string;
  eventName: string;
  // Kept for the polished view-only redesign (Part 2); /e/ uses the default light.
  variant?: "light" | "dark";
};

export function PasswordGate({
  token,
  eventName,
  variant = "light",
}: PasswordGateProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const dark = variant === "dark";

  // Client-side first barrier (cost/DDoS): after a burst of wrong guesses, impose a short cooldown
  // BEFORE the next server hit, so honest hammering doesn't cost a Vercel invocation per try. The
  // server-side limiter (now the sole, unbypassable throttle once verify_event_password is
  // service-role-only) is the real guard; this just keeps honest-traffic load + cost down.
  const failsRef = useRef(0);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const id = setTimeout(() => setCooldownLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(id);
  }, [cooldownLeft]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password.trim() || pending || cooldownLeft > 0) return;
    setError(null);
    start(async () => {
      const res = await fetch("/api/guests/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_token: token, password }),
      });
      // Wait for the Set-Cookie before refreshing so the RSC sees it.
      if (res.ok) {
        router.refresh();
        return;
      }
      // Client throttle: after every 5 wrong guesses, a 20s cooldown before the next server hit.
      failsRef.current += 1;
      if (failsRef.current % 5 === 0) setCooldownLeft(20);
      setError("That password didn't work. Try again.");
    });
  }

  return (
    <div className="flex w-full flex-col items-center gap-4 text-center">
      {/* Rendered as the entry modal's password STEP (the modal provides the surface + entrance);
          no full-screen wrapper. The form + the 5-wrong/20s cooldown + the unlock call are unchanged. */}
      <div
        className={cn(
          "flex size-11 items-center justify-center rounded-full",
          dark ? "bg-white/10 text-white" : "bg-muted text-muted-foreground",
        )}
      >
        <Lock className="size-5" />
      </div>
      <div className="space-y-1">
        <h1 className="font-heading text-xl text-balance">{eventName}</h1>
        <p
          className={cn(
            "max-w-xs text-[15px]",
            dark ? "text-white/60" : "text-muted-foreground",
          )}
        >
          This event is password protected. Enter the password the host shared
          to view it.
        </p>
      </div>
      <form onSubmit={onSubmit} className="w-full space-y-3">
        <div className="relative">
          <Input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Password"
            autoComplete="off"
            // NO autofocus (Phase 4.5 R3): on iOS the keyboard ambushed the
            // mid-transition sheet and covered it. The keyboard now rises only
            // on an intentional tap; the drawer's repositionInputs lifts the
            // focused field above it.
            aria-label="Event password"
            aria-invalid={error ? true : undefined}
            className={cn(
              "pr-10",
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
        {(cooldownLeft > 0 || error) && (
          <p
            className={cn(
              "text-sm",
              dark ? "text-red-300" : "text-destructive",
            )}
          >
            {cooldownLeft > 0
              ? `Too many attempts. Try again in ${cooldownLeft}s.`
              : error}
          </p>
        )}
        <Button
          type="submit"
          className="h-11 w-full text-[15px]"
          disabled={pending || !password.trim() || cooldownLeft > 0}
        >
          {pending
            ? "Unlocking…"
            : cooldownLeft > 0
              ? `Wait ${cooldownLeft}s`
              : "Unlock"}
        </Button>
      </form>
    </div>
  );
}
