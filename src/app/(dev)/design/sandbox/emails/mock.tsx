"use client";

import { type ReactNode, useEffect, useRef } from "react";

/**
 * THE INBOX MOCK: a From, a To, a Subject row, then the body — the one shell
 * every option in this board reads its evidence through, so the reviewer
 * compares mails inside a real reading pane rather than a bare div. Two
 * screens only (the board's shared `screen` config): a phone's single-pane
 * mail app and a laptop's, a wider pane with a thin folder rail. Furniture
 * only — nothing here sends, joins or reads a real inbox.
 */

export type ScreenId = "375" | "1440";

export const SCREENS: Record<ScreenId, { w: number; h: number; name: string }> = {
  "375": { w: 375, h: 812, name: "a phone" },
  "1440": { w: 1440, h: 900, name: "a laptop" },
};

export const screenOf = (v: string | undefined): ScreenId =>
  v === "1440" ? "1440" : "375";

export function PhoneChrome() {
  return (
    <div className="flex items-center gap-2 border-b border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900">
      <span aria-hidden>‹</span>
      <span>Inbox</span>
    </div>
  );
}

export function DesktopChrome() {
  return (
    <div className="flex items-center gap-4 border-b border-neutral-200 bg-white px-5 py-2.5">
      <span className="text-sm font-semibold text-neutral-900">Mail</span>
      <div className="max-w-sm flex-1 rounded-md bg-neutral-100 px-3 py-1.5 text-xs text-neutral-500">
        Search mail
      </div>
      <div className="flex gap-3 text-xs text-neutral-500">
        <span className="text-neutral-900">Inbox</span>
        <span>Sent</span>
        <span>Drafts</span>
      </div>
    </div>
  );
}

/** One opened message: the chrome every option draws its evidence inside. */
export function InboxMessage({
  screen,
  fromName,
  fromEmail,
  to,
  replyTo,
  subject,
  when,
  children,
}: {
  screen: ScreenId;
  fromName: string;
  fromEmail: string;
  to: string;
  replyTo?: string;
  subject: string;
  when: string;
  children: ReactNode;
}) {
  const cardMax = screen === "1440" ? 640 : SCREENS[screen].w - 32;
  return (
    <div
      data-inbox-screen={screen}
      className="flex h-full flex-col bg-neutral-100"
    >
      {screen === "1440" ? <DesktopChrome /> : <PhoneChrome />}
      <div
        className="flex-1 overflow-auto px-4 py-4"
        style={{
          display: "flex",
          justifyContent: screen === "1440" ? "center" : "flex-start",
        }}
      >
        <div
          data-inbox-card
          className="h-fit w-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
          style={{ maxWidth: cardMax }}
        >
          <div className="flex items-start gap-3 border-b border-neutral-200 p-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-700">
              {fromName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p
                  data-inbox-from
                  className="truncate text-sm font-semibold text-neutral-900"
                >
                  {fromName}
                </p>
                <p className="shrink-0 text-xs text-neutral-500">{when}</p>
              </div>
              <p className="truncate text-xs text-neutral-500">
                {fromEmail}
              </p>
              <p className="truncate text-xs text-neutral-500">
                to {to}
                {replyTo ? ` · reply-to ${replyTo}` : ""}
              </p>
            </div>
          </div>
          <div className="border-b border-neutral-200 px-4 py-3">
            <p data-inbox-subject className="text-sm font-semibold text-neutral-900">
              {subject}
            </p>
          </div>
          <div data-inbox-body className="p-5">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export type ListRow = {
  from: string;
  subject: string;
  preview: string;
  when: string;
};

/** A guest's own inbox, as a plain list of rows — 0, 1 or 2 from Partyreel. */
export function InboxList({
  screen,
  rows,
}: {
  screen: ScreenId;
  rows: ListRow[];
}) {
  return (
    <div data-inbox-screen={screen} className="flex h-full flex-col bg-neutral-100">
      {screen === "1440" ? <DesktopChrome /> : <PhoneChrome />}
      <div className="flex-1 overflow-auto px-4 py-4">
        <div
          className="mx-auto overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
          style={{ maxWidth: screen === "1440" ? 640 : SCREENS[screen].w - 32 }}
        >
          {rows.length === 0 ? (
            <p
              data-inbox-empty
              className="p-6 text-center text-sm text-neutral-500"
            >
              Nothing from Partyreel.
            </p>
          ) : (
            <ul data-inbox-row className="divide-y divide-neutral-200">
              {rows.map((r, i) => (
                <li key={i} className="flex flex-col gap-0.5 p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {r.from}
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
                  <p className="truncate text-xs text-neutral-500">
                    {r.preview}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── the measurement ─────────────────────────────────────────────────────── */

export type Reader = (root: HTMLElement, win: Window) => string | null;

/**
 * Reads one fact out of the frame's own document, re-checked after the
 * candidate's stylesheet lands and once more after layout settles. Mirrors
 * guest-upload's Probe: the observer belongs to the FRAME's window, not the
 * lab page's, because the subtree lives in the iframe's own document.
 */
export function Probe({
  read,
  onRead,
  children,
}: {
  read: Reader;
  onRead: (s: string) => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const latest = useRef({ read, onRead });
  useEffect(() => {
    latest.current = { read, onRead };
  });

  useEffect(() => {
    const el = ref.current;
    const win = el?.ownerDocument.defaultView as
      | (Window & typeof globalThis)
      | null
      | undefined;
    if (!el || !win) return;
    const run = () => {
      const said = latest.current.read(el, win);
      if (said) latest.current.onRead(said);
    };
    run();
    const ro = new win.ResizeObserver(run);
    ro.observe(el);
    const late = [400, 900].map((ms) => win.setTimeout(run, ms));
    return () => {
      ro.disconnect();
      late.forEach((t) => win.clearTimeout(t));
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}

/** The type size a node really renders at, in CSS pixels. */
export function sizeOf(el: Element | null, win: Window): number | null {
  return el ? Math.round(parseFloat(win.getComputedStyle(el).fontSize)) : null;
}

/** A computed `rgb(...)` colour as `#rrggbb`, so a caption can name it. */
export function toHex(rgb: string): string {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(rgb);
  if (!m) return rgb;
  return `#${[m[1], m[2], m[3]]
    .map((n) => Number(n).toString(16).padStart(2, "0"))
    .join("")}`;
}
