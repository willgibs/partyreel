"use client";

/**
 * DISCONNECT, ASKED FIRST (the board's confirm): what stops (a send under way) and what stays (everything already in
 * her Drive). Partyreel deletes its key at once and revokes it at Google; when Google does not confirm, she is told how
 * to finish it herself.
 */
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popup, PopupContent, PopupFooter, PopupHeader } from "@/components/ui/popup";
import { formatCount } from "@/lib/format/count";

import { disconnectDriveAction } from "./actions";
import { GOOGLE_CONNECTIONS_URL } from "./drive-client";

export function DriveDisconnect({ email, running }: { email: string | null; running: number }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const disconnect = () =>
    start(async () => {
      const answer = await disconnectDriveAction();
      setOpen(false);
      if (!answer.ok) {
        toast.error(answer.message);
        return;
      }
      if (answer.revoked) {
        toast.success("Google Drive is disconnected.", { description: "Everything already sent stays in your Drive." });
      } else {
        toast.warning("Partyreel deleted its key to your Drive.", {
          description: "To be sure, remove Partyreel in your Google account too.",
          duration: Infinity,
          action: { label: "Open Google", onClick: () => window.open(GOOGLE_CONNECTIONS_URL, "_blank", "noopener,noreferrer") },
        });
      }
    });
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        Disconnect
      </Button>
      <Popup open={open} onOpenChange={setOpen}>
        <PopupContent kind="confirm">
          <PopupHeader
            title="Disconnect Google Drive?"
            description={`Partyreel stops sending to ${email ?? "your Google Drive"} and deletes its key to it. Everything already sent stays in your Drive.${
              running > 0 ? ` ${running === 1 ? "1 send in progress" : `${formatCount(running)} sends in progress`} will stop.` : ""
            }`}
          />
          <PopupFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={pending} onClick={disconnect}>
              Disconnect
            </Button>
          </PopupFooter>
        </PopupContent>
      </Popup>
    </>
  );
}
