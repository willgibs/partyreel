"use client";

import type { SlideProps } from "../deck/contract";
import { HEAD } from "../deck/deck";
import { GUESTS, PARTY, type PhotoId, Seeded } from "../deck/media";
import { ink, SlideRoot } from "./root";
import {
  GROUND,
  type Light,
  lightOfPhotos,
  lightOfSeed,
  LitPhoto,
  PhoneShell,
  Readout,
  Ring,
  Seam,
  SeedCover,
  VOICE,
} from "./system";

/**
 * 06 WITHOUT MEDIA: before an event has a photograph, its seed is its light.
 * The hashvatar (production's seeded mesh) is the atmosphere where the
 * photograph will be, and the same hue at three depths is the light of its
 * Ring, its Seam and its Bloom; the first photograph takes the light over.
 */

const SEED = PARTY.seed;
const EVENTS = [
  { name: "Maya & Jay", date: "Sat 12 Sept", seed: PARTY.seed, guests: 31 },
  { name: "Lena turns 30", date: "Fri 2 Oct", seed: "event-lena-birthday", guests: 18 },
  { name: "Ines & Tom", date: "Sat 17 Oct", seed: "event-ines-wedding", guests: 54 },
] as const;

/** The guest's empty album: the seed where the photographs will be, the shutter lit by it. */
function EmptyAlbum({ w, h }: { w: number; h: number }) {
  const t = ink("room");
  const inner = w - 2 * Math.round(w * 0.03);
  const pad = 16;
  return (
    <PhoneShell width={w} height={h}>
      <div className="flex h-full flex-col" style={{ padding: `${Math.round(h * 0.07)}px ${pad}px ${pad}px` }}>
        <p className="ag-subtitle" style={{ fontSize: 22 }}>
          {PARTY.name}
        </p>
        <p className="ag-caption" style={{ color: t.muted, marginTop: 2 }}>
          {PARTY.date}
        </p>
        <div className="mt-3 flex items-center">
          {GUESTS.slice(0, 5).map((g, i) => (
            <Seeded
              key={g.seed}
              seed={g.seed}
              style={{
                width: 22,
                height: 22,
                marginLeft: i ? -6 : 0,
                boxShadow: `0 0 0 2px ${GROUND.room.hex}`,
              }}
            />
          ))}
          <span className="ag-caption ag-num" style={{ color: t.faint, marginLeft: 8 }}>
            +26
          </span>
        </div>
        <SeedCover
          seed={SEED}
          style={{ marginTop: 18, width: inner - 2 * pad, height: Math.round(h * 0.3), borderRadius: 2 }}
        />
        <p className="ag-subtitle" style={{ fontSize: 18, marginTop: 18 }}>
          {VOICE.guestEmpty}
        </p>
        <p className="ag-caption" style={{ color: t.muted, marginTop: 4 }}>
          Add the first photo. Everyone sees it land.
        </p>
        <div className="mt-auto flex justify-center pb-1">
          <Ring light={lightOfSeed(SEED)} ground="room" size={Math.round(w * 0.19)} label="Add photos" />
        </div>
      </div>
    </PhoneShell>
  );
}

/** The host's events before any photograph: each card wears its own seed. */
function Dashboard({ w, cols }: { w: number; cols: number }) {
  const t = ink("room");
  const gap = 14;
  const cw = Math.floor((w - 40 - (cols - 1) * gap) / cols);
  return (
    <div style={{ width: w, background: GROUND.display.hex, borderRadius: 14, padding: 20, boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.06)" }}>
      <div className="flex items-baseline justify-between">
        <p className="ag-subtitle" style={{ fontSize: 20 }}>
          Your events
        </p>
        <Readout style={{ color: t.faint }}>3 coming up</Readout>
      </div>
      <div className="mt-4 flex flex-wrap" style={{ gap }}>
        {EVENTS.slice(0, cols < 3 ? 2 : 3).map((e) => (
          <div key={e.seed} style={{ width: cw }}>
            <SeedCover seed={e.seed} style={{ width: cw, height: Math.round(cw * 0.7), borderRadius: 2, boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.06)" }} />
            <p className="ag-body" style={{ fontSize: 14.5, fontWeight: 600, marginTop: 10 }}>
              {e.name}
            </p>
            <p className="ag-caption ag-num" style={{ color: t.muted }}>
              {e.date} · {e.guests} guests
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** A person's page: their orb, and the page's seam in their own hue. */
function Account({ w, h }: { w: number; h: number }) {
  const t = ink("room");
  const host = PARTY.hostSeed;
  return (
    <div className="relative overflow-hidden" style={{ width: w, height: h, background: GROUND.roomCard.hex, borderRadius: 14 }}>
      <Seam light={lightOfSeed(host)} ground="room" reach={Math.round(h * 0.36)} strength={0.72} />
      <div className="relative flex flex-col items-center" style={{ paddingTop: Math.round(h * 0.2) }}>
        <Seeded seed={host} style={{ width: 84, height: 84 }} />
        <p className="ag-subtitle" style={{ fontSize: 22, marginTop: 14 }}>
          {PARTY.host}
        </p>
        <p className="ag-caption" style={{ color: t.muted, marginTop: 2 }}>
          Host of 3 events
        </p>
        <div className="flex" style={{ gap: 26, marginTop: 20 }}>
          {[
            ["1,284", "Photos"],
            ["31", "Guests"],
          ].map(([n, l]) => (
            <div key={l} className="flex flex-col items-center">
              <span className="ag-subtitle ag-num" style={{ fontSize: 20 }}>
                {n}
              </span>
              <Readout style={{ color: t.faint }}>{l}</Readout>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The handover: the seed's light, the first photograph, the photographs' light. */
const FIRST: PhotoId = "wedding-toast";
const AFTER: PhotoId[] = ["wedding-toast", "wedding-rings", "reception-table"];

function Step({ tiles, light, w, small = false }: { tiles: readonly ("seed" | PhotoId)[]; light: Light; w: number; small?: boolean }) {
  const tw = Math.floor((w - 4) / 3);
  const th = Math.round(tw * (small ? 0.8 : 0.62));
  return (
    <div className="relative overflow-hidden" style={{ width: w, height: th + (small ? 46 : 70), background: GROUND.room.hex, borderRadius: 6, boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.07)" }}>
      <div className="flex" style={{ gap: 2 }}>
        {tiles.map((x, i) =>
          x === "seed" ? (
            <SeedCover key={i} seed={SEED} style={{ width: tw, height: th }} />
          ) : (
            <LitPhoto key={i} id={x} style={{ width: tw, height: th }} />
          ),
        )}
      </div>
      <div className="absolute inset-x-0" style={{ top: th * 0.4, height: th * 0.6 + 4, background: `linear-gradient(to bottom, transparent, ${GROUND.room.hex})` }} />
      <div className="absolute inset-x-0 flex justify-center" style={{ bottom: small ? 9 : 14 }}>
        <Ring light={light} ground="room" size={small ? 26 : 38} glyph={small ? "none" : "add"} breathe={false} />
      </div>
    </div>
  );
}

function Handover({ w, vertical, compact = false }: { w: number; vertical: boolean; compact?: boolean }) {
  const t = ink("room");
  const seedLight = lightOfSeed(SEED);
  const steps = [
    { label: "The seed's light", line: "Teal: the event's own hue, before anything lands.", tiles: ["seed", "seed", "seed"] as const, light: seedLight },
    { label: "The first photograph", line: "Lands in its place; the light begins to turn.", tiles: [FIRST, "seed", "seed"] as const, light: [...lightOfPhotos([FIRST]), ...seedLight.slice(0, 2)] },
    { label: "The photographs' light", line: "From now on the album lights itself.", tiles: AFTER, light: lightOfPhotos(AFTER) },
  ];
  const gap = compact ? 12 : 36;
  const sw = vertical ? w : Math.floor((w - 2 * gap) / 3);
  return (
    <div className={vertical ? "flex flex-col" : "flex items-start"} style={{ gap: vertical ? 22 : gap }}>
      {steps.map((s, i) => (
        <div key={s.label} style={{ width: sw }}>
          <Step tiles={s.tiles} light={s.light} w={sw} small={compact} />
          <p className="ag-body" style={{ fontSize: compact ? 12.5 : 14, fontWeight: 600, marginTop: compact ? 8 : 12, lineHeight: 1.3 }}>
            <span className="ag-num" style={{ color: t.faint }}>
              {i + 1}{" "}
            </span>
            {s.label}
          </p>
          {compact ? null : (
            <p className="ag-caption" style={{ color: t.muted, marginTop: 2 }}>
              {s.line}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function AtmosphereSlide({ screen }: SlideProps) {
  const t = ink("room");
  if (screen === "375")
    return (
      <SlideRoot screen={screen} ground="room">
        <div className="absolute inset-x-0 px-6" style={{ top: HEAD[screen] + 26 }}>
          <Readout style={{ color: t.faint }}>Without media</Readout>
          <h2 className="ag-title mt-3" style={{ fontSize: 32 }}>
            Before the first photograph, the seed is the light.
          </h2>
          <p className="ag-body mt-3" style={{ color: t.muted, fontSize: 14 }}>
            Every event and every person has a seed. Where no photograph exists yet, its hue
            is the colour, and the first photograph takes it over.
          </p>
          <div className="mt-7 flex justify-center">
            <EmptyAlbum w={252} h={500} />
          </div>
          <div className="mt-7">
            <Dashboard w={327} cols={2} />
          </div>
          <div className="mt-5">
            <Account w={327} h={248} />
          </div>
          <Readout className="mt-8 block" style={{ color: t.faint }}>
            The handover
          </Readout>
          <div className="mt-3">
            <Handover w={327} vertical={false} compact />
          </div>
        </div>
      </SlideRoot>
    );
  return (
    <SlideRoot screen={screen} ground="room">
      <div className="absolute" style={{ left: 64, top: 92, right: 64 }}>
        <Readout style={{ color: t.faint }}>Without media</Readout>
        <div className="flex items-end justify-between" style={{ marginTop: 12, gap: 40 }}>
          <h2 className="ag-title" style={{ fontSize: 38 }}>
            Before the first photograph, the seed is the light.
          </h2>
          <p className="ag-body" style={{ color: t.muted, fontSize: 14.5, maxWidth: 400, paddingBottom: 2 }}>
            Every event and every person has a seed, the hashvatar. Until a photograph
            exists, its hue at three depths is the colour; the first photograph takes it
            over.
          </p>
        </div>
      </div>
      <div className="absolute" style={{ left: 64, top: 214 }}>
        <EmptyAlbum w={272} h={640} />
      </div>
      <div className="absolute" style={{ left: 380, top: 214 }}>
        <Dashboard w={600} cols={3} />
      </div>
      <div className="absolute" style={{ left: 1012, top: 214 }}>
        <Account w={364} h={296} />
      </div>
      <div className="absolute" style={{ left: 380, top: 560, right: 64 }}>
        <Readout style={{ color: t.faint }}>The handover</Readout>
        <div style={{ marginTop: 16 }}>
          <Handover w={996} vertical={false} />
        </div>
      </div>
    </SlideRoot>
  );
}
