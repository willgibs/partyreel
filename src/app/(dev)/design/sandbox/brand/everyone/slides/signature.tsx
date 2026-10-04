"use client";

import type { ReactNode } from "react";

import type { SlideProps } from "../../deck/contract";
import { PARTY } from "../../deck/media";
import { Trail, Wordmark, WORDMARK_FOOT_SHARE } from "../marks";
import { BASE, CROWD, Credit, GuestRow, Mix, ON, Orb, Toss } from "../system";
import { isDesk, Kicker, Pic, SlideGround } from "./kit";

/**
 * 05 THE SIGNATURE: THE MIX. Four forms (one person, the row, the trail, the
 * toss), then the rule drawn on a real photograph: people sit beside the
 * picture, never on it.
 */

function Form({
  title,
  line,
  children,
  h,
}: {
  title: string;
  line: string;
  children: ReactNode;
  h: number;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-end" style={{ height: h }}>
        {children}
      </div>
      <p className="ev-title" style={{ fontSize: 17, marginTop: 16 }}>
        {title}
      </p>
      <p
        className="ev-body"
        style={{ fontSize: 13.5, marginTop: 4, color: ON.paper.muted }}
      >
        {line}
      </p>
    </div>
  );
}

function OnePerson({ big }: { big: number }) {
  const p = CROWD[3];
  return (
    <div className="flex items-end" style={{ gap: 12 }}>
      <Orb seed={p.seed} size={big} />
      <Orb seed={p.seed} size={38} initial={p.name[0]} />
      <Orb seed={p.seed} size={24} initial={p.name[0]} />
    </div>
  );
}

function TrailForm({ h }: { h: number }) {
  return (
    <div className="flex items-end">
      <Wordmark height={h} />
      <div style={{ marginLeft: 4, marginBottom: h * WORDMARK_FOOT_SHARE }}>
        <Trail h={h} count={6} arrive={false} />
      </div>
    </div>
  );
}

const FORMS = {
  one: {
    title: "One person",
    line: "Their seeded hashvatar, unchanged. A letter at a face's size, alone without one.",
  },
  row: {
    title: "The row",
    line: "Who is here, in arrival order. The newest pops in; a count is a number, never an orb.",
  },
  huddle: {
    title: "The huddle",
    line: "An event's mix where a photograph would be: its people on the dark well, host first.",
  },
  trail: {
    title: "The trail",
    line: "The brand's own row: the full stop, then everyone after it.",
  },
  toss: {
    title: "The toss",
    line: "Confetti made of people, thrown once at a moment worth it: one piece per guest.",
  },
} as const;

/** The huddle on its well: what stands in for a photograph. */
function HuddleForm({ w, h }: { w: number; h: number }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        backgroundColor: BASE.well.hex,
        borderRadius: 4,
        position: "relative",
      }}
    >
      <Mix
        people={CROWD.slice(0, 9)}
        w={w}
        h={h}
        tone="room"
        pad={12}
        gap={0.24}
        style={{ position: "absolute", left: 0, top: 0 }}
      />
    </div>
  );
}

function DoPicture({ w, h }: { w: number; h: number }) {
  return (
    <div style={{ width: w }}>
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 12 }}
      >
        <p className="ev-title" style={{ fontSize: 15 }}>
          {PARTY.name}
        </p>
        <GuestRow people={CROWD} max={8} total={PARTY.guests} size={24} />
      </div>
      <Pic id="wedding-toast" style={{ width: w, height: h }} focus="55% 45%" />
      <div
        className="flex items-center justify-between"
        style={{ marginTop: 12 }}
      >
        <Credit person={CROWD[2]} size={22} />
        <span
          className="ev-body"
          style={{ fontSize: 13, color: ON.paper.muted }}
        >
          1 of {PARTY.photos.toLocaleString("en-US")}
        </span>
      </div>
    </div>
  );
}

function NeverPicture({
  w,
  h,
  pad = true,
}: {
  w: number;
  h: number;
  pad?: boolean;
}) {
  return (
    <div style={{ width: w, paddingTop: pad ? 36 : 12 }}>
      <Pic id="wedding-toast" style={{ width: w, height: h }} focus="55% 45%">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(120deg, rgb(255 90 150 / 0.55), rgb(90 120 255 / 0.5))",
            mixBlendMode: "color",
          }}
        />
        <Toss
          people={CROWD.slice(0, 14)}
          w={w}
          h={h}
          ox={w * 0.5}
          oy={h * 0.95}
          min={22}
          max={46}
          reach={0.95}
          style={{ position: "absolute", left: 0, top: 0 }}
        />
      </Pic>
      {pad && <div style={{ height: 34 }} />}
    </div>
  );
}

export function Signature({ screen }: SlideProps) {
  if (!isDesk(screen)) return <SignaturePhone screen={screen} />;
  return (
    <SlideGround tone="paper" screen={screen}>
      <div
        className="absolute flex items-end justify-between"
        style={{ left: 72, right: 72, top: 92 }}
      >
        <div>
          <Kicker tone="paper">The signature</Kicker>
          <h2 className="ev-display" style={{ fontSize: 76, marginTop: 10 }}>
            The Mix
          </h2>
        </div>
        <p
          className="ev-body"
          style={{
            fontSize: 16,
            width: 560,
            color: ON.paper.ink,
            marginBottom: 6,
          }}
        >
          Every guest is an orb, an object you could count. An event wears its
          people in the order they arrived, wherever there is no photograph to
          wear instead.
        </p>
      </div>
      <div
        className="absolute grid"
        style={{
          left: 72,
          top: 236,
          width: 1296,
          gridTemplateColumns: "0.95fr 1.1fr 1fr 1fr 1fr",
          gap: 30,
        }}
      >
        <Form {...FORMS.one} h={112}>
          <OnePerson big={96} />
        </Form>
        <Form {...FORMS.row} h={112}>
          <div style={{ paddingBottom: 30 }}>
            <GuestRow
              people={CROWD}
              max={6}
              total={PARTY.guests}
              size={42}
              pop
            />
          </div>
        </Form>
        <Form {...FORMS.huddle} h={112}>
          <HuddleForm w={226} h={112} />
        </Form>
        <Form {...FORMS.trail} h={112}>
          <div style={{ paddingBottom: 34 }}>
            <TrailForm h={34} />
          </div>
        </Form>
        <Form {...FORMS.toss} h={112}>
          <div className="relative" style={{ width: 226, height: 112 }}>
            <Toss
              people={CROWD}
              w={226}
              h={112}
              ox={113}
              oy={112}
              min={7}
              max={18}
              reach={0.92}
            />
          </div>
        </Form>
      </div>
      <div className="absolute" style={{ left: 72, top: 476, width: 600 }}>
        <Kicker tone="paper">Do</Kicker>
        <p
          className="ev-body"
          style={{
            fontSize: 14,
            marginTop: 4,
            marginBottom: 12,
            color: ON.paper.muted,
          }}
        >
          People beside the picture: faces and credits, small. The photograph
          stays whole.
        </p>
        <DoPicture w={600} h={262} />
      </div>
      <div className="absolute" style={{ left: 768, top: 476, width: 600 }}>
        <Kicker tone="paper">Never</Kicker>
        <p
          className="ev-body"
          style={{
            fontSize: 14,
            marginTop: 4,
            marginBottom: 12,
            color: ON.paper.muted,
          }}
        >
          Color over a photograph: no orbs on the picture, no tint, no glow at
          its edges.
        </p>
        <NeverPicture w={600} h={262} />
      </div>
    </SlideGround>
  );
}

function SignaturePhone({ screen }: SlideProps) {
  return (
    <SlideGround tone="paper" screen={screen}>
      <div style={{ padding: "28px 20px 0" }}>
        <Kicker tone="paper">The signature</Kicker>
        <h2 className="ev-display" style={{ fontSize: 56, marginTop: 8 }}>
          The Mix
        </h2>
        <p className="ev-body" style={{ fontSize: 15, marginTop: 12 }}>
          Every guest is an orb, an object you could count. An event wears its
          people in the order they arrived, wherever there is no photograph to
          wear instead.
        </p>
        <div className="grid" style={{ gap: 22, marginTop: 24 }}>
          <Form {...FORMS.one} h={92}>
            <OnePerson big={88} />
          </Form>
          <Form {...FORMS.row} h={44}>
            <GuestRow
              people={CROWD}
              max={7}
              total={PARTY.guests}
              size={40}
              pop
            />
          </Form>
          <Form {...FORMS.huddle} h={120}>
            <HuddleForm w={335} h={120} />
          </Form>
          <Form {...FORMS.trail} h={40}>
            <TrailForm h={36} />
          </Form>
          <Form {...FORMS.toss} h={84}>
            <div className="relative" style={{ width: 335, height: 84 }}>
              <Toss
                people={CROWD}
                w={335}
                h={84}
                ox={167}
                oy={84}
                min={7}
                max={17}
                reach={0.92}
              />
            </div>
          </Form>
        </div>
        <div style={{ marginTop: 30 }}>
          <Kicker tone="paper">Do</Kicker>
          <p
            className="ev-body"
            style={{
              fontSize: 14,
              marginTop: 4,
              marginBottom: 12,
              color: ON.paper.muted,
            }}
          >
            People beside the picture: faces and credits, small. The photograph
            stays whole.
          </p>
          <DoPicture w={335} h={184} />
        </div>
        <div style={{ marginTop: 26 }}>
          <Kicker tone="paper">Never</Kicker>
          <p
            className="ev-body"
            style={{ fontSize: 14, marginTop: 4, color: ON.paper.muted }}
          >
            Color over a photograph: no orbs on the picture, no tint, no glow at
            its edges.
          </p>
          <NeverPicture w={335} h={184} pad={false} />
        </div>
      </div>
    </SlideGround>
  );
}
