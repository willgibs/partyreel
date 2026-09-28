"use client";

import { WAITING_SUBJECT } from "./inboxes";

/**
 * THE ROSTER: every mail Partyreel could send, as one compact table, for the
 * `moments` decision (which ones should exist). Real, unmodified subjects for
 * the ten shipped kinds (drawn from the fixtures, which call the real
 * templates); the dormant switches' subjects are hand-labelled mocks, marked
 * as such, since nothing behind them exists to call; `identity` is the same
 * kind of mock, for the one moment the keep implies (`moments=identity`),
 * which nothing has built either. Whether a guest is ever mailed is asked
 * apart (`guest`, `letin`, `reporter`, inboxes.tsx).
 */

export type Kind = "host" | "operator" | "dormant" | "identity";

export type MomentRow = {
  subject: string;
  trigger: string;
  kind: Kind;
};

export const KIND_LABEL: Record<Kind, string> = {
  host: "Host",
  operator: "Operator",
  dormant: "Dormant",
  identity: "Identity",
};

const KIND_DOT: Record<Kind, string> = {
  host: "bg-neutral-900",
  operator: "bg-neutral-400",
  dormant: "bg-amber-500",
  identity: "bg-violet-600",
};

/**
 * ★ A PROPOSED MAIL IS READ WHOLE. The ten shipped rows keep their one
 * truncated line (they are the ground); a row nothing sends yet (a dormant
 * switch's, the keep's) is the thing being judged, so its subject wraps and
 * its trigger drops beneath it. At 375 the one-line row cut the keep's mail to
 * "11 photos f...", the one part of it the option is about.
 */
export function MomentsRoster({ rows }: { rows: MomentRow[] }) {
  return (
    <div
      data-inbox-row
      className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white"
    >
      {rows.map((r, i) =>
        r.kind === "dormant" || r.kind === "identity" ? (
          <div
            key={i}
            data-inbox-proposed
            className="flex items-start gap-3 px-4 py-2.5"
          >
            <span
              aria-hidden
              className={`mt-1.5 size-1.5 shrink-0 rounded-full ${KIND_DOT[r.kind]}`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-neutral-900">{r.subject}</p>
              <p className="mt-0.5 text-xs text-neutral-500">{r.trigger}</p>
            </div>
            <span className="w-14 shrink-0 pt-0.5 text-right text-[11px] font-medium text-neutral-500">
              {KIND_LABEL[r.kind]}
            </span>
          </div>
        ) : (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
            <span
              aria-hidden
              className={`size-1.5 shrink-0 rounded-full ${KIND_DOT[r.kind]}`}
            />
            <p className="min-w-0 flex-1 truncate text-sm text-neutral-900">
              {r.subject}
            </p>
            <span className="shrink-0 text-xs text-neutral-500">
              {r.trigger}
            </span>
            <span className="w-14 shrink-0 text-right text-[11px] font-medium text-neutral-500">
              {KIND_LABEL[r.kind]}
            </span>
          </div>
        ),
      )}
    </div>
  );
}

/** The ten mails Partyreel sends today, none of them to a guest. */
export const TODAY_ROSTER: MomentRow[] = [
  { subject: "Your Partyreel storage is over the limit", trigger: "over cap", kind: "host" },
  { subject: "Reminder: storage will be reduced soon", trigger: "grace ending", kind: "host" },
  { subject: "We reduced your Partyreel storage", trigger: "grace elapsed", kind: "host" },
  { subject: "Your Event Pass expires soon", trigger: "14 days out", kind: "host" },
  { subject: "Your Partyreel event will be removed soon", trigger: "6mo quiet", kind: "host" },
  { subject: "Your Partyreel event was removed", trigger: "warning ignored", kind: "host" },
  { subject: "Contact form: a submission", trigger: "/contact sent", kind: "operator" },
  { subject: "Application: a role", trigger: "/careers sent", kind: "operator" },
  { subject: "Orphan-sweep blocked", trigger: "circuit breaker", kind: "operator" },
  { subject: "Backup prune blocked", trigger: "circuit breaker", kind: "operator" },
];

/**
 * The three switches in Account settings today: live-looking, nothing behind
 * them. A fourth, the reel's own, is not merely unbuilt: the reel round
 * leaves no host action and no file behind to finish, so "render done" is
 * not a trigger waiting to be wired, it is a trigger that no longer exists.
 */
export const DORMANT_ROSTER: MomentRow[] = [
  { subject: "An album you joined was shared", trigger: "host publishes", kind: "dormant" },
  { subject: "New uploads to your events", trigger: "a digest", kind: "dormant" },
  { subject: "Someone followed you", trigger: "a follow", kind: "dormant" },
];

/**
 * The one row the keep implies (`moments=identity`, redrawn on Will's
 * `identity-claims` r3 `pointer=line`, 2026-09-28: "Events should feel mostly
 * self-contained... Simply acknowledging the existence of other events and
 * allowing that to be handled back on the dashboard later is enough"). It is
 * sent once she confirms at the keep, AFTER her first upload, and only when
 * other events wait under her address; never from a confirmation before she
 * uploads (the verified gate's), which would point her out of the event
 * first. Its subject is the dashboard banner's own sentence, imported
 * (`bannerWords`), so the mail and the banner it points at say one thing.
 */
export const IDENTITY_ROSTER: MomentRow[] = [
  {
    subject: WAITING_SUBJECT,
    trigger: "confirmed at the keep, other events waiting",
    kind: "identity",
  },
];

/** A settings-panel stub for `moments=retired`: the four switches gone, the one real one left standing. */
export function RetiredSwitchesStub() {
  return (
    <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-xs font-medium text-neutral-500">
        Account · Email preferences
      </p>
      <div className="space-y-2 border-t border-neutral-200 pt-3">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-neutral-900">
            Product news and occasional tips
          </span>
          <span
            data-inbox-real-switch
            aria-hidden
            className="h-4 w-7 rounded-full bg-neutral-100"
          />
        </div>
      </div>
      <p className="border-t border-neutral-200 pt-3 text-xs text-neutral-500">
        Sign-in codes and account notices always send. The album/digest/
        follower switches are gone: nothing sent behind them. The reel&rsquo;s
        own never existed under this shape: a live montage has no render to
        finish.
      </p>
    </div>
  );
}
