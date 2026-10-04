"use client";

import type { SlideProps } from "../../deck/contract";
import { PARTY } from "../../deck/media";
import {
  AddOrb,
  BASE,
  CROWD,
  crowdFor,
  GuestRow,
  Mix,
  ON,
  Orb,
  type Person,
  PhoneShell,
} from "../system";
import { isDesk, Kicker, SlideGround } from "./kit";

/**
 * 06 WITHOUT MEDIA. Where a photograph would be, its people stand in: on the
 * photograph's own dark well (production's media well, dark in both themes),
 * seeded per event (its guests, from the host outward) or per person (your
 * own orb). Three screens: an empty album, a dashboard before any photo, an
 * account page.
 */

/* ── the three screens ─────────────────────────────────────────────────── */

const HERE = CROWD.slice(0, 9);

function EmptyAlbum({ w }: { w: number }) {
  const s = w / 280;
  return (
    <PhoneShell width={w} tone="room">
      <div
        className="absolute"
        style={{ left: 18 * s, right: 18 * s, top: 52 * s }}
      >
        <p className="ev-head" style={{ fontSize: 25 * s, color: ON.room.ink }}>
          {PARTY.name}
        </p>
        <p
          className="ev-body"
          style={{ fontSize: 12 * s, color: ON.room.muted, marginTop: 4 * s }}
        >
          {PARTY.date}
        </p>
      </div>
      <div className="absolute" style={{ left: 0, top: 118 * s }}>
        <Mix
          people={HERE}
          w={w}
          h={250 * s}
          tone="room"
          pad={34 * s}
          gap={0.3}
        />
      </div>
      <div
        className="absolute text-center"
        style={{ left: 18 * s, right: 18 * s, top: 388 * s }}
      >
        <p className="ev-head" style={{ fontSize: 20 * s, color: ON.room.ink }}>
          The album starts with&nbsp;you.
        </p>
        <p
          className="ev-body"
          style={{ fontSize: 12.5 * s, color: ON.room.muted, marginTop: 6 * s }}
        >
          {HERE.length} guests are here. Add the first photo.
        </p>
      </div>
      <div
        className="absolute"
        style={{ left: "50%", bottom: 34 * s, transform: "translateX(-50%)" }}
      >
        <AddOrb you={CROWD[3]} size={56 * s} />
      </div>
    </PhoneShell>
  );
}

const THEO = crowdFor("event-theo-30", 6).map((p, i) => ({
  ...p,
  name: ["Theo", "Ana", "Kofi", "June", "Raf", "Bea"][i],
}));
const CLUB: Person[] = [{ name: "Lena", seed: CROWD[5].seed }];

function EventCard({
  people,
  name,
  meta,
  w,
  s,
}: {
  people: readonly Person[];
  name: string;
  meta: string;
  w: number;
  s: number;
}) {
  const h = 116 * s;
  return (
    <div
      style={{
        backgroundColor: ON.paper.card,
        borderRadius: 8 * s,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: h,
          backgroundColor: BASE.well.hex,
          position: "relative",
        }}
      >
        <Mix
          people={people}
          w={w}
          h={h}
          tone="room"
          pad={(people.length > 10 ? 12 : 22) * s}
          gap={0.2}
          style={{ position: "absolute", left: 0, top: 0 }}
        />
      </div>
      <div style={{ padding: `${10 * s}px ${12 * s}px ${12 * s}px` }}>
        <p className="ev-title" style={{ fontSize: 15 * s }}>
          {name}
        </p>
        <p
          className="ev-body"
          style={{
            fontSize: 11.5 * s,
            color: ON.paper.muted,
            marginTop: 2 * s,
          }}
        >
          {meta}
        </p>
      </div>
    </div>
  );
}

function Dashboard({ w }: { w: number }) {
  const s = w / 280;
  const inner = w - 32 * s;
  return (
    <PhoneShell width={w} tone="paper">
      <div
        className="absolute"
        style={{ left: 16 * s, right: 16 * s, top: 50 * s }}
      >
        <p className="ev-head" style={{ fontSize: 25 * s }}>
          Your events
        </p>
        <div className="grid" style={{ gap: 12 * s, marginTop: 14 * s }}>
          <EventCard
            people={CROWD}
            name={PARTY.name}
            meta={`${PARTY.guests} guests · Saturday 12 September`}
            w={inner}
            s={s}
          />
          <EventCard
            people={THEO}
            name="Theo's 30th"
            meta="6 guests · Friday 2 October"
            w={inner}
            s={s}
          />
          <EventCard
            people={CLUB}
            name="Book club"
            meta="Just you so far · share the code"
            w={inner}
            s={s}
          />
        </div>
      </div>
    </PhoneShell>
  );
}

function Account({ w }: { w: number }) {
  const s = w / 280;
  const me = CROWD[3];
  return (
    <PhoneShell width={w} tone="paper">
      <div
        className="absolute flex flex-col items-center"
        style={{ left: 16 * s, right: 16 * s, top: 70 * s }}
      >
        <Orb seed={me.seed} size={132 * s} lit />
        <p className="ev-head" style={{ fontSize: 26 * s, marginTop: 18 * s }}>
          {me.name}
        </p>
        <p
          className="ev-body text-center"
          style={{ fontSize: 12 * s, color: ON.paper.muted, marginTop: 4 * s }}
        >
          Your color, on every album you join.
        </p>
      </div>
      <div
        className="absolute"
        style={{ left: 16 * s, right: 16 * s, top: 332 * s }}
      >
        <p className="ev-label" style={{ color: ON.paper.muted }}>
          Your events
        </p>
        {[
          { name: PARTY.name, people: CROWD, n: PARTY.guests },
          { name: "Theo's 30th", people: THEO, n: 6 },
          {
            name: "Sam's leaving drinks",
            people: crowdFor("event-sam", 14),
            n: 14,
          },
        ].map((e) => (
          <div
            key={e.name}
            className="flex items-center justify-between"
            style={{
              padding: `${11 * s}px 0`,
              borderBottom: `1px solid ${ON.paper.line}`,
            }}
          >
            <span
              className="ev-body"
              style={{ fontSize: 13.5 * s, fontWeight: 500 }}
            >
              {e.name}
            </span>
            <GuestRow
              people={e.people}
              max={4}
              total={e.n}
              size={20 * s}
              initials={false}
            />
          </div>
        ))}
      </div>
    </PhoneShell>
  );
}

/* ── the slide ─────────────────────────────────────────────────────────── */

const RULES = [
  "Where a photograph would be, its people stand in, on the photograph's own dark well.",
  "Seeded per event (its guests, from the host outward) or per person (your own orb).",
  "Before anyone joins, the host stands alone; each guest after adds to the edge.",
  "The first photograph takes the well; the people go back to the row.",
] as const;

export function Atmosphere({ screen }: SlideProps) {
  if (!isDesk(screen)) return <AtmospherePhone screen={screen} />;
  const pw = 270;
  return (
    <SlideGround tone="paper" screen={screen}>
      <div className="absolute" style={{ left: 72, top: 96, width: 330 }}>
        <Kicker tone="paper">Without media</Kicker>
        <h2
          className="ev-display"
          style={{ fontSize: 54, marginTop: 14, lineHeight: 0.95, width: 380 }}
        >
          People stand&nbsp;in.
        </h2>
        <ol className="ev-body" style={{ marginTop: 26, fontSize: 15 }}>
          {RULES.map((r, i) => (
            <li
              key={r}
              className="flex"
              style={{
                gap: 12,
                padding: "10px 0",
                borderTop: `1px solid ${ON.paper.line}`,
              }}
            >
              <span
                className="ev-num"
                style={{ color: ON.paper.muted, width: 16, flex: "none" }}
              >
                {i + 1}
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ol>
      </div>
      <div
        className="absolute flex items-start"
        style={{ left: 462, top: 92, gap: 34 }}
      >
        {[
          {
            el: <EmptyAlbum w={pw} />,
            cap: "An empty album: the guests already here",
          },
          {
            el: <Dashboard w={pw} />,
            cap: "A dashboard before any photo: each event's mix",
          },
          { el: <Account w={pw} />, cap: "An account page: your own color" },
        ].map((x) => (
          <figure
            key={x.cap}
            className="flex flex-col"
            style={{ gap: 14, width: pw + 18 }}
          >
            {x.el}
            <figcaption
              className="ev-body"
              style={{ fontSize: 13, color: ON.paper.muted }}
            >
              {x.cap}
            </figcaption>
          </figure>
        ))}
      </div>
    </SlideGround>
  );
}

function AtmospherePhone({ screen }: SlideProps) {
  const pw = 290;
  return (
    <SlideGround tone="paper" screen={screen}>
      <div style={{ padding: "28px 20px 0" }}>
        <Kicker tone="paper">Without media</Kicker>
        <h2 className="ev-display" style={{ fontSize: 50, marginTop: 10 }}>
          People stand in.
        </h2>
        <ol className="ev-body" style={{ marginTop: 18, fontSize: 14 }}>
          {RULES.map((r, i) => (
            <li
              key={r}
              className="flex"
              style={{
                gap: 10,
                padding: "8px 0",
                borderTop: `1px solid ${ON.paper.line}`,
              }}
            >
              <span
                className="ev-num"
                style={{ color: ON.paper.muted, width: 14, flex: "none" }}
              >
                {i + 1}
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ol>
        <div
          className="flex flex-col items-center"
          style={{ gap: 30, marginTop: 26 }}
        >
          <EmptyAlbum w={pw} />
          <Dashboard w={pw} />
        </div>
      </div>
    </SlideGround>
  );
}
