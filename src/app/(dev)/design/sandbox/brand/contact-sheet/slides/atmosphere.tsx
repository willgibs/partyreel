"use client";

import { PARTY, Qr } from "../../deck/media";
import { HEAD } from "../../deck/deck";
import { Copy, Display, Kicker, type Screen, SlideFoot, SlideRoot } from "../parts";
import { edgeCode, EVENTS, GROUND, Print, Status } from "../system";

/**
 * 06 WITHOUT MEDIA: the hashvatar as the latent image. On a screen with no
 * photographs it is the photograph about to be, seeded per event or person,
 * held in a print's border with its edge underneath, breathing toward what
 * it is waiting for. Three screens: an empty album, an account, a host's
 * sheet before any photo.
 */

const LEDE =
  "With no photographs yet, the hashvatar is the latent image: seeded per event or per person, held in a print's border, its edge underneath. It breathes toward the photograph it is waiting for, so an empty screen is never grey, and never the brand's colour.";

/** The primary action in the system: ink, round (an action is twice as round as a surface). */
function Action({ children, size = 15 }: { children: string; size?: number }) {
  return (
    <span
      className="cs-read"
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: Math.round(size * 2.7),
        padding: `0 ${Math.round(size * 1.3)}px`,
        borderRadius: Math.round(size * 1.08),
        background: GROUND.ink.hex,
        color: GROUND.paper.hex,
        fontSize: size,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

function EmptyAlbum({ w, phone = false }: { w: number; phone?: boolean }) {
  const code = edgeCode(PARTY.seed);
  return (
    <div style={{ display: "flex", gap: phone ? 18 : 28, flexDirection: phone ? "column" : "row" }}>
      <Print
        seed={PARTY.seed}
        w={w}
        ratio={4 / 5}
        breathe
        edge={[code, PARTY.name, PARTY.dateShort, "00"]}
        edgeSize={10}
        read="the latent image, an empty album"
      />
      <div style={{ width: phone ? undefined : 230, paddingTop: phone ? 0 : 6 }}>
        <Display size={phone ? 32 : 40} style={{ lineHeight: 1 }}>
          {PARTY.name}
        </Display>
        <Copy size={14} lead={20} style={{ marginTop: 8 }}>
          {PARTY.kind}, {PARTY.date}
        </Copy>
        <Copy size={phone ? 17 : 18} lead={phone ? 24 : 26} muted={false} style={{ marginTop: phone ? 14 : 22, fontWeight: 600 }}>
          <span data-bd-read="empty-state voice">Your first album starts here.</span>
        </Copy>
        <div style={{ marginTop: 16 }}>
          <Action>Add the first photo</Action>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: phone ? 18 : 30 }}>
          <Print w={84} border={8} ratio={1} flat>
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: GROUND.print.hex, color: GROUND.ink.hex }}>
              <Qr size={68} />
            </div>
          </Print>
          <Copy size={13} lead={18}>
            Or put the code on the tables. It opens this album.
          </Copy>
        </div>
      </div>
    </div>
  );
}

function Account({ w, phone = false }: { w: number; phone?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 18, flexDirection: phone ? "row" : "column", alignItems: phone ? "flex-start" : undefined }}>
      <Print
        seed={PARTY.hostSeed}
        w={w}
        ratio={1}
        breathe
        edge={[PARTY.host, "Host", "412 frames"]}
        edgeSize={10}
        read="the latent image, an account"
      />
      <div>
        <Display size={phone ? 28 : 34} style={{ lineHeight: 1 }}>
          {PARTY.host}
        </Display>
        <Copy size={14} lead={20} style={{ marginTop: 6 }}>
          Host of 3 albums
        </Copy>
        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <Status state="done" size={13} word="Email confirmed" />
          <Copy size={13} lead={18}>
            Free plan, 61 MB of 100 MB
          </Copy>
        </div>
      </div>
    </div>
  );
}

function HostSheet({ w, gap }: { w: number; gap: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(2, ${w}px)`, gap }}>
      {EVENTS.map((e) => (
        <div key={e.seed}>
          <Print
            seed={e.seed}
            w={w}
            ratio={4 / 5}
            breathe
            border={Math.round(w * 0.05)}
            edge={[edgeCode(e.seed), e.name]}
            edgeSize={9}
            flat
          />
          <Copy size={12} lead={16} style={{ marginTop: 7 }}>
            {e.kind}, {e.date ?? "undated"}, 0 frames
          </Copy>
        </div>
      ))}
    </div>
  );
}

export function AtmosphereSlide({ screen }: { screen: Screen }) {
  return screen === "1440" ? <AtmosphereDesk /> : <AtmospherePhone />;
}

function AtmosphereDesk() {
  return (
    <SlideRoot screen="1440">
      <div className="absolute" style={{ left: 64, top: HEAD["1440"] + 42, width: 860 }}>
        <Display size={50} style={{ lineHeight: 1 }}>
          The photograph about to be.
        </Display>
        <Copy size={16} lead={24} style={{ marginTop: 16, maxWidth: 800 }}>
          {LEDE}
        </Copy>
      </div>
      <div className="absolute" style={{ left: 64, top: 268 }}>
        <Kicker>An empty album</Kicker>
        <div style={{ marginTop: 18 }}>
          <EmptyAlbum w={300} />
        </div>
      </div>
      <div className="absolute" style={{ left: 690, top: 268 }}>
        <Kicker>An account</Kicker>
        <div style={{ marginTop: 18 }}>
          <Account w={220} />
        </div>
      </div>
      <div className="absolute" style={{ left: 990, top: 268 }}>
        <Kicker>A host&apos;s sheet, before any photo</Kicker>
        <div style={{ marginTop: 18 }}>
          <HostSheet w={180} gap={18} />
        </div>
      </div>
      <SlideFoot screen="1440" />
    </SlideRoot>
  );
}

function AtmospherePhone() {
  return (
    <SlideRoot screen="375">
      <div className="absolute" style={{ left: 16, right: 16, top: HEAD["375"] + 24 }}>
        <Display size={34} style={{ lineHeight: 1 }}>
          The photograph about to be.
        </Display>
        <Copy size={15} lead={22} style={{ marginTop: 12 }}>
          {LEDE}
        </Copy>
        <Kicker style={{ fontSize: 11, marginTop: 28 }}>An empty album</Kicker>
        <div style={{ marginTop: 14 }}>
          <EmptyAlbum w={220} phone />
        </div>
        <Kicker style={{ fontSize: 11, marginTop: 32 }}>An account</Kicker>
        <div style={{ marginTop: 14 }}>
          <Account w={150} phone />
        </div>
        <Kicker style={{ fontSize: 11, marginTop: 32 }}>A host&apos;s sheet, before any photo</Kicker>
        <div style={{ marginTop: 14 }}>
          <HostSheet w={163} gap={16} />
        </div>
      </div>
      <SlideFoot screen="375" />
    </SlideRoot>
  );
}
