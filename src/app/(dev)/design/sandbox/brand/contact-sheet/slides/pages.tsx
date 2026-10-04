"use client";

import type { CSSProperties, ReactNode } from "react";

import { Photo, type PhotoId } from "../../deck/media";
import { HEAD } from "../../deck/deck";
import { Wordmark } from "../marks";
import { Copy, Display, Kicker, type Screen, SlideFoot, SlideRoot } from "../parts";
import { Edge, GROUND } from "../system";

/**
 * 08 DARK AND LIGHT: every page is wholly one ground. Paper is where
 * photographs are printed and kept, so every page is a photo book in paper,
 * its footer too; the room is where film is projected, so only the reel (and
 * the wall in the app) is dark. Inside a page the rhythm is a photo book's:
 * a spread, a sheet, a read, a sheet, and the close on its edge.
 */

type Kind = "home" | "features" | "events" | "reel" | "pricing" | "help" | "about" | "blog" | "legal";

const PAGES: readonly { kind: Kind; name: string; room?: boolean; why: string }[] = [
  { kind: "home", name: "Home", why: "A spread, then sheets" },
  { kind: "features", name: "Features", why: "Each feature a print" },
  { kind: "events", name: "Events", why: "A sheet per kind" },
  { kind: "reel", name: "Reel", room: true, why: "Projected: the room" },
  { kind: "pricing", name: "Pricing", why: "Plans as prints" },
  { kind: "help", name: "Help", why: "A read, wholly paper" },
  { kind: "about", name: "About", why: "The story, a strip" },
  { kind: "blog", name: "Blog", why: "A cover print each" },
  { kind: "legal", name: "Legal", why: "Paper, plainly" },
];

/* ── a page, in miniature ─────────────────────────────────────────────────── */

const bar = (w: number | string, h: number, o = 1, room = false): CSSProperties => ({
  width: w,
  height: h,
  borderRadius: 1,
  background: room ? GROUND.roomInk.hex : GROUND.ink.hex,
  opacity: o,
});

function Pic({ id, w, h, focus }: { id: PhotoId; w: number | string; h: number; focus?: string }) {
  return (
    <div style={{ width: w, height: h, overflow: "hidden", borderRadius: 1, flex: "none" }}>
      <Photo id={id} focus={focus} />
    </div>
  );
}

function MiniPage({ kind, room, w, h }: { kind: Kind; room?: boolean; w: number; h: number }) {
  const ink = room ? GROUND.roomInk.hex : GROUND.ink.hex;
  const pad = Math.round(w * 0.06);
  const unit = w / 280;
  let body: ReactNode = null;
  if (kind === "home")
    body = (
      <div style={{ display: "flex", gap: 10 * unit, alignItems: "center" }}>
        <div style={{ flex: 1, display: "grid", gap: 4 * unit }}>
          <div style={bar("90%", 9 * unit)} />
          <div style={bar("70%", 9 * unit)} />
          <div style={bar("80%", 3 * unit, 0.35)} />
        </div>
        <div style={{ background: GROUND.print.hex, padding: 4 * unit, boxShadow: "0 3px 8px -3px rgb(22 18 15 / .35)", transform: "rotate(-2deg)" }}>
          <Pic id="wedding-petals" w={62 * unit} h={78 * unit} />
        </div>
      </div>
    );
  if (kind === "features")
    body = (
      <div style={{ display: "grid", gap: 6 * unit }}>
        <div style={bar("60%", 8 * unit)} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3 * unit }}>
          {(["reception-table", "party-balloons", "wedding-rings", "festival-lights"] as const).map((p) => (
            <Pic key={p} id={p} w="100%" h={34 * unit} />
          ))}
        </div>
        <div style={bar("85%", 3 * unit, 0.3)} />
      </div>
    );
  if (kind === "events")
    body = (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 5 * unit }}>
        {(["wedding-arch", "party-dj", "festival-crowd"] as const).map((p) => (
          <div key={p} style={{ background: GROUND.print.hex, padding: 3 * unit, boxShadow: "0 0 0 1px rgb(22 18 15 / .1)" }}>
            <Pic id={p} w="100%" h={46 * unit} />
            <div style={{ ...bar("60%", 3 * unit, 0.5), marginTop: 4 * unit }} />
          </div>
        ))}
      </div>
    );
  if (kind === "reel")
    body = (
      <div style={{ position: "relative", display: "grid", placeItems: "center" }}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: `${-6 * unit}px ${-14 * unit}px`,
            background: "radial-gradient(60% 70% at 50% 55%, rgb(214 150 92 / 0.32), transparent 70%)",
          }}
        />
        <div style={{ position: "relative", boxShadow: "0 0 0 1px rgb(255 255 255 / .12), 0 -1px 0 rgb(255 255 255 / .3)" }}>
          <Pic id="festival-crowd" w={150 * unit} h={78 * unit} />
        </div>
      </div>
    );
  if (kind === "pricing")
    body = (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 * unit }}>
        {(["party-balloons", "wedding-toast", "festival-lights"] as const).map((ph) => (
          <div key={ph} style={{ background: GROUND.print.hex, padding: 4 * unit, boxShadow: "0 0 0 1px rgb(22 18 15 / .1)", display: "grid", gap: 3 * unit }}>
            <Pic id={ph} w="100%" h={24 * unit} />
            <div style={bar("45%", 7 * unit)} />
            <div style={bar("80%", 2.5 * unit, 0.3)} />
            <div style={bar("62%", 2.5 * unit, 0.3)} />
          </div>
        ))}
      </div>
    );
  if (kind === "help")
    body = (
      <div style={{ display: "grid", gap: 5 * unit }}>
        <div style={{ ...bar("100%", 12 * unit, 0.08), boxShadow: `inset 0 0 0 1px rgb(22 18 15 / .2)` }} />
        {[92, 80, 88, 60].map((p) => (
          <div key={p} style={bar(`${p}%`, 3 * unit, 0.3)} />
        ))}
      </div>
    );
  if (kind === "about")
    body = (
      <div style={{ display: "grid", gap: 6 * unit }}>
        <Wordmark height={16 * unit} color={ink} />
        <div style={{ display: "flex", gap: 3 * unit, background: GROUND.ink.hex, padding: 3 * unit }}>
          {(["wedding-toast", "concert-confetti", "reception-hall", "wedding-golden"] as const).map((p) => (
            <Pic key={p} id={p} w={36 * unit} h={24 * unit} />
          ))}
        </div>
      </div>
    );
  if (kind === "blog")
    body = (
      <div style={{ display: "grid", gap: 6 * unit }}>
        {(["reception-table", "wedding-rings"] as const).map((p) => (
          <div key={p} style={{ display: "flex", gap: 6 * unit, alignItems: "center" }}>
            <Pic id={p} w={40 * unit} h={27 * unit} />
            <div style={{ flex: 1, display: "grid", gap: 3 * unit }}>
              <div style={bar("70%", 5 * unit)} />
              <div style={bar("90%", 2.5 * unit, 0.3)} />
            </div>
          </div>
        ))}
      </div>
    );
  if (kind === "legal")
    body = (
      <div style={{ display: "grid", gap: 4 * unit, width: "70%" }}>
        <div style={bar("50%", 7 * unit)} />
        {[100, 96, 100, 90, 98, 70].map((p, i) => (
          <div key={i} style={bar(`${p}%`, 2.5 * unit, 0.3)} />
        ))}
      </div>
    );
  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
        overflow: "hidden",
        borderRadius: 2,
        background: room ? GROUND.room.hex : GROUND.paper.hex,
        boxShadow: room ? "none" : "0 0 0 1px rgb(22 18 15 / 0.12)",
        padding: `${pad * 0.7}px ${pad}px`,
        display: "flex",
        flexDirection: "column",
        gap: 7 * unit,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Wordmark height={9 * unit} color={ink} />
        <div style={{ display: "flex", gap: 4 * unit }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={bar(12 * unit, 2 * unit, 0.4, room)} />
          ))}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>{body}</div>
      {/* The close: a thin edge band, then the footer on the page's own ground. */}
      <div style={{ margin: `0 ${-pad}px`, height: 4 * unit, background: room ? "#2a241e" : GROUND.ink.hex }} />
      <div style={{ display: "flex", gap: 6 * unit, marginBottom: -2 * unit }}>
        {[22, 16, 19, 14].map((w2, i) => (
          <div key={i} style={bar(w2 * unit, 2 * unit, 0.3, room)} />
        ))}
      </div>
    </div>
  );
}

/* ── the rhythm inside a page ────────────────────────────────────────────── */

const RHYTHM: readonly { n: string; title: string; line: string; draw: ReactNode }[] = [
  {
    n: "01",
    title: "The spread",
    line: "One photograph, large, its edge under it.",
    draw: <Pic id="wedding-golden" w="100%" h={40} />,
  },
  {
    n: "02",
    title: "A sheet",
    line: "The dense grid: frames side by side.",
    draw: (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 2 }}>
        {(["party-dj", "wedding-toast", "party-balloons", "festival-lights", "reception-table"] as const).map((p) => (
          <Pic key={p} id={p} w="100%" h={19} />
        ))}
      </div>
    ),
  },
  {
    n: "03",
    title: "A read",
    line: "Text with a print in its margin.",
    draw: (
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <div style={{ flex: 1, display: "grid", gap: 3 }}>
          {[90, 100, 70].map((p) => (
            <div key={p} style={bar(`${p}%`, 3, 0.3)} />
          ))}
        </div>
        <div style={{ background: GROUND.print.hex, padding: 2, boxShadow: "0 0 0 1px rgb(22 18 15 / .12)" }}>
          <Pic id="wedding-rings" w={30} h={22} />
        </div>
      </div>
    ),
  },
  {
    n: "04",
    title: "The close",
    line: "The edge band, then the footer, on the same paper.",
    draw: (
      <div style={{ display: "grid", gap: 4 }}>
        <Edge items={["Partyreel", "One album"]} size={7} band height={12} />
        <div style={{ display: "flex", gap: 8 }}>
          {[40, 34, 38].map((p) => (
            <div key={p} style={bar(p, 3, 0.3)} />
          ))}
        </div>
      </div>
    ),
  },
];

function Rhythm() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {RHYTHM.map((r) => (
        <div key={r.n} style={{ display: "grid", gridTemplateColumns: "116px 1fr", gap: 14, alignItems: "center" }}>
          <div style={{ width: 116, overflow: "hidden", background: GROUND.paper.hex, boxShadow: "0 0 0 1px rgb(22 18 15 / .12)", padding: 6, boxSizing: "border-box" }}>
            {r.draw}
          </div>
          <div>
            <Edge items={[r.n, r.title]} size={11} />
            <Copy size={13} lead={18} style={{ marginTop: 5 }}>
              {r.line}
            </Copy>
          </div>
        </div>
      ))}
    </div>
  );
}

function PageMap({ w, h, cols, gap }: { w: number; h: number; cols: number; gap: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${w}px)`, gap }}>
      {PAGES.map((p, i) => (
        <div key={p.kind}>
          <MiniPage kind={p.kind} room={p.room} w={w} h={h} />
          <Edge
            items={[String(i + 1).padStart(2, "0"), p.name, p.room ? "The room" : "Paper"]}
            size={11}
            style={{ marginTop: 9, color: p.room ? GROUND.ink.hex : undefined }}
          />
          <Copy size={12} lead={16} style={{ marginTop: 4 }}>
            {p.why}
          </Copy>
        </div>
      ))}
    </div>
  );
}

const LEDE =
  "Every page is a photo book, wholly paper, its footer too. A page is the room only where film is projected: the reel, and the wall in the app. No page cuts between grounds, so nothing on it fights the photographs.";

export function PagesSlide({ screen }: { screen: Screen }) {
  return screen === "1440" ? <PagesDesk /> : <PagesPhone />;
}

function PagesDesk() {
  return (
    <SlideRoot screen="1440">
      <div className="absolute" style={{ left: 64, top: HEAD["1440"] + 42, width: 900 }}>
        <Display size={50} style={{ lineHeight: 1 }}>
          Paper, unless it&rsquo;s projected.
        </Display>
        <Copy size={16} lead={24} style={{ marginTop: 16, maxWidth: 820 }}>
          {LEDE}
        </Copy>
      </div>
      <div className="absolute" style={{ left: 64, top: 252 }}>
        <PageMap w={282} h={136} cols={3} gap={26} />
      </div>
      <div className="absolute" style={{ left: 1022, top: 252, width: 354 }}>
        <Kicker>Inside a page</Kicker>
        <div style={{ marginTop: 18 }}>
          <Rhythm />
        </div>
        <Copy size={13} lead={19} style={{ marginTop: 22 }}>
          A section opens on a spread and winds down through sheets and reads; the page closes on its edge, never on a chapter of another ground.
        </Copy>
      </div>
      <SlideFoot screen="1440" />
    </SlideRoot>
  );
}

function PagesPhone() {
  return (
    <SlideRoot screen="375">
      <div className="absolute" style={{ left: 16, right: 16, top: HEAD["375"] + 24 }}>
        <Display size={34} style={{ lineHeight: 1 }}>
          Paper, unless it&rsquo;s projected.
        </Display>
        <Copy size={15} lead={22} style={{ marginTop: 12 }}>
          {LEDE}
        </Copy>
        <div style={{ marginTop: 24 }}>
          <PageMap w={163} h={96} cols={2} gap={17} />
        </div>
        <Kicker style={{ fontSize: 11, marginTop: 30 }}>Inside a page</Kicker>
        <div style={{ marginTop: 14 }}>
          <Rhythm />
        </div>
      </div>
      <SlideFoot screen="375" />
    </SlideRoot>
  );
}
