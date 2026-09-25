/**
 * THE KEYBOARD, AS ONE FLAT SVG (the manifest: "every 375 frame with a field
 * draws an iOS keyboard").
 *
 * ★ 335 PT ON A 375 x 812 PHONE, SUGGESTIONS BAR INCLUDED, which is the frame
 * the door is read in (an iPhone X-class screen: four rows of 42 pt keys on a
 * 54 pt pitch under a 44 pt QuickType bar, over the 78 pt strip that holds the
 * emoji key, dictation and the home indicator). The sheet's rule reads this one
 * number (`KEYBOARD_H`), so the visible area every caption measures against is
 * 812 minus it, never a second guess.
 *
 * ★ NOT MEASURED ON A SIMULATOR THIS ROUND. A booted simulator hides its
 * software keyboard behind the host's hardware one, and turning that off is a
 * preference on Will's machine this lane did not change. The number is the one
 * the manifest names; the Handoff says so, and notes that Safari's own form bar
 * (arrows and Done) can sit on top of it, which is why production reads the
 * visual viewport rather than any constant.
 *
 * ★ AN SVG IN JSX, NOT A FILE BEHIND AN <img>, so it can wear the frame's theme:
 * its colours are CSS variables (`identity-door.css`), light and dark, the way
 * the phone's own keyboard follows its appearance. `digits` is the number pad a
 * one-time-code field raises, with the code offered from Mail in its bar.
 */

export const KEYBOARD_H = 335;
const W = 375;

type Kind = "text" | "email" | "digits";

const FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif";

function Key({
  x,
  y,
  w,
  h = 42,
  mod = false,
  go = false,
  label,
  size = 22,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  mod?: boolean;
  go?: boolean;
  label?: string;
  size?: number;
  children?: React.ReactNode;
}) {
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

function Letters({ kind, enter }: { kind: "text" | "email"; enter: string }) {
  const go = enter === "go";
  return (
    <>
      {ROW1.map((c, i) => (
        <Key key={c} x={3 + i * PITCH} y={Y[0]} w={KEY_W} label={c} />
      ))}
      {ROW2.map((c, i) => (
        <Key key={c} x={21.75 + i * PITCH} y={Y[1]} w={KEY_W} label={c} />
      ))}
      <Key x={3} y={Y[2]} w={42} mod>
        <path
          d={`M${3 + 21} ${Y[2] + 11} l10 11 h-5.5 v9 h-9 v-9 h-5.5 z`}
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
          d={`M${330 + 15} ${Y[2] + 13} h15 a2.5 2.5 0 0 1 2.5 2.5 v11 a2.5 2.5 0 0 1 -2.5 2.5 h-15 l-7 -8 z M${330 + 20} ${Y[2] + 17.5} l7 7 M${330 + 27} ${Y[2] + 17.5} l-7 7`}
          fill="none"
          stroke="var(--kb-ink)"
          strokeWidth={1.6}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Key>
      {kind === "email" ? (
        <>
          <Key x={3} y={Y[3]} w={54} mod label="123" size={16} />
          <Key x={63} y={Y[3]} w={123} label="space" size={16} />
          <Key x={192} y={Y[3]} w={42} label="@" size={20} />
          <Key x={240} y={Y[3]} w={42} label="." size={22} />
          <Key
            x={288}
            y={Y[3]}
            w={84}
            mod={!go}
            go={go}
            label={enter}
            size={16}
          />
        </>
      ) : (
        <>
          <Key x={3} y={Y[3]} w={87} mod label="123" size={16} />
          <Key x={96} y={Y[3]} w={183} label="space" size={16} />
          <Key
            x={285}
            y={Y[3]}
            w={87}
            mod={!go}
            go={go}
            label={enter}
            size={16}
          />
        </>
      )}
      {/* The strip under the keys: the emoji key and dictation (a Face ID
          phone keeps them out of the rows). */}
      <g stroke="var(--kb-glyph)" strokeWidth={1.6} fill="none">
        <circle cx={32} cy={287} r={11} />
        <path d="M27 290 q5 5 10 0" strokeLinecap="round" />
        <rect x={339} y={277} width={8} height={13} rx={4} />
        <path d="M335 286 a8 8 0 0 0 16 0 M343 294 v4" strokeLinecap="round" />
      </g>
      <circle cx={28.5} cy={283.5} r={1.2} fill="var(--kb-glyph)" />
      <circle cx={35.5} cy={283.5} r={1.2} fill="var(--kb-glyph)" />
    </>
  );
}

const PAD: readonly (readonly [string, string])[] = [
  ["1", ""],
  ["2", "ABC"],
  ["3", "DEF"],
  ["4", "GHI"],
  ["5", "JKL"],
  ["6", "MNO"],
  ["7", "PQRS"],
  ["8", "TUV"],
  ["9", "WXYZ"],
];

function Digits() {
  const col = (i: number) => 6 + i * 123;
  const row = (i: number) => 52 + i * 54;
  return (
    <>
      {PAD.map(([d, letters], i) => {
        const x = col(i % 3);
        const y = row(Math.floor(i / 3));
        return (
          <Key key={d} x={x} y={y} w={117} h={46}>
            <text
              x={x + 58.5}
              y={y + (letters ? 25 : 31)}
              textAnchor="middle"
              fontFamily={FONT}
              fontSize={25}
              fill="var(--kb-ink)"
            >
              {d}
            </text>
            {letters && (
              <text
                x={x + 58.5}
                y={y + 39}
                textAnchor="middle"
                fontFamily={FONT}
                fontSize={9.5}
                fontWeight={600}
                letterSpacing={2}
                fill="var(--kb-ink)"
              >
                {letters}
              </text>
            )}
          </Key>
        );
      })}
      <Key x={col(1)} y={row(3)} w={117} h={46} label="0" size={25} />
      <path
        d={`M${col(2) + 44} ${row(3) + 14} h24 a3 3 0 0 1 3 3 v12 a3 3 0 0 1 -3 3 h-24 l-8 -9 z M${col(2) + 51} ${row(3) + 18.5} l8 8 M${col(2) + 59} ${row(3) + 18.5} l-8 8`}
        fill="none"
        stroke="var(--kb-ink)"
        strokeWidth={1.7}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </>
  );
}

/**
 * The keyboard, pinned to the frame's foot. `data-door-kb` is what every
 * caption measures the sheet against; `aria-hidden` because it is a picture of
 * the phone's own chrome, not a control.
 */
export function Keyboard({
  kind,
  enter = "return",
  code,
}: {
  kind: Kind;
  /** The return key's own label (`enterKeyHint`): "go" on the name field. */
  enter?: string;
  /** What the QuickType bar offers a one-time-code field. */
  code?: string;
}) {
  return (
    <svg
      data-door-kb={kind}
      aria-hidden
      viewBox={`0 0 ${W} ${KEYBOARD_H}`}
      width={W}
      height={KEYBOARD_H}
      className="fixed inset-x-0 bottom-0 z-[70] block"
    >
      <rect width={W} height={KEYBOARD_H} fill="var(--kb-bg)" />
      <rect width={W} height={0.5} fill="var(--kb-sep)" />
      {kind === "digits" ? (
        <g fontFamily={FONT} textAnchor="middle">
          <text x={W / 2} y={18} fontSize={11} fill="var(--kb-glyph)">
            From Mail
          </text>
          <text x={W / 2} y={36} fontSize={17} fill="var(--kb-ink)">
            {code}
          </text>
        </g>
      ) : (
        <>
          <rect x={125} y={12} width={0.75} height={20} fill="var(--kb-sep)" />
          <rect x={250} y={12} width={0.75} height={20} fill="var(--kb-sep)" />
        </>
      )}
      {kind === "digits" ? <Digits /> : <Letters kind={kind} enter={enter} />}
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
