"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  blockFromEventAction,
  previewBlockAction,
} from "@/app/(app)/dashboard/[eventId]/guests/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupFooter,
  PopupHeader,
} from "@/components/ui/popup";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  BLOCK_LEDE,
  blockedToast,
  blockTitle,
  blockTouches,
  NAMES_ONLY_OFFER,
  type BlockPreview,
  type BlockTarget,
} from "@/lib/events/event-blocks";

/**
 * THE ONE BLOCK SCREEN (Will, event-safety `entry=all`: "if 'block' is specifically clicked, that
 * could funnel all into one screen"). Every road to it is a person's look (a name in the Guests room,
 * the viewer's credit, the uploader in Review), and every one opens this confirm: the popups'
 * `confirm` kind, a centred dialog at every width, in the destructive confirm's own grammar (a title
 * that names them, one line, and "What this touches" before anything happens, like
 * `admin/destructive-sheet.tsx`).
 *
 * ★ THE NUMBER IS THE ACT'S OWN. The confirm asks the block itself for a preview when it opens (the
 * RPC's `p_preview`, which writes and locks nothing), so "Their 7 uploads move to Deleted" is the
 * count the act then moves, and Block waits until it has arrived.
 *
 * ★ ON A NAMES-ONLY ALBUM IT OFFERS THE SWITCH (the brief: "on a names-only party it holds on one
 * browser, so the block's confirmation offers Require verified emails"), off by default: turning it
 * on mid-party asks every guest to confirm an email, which is the host's call to make in the moment.
 *
 * Mounted only once its door has been pressed (the caller's), so a room of two hundred names mounts
 * none of it until a host means to block somebody.
 */
export function BlockConfirm({
  open,
  onOpenChange,
  target,
  name,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: BlockTarget;
  /** The name the host pressed Block beside, for the title before the preview lands. */
  name: string | null;
}) {
  return (
    <Popup open={open} onOpenChange={onOpenChange}>
      <PopupContent kind="confirm" size="md" data-block-confirm="">
        {/* The body is the content's child, so a closed confirm forgets its preview and its switch
            (Radix unmounts closed content), and reopening it asks again. */}
        <BlockConfirmBody
          target={target}
          name={name}
          onDone={() => onOpenChange(false)}
        />
      </PopupContent>
    </Popup>
  );
}

function BlockConfirmBody({
  target,
  name,
  onDone,
}: {
  target: BlockTarget;
  name: string | null;
  onDone: () => void;
}) {
  const router = useRouter();
  const switchId = useId();
  const [preview, setPreview] = useState<BlockPreview | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [requireVerified, setRequireVerified] = useState(false);
  const [pending, startTransition] = useTransition();

  // Keyed by the target's value, not its identity: a parent that rebuilds the object on a render
  // asks nothing twice.
  const targetKey = JSON.stringify(target);
  useEffect(() => {
    let live = true;
    void previewBlockAction(JSON.parse(targetKey)).then((result) => {
      if (!live) return;
      if (result.ok) setPreview(result.preview);
      else setFailure(result.message);
    });
    return () => {
      live = false;
    };
  }, [targetKey]);

  const who = preview?.label ?? name;

  function block() {
    if (!preview || pending) return;
    startTransition(async () => {
      const result = await blockFromEventAction(target, {
        requireVerifiedEmail: preview.namesOnly && requireVerified,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      const told = blockedToast(who, result.removed);
      toast.success(told.title, { description: told.description });
      onDone();
      router.refresh();
    });
  }

  if (preview?.already) {
    return (
      <>
        <PopupHeader
          title={who ? `${who} is already blocked` : "Already blocked"}
          description="They can't open this album or add to it. You can let them back in from Guests."
        />
        <PopupFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            Close
          </Button>
        </PopupFooter>
      </>
    );
  }

  return (
    <>
      <PopupHeader title={blockTitle(who)} description={BLOCK_LEDE} />
      <PopupBody className="space-y-4">
        <div className="rounded-md border bg-muted/50 px-3 py-2.5">
          <p className="mb-1.5 text-label font-medium text-muted-foreground uppercase">
            What this touches
          </p>
          {preview ? (
            <ul data-slot="block-touches" className="space-y-1">
              {blockTouches(preview.uploads).map((touch) => (
                <li key={touch} className="flex gap-2 text-caption">
                  <span aria-hidden className="text-muted-foreground">
                    -
                  </span>
                  <span>{touch}</span>
                </li>
              ))}
            </ul>
          ) : failure ? (
            <p role="alert" className="text-caption text-destructive">
              {failure}
            </p>
          ) : (
            <div aria-hidden className="space-y-1.5 py-0.5">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
          )}
        </div>

        {preview?.namesOnly ? (
          <div className="flex items-start justify-between gap-4">
            <Label
              htmlFor={switchId}
              className="min-w-0 flex-1 cursor-pointer flex-col items-start gap-1 font-normal"
            >
              <span className="text-sm font-medium text-foreground">
                {NAMES_ONLY_OFFER.label}
              </span>
              <span className="text-xs leading-relaxed text-pretty text-muted-foreground">
                {NAMES_ONLY_OFFER.description}
              </span>
            </Label>
            <Switch
              id={switchId}
              checked={requireVerified}
              onCheckedChange={setRequireVerified}
              disabled={pending}
            />
          </div>
        ) : null}
      </PopupBody>
      <PopupFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={block}
          disabled={!preview || pending}
          data-block-confirm-act=""
        >
          {pending ? "Blocking" : "Block"}
        </Button>
      </PopupFooter>
    </>
  );
}
