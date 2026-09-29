"use client";

import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { type ActionResult } from "@/app/(app)/dashboard/actions";
import {
  TRIAGE_WORDS,
  type InboxWords,
} from "@/components/admin/triage-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  TRIAGE_STATUS_META,
  TRIAGE_STATUSES,
  type TriageStatus,
} from "@/lib/constants/triage";

/**
 * THE ONE STATUS CONTROL EVERY INBOX SHARES (admin-triage r1, `idiom=shape`, Will 2026-09-28): the
 * current status as a badge in the trigger, a chevron, and a "Move to" menu, in the inbox's own
 * words. It only reports the pick (`onPick`): what a move DOES is the surface's, because a Reports
 * move is a verdict (Actioned on an item opens the portal's confirm) where a Support move is one
 * write.
 *
 * `moves` lists the statuses the menu offers, in order; the current one, if listed, is shown
 * disabled, which is how Support's menu has always read.
 */
export function StatusPicker<S extends string>({
  status,
  words,
  moves,
  moveLabel,
  onPick,
  disabled,
}: {
  status: S;
  words: InboxWords<S>;
  moves: readonly S[];
  /** A move's menu words when they differ from the status word ("Actioned…" when a confirm follows). */
  moveLabel?: (next: S) => string;
  onPick: (next: S) => void;
  disabled?: boolean;
}) {
  const meta = words.meta[status];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-1.5"
          aria-label={`Status: ${meta.label}. Move to another status`}
        >
          <Badge variant={meta.badge}>{meta.label}</Badge>
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* One labelled group and no title row: the trigger already carries the
            current status as a badge, so a header would say it twice. What the
            menu was missing is what the rows ARE, which is a label (Card, Will
            2026-09-17). */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>Move to</DropdownMenuLabel>
          {moves.map((s) => (
            <DropdownMenuItem
              key={s}
              disabled={s === status}
              onSelect={() => {
                if (s !== status) onPick(s);
              }}
            >
              {moveLabel?.(s) ?? words.meta[s].label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Support's and Applicants' picker: every status listed, and a pick is the passed server action
 * (setContactStatus / setApplicationStatus), with its toast.
 */
export function TriageStatusControl({
  id,
  status,
  action,
}: {
  id: string;
  status: TriageStatus;
  action: (id: string, status: TriageStatus) => Promise<ActionResult>;
}) {
  const [isPending, startTransition] = useTransition();

  function change(next: TriageStatus) {
    startTransition(async () => {
      const result = await action(id, next);
      if (result.ok) {
        toast.success(
          `Marked ${TRIAGE_STATUS_META[next].label.toLowerCase()}.`,
        );
        return;
      }
      toast.error("Couldn't update status.", { description: result.message });
    });
  }

  return (
    <StatusPicker
      status={status}
      words={TRIAGE_WORDS}
      moves={TRIAGE_STATUSES}
      onPick={change}
      disabled={isPending}
    />
  );
}
