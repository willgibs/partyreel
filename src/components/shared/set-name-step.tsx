"use client";

import { useState, useTransition } from "react";

import { updateDisplayNameAction } from "@/app/(app)/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DISPLAY_NAME_GUIDANCE,
  DISPLAY_NAME_MAX_LENGTH,
} from "@/lib/validation/profile";

// The one required "set your name" step, reused at every gate (host onboarding + the guest upload
// flow). Writes through updateDisplayNameAction (the single, profanity-checked, service-role write
// path), then calls onSaved. The same guidance copy everywhere keeps the privacy promise identical.
export function SetNameStep({
  title = "Add your name",
  prefill = "",
  submitLabel = "Continue",
  onSaved,
}: {
  title?: string;
  prefill?: string;
  submitLabel?: string;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(prefill);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  function onSubmit() {
    startSave(async () => {
      setError(null);
      const res = await updateDisplayNameAction(value);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      onSaved();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-3"
    >
      <div className="space-y-1">
        <Label htmlFor="set-display-name" className="text-base font-semibold">
          {title}
        </Label>
        <p className="text-sm text-muted-foreground">{DISPLAY_NAME_GUIDANCE}</p>
      </div>
      <Input
        id="set-display-name"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError(null);
        }}
        placeholder="Your name"
        maxLength={DISPLAY_NAME_MAX_LENGTH}
        autoComplete="name"
        autoFocus
        aria-invalid={error ? true : undefined}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        className="w-full"
        disabled={saving || !value.trim()}
      >
        {saving ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
