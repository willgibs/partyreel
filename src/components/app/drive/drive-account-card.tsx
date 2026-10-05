/**
 * ACCOUNT'S GOOGLE DRIVE CARD (Will, desk 2: `account = card`): under Plan, everything about the connection in one
 * place: which Google account (the address only when Google verified it), since when, the Partyreel folder in her
 * Drive, what has been sent, and Disconnect. Without a connection, what connecting does and its one press. Where Send to
 * Google Drive is not set up on this deployment it says so in words, as the three doors do (`NOT_SET_UP`), and offers no
 * press: a Connect there could only come back as "isn't set up yet".
 */
import { ExternalLink } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { connectHref, DRIVE_ACCOUNT_ANCHOR } from "@/lib/drive/links";
import {
  readConnection,
  readMySends,
  readMySentTotals,
} from "@/lib/db/queries/drive";
import { driveConfigured } from "@/lib/env";
import { formatCount } from "@/lib/format/count";
import { formatDateInZone } from "@/lib/format/date-in-zone";
import { formatBytes } from "@/lib/utils";

import { DriveDisconnect } from "./drive-disconnect";
import { DriveName } from "./drive-parts";
import { NOT_SET_UP } from "./not-set-up";

export async function DriveAccountCard({
  userId,
  zone,
}: {
  userId: string;
  zone: string;
}) {
  if (!driveConfigured()) {
    return (
      <Card
        id={DRIVE_ACCOUNT_ANCHOR}
        className="scroll-mt-6"
        data-drive-card="unavailable"
      >
        <CardHeader>
          <CardTitle>
            <DriveName className="gap-2" />
          </CardTitle>
          <CardDescription>
            Where Send to Drive puts your albums. Partyreel sees only what it
            puts there.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p
            role="status"
            className="text-sm text-pretty text-muted-foreground"
          >
            <span className="font-medium text-foreground">
              {NOT_SET_UP.title}
            </span>{" "}
            {NOT_SET_UP.detail}
          </p>
        </CardContent>
      </Card>
    );
  }
  const [connection, totals, sends] = await Promise.all([
    readConnection(userId),
    readMySentTotals(),
    readMySends(),
  ]);
  const connect = connectHref("/account");
  const running = sends.filter((s) =>
    ["preparing", "sending", "paused", "checking"].includes(s.status),
  ).length;

  return (
    <Card
      id={DRIVE_ACCOUNT_ANCHOR}
      className="scroll-mt-6"
      data-drive-card={connection ? connection.status : "none"}
    >
      <CardHeader>
        <CardTitle>
          <DriveName className="gap-2" />
        </CardTitle>
        <CardDescription>
          Where Send to Drive puts your albums. Partyreel sees only what it puts
          there.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!connection ? (
          <>
            <p className="text-sm text-pretty text-muted-foreground">
              Send an album&rsquo;s originals to your own Google Drive, a folder
              an album, from its Download. Disconnect any time: what was sent
              stays yours.
            </p>
            <Button asChild size="sm">
              <a href={connect}>Connect Google Drive</a>
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarFallback className="text-[10px]">
                  {(connection.email ?? "G").slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">
                  {connection.email ?? "Your Google account"}
                </span>
                <span className="text-xs text-muted-foreground">{`Connected ${formatDateInZone(connection.createdAt, zone)}`}</span>
              </span>
              {connection.status === "connected" ? (
                <Badge variant="success">Connected</Badge>
              ) : connection.status === "failing" ? (
                <Badge variant="warning">Needs you</Badge>
              ) : (
                <Badge variant="warning">Lost access</Badge>
              )}
            </div>
            {connection.status !== "connected" ? (
              <p className="text-sm text-pretty text-muted-foreground">
                {connection.status === "revoked"
                  ? "Google says Partyreel can no longer add files to this Drive. Reconnect, and anything paused carries on where it stopped."
                  : "Google hasn't let Partyreel renew its access lately. Reconnect to keep sending."}
              </p>
            ) : null}
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">Folder</dt>
              <dd className="min-w-0">
                {connection.rootFolderId ? (
                  <a
                    href={`https://drive.google.com/drive/folders/${connection.rootFolderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-w-0 items-center gap-1.5 underline-offset-4 hover:underline"
                  >
                    <span className="truncate">My Drive › Partyreel</span>
                    <ExternalLink
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  </a>
                ) : (
                  <span className="text-muted-foreground">
                    Made at your first send
                  </span>
                )}
              </dd>
              <dt className="text-muted-foreground">Sent</dt>
              <dd className="tabular-nums">
                {totals.albums === 0
                  ? "Nothing yet"
                  : `${formatCount(totals.albums)} ${totals.albums === 1 ? "album" : "albums"} · ${formatBytes(totals.bytes)}${
                      totals.lastAt
                        ? ` · the last on ${formatDateInZone(totals.lastAt, zone)}`
                        : ""
                    }`}
              </dd>
            </dl>
            <div className="flex flex-wrap gap-2">
              {connection.status !== "connected" ? (
                <Button asChild size="sm">
                  <a href={connect}>Reconnect</a>
                </Button>
              ) : null}
              <DriveDisconnect email={connection.email} running={running} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
