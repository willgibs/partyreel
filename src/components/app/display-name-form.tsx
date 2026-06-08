"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateDisplayNameAction } from "@/app/(app)/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DISPLAY_NAME_GUIDANCE,
  DISPLAY_NAME_MAX_LENGTH,
} from "@/lib/validation/profile";

// Display-name editor on the account page. The name is REQUIRED now (Phase 1) and public, so there
// is no blank-clears-it path; it is also profanity-checked server-side. Saves via the single
// display-name server action, then router.refresh() so the server-rendered surfaces (UserMenu label,
// uploader attribution, "Hosted by" byline) re-read it.
export function DisplayNameForm({
  displayName,
}: {
  displayName: string | null;
}) {
  const router = useRouter();
  const [value, setValue] = useState(displayName ?? "");
  const [saving, startSave] = useTransition();

  const dirty = value.trim() !== (displayName ?? "").trim();

  function onSubmit() {
    startSave(async () => {
      const res = await updateDisplayNameAction(value);
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success("Name saved.");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-1.5"
    >
      <Label htmlFor="display-name">Display name</Label>
      <div className="flex gap-2">
        <Input
          id="display-name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Your name"
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          autoComplete="name"
        />
        <Button type="submit" disabled={saving || !dirty || !value.trim()}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{DISPLAY_NAME_GUIDANCE}</p>
    </form>
  );
}
