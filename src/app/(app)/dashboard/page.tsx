import type { Metadata } from "next";
import { CalendarPlus } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your events</h1>
          <p className="text-sm text-muted-foreground">
            Create an event, share its QR code, and watch the photos roll in.
          </p>
        </div>
        <Button disabled>
          <CalendarPlus /> New event
        </Button>
      </div>
      <EmptyState
        icon={CalendarPlus}
        title="No events yet"
        description="Event creation lands in the next build. You'll generate a QR code here and share it with your guests."
      />
    </div>
  );
}
