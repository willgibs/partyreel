"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { setProfileBioAction } from "@/app/(app)/account/social-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BIO_MAX_LENGTH } from "@/lib/validation/profile";

/**
 * The one line a person writes about themselves, edited here and rendered on
 * /u/[slug] (Will, `identity=line`, 2026-09-19: "Joined June 2026 is a record,
 * not a person" was the board's argument and he took it).
 *
 * ★ IT LIVES IN THE PUBLIC PROFILE CARD, NOT THE PROFILE ONE. The display name
 * is on every upload you ever make, signed in, anywhere; this line exists at
 * exactly one address and only once a handle does. Putting it beside the handle
 * is what makes "this is the page people will read" one idea instead of two
 * cards apart.
 *
 * The counter appears only in the last quarter of the allowance, which is the
 * only moment it is information rather than pressure. The field carries no
 * `maxLength` on purpose: a pasted paragraph is refused with a sentence and the
 * words stay in the box to be edited, where a clamp would silently eat them
 * mid-word and leave the person wondering what they lost.
 */
export function ProfileBioForm({ bio }: { bio: string | null }) {
  const router = useRouter();
  const [value, setValue] = useState(bio ?? "");
  const [saving, startSave] = useTransition();

  const current = value.replace(/\s+/g, " ").trim();
  const dirty = current !== (bio ?? "");
  const over = current.length > BIO_MAX_LENGTH;
  const left = BIO_MAX_LENGTH - current.length;
  const showCount = current.length > BIO_MAX_LENGTH * 0.75;

  function onSubmit() {
    startSave(async () => {
      const result = await setProfileBioAction(value);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(current ? "Bio saved." : "Bio removed.");
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
      <Label htmlFor="profile-bio">Bio</Label>
      <Textarea
        id="profile-bio"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Weddings, mostly. Always the one with the camera."
        aria-invalid={over}
        aria-describedby="profile-bio-help"
        rows={2}
        className="resize-none"
      />
      <div className="flex items-start justify-between gap-3">
        <p id="profile-bio-help" className="text-xs text-muted-foreground">
          One line on your public page. No links. Leave it empty to remove it.
        </p>
        {/* Tabular so the number cannot shuffle the line as it counts down. */}
        {showCount && (
          <span
            aria-live="polite"
            className={`shrink-0 text-xs tabular-nums ${over ? "text-destructive" : "text-muted-foreground"}`}
          >
            {left}
          </span>
        )}
      </div>
      <Button type="submit" size="sm" disabled={saving || !dirty || over}>
        {saving ? "Saving…" : "Save bio"}
      </Button>
    </form>
  );
}
