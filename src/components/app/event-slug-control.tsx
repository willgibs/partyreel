"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  clearEventSlugAction,
  setEventSlugAction,
} from "@/app/(app)/dashboard/actions";
import { CopyShareLink } from "@/components/app/copy-share-link";
import { LockChip } from "@/components/app/pricing/lock-chip";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { eventUrl } from "@/lib/events/share-urls";
import { evaluateSlugInput, suggestSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type EventSlugControlProps = {
  eventId: string;
  // Absolute site origin — used to render the pretty /e/<slug> link (reusing CopyShareLink).
  siteUrl: string;
  // The persisted custom slug (events.custom_slug) or null; updates after an action revalidates.
  slug: string | null;
  // Tier-locked on Free: can't CREATE or CHANGE a slug. A downgraded host keeps the link
  // visible and can still Remove it (no tier check on clear) — mirrors EventPasswordControl.
  locked: boolean;
  // Event name → a one-click slug suggestion for first-time setup (optional).
  eventName?: string;
  /**
   * Where Checkout should return a buyer who unlocked this control
   * (`back=finish`). The share sheet passes its own room; the create wizard
   * omits it, because the host is mid-flow on a page with nothing to reopen.
   */
  returnTo?: string;
};

// The live status of what's in the input (Phase 2). The sync kinds (idle/invalid/current)
// come from evaluateSlugInput; checking/available/taken come from the debounced RPC.
type Status =
  | { kind: "idle" }
  | { kind: "invalid"; message: string }
  | { kind: "current" }
  | { kind: "checking"; slug: string }
  | { kind: "available"; slug: string }
  | { kind: "taken"; slug: string };

const DEBOUNCE_MS = 400;

// Phase 2: live availability as you type + a change/remove warning dialog + a name-based
// suggestion. Reused verbatim by the create wizard's Share step (the event exists there).
export function EventSlugControl({
  eventId,
  siteUrl,
  slug,
  locked,
  eventName,
  returnTo,
}: EventSlugControlProps) {
  // The input shows when there's no slug yet, or when the host taps "Change".
  const [editing, setEditing] = useState(!slug);
  const [value, setValue] = useState(slug ?? "");
  const [saving, startSave] = useTransition();
  const [clearing, startClear] = useTransition();
  // The confirm dialog: null = closed. "change" carries the NEW slug to save; "remove" uses
  // the current `slug`. Both warn that the old link breaks (there's no redirect).
  const [confirm, setConfirm] = useState<
    null | { mode: "change"; slug: string } | { mode: "remove" }
  >(null);

  // One browser client for the lifetime of the control; authenticated (the host's session).
  const [supabase] = useState(() => createClient());
  // The async availability verdict for ONE specific slug — set ONLY inside the debounced RPC
  // callback. The synchronous kinds (idle/invalid/current) are DERIVED in render below; never
  // setState synchronously in an effect body (the cascading-render lint).
  const [availability, setAvailability] = useState<{
    slug: string;
    available: boolean;
  } | null>(null);
  // Race guard: each check bumps this; a response lands only if it's still the latest.
  const reqId = useRef(0);

  // Host without the scheme, for compact link previews (e.g. "partyreel.com").
  const host = siteUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const suggestion = !slug && eventName ? suggestSlug(eventName) : null;

  // Pure, synchronous classification (no network). Only "check" needs the live RPC.
  const evaluated = evaluateSlugInput(value, slug);
  const checkTarget = evaluated.kind === "check" ? evaluated.normalized : null;

  // Debounced availability for the current check target. setState happens ONLY inside the
  // deferred timeout/await (not synchronously in the effect body), and the request-id guard
  // drops stale responses. set_event_slug stays authoritative on save.
  useEffect(() => {
    if (!checkTarget) {
      reqId.current += 1; // invalidate any in-flight check
      return;
    }
    const id = ++reqId.current;
    const timer = setTimeout(async () => {
      const { data, error } = await supabase.rpc("check_slug_available", {
        p_slug: checkTarget,
        p_event_id: eventId,
      });
      if (id !== reqId.current) return; // a newer keystroke superseded this
      // On a transient check error, don't block the host — set_event_slug is the backstop.
      setAvailability({
        slug: checkTarget,
        available: Boolean(error) || Boolean(data),
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [checkTarget, eventId, supabase]);

  // Display status: the synchronous kinds straight from `evaluated`; checking/available/taken
  // from the matching async verdict (else "checking" while the debounce/RPC is in flight).
  const status: Status =
    evaluated.kind === "idle"
      ? { kind: "idle" }
      : evaluated.kind === "invalid"
        ? { kind: "invalid", message: evaluated.message }
        : evaluated.kind === "current"
          ? { kind: "current" }
          : availability && availability.slug === evaluated.normalized
            ? availability.available
              ? { kind: "available", slug: evaluated.normalized }
              : { kind: "taken", slug: evaluated.normalized }
            : { kind: "checking", slug: evaluated.normalized };

  function runSave(target: string) {
    startSave(async () => {
      const result = await setEventSlugAction(eventId, target);
      if (!result || result.ok) {
        toast.success("Custom link saved.");
        setValue(target);
        setEditing(false);
        setConfirm(null);
        return;
      }
      toast.error("Couldn't save the custom link.", {
        description: result.message,
      });
    });
  }

  function onSaveClick() {
    if (status.kind !== "available") return; // Save is enabled only when available
    // Changing an EXISTING slug breaks the old link → confirm first. First-time set just saves.
    if (slug) setConfirm({ mode: "change", slug: status.slug });
    else runSave(status.slug);
  }

  function runRemove() {
    startClear(async () => {
      const result = await clearEventSlugAction(eventId);
      if (!result || result.ok) {
        toast.success("Custom link removed.");
        setValue("");
        setEditing(true);
        setConfirm(null);
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
        // Free + no slug: can't create one. The chip is the control now
        // (`words=chip`): it names itself, its tooltip says why and what opens
        // it, and pressing it opens the pricing sheet led by this feature.
        <LockChip feature="custom_slug" returnTo={returnTo} />
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
              onClick={() => setConfirm({ mode: "remove" })}
              disabled={clearing}
              className="text-destructive hover:text-destructive"
            >
              {clearing ? "Removing…" : "Remove"}
            </Button>
          </div>
        </div>
      ) : (
        // Editing: the slug input with the /e/ prefix + a live availability indicator.
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
                aria-invalid={
                  status.kind === "taken" || status.kind === "invalid"
                }
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="pl-9 pr-9"
              />
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                {status.kind === "checking" && (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                )}
                {status.kind === "available" && (
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                )}
                {(status.kind === "taken" || status.kind === "invalid") && (
                  <AlertCircle className="size-4 text-destructive" />
                )}
              </span>
            </div>
            <Button
              type="button"
              onClick={onSaveClick}
              disabled={saving || status.kind !== "available"}
            >
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

          {status.kind === "idle" ? (
            !slug ? (
              <p className="text-xs text-muted-foreground">
                A friendly link to share instead of the permanent one above.
                Lowercase letters, numbers, and hyphens. You can change it
                anytime.
              </p>
            ) : null
          ) : (
            <p
              key={status.kind}
              data-slug-status
              className={cn(
                "text-xs",
                status.kind === "available"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : status.kind === "taken" || status.kind === "invalid"
                    ? "text-destructive"
                    : "text-muted-foreground",
              )}
            >
              {status.kind === "checking" && "Checking availability…"}
              {status.kind === "available" &&
                `${host}/e/${status.slug} is available.`}
              {status.kind === "taken" && "That link is taken. Try another."}
              {status.kind === "invalid" && status.message}
              {status.kind === "current" && "This is your current link."}
            </p>
          )}

          {!slug && suggestion && value.trim() === "" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValue(suggestion)}
            >
              Use {suggestion}
            </Button>
          )}
        </div>
      )}

      {/* Change / remove confirmation — both warn that the old link breaks (no redirect). */}
      <Dialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <DialogContent>
          {confirm?.mode === "change" ? (
            <>
              <DialogHeader>
                <DialogTitle>Change your custom link?</DialogTitle>
                <DialogDescription>
                  Your current link{" "}
                  <span className="font-medium break-all text-foreground">
                    {host}/e/{slug}
                  </span>{" "}
                  stops working right away, with no redirect. Anyone who saved it
                  will need the new one. Your permanent link always keeps working.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirm(null)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => runSave(confirm.slug)}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Change link"}
                </Button>
              </DialogFooter>
            </>
          ) : confirm?.mode === "remove" ? (
            <>
              <DialogHeader>
                <DialogTitle>Remove your custom link?</DialogTitle>
                <DialogDescription>
                  <span className="font-medium break-all text-foreground">
                    {host}/e/{slug}
                  </span>{" "}
                  stops working right away. Your permanent link always keeps
                  working.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirm(null)}
                  disabled={clearing}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={runRemove}
                  disabled={clearing}
                >
                  {clearing ? "Removing…" : "Remove link"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
