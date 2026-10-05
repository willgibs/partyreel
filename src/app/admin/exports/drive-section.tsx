/**
 * SEND TO GOOGLE DRIVE ON /admin/exports (drive-export.md, "Operators"): the switch and the four readings it answers
 * to; every send still going (stuck and paused ones tinted) and the last week's that ended short, each with its acts;
 * the connections an operator may need (dying lanes, a standing breaker, an operator's pause, a lost grant); an
 * account's connection found by address, for its recovery; and the OAuth client's own idle clock. No hand-run SQL:
 * every state a send or a connection can reach has its control here.
 */
import Link from "next/link";

import { FolderUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { healthLabel, jobById, type JobId } from "@/app/admin/jobs/catalog";
import { HEALTH_BADGE } from "@/lib/admin/tone";
import type { JobHealthReport } from "@/lib/jobs/health-summary";
import {
  readDriveAdmin,
  type AdminConnection,
  type DriveAdmin,
} from "@/lib/db/queries/drive";
import { driveConfigured } from "@/lib/env";
import { formatAdminTimestamp } from "@/lib/format/admin-time";
import { formatCount } from "@/lib/format/count";
import { captureError } from "@/lib/observability/sentry";
import { formatBytes } from "@/lib/utils";

import {
  DriveConnectionActs,
  DriveKillSwitch,
  DriveRevokeAll,
  DriveSendActs,
} from "./drive-controls";
import {
  clientHealth,
  connectionActs,
  connectionWord,
  sendActs,
  sendWord,
} from "./drive-words";

/** The four jobs Send to Google Drive reports through (`app/admin/jobs/catalog.ts`). */
const HEALTH_OF: { id: JobId; what: string }[] = [
  { id: "drive_export", what: "The Worker" },
  { id: "drive_transfer", what: "Transfers, 24h" },
  { id: "drive_queue", what: "Queue" },
  { id: "drive_dead_letters", what: "Dead letters" },
];

function hostOf(
  h: { email: string | null; name: string | null },
  userId: string,
): string {
  return h.email ?? h.name ?? `${userId.slice(0, 8)}…`;
}

function ConnectionsTable({ rows }: { rows: AdminConnection[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Account</TableHead>
          <TableHead>Connected as</TableHead>
          <TableHead>State</TableHead>
          <TableHead>Last refresh</TableHead>
          <TableHead className="text-right">Acts</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((c) => {
          const word = connectionWord(c);
          const host = hostOf(c.host, c.userId);
          return (
            <TableRow key={c.id} tone={word.row}>
              <TableCell>
                <Link
                  href={`/admin/accounts/${c.userId}`}
                  prefetch={false}
                  className="underline-offset-4 hover:underline"
                >
                  {host}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {c.connectedAs ?? "Unverified address"}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge variant={word.badge}>{word.label}</Badge>
                  {c.operatorNote ? (
                    <span className="text-caption text-muted-foreground">
                      {c.operatorNote}
                    </span>
                  ) : null}
                  {c.lastError && word.label !== "Connected" ? (
                    <span
                      className="max-w-64 truncate text-caption text-muted-foreground"
                      title={c.lastError}
                    >
                      {c.lastError}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {c.lastRefreshAt
                  ? formatAdminTimestamp(c.lastRefreshAt)
                  : "Never"}
              </TableCell>
              <TableCell>
                <DriveConnectionActs
                  connectionId={c.id}
                  host={host}
                  connectedAs={c.connectedAs}
                  breakerSends={c.breakerSends}
                  acts={connectionActs(c)}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export async function DriveSection({
  search,
  health,
}: {
  search: string | null;
  health: JobHealthReport;
}) {
  let data: DriveAdmin | null = null;
  try {
    data = await readDriveAdmin({ search });
  } catch (e) {
    // An unreadable console says so in words, never as a quiet "nothing running"; the page's other cards still draw.
    captureError("admin", e, { action: "read_drive_admin" });
  }
  const client = data
    ? clientHealth(data.clientLastUsedAt, data.readAtMs)
    : null;

  return (
    <>
      {/* The id is part of the mails' and the jobs console's contract: /admin/exports#drive. */}
      <Card id="drive" className="scroll-mt-20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FolderUp className="size-5 text-foreground" />
            <CardTitle>Send to Google Drive</CardTitle>
          </div>
          <CardDescription>
            Pause to stop every send platform-wide: no new send starts and
            running ones wait where they stand, then carry on when it is back
            on.{" "}
            {driveConfigured() ? null : (
              <strong>
                Not set up on this deployment: its env is missing.
              </strong>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data ? (
            <DriveKillSwitch enabled={data.enabled} />
          ) : (
            <Badge variant="destructive">Unreadable</Badge>
          )}
          <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {HEALTH_OF.map(({ id, what }) => {
              const def = jobById(id);
              const verdict = health.readable ? health.byId?.[id] : undefined;
              return (
                <div key={id} className="flex items-center gap-2">
                  <dt className="text-muted-foreground">{what}</dt>
                  <dd>
                    {def && verdict ? (
                      <Badge variant={HEALTH_BADGE[verdict]}>
                        {healthLabel(def, verdict)}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Unreadable</Badge>
                    )}
                  </dd>
                </div>
              );
            })}
            <div>
              <Link
                href="/admin/jobs#job-drive_export"
                prefetch={false}
                className="text-muted-foreground underline-offset-4 hover:underline"
              >
                On Jobs
              </Link>
            </div>
          </dl>
          {data && client ? (
            <p className="text-caption text-muted-foreground">
              {formatCount(data.connections)}{" "}
              {data.connections === 1 ? "connection" : "connections"}.{" "}
              {client.days === null ? (
                "No connection has used the Google client yet; Google deletes a client unused for six months, mailing the project's owner 30 days before."
              ) : client.attention ? (
                <span className="font-medium text-destructive">
                  The Google client was last used {formatCount(client.days)}{" "}
                  days ago: Google deletes it at six months unused. Connect any
                  account to keep it.
                </span>
              ) : (
                `The Google client was last used ${client.days === 0 ? "today" : `${formatCount(client.days)} days ago`}.`
              )}
            </p>
          ) : null}
          {data ? <DriveRevokeAll connections={data.connections} /> : null}
        </CardContent>
      </Card>

      {data ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Sends
                {data.sends.some((s) => s.stuckSince) ? (
                  <Badge variant="destructive">Stuck</Badge>
                ) : null}
              </CardTitle>
              <CardDescription>
                Every send still going, the longest waiting first, then the last
                week&rsquo;s that ended short. Stuck means its lanes made no
                progress for an hour with work left.
                {data.sendsMore
                  ? " More than 100 are going: the newest are not drawn."
                  : null}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {data.sends.length === 0 ? (
                <p className="px-6 text-working text-muted-foreground">
                  Nothing sending.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Album</TableHead>
                      <TableHead>Host</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead className="text-right">Files</TableHead>
                      <TableHead className="text-right">Size</TableHead>
                      <TableHead>Last progress</TableHead>
                      <TableHead className="text-right">Acts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.sends.map((s) => {
                      const word = sendWord(s);
                      const host = hostOf(s.host, s.userId);
                      // Kept files (confirmed from an earlier send) are counted inside items_sent already.
                      const done = s.itemsSent;
                      return (
                        <TableRow key={s.id} tone={word.row}>
                          <TableCell className="max-w-48 truncate">
                            {s.albumName}
                          </TableCell>
                          <TableCell className="max-w-48 truncate">
                            <Link
                              href={`/admin/accounts/${s.userId}`}
                              prefetch={false}
                              className="underline-offset-4 hover:underline"
                            >
                              {host}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant={word.badge}>{word.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap tabular-nums">
                            {`${formatCount(done)} of ${formatCount(s.itemsTotal)}`}
                            {s.itemsFailed > 0 && s.status !== "partly_done" ? (
                              <span className="text-muted-foreground">{` · ${formatCount(s.itemsFailed)} failed`}</span>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap tabular-nums">
                            {`${formatBytes(s.bytesSent)} of ${formatBytes(s.bytesTotal)}`}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {formatAdminTimestamp(
                              s.lastProgressAt ?? s.closedAt ?? s.createdAt,
                            )}
                          </TableCell>
                          <TableCell>
                            <DriveSendActs
                              jobId={s.id}
                              albumName={s.albumName}
                              host={host}
                              left={Math.max(
                                s.itemsTotal - done - s.itemsSkipped,
                                0,
                              )}
                              acts={sendActs(s)}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connections that need you</CardTitle>
              <CardDescription>
                Dying lanes (three in a day pause the connection&rsquo;s sends),
                a standing account breaker, an operator&rsquo;s pause, and
                grants Google ended. Find any account&rsquo;s connection by its
                address below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-0">
              {data.attention.length === 0 ? (
                <p className="px-6 text-working text-muted-foreground">None.</p>
              ) : (
                <ConnectionsTable rows={data.attention} />
              )}
              <form
                method="get"
                action="/admin/exports#drive"
                className="flex max-w-md items-center gap-2 px-6"
              >
                <Input
                  name="drive"
                  type="search"
                  defaultValue={search ?? ""}
                  placeholder="An account's or a Google address"
                  aria-label="Find a Drive connection by address"
                  minLength={3}
                />
              </form>
              {data.found === null ? null : data.found.length === 0 ? (
                <p className="px-6 text-working text-muted-foreground">
                  No connection for &ldquo;{search}&rdquo;.
                </p>
              ) : (
                <ConnectionsTable rows={data.found} />
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </>
  );
}
