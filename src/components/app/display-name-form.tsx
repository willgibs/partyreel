"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateDisplayNameAction } from "@/app/(app)/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/validation/profile";

// Display-name editor on the account page. A blank submit clears the name (→ null), which is the
// "no name set" state the guest "Hosted by" byline hides on. Saves via a server action (RLS
// self-update), then router.refresh() so the server-rendered surfaces (UserMenu label, byline)
// re-read it.
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
      toast.success(value.trim() ? "Name saved." : "Name cleared.");
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
        <Button type="submit" disabled={saving || !dirty}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Shown to guests on your events. Leave blank to hide it.
      </p>
    </form>
  );
}
