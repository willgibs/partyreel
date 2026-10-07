"use client";

import type { ReactNode } from "react";

import { type IconId, RingIcon } from "./ring";

/**
 * WHERE A FAVICON LIVES: a browser's tabs on a dark window and a light one, a
 * search result on white, and a browser's favourites on a phone, the icon at
 * the sizes those draw it (16 in a tab, 18 in a result, 60 on a start page).
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
  { name: "Docs: seating plan", bg: "#2f6fdf", fg: "#fff", glyph: "D" },
  null,
  { name: "Flights to Lisbon", bg: "#1a73e8", fg: "#fff", glyph: "F" },
  { name: "Calendar", bg: "#ffffff", fg: "#1a73e8", glyph: "31" },
  { name: "Playlist", bg: "#1db954", fg: "#0b0b0b", glyph: "P" },
  { name: "Weather", bg: "#f5b400", fg: "#fff", glyph: "W" },
];

function Fav({ n, size = 16 }: { n: Neighbour; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: n.bg,
        color: n.fg,
        fontSize: size * 0.56,
        fontWeight: 700,
        lineHeight: 1,
        boxShadow: "inset 0 0 0 0.5px rgb(0 0 0 / 0.12)",
      }}
    >
      {n.glyph}
    </span>
  );
}

/** One window's tab strip and address bar, dark or light. */
export function TabStrip({
  icon,
  tone,
}: {
  icon: IconId;
  tone: "dark" | "light";
}) {
  const dark = tone === "dark";
  const strip = dark ? "#1f1f22" : "#dfe1e5";
  const active = dark ? "#35363a" : "#ffffff";
  const ink = dark ? "#e8eaed" : "#202124";
  const muted = dark ? "#9aa0a6" : "#5f6368";
  return (
    <div
      style={{
        background: strip,
        color: ink,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        className="flex items-end"
        style={{ height: 42, paddingInline: 10, gap: 2 }}
      >
        <span
          className="flex items-center"
          style={{ gap: 8, paddingInline: 8, paddingBottom: 12 }}
        >
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span
              key={c}
              style={{ width: 12, height: 12, borderRadius: 99, background: c }}
            />
          ))}
        </span>
        {TABS.map((n, i) => {
          const on = n === null;
          return (
            <span
              key={i}
              className="flex items-center"
              data-bm-read={
                on ? `the favicon in a ${tone} window's tab` : undefined
              }
              data-bm-says={on ? "16×16" : undefined}
              style={{
                width: 196,
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
      <div
        className="flex items-center"
        style={{ height: 44, background: active, paddingInline: 16, gap: 14 }}
      >
        <span style={{ color: muted, fontSize: 15 }}>‹ ›</span>
        <span
          className="flex flex-1 items-center"
          style={{
            height: 30,
            borderRadius: 99,
            paddingInline: 14,
            background: dark ? "#202124" : "#f1f3f4",
            fontSize: 13,
            color: muted,
            gap: 6,
          }}
        >
          <span style={{ color: ink }}>partyreel.com</span>/e/maya-and-jay
        </span>
      </div>
    </div>
  );
}

/** A search result on white: the favicon in its round well beside the site's name. */
function Result({
  fav,
  site,
  url,
  title,
  line,
}: {
  fav: ReactNode;
  site: string;
  url: string;
  title: string;
  line: string;
}) {
  return (
    <div style={{ maxWidth: 600 }}>
      <div className="flex items-center" style={{ gap: 12 }}>
        <span
          className="flex items-center justify-center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 99,
            background: "#f1f3f4",
            border: "1px solid #ecedef",
          }}
        >
          {fav}
        </span>
        <span className="flex flex-col" style={{ lineHeight: 1.25 }}>
          <span style={{ fontSize: 14, color: "#202124" }}>{site}</span>
          <span style={{ fontSize: 12, color: "#4d5156" }}>{url}</span>
        </span>
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 20,
          color: "#1a0dab",
          lineHeight: 1.3,
        }}
      >
        {title}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 14,
          color: "#4d5156",
          lineHeight: 1.55,
        }}
      >
        {line}
      </div>
    </div>
  );
}

export function SearchResults({ icon }: { icon: IconId }) {
  return (
    <div
      className="flex flex-col"
      style={{
        background: "#ffffff",
        padding: "28px 40px 32px 180px",
        gap: 26,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Result
        fav={
          <Fav
            n={{ name: "", bg: "#5f6b7a", fg: "#fff", glyph: "W" }}
            size={18}
          />
        }
        site="Wedding Wire"
        url="https://www.weddingwire.com › ideas"
        title="How to collect every guest's photos after the wedding"
        line="Shared albums, disposable cameras and QR codes compared, with what each one costs the couple."
      />
      <div data-bm-read="the favicon in a search result" data-bm-says="18×18">
        <Result
          fav={<RingIcon id={icon} size={18} />}
          site="Partyreel"
          url="https://partyreel.com"
          title="Partyreel: the whole event, in one album"
          line="Your guests took the best photos and videos at your event. Partyreel collects them with one easy link."
        />
      </div>
    </div>
  );
}

/** A browser's start page on a phone, light: favourites drawn from each site's touch icon. */
export function Favourites({ icon }: { icon: IconId }) {
  const sites: readonly (Neighbour | null)[] = [
    { name: "Mail", bg: "#d93025", fg: "#fff", glyph: "M" },
    null,
    { name: "Maps", bg: "#34a853", fg: "#fff", glyph: "⌖" },
    { name: "News", bg: "#111", fg: "#fff", glyph: "N" },
    { name: "Shop", bg: "#ff9900", fg: "#111", glyph: "a" },
    { name: "Wiki", bg: "#ffffff", fg: "#111", glyph: "W" },
    { name: "Weather", bg: "#3d86f2", fg: "#fff", glyph: "☀" },
    { name: "Video", bg: "#ff0033", fg: "#fff", glyph: "▶" },
  ];
  return (
    <div
      className="flex h-full flex-col"
      style={{
        background: "#f2f2f7",
        padding: "70px 22px 22px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <span
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "#111",
          marginBottom: 16,
        }}
      >
        Favourites
      </span>
      <div className="grid grid-cols-4" style={{ rowGap: 20 }}>
        {sites.map((n, i) => (
          <span
            key={i}
            className="flex flex-col items-center"
            style={{ gap: 7 }}
          >
            {n ? (
              <span
                className="flex items-center justify-center"
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 13,
                  background: n.bg,
                  color: n.fg,
                  fontSize: 26,
                  fontWeight: 700,
                  boxShadow: "inset 0 0 0 0.5px rgb(0 0 0 / 0.1)",
                }}
              >
                {n.glyph}
              </span>
            ) : (
              <span
                data-bm-read="the touch icon on a light start page"
                data-bm-says="60×60"
                style={{ filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.16))" }}
              >
                <RingIcon id={icon} size={60} />
              </span>
            )}
            <span style={{ fontSize: 11.5, color: "#3c3c43" }}>
              {n ? n.name : "Partyreel"}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
