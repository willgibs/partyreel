"use client";

import type { ReactNode } from "react";

import type { SlideProps } from "../../deck/contract";
import type { PhotoId } from "../../deck/media";
import { StatusLight } from "../kit";
import { Wordmark } from "../marks";
import { SlideRoot } from "../root";
import { alpha, LitPhoto, Readout, VOICE } from "../system";
import { inkOf, useTake } from "../take";
import { Label, useMeasure } from "./parts";

/**
 * 07 TYPE, IMAGERY, MOTION: THE SAME FACES AND PICTURES IN EVERY TAKE.
 *
 * Round one's slide edited down to three pictures: the ladder set in the
 * voice's own lines at their real sizes (the specimen IS the type, so no "Aa"
 * beside it), the wordmark as the brand's one italic; four stills, each a
 * rule in a few words; and motion as one time scale, where the interface's
 * 200 ms sits against the light's 1.4 s and Standby's 2.4 s, so "the light
 * moves slowly, the interface instantly" is a drawing rather than a list.
 * The one line a take changes is its light's motion, beside its paper form.
 */

type Row = { role: string; spec: string; line: ReactNode };

const STILLS: readonly { id: PhotoId; focus?: string; name: string; line: string }[] = [
  { id: "wedding-toast", name: "Real light", line: "String lights, a stage, the sun: light in the frame." },
  { id: "wedding-arch", focus: "50% 38%", name: "Any hour", line: "A garden at noon is as much ours as 2 am." },
  { id: "wedding-petals", focus: "50% 34%", name: "Mid-moment", line: "Shot by guests, never posed for us." },
  { id: "reception-table", focus: "50% 60%", name: "Never tinted", line: "Light goes round a photograph, never on it." },
];

/** The ladder, each step in the voice's own words at its real size. */
function useLadder(desk: boolean): readonly Row[] {
  const t = inkOf(useTake(), "paper");
  const display = desk ? 76 : 44;
  const title = desk ? 34 : 27;
  const lede = desk ? 18 : 16;
  return [
    {
      role: "Display",
      spec: `Urbanist 700 · ${display} · −4.5%`,
      line: (
        <p className="ag-display" data-bd-read="the display line" style={{ fontSize: display, color: t.fg, lineHeight: 0.94 }}>
          {VOICE.thesis}
        </p>
      ),
    },
    {
      role: "Title",
      spec: `Urbanist 700 · ${title} · −3.2%`,
      line: (
        <p className="ag-title" style={{ fontSize: title, color: t.fg }}>
          {VOICE.hostEmpty}
        </p>
      ),
    },
    {
      role: "Lede",
      spec: `Inter 400 · ${lede} / 1.45`,
      line: (
        <p className="ag-lede" style={{ fontSize: lede, color: t.muted, maxWidth: desk ? 800 : undefined, textWrap: "pretty" }}>
          {VOICE.subhead}
        </p>
      ),
    },
    {
      role: "Readout",
      spec: "Inter 600 · 11 · +10% · capitals",
      line: (
        <div className="flex flex-wrap items-center" style={{ columnGap: desk ? 26 : 18, rowGap: 10 }}>
          <StatusLight state="standby" ground="paper">
            3 waiting
          </StatusLight>
          <StatusLight state="ready" ground="paper">
            12 approved
          </StatusLight>
          <Readout style={{ color: t.fg }}>1,284 photos</Readout>
        </div>
      ),
    },
    {
      role: "The one italic",
      spec: "The wordmark's, and nowhere else",
      line: <Wordmark height={desk ? 30 : 26} color={t.fg} read="the wordmark, the one italic" />,
    },
  ];
}

function Ladder({ w, desk }: { w: number; desk: boolean }) {
  const t = inkOf(useTake(), "paper");
  const rows = useLadder(desk);
  const rule = alpha(t.fg, 10);
  const gutter = 232;
  return (
    <div style={{ width: w }}>
      {rows.map((r, i) => (
        <div
          key={r.role}
          className={desk ? "grid items-center" : "flex flex-col"}
          style={{
            gridTemplateColumns: desk ? `${gutter}px 1fr` : undefined,
            gap: desk ? 0 : 10,
            paddingBlock: desk ? (i === 0 ? 14 : 15) : 16,
            borderTop: i ? `1px solid ${rule}` : undefined,
          }}
        >
          <div>
            <p className="ag-body" style={{ fontSize: 13.5, fontWeight: 600, color: t.fg, lineHeight: 1.3 }}>
              {r.role}
            </p>
            <p className="ag-caption ag-num" style={{ color: t.faint, marginTop: 2 }}>
              {r.spec}
            </p>
          </div>
          {r.line}
        </div>
      ))}
    </div>
  );
}

function Imagery({ w, cols, aspect = 0.667 }: { w: number; cols: number; aspect?: number }) {
  const t = inkOf(useTake(), "paper");
  const gap = cols > 2 ? 20 : 16;
  const tw = Math.floor((w - gap * (cols - 1)) / cols);
  return (
    <div className="grid" style={{ width: w, gridTemplateColumns: `repeat(${cols}, ${tw}px)`, columnGap: gap, rowGap: 24 }}>
      {STILLS.map((s) => (
        <div key={s.id}>
          <LitPhoto id={s.id} focus={s.focus} ground="paper" style={{ width: tw, height: Math.round(tw * aspect) }} />
          <p className="ag-body" style={{ fontSize: 13.5, fontWeight: 600, color: t.fg, marginTop: 12, lineHeight: 1.3 }}>
            {s.name}
          </p>
          <p className="ag-caption" style={{ color: t.muted, marginTop: 2, textWrap: "pretty" }}>
            {s.line}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * THE CLOCKS ON ONE SCALE, 0 to 2.4 s: the interface's tick crowded at the
 * start, the light's far along it, Standby at its end. Reduced motion is the
 * line under it: the rest state is the whole design.
 */
function Scale({ w, narrow = false }: { w: number; narrow?: boolean }) {
  const t = inkOf(useTake(), "paper");
  const at = (s: number) => Math.round((s / 2.4) * w);
  const ink = alpha(t.fg, 22);
  // On a phone each label keeps to its own third, so three never collide.
  const third = Math.floor(w / 3) - 8;
  const ticks = [
    { s: 0.2, n: "200 ms", line: "The interface: instant.", align: "left" as const },
    { s: 1.4, n: "1.4 s", line: "A bloom ignites, once.", align: "center" as const },
    { s: 2.4, n: "2.4 s", line: "Standby breathes.", align: "right" as const },
  ];
  return (
    <div className="relative" style={{ width: w, height: narrow ? 104 : 96 }}>
      <div aria-hidden className="absolute inset-x-0" style={{ top: 10, height: 1, background: ink }} />
      <span aria-hidden className="absolute" style={{ left: 0, top: 4, width: 1, height: 13, background: ink }} />
      {ticks.map((k) => {
        const x = at(k.s);
        const bw = narrow ? third : 168;
        const box =
          k.align === "left"
            ? { left: x - 1, width: bw }
            : k.align === "right"
              ? { right: w - x, width: bw }
              : { left: x - bw / 2, width: bw };
        return (
          <div key={k.n}>
            <span aria-hidden className="absolute" style={{ left: x - 1, top: 2, width: 2, height: 17, background: t.fg }} />
            <div className="absolute" style={{ top: 30, textAlign: k.align, ...box }}>
              <p className="ag-subtitle ag-num" style={{ fontSize: narrow ? 21 : 24, color: t.fg, lineHeight: 1 }}>
                {k.n}
              </p>
              <p className="ag-caption" style={{ color: t.muted, marginTop: 6, textWrap: "balance" }}>
                {k.line}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * The take's own line for its light's motion, beside its paper form, small.
 * ★ The drawing's box is the photograph's; a take's paper form reaches up to
 * an eighth past it, so the box keeps that margin (`reach`) on every side,
 * and whoever places this places the photograph, never the margin.
 */
function TakeMotion({ w, size, stack = false }: { w: number; size: number; stack?: boolean }) {
  const take = useTake();
  const t = inkOf(take, "paper");
  const { Bloom } = take.light;
  const ph = Math.round(size * 0.667);
  const reach = Math.round(size * 0.18);
  return (
    <div className={stack ? "flex flex-col" : "flex items-center"} style={{ width: w, gap: stack ? 6 : 14 }}>
      {/* Stacked on a phone, the drawing is centred, so its reach stays inside the margins. */}
      <div className="shrink-0" style={{ margin: reach, width: size, height: ph, alignSelf: stack ? "center" : undefined }}>
        <Bloom source={{ photo: "wedding-toast" }} ground="paper" size={size} radius={2}>
          <LitPhoto id="wedding-toast" ground="paper" style={{ width: size, height: ph }} />
        </Bloom>
      </div>
      <p
        className="ag-body"
        data-bd-read="the take's motion line"
        style={{ fontSize: 15, lineHeight: 1.5, color: t.fg, textWrap: "pretty" }}
      >
        {take.words.motion}
      </p>
    </div>
  );
}

export function VoiceSlide({ screen }: SlideProps) {
  const take = useTake();
  const m = useMeasure();
  const t = inkOf(take, "paper");

  if (m.desk) {
    const split = 556;
    const motionX = 884;
    const motionW = m.w - m.pad - motionX;
    // The drawing's photograph sits on the motion column's line; its margin
    // (the take's reach) hangs to the left of it, outside the column.
    const size = 92;
    const reach = Math.round(size * 0.18);
    return (
      <SlideRoot screen={screen} ground="paper">
        <Label ground="paper" style={{ position: "absolute", left: m.pad, top: m.top }}>
          Type
        </Label>
        <p className="ag-caption absolute" style={{ left: m.pad + 232, top: m.top - 1, color: t.muted }}>
          Urbanist to be loud, tighter as it grows. Inter to read. The readout for what a camera prints.
        </p>
        <div className="absolute" style={{ left: m.pad, top: m.top + 22 }}>
          <Ladder w={m.inner} desk />
        </div>
        <Label ground="paper" style={{ position: "absolute", left: m.pad, top: split }}>
          Imagery
        </Label>
        <div className="absolute" style={{ left: m.pad, top: split + 30 }}>
          <Imagery w={motionX - m.pad - 64} cols={4} aspect={0.75} />
        </div>
        <Label ground="paper" style={{ position: "absolute", left: motionX, top: split }}>
          Motion
        </Label>
        <div className="absolute" style={{ left: motionX - reach, top: split + 44 - reach }}>
          <TakeMotion w={motionW + reach} size={size} />
        </div>
        <div className="absolute" style={{ left: motionX, top: split + 160 }}>
          <Scale w={motionW} />
        </div>
        <p className="ag-caption absolute" style={{ left: motionX, top: split + 262, width: motionW, color: t.faint }}>
          Reduced motion: lit and still. Nothing is lost.
        </p>
      </SlideRoot>
    );
  }

  return (
    <SlideRoot screen={screen} ground="paper">
      <div className="absolute" style={{ left: m.pad, top: m.top, width: m.inner }}>
        <Label ground="paper">Type</Label>
        <p className="ag-caption" style={{ color: t.muted, marginTop: 8, textWrap: "pretty" }}>
          Urbanist to be loud, tighter as it grows. Inter to read. The readout for what a camera prints.
        </p>
        <div style={{ marginTop: 8 }}>
          <Ladder w={m.inner} desk={false} />
        </div>
        <Label ground="paper" style={{ marginTop: 48 }}>
          Imagery
        </Label>
        <div style={{ marginTop: 16 }}>
          <Imagery w={m.inner} cols={2} aspect={0.75} />
        </div>
        <Label ground="paper" style={{ marginTop: 52 }}>
          Motion
        </Label>
        <div style={{ marginTop: 4 }}>
          <TakeMotion w={m.inner} size={176} stack />
        </div>
        <div style={{ marginTop: 34 }}>
          <Scale w={m.inner} narrow />
        </div>
        <p className="ag-caption" style={{ color: t.faint, marginTop: 14 }}>
          Reduced motion: lit and still. Nothing is lost.
        </p>
      </div>
    </SlideRoot>
  );
}
