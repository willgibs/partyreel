"use client";

import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { type ActionResult } from "@/app/(app)/dashboard/actions";
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

// Shared status control for the Support + Applicants inboxes. The current status shows as a
// Badge in the trigger; picking a new one calls the passed server action (useTransition + toast).
// `action` is a server action passed down per surface (setContactStatus / setApplicationStatus).
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
  const meta = TRIAGE_STATUS_META[status];

  function change(next: TriageStatus) {
    if (next === status) return;
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          className="gap-1.5"
        >
          <Badge variant={meta.badge}>{meta.label}</Badge>
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* One labelled group and no title row: the trigger already carries the
            current status as a badge, so a header would say it twice. What the
            menu was missing is what the three rows ARE, which is a label (Card,
            Will 2026-09-17). */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>Move to</DropdownMenuLabel>
          {TRIAGE_STATUSES.map((s) => (
            <DropdownMenuItem
              key={s}
              disabled={s === status}
              onSelect={() => change(s)}
            >
              {TRIAGE_STATUS_META[s].label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
