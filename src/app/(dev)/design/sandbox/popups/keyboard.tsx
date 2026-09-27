/**
 * THE KEYBOARD, AS ONE FLAT SVG: `identity-door/keyboard.tsx`'s drawing,
 * retyped rather than imported (a board's directory leaves with its ruling,
 * so no board reaches into another's), the letters board only, since every
 * field on this board takes words.
 *
 * ★ 335 PT ON A 375 x 812 PHONE, SUGGESTIONS BAR INCLUDED (an iPhone X-class
 * screen: four rows of 42 pt keys on a 54 pt pitch under a 44 pt QuickType
 * bar, over the strip that holds the emoji key and dictation). Every surface
 * reads this one number (`KEYBOARD_H`), so the visible band each caption
 * measures against is 812 minus it, never a second guess. Production reads
 * the visual viewport instead of any constant (`use-keyboard-inset.ts`),
 * because Safari's own form bar can sit on top of it.
 *
 * ★ ITS COLOURS ARE VARIABLES (`popups.css`), light and dark, the way the
 * phone's own keyboard follows its appearance.
 */

export const KEYBOARD_H = 335;
const W = 375;

const FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif";

function Key({
  x,
  y,
  w,
  mod = false,
  go = false,
  label,
  size = 22,
  children,
}: {
  x: number;
  y: number;
  w: number;
  mod?: boolean;
  go?: boolean;
  label?: string;
  size?: number;
  children?: React.ReactNode;
}) {
  const h = 42;
  const fill = go ? "var(--kb-go)" : mod ? "var(--kb-mod)" : "var(--kb-key)";
  return (
    <g>
      <rect
        x={x}
        y={y + 1}
        width={w}
        height={h}
        rx={5}
        fill="var(--kb-shadow)"
      />
      <rect x={x} y={y} width={w} height={h} rx={5} fill={fill} />
      {label && (
        <text
          x={x + w / 2}
          y={y + h / 2 + size * 0.36}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize={size}
          fill={go ? "#fff" : "var(--kb-ink)"}
        >
          {label}
        </text>
      )}
      {children}
    </g>
  );
}

const ROW1 = "qwertyuiop".split("");
const ROW2 = "asdfghjkl".split("");
const ROW3 = "zxcvbnm".split("");
const PITCH = 37.5;
const KEY_W = 31.5;
const Y = [53, 107, 161, 215];

/**
 * The keyboard, pinned to the frame's foot. `data-pop-kb` is what every
 * caption measures a surface against; `aria-hidden` because it is a picture
 * of the phone's own chrome, not a control.
 */
export function Keyboard({ enter = "return" }: { enter?: string }) {
  const go = enter === "send" || enter === "go" || enter === "done";
  return (
    <svg
      data-pop-kb=""
      aria-hidden
      viewBox={`0 0 ${W} ${KEYBOARD_H}`}
      width={W}
      height={KEYBOARD_H}
      className="fixed inset-x-0 bottom-0 z-[90] block"
    >
      <rect width={W} height={KEYBOARD_H} fill="var(--kb-bg)" />
      <rect width={W} height={0.5} fill="var(--kb-sep)" />
      <rect x={125} y={12} width={0.75} height={20} fill="var(--kb-sep)" />
      <rect x={250} y={12} width={0.75} height={20} fill="var(--kb-sep)" />
      {ROW1.map((c, i) => (
        <Key key={c} x={3 + i * PITCH} y={Y[0]} w={KEY_W} label={c} />
      ))}
      {ROW2.map((c, i) => (
        <Key key={c} x={21.75 + i * PITCH} y={Y[1]} w={KEY_W} label={c} />
      ))}
      <Key x={3} y={Y[2]} w={42} mod>
        <path
          d={`M24 ${Y[2] + 11} l10 11 h-5.5 v9 h-9 v-9 h-5.5 z`}
          fill="none"
          stroke="var(--kb-ink)"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </Key>
      {ROW3.map((c, i) => (
        <Key key={c} x={59.25 + i * PITCH} y={Y[2]} w={KEY_W} label={c} />
      ))}
      <Key x={330} y={Y[2]} w={42} mod>
        <path
          d={`M345 ${Y[2] + 13} h15 a2.5 2.5 0 0 1 2.5 2.5 v11 a2.5 2.5 0 0 1 -2.5 2.5 h-15 l-7 -8 z M350 ${Y[2] + 17.5} l7 7 M357 ${Y[2] + 17.5} l-7 7`}
          fill="none"
          stroke="var(--kb-ink)"
          strokeWidth={1.6}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Key>
      <Key x={3} y={Y[3]} w={87} mod label="123" size={16} />
      <Key x={96} y={Y[3]} w={183} label="space" size={16} />
      <Key x={285} y={Y[3]} w={87} mod={!go} go={go} label={enter} size={16} />
      <g stroke="var(--kb-glyph)" strokeWidth={1.6} fill="none">
        <circle cx={32} cy={287} r={11} />
        <path d="M27 290 q5 5 10 0" strokeLinecap="round" />
        <rect x={339} y={277} width={8} height={13} rx={4} />
        <path d="M335 286 a8 8 0 0 0 16 0 M343 294 v4" strokeLinecap="round" />
      </g>
      <circle cx={28.5} cy={283.5} r={1.2} fill="var(--kb-glyph)" />
      <circle cx={35.5} cy={283.5} r={1.2} fill="var(--kb-glyph)" />
      <rect
        x={(W - 134) / 2}
        y={KEYBOARD_H - 13}
        width={134}
        height={5}
        rx={2.5}
        fill="var(--kb-home)"
      />
    </svg>
  );
}
