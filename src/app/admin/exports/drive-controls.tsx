"use client";

/**
 * THE DRIVE SECTION'S CONTROLS (drive-export.md, "Operators"): the switch, a send's acts and a connection's, each
 * through the portal's one confirmation where it ends or stops something (`destructive-sheet.tsx`), a plain press
 * where it only sets something going again.
 */
import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { ActionResult } from "@/app/(app)/dashboard/actions";
import {
  DestructiveSheet,
  GuardedSwitch,
} from "@/components/admin/destructive-sheet";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/format/count";

import {
  driveConnectionAction,
  driveDisconnectAction,
  driveRevokeAllAction,
  driveSendAction,
  toggleDriveExportsAction,
} from "./drive-actions";
import {
  REVOKE_ALL_PHRASE,
  type ConnectionActId,
  type SendActId,
} from "./drive-words";

export function DriveKillSwitch({ enabled }: { enabled: boolean }) {
  return (
    <GuardedSwitch
      enabled={enabled}
      label="Send to Google Drive"
      description={
        enabled
          ? "On. Hosts can send albums to their Google Drive."
          : "Paused. No send starts, and every send waits where it stands."
      }
      ariaLabel="Toggle Send to Google Drive"
      sheet={{
        title: "Pause Send to Google Drive?",
        lede: "No new send starts, and every running send stops at its next batch and waits. Nothing is lost: each carries on from where it stood when this is back on.",
        verb: "Pause sending",
        touches: [
          "Every host, every album, every connected Drive",
          "Running sends pause within a minute (their lanes finish the file in hand)",
          "Hosts are not emailed: a press reads as “paused for a moment”",
        ],
      }}
      onToggle={toggleDriveExportsAction}
      onMessage="Send to Google Drive is on."
      offMessage="Send to Google Drive is paused."
    />
  );
}

function usePress() {
  const [pending, start] = useTransition();
  const press = (run: () => Promise<ActionResult>, success: string) =>
    start(async () => {
      const r = await run();
      if (r.ok) toast.success(success);
      else toast.error(r.message);
    });
  return { pending, press };
}

export function DriveSendActs({
  jobId,
  albumName,
  host,
  left,
  acts,
}: {
  jobId: string;
  albumName: string;
  host: string;
  /** Files not yet in her Drive. */
  left: number;
  acts: SendActId[];
}) {
  const { pending, press } = usePress();
  const [canceling, setCanceling] = useState(false);
  if (acts.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {acts.includes("resume") ? (
        <Button
          size="xs"
          variant="outline"
          disabled={pending}
          onClick={() =>
            press(() => driveSendAction(jobId, "resume"), "Sending again.")
          }
        >
          Resume
        </Button>
      ) : null}
      {acts.includes("retry") ? (
        <Button
          size="xs"
          variant="outline"
          disabled={pending}
          onClick={() =>
            press(
              () => driveSendAction(jobId, "retry"),
              "Retrying what failed.",
            )
          }
        >
          Retry failed
        </Button>
      ) : null}
      {acts.includes("cancel") ? (
        <>
          <Button
            size="xs"
            variant="ghost"
            disabled={pending}
            onClick={() => setCanceling(true)}
          >
            Cancel
          </Button>
          <DestructiveSheet
            open={canceling}
            onOpenChange={setCanceling}
            title={`Cancel sending ${albumName}?`}
            lede="The send ends at its lanes' next report. What already reached her Drive stays; sending again later takes only the rest."
            verb="Cancel the send"
            touches={[
              `${host}'s send of ${albumName}`,
              left > 0
                ? `${formatCount(left)} ${left === 1 ? "file" : "files"} not sent`
                : "Nothing left to send",
              "Her album reads “We stopped this send”; she is not emailed",
            ]}
            severity="reversible"
            successMessage="Send canceled."
            onConfirm={() => driveSendAction(jobId, "cancel")}
          />
        </>
      ) : null}
    </div>
  );
}

export function DriveConnectionActs({
  connectionId,
  host,
  connectedAs,
  breakerSends,
  acts,
}: {
  connectionId: string;
  host: string;
  connectedAs: string | null;
  breakerSends: number;
  acts: ConnectionActId[];
}) {
  const { pending, press } = usePress();
  const [asking, setAsking] = useState<
    "pause" | "lift_breaker" | "disconnect" | null
  >(null);
  const drive = connectedAs ?? "her Google Drive";
  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      {acts.includes("resume") ? (
        <Button
          size="xs"
          variant="outline"
          disabled={pending}
          onClick={() =>
            press(
              () => driveConnectionAction(connectionId, "resume", ""),
              "Connection resumed.",
            )
          }
        >
          Resume
        </Button>
      ) : null}
      {acts.includes("lift_breaker") ? (
        <Button
          size="xs"
          variant="outline"
          disabled={pending}
          onClick={() => setAsking("lift_breaker")}
        >
          Lift breaker
        </Button>
      ) : null}
      {acts.includes("pause") ? (
        <Button
          size="xs"
          variant="ghost"
          disabled={pending}
          onClick={() => setAsking("pause")}
        >
          Pause
        </Button>
      ) : null}
      {acts.includes("disconnect") ? (
        <Button
          size="xs"
          variant="ghost"
          disabled={pending}
          onClick={() => setAsking("disconnect")}
        >
          Disconnect
        </Button>
      ) : null}
      <DestructiveSheet
        open={asking === "pause"}
        onOpenChange={(open) => setAsking(open ? "pause" : null)}
        title="Pause this connection?"
        lede="Every lease for it answers paused: her running sends stop at their next batch and wait, and a new press is refused, until an operator resumes it."
        verb="Pause the connection"
        touches={[
          `${host}, sending to ${drive}`,
          "Every send on it, running or pressed later",
          "Her album reads “Sending stopped on our side”; she is not emailed",
        ]}
        severity="reversible"
        note={{
          label: "Why",
          placeholder: "What you saw",
          hint: "Kept on the connection until it is resumed.",
          maxLength: 500,
        }}
        successMessage="Connection paused."
        onConfirm={(_typed, note) =>
          driveConnectionAction(connectionId, "pause", note)
        }
      />
      <DestructiveSheet
        open={asking === "lift_breaker"}
        onOpenChange={(open) => setAsking(open ? "lift_breaker" : null)}
        title="Lift this account's breaker?"
        lede="The 30-day sum that tripped it restarts from now, and her sends paused on it carry on."
        verb="Lift the breaker"
        touches={[
          host,
          breakerSends > 0
            ? `${formatCount(breakerSends)} paused ${breakerSends === 1 ? "send carries" : "sends carry"} on`
            : "No send is waiting on it",
          "It trips again past ten times her plan's storage in 30 days",
        ]}
        severity="reversible"
        successMessage="Breaker lifted."
        onConfirm={() =>
          driveConnectionAction(connectionId, "lift_breaker", "")
        }
      />
      <DestructiveSheet
        open={asking === "disconnect"}
        onOpenChange={(open) => setAsking(open ? "disconnect" : null)}
        title="Disconnect this Google Drive?"
        lede="For an account's recovery: Partyreel forgets its key to the Drive and revokes it at Google, exactly as her own Disconnect does."
        verb="Disconnect"
        touches={[
          `${host}, connected as ${drive}`,
          "Her running sends stop; everything already sent stays in her Drive",
          "She can connect again from Account; she is not emailed",
        ]}
        severity="reversible"
        successMessage="Disconnected and revoked at Google."
        onConfirm={() => driveDisconnectAction(connectionId)}
      />
    </div>
  );
}

/**
 * For a leak of the token key or the client secret (drive-export.md, "When a secret leaks"): every grant revoked at
 * Google, every key wiped, every host mailed to reconnect. Permanent for the grants, so the phrase is typed.
 */
export function DriveRevokeAll({ connections }: { connections: number }) {
  const [asking, setAsking] = useState(false);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
      <p className="min-w-0 flex-1 basis-64 text-caption text-muted-foreground">
        If the token key or the client secret leaks: rotate them (the runbook),
        then revoke every connection here.
      </p>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => setAsking(true)}
        disabled={connections === 0}
      >
        Revoke every connection
      </Button>
      <DestructiveSheet
        open={asking}
        onOpenChange={setAsking}
        title="Revoke every Google Drive connection?"
        lede="Each grant is revoked at Google and its key wiped here, so nothing leaked can open it. Every host's sends pause until she reconnects the same Google account, then carry on."
        verb="Revoke every connection"
        touches={[
          `${formatCount(connections)} ${connections === 1 ? "connection" : "connections"}, every host who connected`,
          "Running sends pause (nothing is lost; they resume at her reconnect)",
          "Each host gets one email asking her to reconnect",
        ]}
        severity="permanent"
        confirmText={REVOKE_ALL_PHRASE}
        successMessage="Every connection is revoked."
        onConfirm={(typed) => driveRevokeAllAction(typed)}
      />
    </div>
  );
}
