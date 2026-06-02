"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import {
  clearEventPasswordAction,
  setEventPasswordAction,
} from "@/app/(app)/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EventPasswordControlProps = {
  eventId: string;
  // From the server `event.has_password` prop (NEVER the hash). Drives the
  // set-vs-already-set branch; updates after a password action revalidates.
  hasPassword: boolean;
  // Tier-locked on Free: can't CREATE or CHANGE a password (but a downgraded host
  // can still see "Password is set" + Remove an existing one).
  locked: boolean;
  // The form syncs the visibility selector after a password action (set_event_password
  // flips visibility='password' atomically; clear reverts to 'open').
  onPasswordSet: () => void;
  onPasswordCleared: () => void;
};

export function EventPasswordControl({
  eventId,
  hasPassword,
  locked,
  onPasswordSet,
  onPasswordCleared,
}: EventPasswordControlProps) {
  // Show the input when there's no password yet, or when the host taps "Change".
  const [editing, setEditing] = useState(!hasPassword);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [saving, startSave] = useTransition();
  const [clearing, startClear] = useTransition();

  function onSet() {
    if (password.trim().length < 4) {
      toast.error("Use at least 4 characters.");
      return;
    }
    startSave(async () => {
      const result = await setEventPasswordAction(eventId, password);
      if (!result || result.ok) {
        toast.success("Password set.");
        setPassword("");
        setEditing(false);
        onPasswordSet();
        return;
      }
      toast.error("Couldn't set the password.", {
        description: result.message,
      });
    });
  }

  function onRemove() {
    startClear(async () => {
      const result = await clearEventPasswordAction(eventId);
      if (!result || result.ok) {
        toast.success("Password removed.");
        setPassword("");
        setEditing(true);
        onPasswordCleared();
        return;
      }
      toast.error("Couldn't remove the password.", {
        description: result.message,
      });
    });
  }

  // Free + no password yet: can't create one — surface the upgrade affordance.
  if (locked && !hasPassword) {
    return (
      <p className="text-sm text-muted-foreground">
        Password-protected albums are a paid feature.{" "}
        <Link
          href="/pricing"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Upgrade to enable
        </Link>
        .
      </p>
    );
  }

  // Password set + not editing: the "set" state with change/remove.
  if (hasPassword && !editing) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Password is set
        </span>
        {!locked && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
          >
            Change
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={clearing}
          className="text-destructive hover:text-destructive"
        >
          {clearing ? "Removing…" : "Remove"}
        </Button>
      </div>
    );
  }

  // Editing: the input + set button (and Cancel when changing an existing one).
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
          <Input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={hasPassword ? "New password" : "Set a password"}
            autoComplete="new-password"
            aria-label="Album password"
            className="pr-10"
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
        <Button type="button" onClick={onSet} disabled={saving}>
          {saving ? "Saving…" : "Set password"}
        </Button>
        {hasPassword && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setEditing(false);
              setPassword("");
            }}
          >
            Cancel
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Guests enter this to view the album. Share it with them separately. You
        can change it anytime, but you won&rsquo;t be able to see it again.
      </p>
    </div>
  );
}
