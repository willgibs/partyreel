"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import {
  clearProfileSlugAction,
  setProfileSlugAction,
} from "@/app/(app)/account/social-actions";
import { CopyShareLink } from "@/components/app/copy-share-link";
import {
  HandleField,
  HandleStatusLine,
  useHandleStatus,
} from "@/components/social/handle-field";
import { Button } from "@/components/ui/button";
import {
  Popup,
  PopupContent,
  PopupFooter,
  PopupHeader,
} from "@/components/ui/popup";

/**
 * Claim / change / release the public profile handle (/u/[slug]).
 *
 * ★ FREE FOR EVERYONE SINCE 2026-09-19, and the upgrade hint that used to stand
 * here is gone with the gate. Will, in plan mode: "Free to claim for everyone,
 * as you recommend it. We can keep custom event slugs as a pro feature, but
 * handles for everyone incentivizes guests to get deeper into our ecosystem and
 * hopefully upgrade to host one day." The person this control is for is the
 * guest who was just told, on an album, that their name could be a page; a
 * /pricing wall at the end of that sentence is the whole loop broken. Custom
 * EVENT slugs followed on 2026-09-28 (the free/pro shift): GATED_EVENT_SETTINGS
 * gates nothing, and Pro is video, storage, events and unmarked clips.
 */
export function ProfileSlugControl({
  siteUrl,
  slug,
}: {
  siteUrl: string;
  /** The persisted profiles.slug, or null; refreshes after an action revalidates. */
  slug: string | null;
}) {
  const [editing, setEditing] = useState(!slug);
  const [value, setValue] = useState(slug ?? "");
  const [saving, startSave] = useTransition();
  const [clearing, startClear] = useTransition();
  const [confirm, setConfirm] = useState<
    null | { mode: "change"; slug: string } | { mode: "remove" }
  >(null);

  // The live status of what's in the input: the one machine the setup wizard's first screen
  // shares (handle-field.tsx). The host is the site's own, so an available handle reads as the
  // address it will be.
  const { status, markTaken } = useHandleStatus(value, slug);
  const host = siteUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");

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
      // Taken between the check and the write: the field says so too, without asking again.
      if (result.taken) markTaken(target);
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

      {slug && !editing ? (
        <div className="space-y-2">
          <CopyShareLink url={`${siteUrl.replace(/\/+$/, "")}/u/${slug}`} />
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/u/${slug}`}>View profile</Link>
            </Button>
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
            <HandleField
              value={value}
              onChange={setValue}
              status={status}
              className="min-w-48 flex-1"
            />
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

          <HandleStatusLine
            status={status}
            host={host}
            idleHint={
              slug
                ? undefined
                : "Your public profile address. Lowercase letters, numbers, and hyphens. Events you choose to share appear there."
            }
          />
        </div>
      )}

      {/* Change / remove confirmation — both warn the old address breaks. */}
      <Popup
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <PopupContent kind="confirm">
          {confirm?.mode === "change" ? (
            <>
              <PopupHeader
                title="Change your handle?"
                description={
                  <>
                    Your current address{" "}
                    <span className="font-medium break-all text-foreground">
                      {host}/u/{slug}
                    </span>{" "}
                    stops working right away, with no redirect, and the old
                    handle becomes available to anyone.
                  </>
                }
              />
              <PopupFooter>
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
              </PopupFooter>
            </>
          ) : confirm?.mode === "remove" ? (
            <>
              <PopupHeader
                title="Remove your handle?"
                description={
                  <>
                    Your profile page at{" "}
                    <span className="font-medium break-all text-foreground">
                      {host}/u/{slug}
                    </span>{" "}
                    stops working right away, and the handle becomes available
                    to anyone. Your account and events aren&rsquo;t affected.
                  </>
                }
              />
              <PopupFooter>
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
              </PopupFooter>
            </>
          ) : null}
        </PopupContent>
      </Popup>
    </div>
  );
}
