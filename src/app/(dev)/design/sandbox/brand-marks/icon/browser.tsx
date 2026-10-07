"use client";

import { type IconId, RingIcon } from "./ring";

/**
 * WHERE A FAVICON LIVES: a browser's tabs, dark or light, the icon at the 16
 * pixels a tab draws it among strangers.
 *
 * ★ THE NEIGHBOURS ARE NOBODY'S MARK: plain coloured tiles with a letter, in
 * the colours a tab strip is full of, so the Ring is judged among strangers.
 */

type Neighbour = {
  readonly name: string;
  readonly bg: string;
  readonly fg: string;
  readonly glyph: string;
};

const TABS: readonly (Neighbour | null)[] = [
  { name: "Inbox (3)", bg: "#d93025", fg: "#fff", glyph: "M" },
  null,
  { name: "Calendar", bg: "#ffffff", fg: "#1a73e8", glyph: "31" },
];

function Fav({ n }: { n: Neighbour }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center"
      style={{
        width: 16,
        height: 16,
        borderRadius: 3.5,
        background: n.bg,
        color: n.fg,
        fontSize: 9,
        fontWeight: 700,
        lineHeight: 1,
        boxShadow: "inset 0 0 0 0.5px rgb(0 0 0 / 0.12)",
      }}
    >
      {n.glyph}
    </span>
  );
}

/**
 * Three tabs of a window's strip, dark or light, Partyreel's the open one; two
 * on a phone's column, where a third ran off the frame's edge.
 */
export function MiniTabs({
  icon,
  tone,
  phone = false,
}: {
  icon: IconId;
  tone: "dark" | "light";
  phone?: boolean;
}) {
  const dark = tone === "dark";
  const strip = dark ? "#1f1f22" : "#dfe1e5";
  const active = dark ? "#35363a" : "#ffffff";
  const ink = dark ? "#e8eaed" : "#202124";
  const muted = dark ? "#9aa0a6" : "#5f6368";
  return (
    <div
      className="flex items-end self-start"
      style={{
        background: strip,
        borderRadius: 10,
        padding: "8px 8px 0",
        gap: 2,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {(phone ? TABS.slice(0, 2) : TABS).map((n, i) => {
        const on = n === null;
        return (
          <span
            key={i}
            className="flex items-center"
            data-bm-read={on ? `the favicon in a ${tone} tab` : undefined}
            data-bm-says={on ? "16×16" : undefined}
            style={{
              width: 168,
              height: 34,
              gap: 9,
              paddingInline: 12,
              borderRadius: "9px 9px 0 0",
              background: on ? active : "transparent",
              fontSize: 12.5,
              color: on ? ink : muted,
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {n ? <Fav n={n} /> : <RingIcon id={icon} size={16} />}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {n ? n.name : "Maya & Jay · Partyreel"}
            </span>
          </span>
        );
      })}
    </div>
  );
}
