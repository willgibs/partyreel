import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAdminTimestamp } from "@/lib/format/admin-time";
import {
  BASIS_WORDS,
  READINGS,
  SWITCH_KEYS,
  SWITCH_LABEL,
  formatAmount,
  formatReading,
  offeredSwitches,
  readingById,
  type ReadingDef,
  type StoredReading,
  type StoredRun,
  type SwitchKey,
  type SwitchStates,
} from "@/lib/jobs/spend-watch";

import { WatchSwitch, type WatchSwitchCopy } from "./switch-controls";

/**
 * THE SPEND WATCH'S CARD, BELOW ITS JOB LINE (admin-observability.md, "The spend watch"): every reading of its last
 * run against its ceiling, and the switches it can stop. Presentation only: the page reads the run and the switches
 * (`readLatestWatchRun`, `readSwitches`) and hands them here, so a specimen or a test renders it from plain data.
 *
 * ★ NO READING IS DRAWN AS A NUMBER IT IS NOT: a missing one says "No reading" and why (its row carries the failure
 * tone, since it is why the run failed), one warming up says so, and an unreadable run or switch list says that in
 * words rather than drawing a calm table.
 */

export type LatestWatchRun = {
  run: StoredRun;
  startedAt: string;
  status: string;
};

/** The two switches whose home is this card, in the operator's words. */
const SWITCH_COPY: Record<
  "uploads_enabled" | "lifecycle_mail_enabled",
  WatchSwitchCopy
> = {
  uploads_enabled: {
    on: "Guests can add",
    off: "Paused for every guest",
    title: "Pause guest uploads?",
    lede: "Every guest's next upload is refused with a line saying uploads are paused on Partyreel, until you turn this back on.",
    verb: "Pause uploads",
    touches: [
      "Every album's guest uploads, camera shots and clips included",
      "A file already uploading finishes; nothing in flight is cut",
      "Hosts still add to their own albums",
    ],
  },
  lifecycle_mail_enabled: {
    on: "Sending",
    off: "Held",
    title: "Hold lifecycle mail?",
    lede: "The nightly reminders, warnings and renewal nudges wait, and go out the first night after you turn this back on.",
    verb: "Hold the mail",
    touches: [
      "Inactivity warnings, over-cap reminders and renewal nudges wait",
      "A removal's or a grace's one-time notice still sends",
      "Sign-in codes and operator alerts are untouched",
    ],
  },
};

/** What each switch is, in a line, and where the ones that live elsewhere are pressed. */
const SWITCH_LINE: Record<
  SwitchKey,
  { line: string; href?: string; place?: string }
> = {
  uploads_enabled: {
    line: "Only a person pauses it: a false alarm would stop a real party.",
  },
  lifecycle_mail_enabled: {
    line: "The watch holds it on its own. Held mail is never lost; a removal's notice always goes.",
  },
  export_enabled: {
    line: "The watch pauses it on its own.",
    href: "/admin/exports#downloads",
    place: "Open Exports",
  },
  purge_cron_enabled: {
    line: "The watch pauses it on its own.",
    href: "/admin/jobs#job-purge_cron",
    place: "Open its card",
  },
};

function NowCell({
  def,
  reading,
}: {
  def: ReadingDef;
  reading: StoredReading;
}) {
  if (reading.state === "missing") {
    return (
      <>
        <span className="text-destructive">No reading</span>
        {reading.why ? (
          <span className="block text-caption break-words text-muted-foreground">
            {reading.why}
          </span>
        ) : null}
      </>
    );
  }
  if (reading.state === "warming" || reading.value === null) {
    return (
      <>
        <span className="text-muted-foreground">Warming up</span>
        {reading.why ? (
          <span className="block text-caption text-muted-foreground">
            {reading.why}
          </span>
        ) : null}
      </>
    );
  }
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 tabular-nums">
      {/* A reading and its unit stay one line; only the badge and the reasons wrap. */}
      <span className="whitespace-nowrap">
        {reading.at_least ? "at least " : ""}
        {formatReading(def, reading.value)}
      </span>
      {reading.state === "tripped" ? (
        <Badge variant="warning">Tripped</Badge>
      ) : null}
    </span>
  );
}

function ReadingsTable({ latest }: { latest: LatestWatchRun }) {
  const { run } = latest;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-2 sm:px-3">Reading</TableHead>
          <TableHead className="px-2 sm:px-3">Now</TableHead>
          <TableHead className="px-2 sm:px-3">Ceiling</TableHead>
          <TableHead className="hidden px-2 sm:table-cell sm:px-3">
            Busiest this week
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {READINGS.map((def) => {
          const reading = run.readings[def.id];
          if (!reading) {
            return (
              <TableRow key={def.id}>
                <TableCell className="px-2 sm:px-3">{def.label}</TableCell>
                <TableCell
                  colSpan={3}
                  className="px-2 text-muted-foreground sm:px-3"
                >
                  Not in this run
                </TableCell>
              </TableRow>
            );
          }
          const tone =
            reading.state === "tripped"
              ? "warning"
              : reading.state === "missing"
                ? "destructive"
                : undefined;
          return (
            <TableRow key={def.id} tone={tone}>
              <TableCell className="px-2 align-top sm:px-3">
                <span className="font-medium">{def.label}</span>
                <span className="block max-w-72 text-caption whitespace-normal text-muted-foreground">
                  {reading.state === "tripped" ? def.remedy : def.source}
                </span>
              </TableCell>
              <TableCell className="px-2 align-top whitespace-normal sm:px-3">
                <NowCell def={def} reading={reading} />
              </TableCell>
              <TableCell className="px-2 align-top whitespace-normal tabular-nums sm:px-3">
                {reading.ceiling !== undefined ? (
                  <>
                    {formatAmount(def, reading.ceiling)}
                    {reading.basis ? (
                      <span className="block text-caption text-muted-foreground">
                        {BASIS_WORDS[reading.basis]}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span className="text-muted-foreground">Unknown</span>
                )}
              </TableCell>
              <TableCell className="hidden px-2 align-top tabular-nums sm:table-cell sm:px-3">
                {reading.peak !== null && reading.peak !== undefined ? (
                  formatAmount(def, reading.peak)
                ) : (
                  <span className="text-muted-foreground">None yet</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/** The readings of the watch's last run that took them, or what stands in their place. */
export function SpendWatchReadings({
  latest,
  unreadable,
}: {
  latest: LatestWatchRun | null;
  unreadable: string | null;
}) {
  return (
    <section aria-labelledby="spend-watch-readings" className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="spend-watch-readings" className="text-sm font-medium">
          Readings
        </h3>
        {latest ? (
          <p className="text-caption text-muted-foreground">
            {latest.run.fromMs !== null
              ? `${formatAdminTimestamp(latest.run.fromMs)} to ${formatAdminTimestamp(latest.run.readAtMs)}`
              : `Taken ${formatAdminTimestamp(latest.run.readAtMs)}`}
          </p>
        ) : null}
      </div>
      {unreadable ? (
        <p className="rounded-md bg-destructive/6 px-2.5 py-2 text-sm text-destructive">
          The readings could not be read: {unreadable}
        </p>
      ) : latest ? (
        <ReadingsTable latest={latest} />
      ) : (
        <p className="text-sm text-muted-foreground">
          No readings yet: the watch has not run. Run it now, or wait for its
          schedule.
        </p>
      )}
      <p className="text-caption text-muted-foreground">
        A reading trips past ten times its busiest of the past week, never under
        its floor. A trip never raises its own ceiling.
      </p>
    </section>
  );
}

/** The band's own voice for a line that needs a look: a tinted ground and a dot, the words in the ground's ink. */
function AttentionLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 flex items-start gap-2 rounded-sm bg-warning/8 px-2 py-1 text-caption">
      <span
        aria-hidden
        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning"
      />
      <span>{children}</span>
    </p>
  );
}

/** The switches the watch can stop, with the pauses that are still its own and the ones its trips left for you. */
export function SpendWatchSwitches({
  switches,
  latest,
  unreadable,
}: {
  switches: SwitchStates | null;
  /** The watch's last run: what it paused (`paused_at`) and what its trips left for a person. */
  latest: StoredRun | null;
  unreadable: string | null;
}) {
  const pausedAt = latest?.pausedAt ?? {};
  const offered = latest ? offeredSwitches(latest) : [];
  return (
    <section aria-labelledby="spend-watch-switches" className="space-y-2">
      <h3 id="spend-watch-switches" className="text-sm font-medium">
        What it can stop
      </h3>
      {unreadable || !switches ? (
        <p className="rounded-md bg-destructive/6 px-2.5 py-2 text-sm text-destructive">
          The switches could not be read{unreadable ? `: ${unreadable}` : "."}{" "}
          None of them is shown as on.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {SWITCH_KEYS.map((key) => {
            const state = switches[key];
            const on = state?.enabled ?? true;
            const watchAt = pausedAt[key];
            const stillTheWatchs =
              watchAt !== undefined &&
              state !== undefined &&
              !state.enabled &&
              state.updatedAtMs === Date.parse(watchAt);
            const line = SWITCH_LINE[key];
            const offer = on ? offered.find((o) => o.key === key) : undefined;
            return (
              <li
                key={key}
                id={`switch-${key}`}
                className="flex scroll-mt-20 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1 basis-56">
                  <p className="text-sm font-medium">{SWITCH_LABEL[key]}</p>
                  <p className="text-caption text-muted-foreground">
                    {line.line}
                  </p>
                  {stillTheWatchs ? (
                    <AttentionLine>
                      Paused by the spend watch, {formatAdminTimestamp(watchAt)}
                      . It stays off until you turn it back on.
                    </AttentionLine>
                  ) : null}
                  {offer ? (
                    <AttentionLine>
                      {offer.readings
                        .map((id) => readingById(id)?.label ?? id)
                        .join(" and ")}{" "}
                      went past the ceiling. Pause it here if this is a runaway,
                      not a party.
                    </AttentionLine>
                  ) : null}
                </div>
                {key === "uploads_enabled" ||
                key === "lifecycle_mail_enabled" ? (
                  <WatchSwitch
                    switchKey={key}
                    label={SWITCH_LABEL[key]}
                    enabled={on}
                    copy={SWITCH_COPY[key]}
                  />
                ) : (
                  <span className="flex items-center gap-3 text-caption">
                    <Badge variant={on ? "success" : "outline"}>
                      {on ? "On" : "Paused"}
                    </Badge>
                    {line.href ? (
                      <Link
                        href={line.href}
                        prefetch={false}
                        className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
                      >
                        {line.place}
                      </Link>
                    ) : null}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
