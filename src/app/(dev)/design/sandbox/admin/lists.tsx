"use client";

import { Check, ChevronDown, CornerUpLeft, Search } from "lucide-react";

import { SupportList } from "@/components/admin/support-list";
import { PageHeading } from "@/components/shared/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ContactSubmission } from "@/lib/db/queries/support";
import { cn } from "@/lib/utils";

import {
  ACCOUNT_ROWS,
  SUPPORT_ROWS,
  type AccountRow,
  type SupportRow,
} from "./fixtures";
import { type Colour, StateChip } from "./state-ui";

/**
 * WHAT A LIST LOOKS LIKE IN THIS PORTAL, on the two surfaces that disagree
 * about it: the support inbox, where a row carries a paragraph somebody wrote,
 * and the accounts list, where a row is five numbers.
 *
 * Today both are the same shape, and it is the card. Nine support cards is
 * about 1,400 pixels of page for nine messages, so an operator reads three and
 * scrolls; six accounts are six one-line rows inside a card-shaped border, so
 * the storage figure that matters has no column to sit in and no way to sort.
 *
 * ★ THE REAL COMPONENT DRAWS THE FIRST OPTION. `SupportList` is a client
 * component that takes rows, so "today" is not a reconstruction of the support
 * inbox, it IS the support inbox, fed nine fixture submissions. The accounts
 * list is a server page, so its markup is reproduced (same classes, same rows)
 * and the reproduction is noted in the handoff.
 */

export type Density = "cards" | "table" | "hybrid";

/** The short chip a dense row wears, since "Plans & billing" is a sentence. */
const TOPIC_VALUE: Record<string, string> = {
  Billing: "billing",
  Uploads: "hosting",
  Account: "hosting",
  Privacy: "privacy",
  Press: "press",
};

/** The fixture rows as the shipped component expects them. */
const SUBMISSIONS: ContactSubmission[] = SUPPORT_ROWS.map((r) => ({
  id: r.id,
  name: r.name,
  email: r.email,
  subject: r.subject,
  message: r.message,
  topic: TOPIC_VALUE[r.topic] ?? "other",
  status: "new",
  // The shipped card renders `new Date(created_at).toLocaleString()`, so this
  // has to be a real timestamp; it is the one place a fixture time is not the
  // string an operator reads.
  created_at: "2026-09-15T09:14:00.000Z",
  handled_at: null,
  handled_by: null,
  source: "contact page",
  user_agent: null,
}));

/* ── Shared furniture ────────────────────────────────────────────────────── */

function InboxHead({ count }: { count: number }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <PageHeading>Support</PageHeading>
        <p className="text-sm text-muted-foreground">
          {count} messages waiting, oldest first at the foot.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="relative">
          <Search className="absolute top-2.5 left-3 size-3.5 text-muted-foreground" />
          <Input className="h-9 w-56 pl-9" placeholder="Search messages" />
        </span>
        <Button variant="outline" size="sm">
          New
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </div>
    </div>
  );
}

function AccountsHead() {
  return (
    <div>
      <p className="font-heading text-subsection">Accounts</p>
      <p className="text-sm text-muted-foreground">
        Six hosts. One is over its cap, which blocks every upload on its events.
      </p>
    </div>
  );
}

/** The storage meter, the one number a table can show and a card cannot. */
function Meter({ row, colour }: { row: AccountRow; colour: Colour }) {
  const over = row.fill > 1;
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <span
          className="block h-full rounded-full"
          style={{
            width: `${Math.min(row.fill, 1) * 100}%`,
            background:
              colour === "achromatic"
                ? over
                  ? "var(--color-destructive)"
                  : "var(--color-foreground)"
                : over
                  ? "var(--ops-fail)"
                  : "var(--ops-info)",
          }}
        />
      </span>
      <span className="tabular-nums">
        {row.used}
        <span className="text-muted-foreground"> of {row.cap}</span>
      </span>
    </span>
  );
}

/* ── Today: cards ────────────────────────────────────────────────────────── */

function AccountsAsRows() {
  return (
    <div className="divide-y rounded-lg border">
      {ACCOUNT_ROWS.map((a) => (
        <span
          key={a.id}
          className="flex items-center justify-between gap-4 px-4 py-3"
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{a.name}</span>
            <span className="block truncate text-xs text-muted-foreground">
              {a.email}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
            <span>{a.used}</span>
            <Badge variant="secondary">{a.tier}</Badge>
          </span>
        </span>
      ))}
    </div>
  );
}

/* ── Tables ──────────────────────────────────────────────────────────────── */

const TH = "py-2 pr-3 text-left text-xs font-medium text-muted-foreground";
const TD = "py-2.5 pr-3 align-middle";

function SupportTable({ colour }: { colour: Colour }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      {/* The bulk bar exists because two of these nine are the same question
          asked twice, and closing them one dropdown at a time is the cost a
          card list never shows. */}
      <div className="flex items-center gap-3 border-b bg-muted/50 px-3 py-2 text-xs">
        <span className="flex size-4 items-center justify-center rounded border bg-background">
          <Check className="size-3" />
        </span>
        <span className="font-medium">2 selected</span>
        <span className="text-muted-foreground">Mark in progress</span>
        <span className="text-muted-foreground">Close</span>
        <span className="text-muted-foreground">Assign to me</span>
      </div>
      {/* ★ `table-fixed`, OR THE LAST TWO COLUMNS LEAVE THE SCREEN. The first
          capture pass caught it: a subject column with no width let the
          message push the table past 1440, and Waiting and Status, the two
          columns the option's own words promise, fell off the right edge.
          Fixed layout makes the declared widths real and the long cell
          truncate, which is what the option claims it does. */}
      <table className="w-full table-fixed text-sm">
        <thead>
          <tr className="border-b">
            <th className={cn(TH, "w-9 pl-3")} />
            <th className={cn(TH, "w-44")}>From</th>
            <th className={cn(TH, "w-28")}>Topic</th>
            <th className={TH}>Subject</th>
            <th className={cn(TH, "w-20 text-right")}>Waiting</th>
            <th className={cn(TH, "w-28 pr-3")}>Status</th>
          </tr>
        </thead>
        <tbody>
          {SUPPORT_ROWS.map((r, i) => (
            <tr key={r.id} className="border-b last:border-0">
              <td className={cn(TD, "pl-3")}>
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded border",
                    i < 2 ? "bg-foreground text-background" : "bg-background",
                  )}
                >
                  {i < 2 ? <Check className="size-3" /> : null}
                </span>
              </td>
              <td className={TD}>
                <span className="block truncate font-medium">{r.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {r.email}
                </span>
              </td>
              <td className={TD}>
                <Badge variant="outline">{r.topic}</Badge>
              </td>
              <td className={TD}>
                <span className="block truncate">{r.subject}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {r.message}
                </span>
              </td>
              <td className={cn(TD, "text-right tabular-nums")}>{r.waiting}</td>
              <td className={cn(TD, "pr-3")}>
                <StateChip level="info" colour={colour}>
                  {r.status}
                </StateChip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AccountsTable({ colour }: { colour: Colour }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full table-fixed text-sm">
        <thead>
          <tr className="border-b">
            <th className={cn(TH, "pl-3")}>Account</th>
            <th className={cn(TH, "w-24")}>Plan</th>
            <th className={cn(TH, "w-64")}>Storage</th>
            <th className={cn(TH, "w-20 text-right")}>Events</th>
            <th className={cn(TH, "w-32 pr-3")}>Billing</th>
          </tr>
        </thead>
        <tbody>
          {ACCOUNT_ROWS.map((a) => (
            <tr key={a.id} className="border-b last:border-0">
              <td className={cn(TD, "pl-3")}>
                <span className="block truncate font-medium">{a.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {a.email}
                </span>
              </td>
              <td className={TD}>
                <Badge variant="secondary">{a.tier}</Badge>
              </td>
              <td className={TD}>
                <Meter row={a} colour={colour} />
              </td>
              <td className={cn(TD, "text-right tabular-nums")}>{a.events}</td>
              <td className={cn(TD, "pr-3")}>
                {a.overCap ? (
                  <StateChip level="fail" colour={colour}>
                    Over cap
                  </StateChip>
                ) : a.billing === "Past due" ? (
                  <StateChip level="warn" colour={colour}>
                    Past due
                  </StateChip>
                ) : (
                  <span className="text-muted-foreground">{a.billing}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── The hybrid: a reading pane where a row carries prose ────────────────── */

function InboxRow({ row, active }: { row: SupportRow; active: boolean }) {
  return (
    <li
      className={cn(
        "border-b px-3 py-2.5 text-sm last:border-0",
        active && "bg-muted",
      )}
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="truncate font-medium">{row.name}</span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {row.waiting}
        </span>
      </span>
      <span className="block truncate">{row.subject}</span>
      <span className="block truncate text-xs text-muted-foreground">
        {row.message}
      </span>
    </li>
  );
}

function SplitInbox({ colour }: { colour: Colour }) {
  const open = SUPPORT_ROWS[0];
  return (
    <div className="flex h-[520px] overflow-hidden rounded-lg border">
      <ul className="w-80 shrink-0 overflow-hidden border-r">
        {SUPPORT_ROWS.map((r, i) => (
          <InboxRow key={r.id} row={r} active={i === 0} />
        ))}
      </ul>
      <div className="min-w-0 flex-1 p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="font-heading text-subsection">{open.subject}</p>
            <p className="text-xs text-muted-foreground">
              {open.name}, {open.email}, {open.received}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{open.topic}</Badge>
            <StateChip level="info" colour={colour}>
              {open.status}
            </StateChip>
          </div>
        </div>
        <p className="max-w-[68ch] text-sm whitespace-pre-wrap">
          {open.message}
        </p>
        <div className="mt-5 flex items-center gap-2 border-t pt-4">
          <Button size="sm" variant="outline">
            <CornerUpLeft className="size-3.5" />
            Reply from your inbox
          </Button>
          <Button size="sm" variant="ghost">
            Mark in progress
          </Button>
          <Button size="sm" variant="ghost">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── The page ────────────────────────────────────────────────────────────── */

export function AdminLists({
  density,
  colour,
}: {
  density: Density;
  colour: Colour;
}) {
  return (
    <div className="space-y-8">
      <InboxHead count={SUPPORT_ROWS.length} />
      {density === "cards" ? (
        // The "as today" option kept drawing the real component, which now takes
        // the pane's props: the board retires at this lane's merge and the
        // fixtures move to the Library demo, so this is the last render of it.
        <SupportList
          submissions={SUBMISSIONS}
          selectedId={null}
          basePath="/admin/support"
          nowMs={Date.parse("2026-09-20T14:22:00Z")}
        />
      ) : null}
      {density === "table" ? <SupportTable colour={colour} /> : null}
      {density === "hybrid" ? <SplitInbox colour={colour} /> : null}

      <div className="space-y-4 border-t pt-8">
        <AccountsHead />
        {density === "cards" ? <AccountsAsRows /> : null}
        {density !== "cards" ? <AccountsTable colour={colour} /> : null}
      </div>
    </div>
  );
}
