"use client";

import { type CSSProperties, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { EventSettingsForm } from "@/components/app/event-settings-form";
import type { Tier } from "@/lib/constants/tiers";
import type { HostEvent } from "@/lib/db/queries/events";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-changes-guard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * The settings-page client wrapper (S4·C): owns the form's `dirty` state (the form
 * reports up via onDirtyChange) and guards leaving with unsaved changes. The header +
 * the form move in here (they need the client guard); the Event-link + Deleted cards
 * stay in the RSC after this. The data-arrive --arrive-i 0/1 stagger is preserved -
 * this returns a FRAGMENT, so the header + form stay direct children of the route's
 * space-y-8 root, in sequence with the RSC cards (--arrive-i 2/3).
 *
 * Two guards, both keyed on `dirty`:
 *   - HARD nav (reload / tab close): useUnsavedChangesGuard -> beforeunload.
 *   - SOFT nav via the BACK-LINK: Next 16 Link.onNavigate -> preventDefault + a
 *     confirm Dialog (Discard router.push / Keep editing).
 * SCOPE (stated): the back-link + beforeunload ONLY. NOT every app-shell link, NOT the
 * browser BACK button (popstate) - both out of scope for this pass.
 */
export function SettingsWithGuard({
  event,
  tier,
  backHref,
}: {
  event: HostEvent;
  tier: Tier;
  backHref: string;
}) {
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  useUnsavedChangesGuard(dirty);

  return (
    <>
      <div
        data-arrive
        style={{ "--arrive-i": 0 } as CSSProperties}
        className="space-y-4"
      >
        <Link
          href={backHref}
          onNavigate={(e) => {
            // Soft-nav guard: intercept the back-link click while dirty and confirm.
            if (dirty) {
              e.preventDefault();
              setConfirmOpen(true);
            }
          }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to event
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">{event.name}</p>
        </div>
      </div>

      <div data-arrive style={{ "--arrive-i": 1 } as CSSProperties}>
        <EventSettingsForm event={event} tier={tier} onDirtyChange={setDirty} />
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Leaving this page will discard them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Keep editing</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                // router.push (programmatic) does NOT re-fire Link.onNavigate, so this
                // leaves cleanly; beforeunload doesn't fire on client nav either.
                setConfirmOpen(false);
                router.push(backHref);
              }}
            >
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
