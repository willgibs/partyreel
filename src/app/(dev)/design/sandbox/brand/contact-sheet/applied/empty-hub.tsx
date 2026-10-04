"use client";

import type { ReactNode } from "react";

import { HEAD } from "../../deck/deck";
import { PARTY } from "../../deck/media";
import { AppIcon } from "../marks";
import { Display, type Screen, SlideRoot } from "../parts";
import { eventEdge, GROUND, Mark, PhoneShell, Print, STATUS } from "../system";
import { BrowserShell, DevelopingCode, Orb, PlusGlyph, Pill, StatusBar } from "./kit";

/**
 * 12 THE HUB, EMPTY: Maya's own album a minute after she made it. No
 * photograph exists yet, so the cover is the latent image (the event's seeded
 * light in a print's border, breathing toward the photograph it is waiting
 * for), its edge printed under it and along the album's head with the frame
 * counter at 00. Her code comes up out of a sample, cell by cell, the first
 * time the hub opens. The lab's marks sit where status naturally does on a
 * new album: the checklist, ticked in green where it is done and circled in
 * blue pencil where it waits on her.
 *
 * What it proves: an empty album is beautiful with nothing but the latent
 * image, and the one chroma the chrome shows (the marks) reads as a note on
 * the sheet beside the event's own colour, never as the brand's.
 */

/** The cover's edge: the album's own, its frame counter at 00. */
const COVER_EDGE = eventEdge(undefined, ["00 frames"]);
const URL = `https://${PARTY.url}`;

const VOICE = "Your first album starts here.";
const VOICE_LINE = "An album with a few photos in it invites guests to add theirs.";

type StepState = "done" | "waiting";

const STEPS: readonly { state: StepState; title: string; line: string; actions?: readonly string[] }[] = [
  { state: "done", title: "Who can get in", line: "Anyone with the link or the code comes in." },
  { state: "done", title: "What guests can add", line: "Uploads are open." },
  {
    state: "waiting",
    title: "The code",
    line: "Nobody has opened it yet. Send it or print it, then scan it once yourself.",
    actions: ["Invite", "Print"],
  },
];

const ROOMS: readonly { title: string; line: string }[] = [
  { title: "Highlight reel", line: "Plays from the second photo" },
  { title: "Guests", line: "Nobody yet" },
  { title: "Review", line: "Nothing waiting" },
  { title: "Settings", line: "Who gets in, what they add" },
  { title: "See it as a guest", line: "Your album, as they meet it" },
];

/** The app's bar: the mark, the crumbs and the host in her own light. */
function AppBar({ phone = false }: { phone?: boolean }) {
  return (
    <div
      style={{
        height: phone ? 56 : 64,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: phone ? "0 16px" : "0 40px",
        borderBottom: "1px solid rgb(22 18 15 / 0.09)",
      }}
    >
      <AppIcon size={phone ? 28 : 30} detail="min" />
      <span className="cs-read" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: phone ? 15 : 14 }}>
        {!phone && (
          <>
            <span className="cs-muted">Your events</span>
            <svg viewBox="0 0 6 10" width={6} height={10} aria-hidden style={{ opacity: 0.4 }}>
              <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            </svg>
          </>
        )}
        <span style={{ fontWeight: 600 }}>{PARTY.name}</span>
      </span>
      <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <Orb seed={PARTY.hostSeed} size={phone ? 30 : 32} />
      </span>
    </div>
  );
}

/** The code on its mat: a flat print, her code developing in it. */
function CodeMat({ size, border }: { size: number; border: number }) {
  return (
    <Print w={size + border * 2} border={border} ratio={1} flat>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: GROUND.print.hex }}>
        <DevelopingCode value={URL} size={size} read="her code, developing" />
      </div>
    </Print>
  );
}

/** One step of the checklist: its mark, its title and line, and its doors. */
function Step({ s, phone = false }: { s: (typeof STEPS)[number]; phone?: boolean }) {
  const waiting = s.state === "waiting";
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: phone ? "34px 1fr" : "34px 1fr auto",
        columnGap: 10,
        rowGap: 10,
        alignItems: "start",
        padding: "12px 0",
        borderTop: "1px solid rgb(22 18 15 / 0.08)",
      }}
    >
      <span style={{ position: "relative", width: 34, height: 26 }}>
        {waiting ? (
          <Mark
            kind="circle"
            size={34}
            color={STATUS.waiting.paper.hex}
            weight={3}
            circling
            style={{ position: "absolute", left: -3, top: -5 }}
          />
        ) : (
          <Mark kind="tick" size={26} color={STATUS.done.paper.hex} weight={4} draw delay={700} style={{ position: "absolute", left: 1, top: -1 }} />
        )}
      </span>
      <div>
        <p className="cs-read" style={{ margin: 0, fontSize: 14, lineHeight: "20px", fontWeight: 600 }}>
          {s.title}
        </p>
        <p className="cs-read cs-muted" style={{ margin: "2px 0 0", fontSize: 13, lineHeight: "19px" }}>
          {s.line}
        </p>
      </div>
      {s.actions && (
        <span style={{ display: "flex", gap: 8, gridColumn: phone ? "2" : undefined }}>
          {s.actions.map((a, i) => (
            <Pill key={a} size={13} tone={i === 0 ? "ink" : "line"}>
              {a}
            </Pill>
          ))}
        </span>
      )}
    </div>
  );
}

function Checklist({ phone = false }: { phone?: boolean }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: phone ? "column" : "row",
          alignItems: phone ? "flex-start" : "baseline",
          justifyContent: "space-between",
          gap: phone ? 2 : 0,
          paddingBottom: 10,
        }}
      >
        <span className="cs-read" style={{ fontSize: 15, fontWeight: 600 }}>
          Before guests arrive
        </span>
        <span className="cs-read cs-muted" style={{ fontSize: 13 }}>
          Guests still need one more thing.
        </span>
      </div>
      {STEPS.map((s) => (
        <Step key={s.title} s={s} phone={phone} />
      ))}
    </div>
  );
}

/** The rooms over the hub, as quiet doors. */
function Rooms({ phone = false }: { phone?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 10, overflow: "hidden" }}>
      {ROOMS.map((r) => (
        <div
          key={r.title}
          style={{
            flex: phone ? "0 0 150px" : "1 1 0",
            padding: "13px 14px 14px",
            borderRadius: 10,
            background: GROUND.print.hex,
            boxShadow: "0 0 0 1px rgb(22 18 15 / 0.09)",
          }}
        >
          <p className="cs-read" style={{ margin: 0, fontSize: 14, fontWeight: 600, lineHeight: "19px" }}>
            {r.title}
          </p>
          <p className="cs-read cs-muted" style={{ margin: "3px 0 0", fontSize: 12.5, lineHeight: "17px" }}>
            {r.line}
          </p>
        </div>
      ))}
    </div>
  );
}

function Who({ size = 14 }: { size?: number }) {
  return (
    <span className="cs-read cs-muted" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: size }}>
      <Orb seed={PARTY.hostSeed} size={Math.round(size * 1.35)} />
      Hosted by {PARTY.host}
    </span>
  );
}

export function HubPage({ layout, top = 0 }: { layout: "desk" | "phone"; top?: number }) {
  return layout === "desk" ? <HubDesk top={top} /> : <HubPhone top={top} />;
}

function HubDesk({ top }: { top: number }) {
  return (
    <div style={{ position: "relative", width: 1120, height: 900 + top }}>
      <div style={{ height: top }} />
      <AppBar />
      <div style={{ padding: "30px 40px 0" }}>
        <div style={{ display: "flex", gap: 44, alignItems: "flex-start" }}>
          <div style={{ width: 400, flex: "none" }}>
            <Print
              seed={PARTY.seed}
              w={400}
              ratio={4 / 5}
              border={18}
              breathe
              edge={COVER_EDGE}
              edgeSize={11}
              read="the latent image, the album's cover"
            />
            <div style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 20 }}>
              <CodeMat size={98} border={9} />
              <div>
                <p className="cs-read" style={{ margin: 0, fontSize: 14, lineHeight: "20px", fontWeight: 600 }}>
                  {PARTY.url}
                </p>
                <p className="cs-read cs-muted" style={{ margin: "3px 0 0", fontSize: 13, lineHeight: "19px" }}>
                  The code and the link open this album.
                </p>
                <div style={{ marginTop: 10 }}>
                  <Pill size={12} tone="line">
                    Copy link
                  </Pill>
                </div>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
            <Display as="h1" size={60} style={{ lineHeight: 0.98 }}>
              {PARTY.name}
            </Display>
            <p className="cs-read cs-muted" style={{ margin: "12px 0 0", fontSize: 16, lineHeight: "24px" }}>
              {PARTY.kind}, {PARTY.date}
            </p>
            <div style={{ marginTop: 10 }}>
              <Who />
            </div>
            <div style={{ marginTop: 40 }}>
              <Display size={36} style={{ lineHeight: 1.04 }}>
                <span data-bd-read="the empty album's voice">{VOICE}</span>
              </Display>
              <p className="cs-read cs-muted" style={{ margin: "10px 0 0", fontSize: 15, lineHeight: "22px" }}>
                {VOICE_LINE}
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <Pill size={16} lead={<PlusGlyph size={13} />}>
                  Add the first photo
                </Pill>
                <Pill size={16} tone="line">
                  Invite guests
                </Pill>
              </div>
            </div>
            <div style={{ marginTop: 36 }}>
              <Checklist />
            </div>
          </div>
        </div>
        <div style={{ marginTop: 26 }}>
          <Rooms />
        </div>
      </div>
    </div>
  );
}

function HubPhone({ top }: { top: number }) {
  return (
    <div style={{ position: "relative", width: 375 }}>
      <div style={{ height: top }} />
      <AppBar phone />
      <div style={{ padding: "18px 16px 0" }}>
        <div>
          <Print
            seed={PARTY.seed}
            w={343}
            ratio={4 / 5}
            border={14}
            breathe
            edge={COVER_EDGE}
            edgeSize={10}
            read="the latent image, the album's cover"
          />
        </div>
        <Display as="h1" size={40} style={{ lineHeight: 1, marginTop: 24 }}>
          {PARTY.name}
        </Display>
        <p className="cs-read cs-muted" style={{ margin: "8px 0 0", fontSize: 15, lineHeight: "22px" }}>
          {PARTY.kind}, {PARTY.date}
        </p>
        <div style={{ marginTop: 8 }}>
          <Who size={13} />
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 18 }}>
          <CodeMat size={88} border={8} />
          <div>
            <p className="cs-read" style={{ margin: 0, fontSize: 13, lineHeight: "19px", fontWeight: 600 }}>
              {PARTY.url}
            </p>
            <p className="cs-read cs-muted" style={{ margin: "2px 0 0", fontSize: 13, lineHeight: "19px" }}>
              The code and the link open this album.
            </p>
            <div style={{ marginTop: 8 }}>
              <Pill size={12} tone="line">
                Copy link
              </Pill>
            </div>
          </div>
        </div>
        <Display size={28} style={{ lineHeight: 1.04, marginTop: 30 }}>
          <span data-bd-read="the empty album's voice">{VOICE}</span>
        </Display>
        <p className="cs-read cs-muted" style={{ margin: "8px 0 0", fontSize: 15, lineHeight: "22px" }}>
          {VOICE_LINE}
        </p>
        <div style={{ marginTop: 16 }}>
          <Pill size={16} wide lead={<PlusGlyph size={13} />}>
            Add the first photo
          </Pill>
        </div>
        <div style={{ marginTop: 30 }}>
          <Checklist phone />
        </div>
        <div style={{ marginTop: 22, marginRight: -16 }}>
          <Rooms phone />
        </div>
      </div>
    </div>
  );
}

/* ── the slide ───────────────────────────────────────────────────────────── */

export function EmptyHubSlide({ screen }: { screen: Screen }) {
  return screen === "1440" ? <EmptyHubDesk /> : <EmptyHubPhone />;
}

function EmptyHubDesk(): ReactNode {
  const phoneW = 336;
  const phoneH = Math.round(phoneW * 2.165);
  const scale = (phoneW - 14) / 375;
  return (
    <SlideRoot screen="1440" style={{ background: GROUND.sheet.hex }}>
      <BrowserShell
        w={1010}
        h={808}
        url="partyreel.com/dashboard"
        page={1120}
        style={{ position: "absolute", left: 52, top: HEAD["1440"] + 22 }}
      >
        <HubPage layout="desk" />
      </BrowserShell>
      <PhoneShell w={phoneW} h={phoneH} style={{ position: "absolute", left: 1040, top: HEAD["1440"] + 96 }}>
        <StatusBar />
        <div style={{ position: "absolute", left: 0, top: 0, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
          <HubPage layout="phone" top={47} />
        </div>
      </PhoneShell>
    </SlideRoot>
  );
}

function EmptyHubPhone() {
  return (
    <SlideRoot screen="375">
      <div style={{ position: "absolute", left: 0, top: 0 }}>
        <HubPage layout="phone" top={HEAD["375"]} />
      </div>
    </SlideRoot>
  );
}
