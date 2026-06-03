"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import {
  clearEventSlugAction,
  setEventSlugAction,
} from "@/app/(app)/dashboard/actions";
import { CopyShareLink } from "@/components/app/copy-share-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { eventUrl } from "@/lib/events/share-urls";
import { eventSlugSchema } from "@/lib/validation/event";

type EventSlugControlProps = {
  eventId: string;
  // Absolute site origin — used to render the pretty /e/<slug> link (reusing CopyShareLink).
  siteUrl: string;
  // The persisted custom slug (events.custom_slug) or null; updates after an action revalidates.
  slug: string | null;
  // Tier-locked on Free: can't CREATE or CHANGE a slug. A downgraded host keeps the link
  // visible and can still Remove it (no tier check on clear) — mirrors EventPasswordControl.
  locked: boolean;
};

// Phase 1 (functional): set / change / remove a custom event link. Availability feedback
// is REACTIVE here — the server rejects a taken/invalid slug and we surface its message in
// a toast. Phase 2 layers the debounced LIVE availability states + a change-warning dialog
// on top of this same shell (so this isn't throwaway).
export function EventSlugControl({
  eventId,
  siteUrl,
  slug,
  locked,
}: EventSlugControlProps) {
  // The input shows when there's no slug yet, or when the host taps "Change".
  const [editing, setEditing] = useState(!slug);
  const [value, setValue] = useState(slug ?? "");
  const [saving, startSave] = useTransition();
  const [clearing, startClear] = useTransition();

  function onSave() {
    // Client-side normalize + format check for instant feedback; the action + RPC re-check.
    // The RPC stays authoritative for tier + uniqueness (the client can't know those).
    const parsed = eventSlugSchema.safeParse({ slug: value });
    if (!parsed.success) {
      toast.error(
        parsed.error.issues[0]?.message ?? "Check the link and try again.",
      );
      return;
    }
    startSave(async () => {
      const result = await setEventSlugAction(eventId, parsed.data.slug);
      if (!result || result.ok) {
        toast.success("Custom link saved.");
        setValue(parsed.data.slug);
        setEditing(false);
        return;
      }
      toast.error("Couldn't save the custom link.", {
        description: result.message,
      });
    });
  }

  function onRemove() {
    startClear(async () => {
      const result = await clearEventSlugAction(eventId);
      if (!result || result.ok) {
        toast.success("Custom link removed.");
        setValue("");
        setEditing(true);
        return;
      }
      toast.error("Couldn't remove the custom link.", {
        description: result.message,
      });
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Custom link</p>

      {locked && !slug ? (
        // Free + no slug: can't create one — surface the upgrade affordance.
        <p className="text-sm text-muted-foreground">
          A custom link is a paid feature.{" "}
          <Link
            href="/pricing"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Upgrade to enable
          </Link>
          .
        </p>
      ) : slug && !editing ? (
        // Slug set: show the pretty link + change/remove. "Change" hides on a locked
        // (downgraded) plan; "Remove" always stays so a dormant slug can be freed.
        <div className="space-y-2">
          <CopyShareLink url={eventUrl(siteUrl, slug)} />
          <div className="flex flex-wrap items-center gap-3">
            {!locked && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setValue(slug);
                  setEditing(true);
                }}
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
        </div>
      ) : (
        // Editing: the slug input (with a /e/ prefix) + Save, and Cancel when changing.
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-48 flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                /e/
              </span>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="sarahs-wedding"
                aria-label="Custom link"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="pl-9"
              />
            </div>
            <Button type="button" onClick={onSave} disabled={saving}>
              {saving ? "Saving…" : "Save link"}
            </Button>
            {slug && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setEditing(false);
                  setValue(slug);
                }}
              >
                Cancel
              </Button>
            )}
          </div>
          {slug ? (
            <p className="text-xs text-muted-foreground">
              Changing this breaks the old link. Anyone who saved it will need the
              new one (the permanent link above always works).
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              A friendly link to share instead of the permanent one above.
              Lowercase letters, numbers, and hyphens. You can change it anytime.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
