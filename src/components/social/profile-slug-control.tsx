"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  checkProfileSlugAction,
  clearProfileSlugAction,
  setProfileSlugAction,
} from "@/app/(app)/account/social-actions";
import { CopyShareLink } from "@/components/app/copy-share-link";
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
import { profileSlugSchema } from "@/lib/validation/profile";
import { cn } from "@/lib/utils";

// The live status of what's in the input — the EventSlugControl state machine,
// re-derived here for the PROFILE handle (whose validity source is
// profileSlugSchema and whose availability source is a signed-in server action,
// not the event RPC).
type Status =
  | { kind: "idle" }
  | { kind: "invalid"; message: string }
  | { kind: "current" }
  | { kind: "checking"; slug: string }
  | { kind: "available"; slug: string }
  | { kind: "taken"; slug: string };

const DEBOUNCE_MS = 400;

/**
 * Claim / change / release the public profile handle (/u/[slug]). Paid feature
 * via the house upgrade-hint pattern (visible-but-locked, like the composer's
 * 60s chip and the event slug): Free sees the affordance + the /pricing nudge,
 * never a hidden feature. A downgraded account keeps its live handle and can
 * still Remove it (setProfileSlug gates SET only; clear never tier-checks).
 */
export function ProfileSlugControl({
  siteUrl,
  slug,
  locked,
}: {
  siteUrl: string;
  /** The persisted profiles.slug, or null; refreshes after an action revalidates. */
  slug: string | null;
  /** Tier-locked (Free): can't CLAIM or CHANGE a handle; Remove always works. */
  locked: boolean;
}) {
  const [editing, setEditing] = useState(!slug);
  const [value, setValue] = useState(slug ?? "");
  const [saving, startSave] = useTransition();
  const [clearing, startClear] = useTransition();
  const [confirm, setConfirm] = useState<
    null | { mode: "change"; slug: string } | { mode: "remove" }
  >(null);

  // The async availability verdict for ONE candidate; set only inside the
  // debounced callback (never synchronously in the effect body).
  const [availability, setAvailability] = useState<{
    slug: string;
    available: boolean;
  } | null>(null);
  const reqId = useRef(0);

  const host = siteUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  // Pure, synchronous classification. Only a valid, non-current candidate needs
  // the network check.
  const trimmed = value.trim().toLowerCase();
  const parsed = trimmed ? profileSlugSchema.safeParse(trimmed) : null;
  const evaluated:
    | { kind: "idle" }
    | { kind: "invalid"; message: string }
    | { kind: "current" }
    | { kind: "check"; normalized: string } = !trimmed
    ? { kind: "idle" }
    : !parsed || !parsed.success
      ? {
          kind: "invalid",
          message:
            parsed?.error.issues[0]?.message ?? "That handle isn't available.",
        }
      : parsed.data === slug
        ? { kind: "current" }
        : { kind: "check", normalized: parsed.data };
  const checkTarget = evaluated.kind === "check" ? evaluated.normalized : null;

  useEffect(() => {
    if (!checkTarget) {
      reqId.current += 1; // invalidate any in-flight check
      return;
    }
    const id = ++reqId.current;
    const timer = setTimeout(async () => {
      const { available } = await checkProfileSlugAction(checkTarget);
      if (id !== reqId.current) return; // superseded by a newer keystroke
      setAvailability({ slug: checkTarget, available });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [checkTarget]);

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
      const result = await setProfileSlugAction(target);
      if (result.ok) {
        toast.success("Your handle is set.");
        setValue(target);
        setEditing(false);
        setConfirm(null);
        return;
      }
      toast.error("Couldn't save your handle.", {
        description: result.message,
      });
    });
  }

  function onSaveClick() {
    if (status.kind !== "available") return;
    if (slug) setConfirm({ mode: "change", slug: status.slug });
    else runSave(status.slug);
  }

  function runRemove() {
    startClear(async () => {
      const result = await clearProfileSlugAction();
      if (result.ok) {
        toast.success("Handle removed.");
        setValue("");
        setEditing(true);
        setConfirm(null);
        return;
      }
      toast.error("Couldn't remove your handle.", {
        description: result.message,
      });
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Profile handle
      </p>

      {locked && !slug ? (
        <p className="text-sm text-muted-foreground">
          A public profile page is a paid feature.{" "}
          <Link
            href="/pricing"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Upgrade to claim your handle
          </Link>
          .
        </p>
      ) : slug && !editing ? (
        <div className="space-y-2">
          <CopyShareLink url={`${siteUrl.replace(/\/+$/, "")}/u/${slug}`} />
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/u/${slug}`}>View profile</Link>
            </Button>
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
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-48 flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
                /u/
              </span>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="your-name"
                aria-label="Profile handle"
                aria-invalid={
                  status.kind === "taken" || status.kind === "invalid"
                }
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="pr-9 pl-9"
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
              {saving ? "Saving…" : "Save handle"}
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
                Your public profile address. Lowercase letters, numbers, and
                hyphens. Events you choose to share appear there.
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
                `${host}/u/${status.slug} is available.`}
              {status.kind === "taken" && "That handle is taken. Try another."}
              {status.kind === "invalid" && status.message}
              {status.kind === "current" && "This is your current handle."}
            </p>
          )}
        </div>
      )}

      {/* Change / remove confirmation — both warn the old address breaks. */}
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
                <DialogTitle>Change your handle?</DialogTitle>
                <DialogDescription>
                  Your current address{" "}
                  <span className="font-medium break-all text-foreground">
                    {host}/u/{slug}
                  </span>{" "}
                  stops working right away, with no redirect, and the old handle
                  becomes available to anyone.
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
                  {saving ? "Saving…" : "Change handle"}
                </Button>
              </DialogFooter>
            </>
          ) : confirm?.mode === "remove" ? (
            <>
              <DialogHeader>
                <DialogTitle>Remove your handle?</DialogTitle>
                <DialogDescription>
                  Your profile page at{" "}
                  <span className="font-medium break-all text-foreground">
                    {host}/u/{slug}
                  </span>{" "}
                  stops working right away, and the handle becomes available to
                  anyone. Your account and events aren&rsquo;t affected.
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
                  {clearing ? "Removing…" : "Remove handle"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
