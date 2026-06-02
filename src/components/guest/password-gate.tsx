"use client";

import { useState, useTransition, type FormEvent } from "react";
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

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password.trim() || pending) return;
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
      setError("That password didn't work. Try again.");
    });
  }

  return (
    <div
      data-password-gate
      className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 px-5 py-20 text-center"
    >
      <div
        className={cn(
          "flex size-11 items-center justify-center rounded-full",
          dark ? "bg-white/10 text-white" : "bg-muted text-muted-foreground",
        )}
      >
        <Lock className="size-5" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">{eventName}</h1>
        <p
          className={cn(
            "max-w-xs text-sm",
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
            autoFocus
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
        {error && (
          <p
            className={cn(
              "text-sm",
              dark ? "text-red-300" : "text-destructive",
            )}
          >
            {error}
          </p>
        )}
        <Button
          type="submit"
          className="w-full active:scale-[0.99]"
          disabled={pending || !password.trim()}
        >
          {pending ? "Unlocking…" : "Unlock"}
        </Button>
      </form>
    </div>
  );
}
