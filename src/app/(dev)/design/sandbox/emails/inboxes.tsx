"use client";

import type { ClaimableEvent } from "@/lib/db/queries/claims";

import { bannerWords } from "@/components/app/dashboard/claims-batch";

import { DesktopChrome, PhoneChrome, SCREENS, type ScreenId } from "./mock";

/**
 * TWO INBOXES, ONE PER CASE: the picture for the three asks about mail that
 * reaches someone who is not a host (`guest`, `letin`, `reporter`).
 *
 * ★ WHY TWO. Each of these asks turns on a case the other options treat
 * differently: a guest who confirmed against one who said Maybe later, a
 * newcomer who waited on the door against one who left, a report that removed
 * something against one that did not. One inbox would draw two of the three
 * options as the same picture; the pair is what tells them apart, and the
 * rows it holds are counted under the frame.
 *
 * ★ WHAT IS REAL AND WHAT IS NOT. The sign-in code is real (a Supabase
 * dashboard template over Resend, its words out of this repo: auth-accounts.md),
 * so its subject here is the `code` ask's stand-in. Every other row is a mail
 * nothing sends yet, drawn as a labelled mock subject; its body is not what is
 * asked.
 */

export type MailRow = {
  subject: string;
  preview: string;
  when: string;
};

export type InboxCase = {
  /** The case, in a few words: the inbox's label. */
  label: string;
  rows: MailRow[];
  /** What an empty inbox means in this case, said under "Nothing from Partyreel." */
  empty?: string;
};

export function CaseInboxes({
  screen,
  cases,
}: {
  screen: ScreenId;
  cases: InboxCase[];
}) {
  const max = screen === "1440" ? 640 : SCREENS[screen].w - 32;
  return (
    // `min-h-screen`, not `h-full`: the frame's body is no taller than what it
    // holds, so a full-height child would leave the frame's foot unpainted.
    <div
      data-inbox-screen={screen}
      className="flex min-h-screen flex-col bg-neutral-100"
    >
      {screen === "1440" ? <DesktopChrome /> : <PhoneChrome />}
      <div className="flex flex-1 flex-col items-center gap-5 px-4 py-4">
        {cases.map((c) => (
          <section
            key={c.label}
            data-inbox-case={c.label}
            className="w-full"
            style={{ maxWidth: max }}
          >
            <p className="mb-1.5 text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
              {c.label}
            </p>
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
              {c.rows.length === 0 ? (
                <div data-inbox-empty className="p-5 text-center">
                  <p className="text-sm text-neutral-500">
                    Nothing from Partyreel.
                  </p>
                  {c.empty ? (
                    <p className="mt-1 text-xs text-neutral-400">{c.empty}</p>
                  ) : null}
                </div>
              ) : (
                <ul className="divide-y divide-neutral-200">
                  {c.rows.map((r) => (
                    <li
                      key={r.subject}
                      data-inbox-mail
                      className="flex flex-col gap-0.5 p-4"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-neutral-900">
                          Partyreel
                        </p>
                        <p className="shrink-0 text-xs text-neutral-500">
                          {r.when}
                        </p>
                      </div>
                      <p
                        data-inbox-list-subject
                        className="truncate text-sm text-neutral-900"
                      >
                        {r.subject}
                      </p>
                      <p className="line-clamp-2 text-xs text-neutral-500">
                        {r.preview}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/* ── the rows these asks draw ────────────────────────────────────────────── */

/** The event every guest mail here is about: Maya Chen's (fixtures.ts's host). */
export const PARTY = "Maya & Jay's wedding";

/** The code her Confirm sends (real; its words are the Supabase template's). */
export const CODE_MAIL: MailRow = {
  subject: "Your Partyreel sign-in code",
  preview: "482915. The code her Confirm sent, from the Supabase template.",
  when: "Sat",
};

/**
 * `guest=link`'s one mail (ROADMAP's deferred one-shot: `sendOnce`, kind
 * `guest_event_link`, dedupe `guest_id`), with the way out that takes a
 * mistyped address off.
 */
export const LINK_MAIL: MailRow = {
  subject: "Your photos are in Maya & Jay's album",
  preview:
    "Your 3 photos, and the album's link to come back to. Not you? This wasn't me.",
  when: "Sat",
};

export const AFTER_MAIL: MailRow = {
  subject: "Your photographs are in",
  preview: "Everything guests added, now the party is behind you.",
  when: "3 weeks later",
};

export const LET_IN_MAIL: MailRow = {
  subject: `You're in: ${PARTY}`,
  preview: "Maya let you in. The album's link, to open where you left it.",
  when: "Sat",
};

export const NOTE_MAIL: MailRow = {
  subject: "About your report",
  preview: `We looked at what you reported at ${PARTY}. Thank you for telling us.`,
  when: "Mon",
};

export const REMOVED_MAIL: MailRow = {
  subject: "What you reported was removed",
  preview: `We looked at what you reported at ${PARTY} and took it out of the album.`,
  when: "Mon",
};

export const KEPT_MAIL: MailRow = {
  subject: "What you reported stays up",
  preview: `We looked at what you reported at ${PARTY} and left it in the album.`,
  when: "Mon",
};

/* ── the moment `moments=identity` sends ─────────────────────────────────── */

/**
 * FOUR EVENTS WAITING UNDER HER ADDRESS, the dashboard banner's own case
 * (`identity-claims` r3's fixture shape). Only `uploadCount` is read.
 */
const waiting = (id: string, uploadCount: number): ClaimableEvent => ({
  eventId: id,
  eventName: id,
  eventDate: null,
  names: [],
  uploadCount,
  lastUploadAt: null,
  gate: null,
  previews: [],
});

const WAITING: readonly ClaimableEvent[] = [
  waiting("a", 4),
  waiting("b", 3),
  waiting("c", 2),
  waiting("d", 2),
];

/**
 * THE BANNER'S OWN SENTENCE (`claims-batch.ts`'s `bannerWords`, imported, so
 * the mail can never drift from what her dashboard says): "11 photos from 4
 * events are waiting for you".
 */
export const WAITING_SUBJECT = bannerWords(WAITING, false);
