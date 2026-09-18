#!/usr/bin/env node
/**
 * THE LAB DEMO CHECK (2026-09-17): every step of the review that is still open
 * has to SHOW its options. For each step it presses every option that carries a
 * picture and fails when the stage under the tiles does not visibly change.
 *
 *   pnpm lab:demo [--key <key>]                  # every open step, against pnpm dev
 *   pnpm lab:demo --board floating-surfaces      # one board
 *   pnpm lab:demo --only floating-surfaces.radius
 *   pnpm lab:demo --base https://<alias> --key "$DESIGN_PREVIEW_KEY"
 *   pnpm lab:demo --reach-limit 0.5              # a stricter travel budget
 *
 * WHY IT EXISTS. A board stopped Will's sitting for the third time on
 * 2026-09-17: "Clicking the configs didn't seem to change anything." The presses
 * registered and the real menu moved by a few pixels, but the 6x drawing he was
 * judging had been measured once and never again. `lab:smoke` cannot see that: a
 * frozen stage answers 200 and weighs the same number of words. What can see it
 * is a browser pressing the tiles and looking at the stage, so this does exactly
 * that: real Chrome over its DevTools protocol, Node's built-in WebSocket, no new
 * dependency, reduced motion emulated so a still stage compares as still.
 *
 * WHAT IT JUDGES. The steps are the desk's own "waiting" links (`?session=`), so
 * a ruled step is never pressed. A step passes when at least one pair of its
 * pictured options draws stages that differ by more than `--threshold` percent
 * of the stage's pixels (default 0.1: the frozen corner this was written for
 * moved 0.06 percent, its real menu's corners alone, and the fix moves it 0.9 to
 * 1.9). A step whose options differ only in MOTION (how a surface enters) is
 * still under reduced motion by design, so a stage that fails on pixels is read
 * a second time with motion allowed, and passes when the animations it declares
 * differ between options. A pair that
 * draws the SAME stage is printed as a warning: sometimes that is an option that
 * equals today, sometimes it is the next frozen stage. A step with no stage, or
 * with text-only options, is skipped and says so.
 *
 * ★ AND WHETHER THE CHANGE CAN BE SEEN, WHOLE, WITH THE ANSWER IN REACH
 * (2026-09-17, rebuilt 2026-09-18). A stage that changes is worth nothing if the
 * reviewer cannot see it. The first fix pinned the stage above the options in a
 * 40vh window, and Will could not see what he was answering ("The top preview
 * UI of our lab is covered by the answer UI, and I cannot scroll it to see the
 * full heights or labels on which height is which"). The step is now the page
 * with a dock, and a 1440x900 pass holds it there. A step FAILS when:
 *  - OUT OF REACH: the stage starts lower than `--reach-limit` (0.6) of a
 *    900px screen, so the preview is not the first thing under the question;
 *  - CLIPPED: anything around an option's preview cuts it short, which is the
 *    window he could not scroll;
 *  - UNLABELLED: the stage head does not name the option it is showing, which
 *    is "labels on which height is which";
 *  - NO DOCK: the dock is off screen at the top of the page or at its foot.
 * Every step also prints its height and its word count, and the run ends with
 * the tallest, the wordiest, and how much of the sitting asks with nothing to
 * press: a reviewer's unit of work is the STEP, and nothing else measures one
 * (`lab:smoke` weighs the whole board page).
 *
 * ★ IT LOOKS INSIDE THE FRAME, NOT AT THE LABEL OVER IT. A stage that is a frame
 * carries a title that names the pressed option, so the words change on every
 * press whether or not the evidence does: measured on the whole stage, the very
 * bug this was written for passed at 1.6 percent. When the stage holds a frame
 * the picture that is compared is the frame's own box, and the first option is
 * pressed once before anything is measured, so no capture is of a stage that is
 * still arriving.
 *
 * It presses the dock's options only, and never the one already shown (a
 * second press PICKS), never a Copy button (that writes the OS clipboard), and
 * it runs in its own throwaway Chrome profile, so it touches no reviewer's held
 * answers. Exit 1 on any failing step.
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inflateSync } from "node:zlib";

const argv = process.argv.slice(2);
const opt = (name, fallback) =>
  argv.includes(name) ? (argv[argv.indexOf(name) + 1] ?? fallback) : fallback;
const base = opt("--base", "http://localhost:3000").replace(/\/+$/, "");
const key = opt("--key", "");
const onlyBoard = opt("--board", "");
const onlyStep = opt("--only", "");
const threshold = Number(opt("--threshold", 0.1));
const settle = Number(opt("--settle", 1600));
const verbose = argv.includes("--verbose");

const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (!existsSync(CHROME)) {
  console.error(
    `lab:demo needs Chrome at ${CHROME} (set CHROME_PATH to point elsewhere).`,
  );
  process.exit(2);
}

const W = 1440;
const H = 2400;
/**
 * The screen a reviewer actually has, for judging how far they must travel.
 * The window above is tall on purpose (a whole step in one capture), so reach
 * and height are measured in pixels and divided by this.
 */
const SCREEN = 900;
/**
 * How far down a 900px screen the stage may start, as a share of it. Below this
 * the preview is not the first thing under the question, and a reviewer reads
 * a screen of words before seeing what they are asked about.
 */
const REACH_LIMIT = Number(opt("--reach-limit", 0.6));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const withKey = (path) => {
  const url = new URL(path, base);
  if (key) url.searchParams.set("key", key);
  return url.toString();
};

// ── A PNG down to its pixels (8-bit RGB or RGBA, non-interlaced: what Chrome writes)
function decodePng(buf) {
  let at = 8;
  let w = 0;
  let h = 0;
  let channels = 4;
  const idat = [];
  while (at < buf.length) {
    const len = buf.readUInt32BE(at);
    const type = buf.toString("latin1", at + 4, at + 8);
    const body = buf.subarray(at + 8, at + 8 + len);
    if (type === "IHDR") {
      w = body.readUInt32BE(0);
      h = body.readUInt32BE(4);
      const colour = body[9];
      if (body[8] !== 8 || (colour !== 2 && colour !== 6) || body[12] !== 0)
        throw new Error("an unexpected PNG format from the screenshot");
      channels = colour === 6 ? 4 : 3;
    } else if (type === "IDAT") idat.push(body);
    at += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * channels;
  const out = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const o = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? out[o + x - channels] : 0;
      const b = y > 0 ? out[o - stride + x] : 0;
      const c = x >= channels && y > 0 ? out[o - stride + x - channels] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      out[o + x] = v & 255;
    }
  }
  return { w, h, channels, data: out };
}

/** The share of pixels that differ by more than a rounding error, in percent. */
function differ(a, b) {
  if (a.w !== b.w || a.h !== b.h) return 100;
  let n = 0;
  const px = a.w * a.h;
  for (let i = 0; i < px; i++) {
    const ia = i * a.channels;
    const ib = i * b.channels;
    if (
      Math.abs(a.data[ia] - b.data[ib]) > 8 ||
      Math.abs(a.data[ia + 1] - b.data[ib + 1]) > 8 ||
      Math.abs(a.data[ia + 2] - b.data[ib + 2]) > 8
    )
      n++;
  }
  return (n / px) * 100;
}

// ── Chrome, over its DevTools protocol
const port = 9400 + (process.pid % 500);
const profile = mkdtempSync(join(tmpdir(), "lab-demo-"));
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--window-size=${W},${H}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

let seq = 0;
const pending = new Map();
let loaded = false;
function send(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function connect() {
  for (let i = 0; i < 80; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) {
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((r) => (ws.onopen = r));
        ws.onmessage = (m) => {
          const msg = JSON.parse(m.data);
          if (msg.id && pending.has(msg.id)) {
            const p = pending.get(msg.id);
            pending.delete(msg.id);
            if (msg.error) p.reject(new Error(msg.error.message));
            else p.resolve(msg.result);
          } else if (msg.method === "Page.loadEventFired") loaded = true;
        };
        return ws;
      }
    } catch {
      // Chrome is still opening its port.
    }
    await sleep(150);
  }
  throw new Error("Chrome never opened its debugging port");
}

async function evaluate(ws, expression) {
  const r = await send(ws, "Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (r.exceptionDetails)
    throw new Error(
      r.exceptionDetails.exception?.description ?? r.exceptionDetails.text,
    );
  return r.result.value;
}

async function go(ws, url) {
  loaded = false;
  await send(ws, "Page.navigate", { url });
  for (let i = 0; i < 300 && !loaded; i++) await sleep(100);
  await sleep(1200);
}

// In the page: the dock's pictured options, each option's view, and the step's frame.
const PAGE_LIB = `
  window.__labDemo = {
    options() {
      return [...document.querySelectorAll('main [data-lab-dock] [data-lab-option]')];
    },
    view(id) {
      return document.querySelector('main [data-lab-stage] [data-lab-view][data-option="' + CSS.escape(id) + '"]');
    },
    stage() {
      return document.querySelector('main [data-lab-stage]');
    },
    /** Where the stage starts, how tall the step is, and how much it asks you to read. */
    geo() {
      const stage = this.stage();
      const words = (document.querySelector('main')?.innerText || '').trim().split(/\\s+/).length;
      // PIXELS, not screens: the caller divides by a nominal screen.
      return {
        height: document.documentElement.scrollHeight,
        words,
        top: stage ? Math.round(stage.getBoundingClientRect().top + scrollY) : null,
        // What a step with no stage asks on instead: options in words, or a
        // catalog's own cards (a winner is pressed on the cards).
        kind: document.querySelector('main .lab-word-options') ? 'words' : 'cards',
      };
    },
    /** What the stage head says it is showing. */
    label() {
      return (document.querySelector('main [data-lab-stage-head] [data-lab-stage-label]')?.textContent || '').trim();
    },
    /** Whether the dock is on screen right now. */
    dock() {
      const d = document.querySelector('main [data-lab-dock]');
      if (!d) return false;
      const r = d.getBoundingClientRect();
      return r.height > 0 && r.top >= -1 && r.bottom <= innerHeight + 1;
    },
    /**
     * WHAT CUTS AN OPTION'S PREVIEW SHORT: an element around it whose box ends
     * before the preview does and does not let it overflow. The step's own
     * stage scrolls sideways by design, so only the height is judged.
     */
    clipped(id) {
      const v = this.view(id);
      if (!v) return 'no view';
      const r = v.getBoundingClientRect();
      if (r.height < 4) return 'no height';
      for (let el = v.parentElement; el && el !== document.body; el = el.parentElement) {
        const cs = getComputedStyle(el);
        if (cs.overflowY === 'visible') continue;
        const b = el.getBoundingClientRect();
        if (b.bottom < r.bottom - 2 || b.top > r.top + 2)
          return (el.getAttribute('class') || el.tagName).slice(0, 48) + ' cuts it at ' + Math.round(b.height) + 'px of ' + Math.round(r.height);
      }
      return null;
    },
    /** Every animation and transition one option's view declares, its frames included. */
    motion(id) {
      const s = this.view(id);
      if (!s) return '';
      const docs = [[...s.querySelectorAll('*')]];
      for (const f of s.querySelectorAll('iframe')) {
        try { docs.push([...f.contentDocument.querySelectorAll('body *')]); } catch {}
      }
      const out = new Set();
      for (const els of docs)
        for (const el of els) {
          const cs = getComputedStyle(el);
          if (cs.animationName !== 'none')
            out.add(cs.animationName + ' ' + cs.animationDuration + ' ' + cs.animationTimingFunction);
        }
      return [...out].sort().join(' | ');
    },
    /** Show an option: a press, unless it is already shown (a second press picks). */
    show(i) {
      const chip = this.options()[i];
      if (!chip) return '';
      if (!chip.hasAttribute('data-shown')) chip.click();
      return chip.getAttribute('data-lab-option');
    },
  };
`;

async function stageShot(ws, id) {
  const rect = await evaluate(
    ws,
    `(async () => {
      const s = window.__labDemo.view(${JSON.stringify(id)});
      if (!s) return null;
      // The sticky head and dock float over whatever they pass: out of the picture.
      let hide = document.getElementById('lab-demo-hide');
      if (!hide) {
        hide = document.createElement('style');
        hide.id = 'lab-demo-hide';
        hide.textContent = '[data-lab-dock],[data-lab-stage-head]{visibility:hidden!important}';
        document.head.appendChild(hide);
      }
      s.scrollIntoView({ block: 'start' });
      // Let a lazily mounted frame arrive, then let every frame in the view load.
      for (let i = 0; i < 40; i++) {
        const frames = [...s.querySelectorAll('iframe')];
        const ready = frames.every((f) => {
          try { return f.contentDocument && f.contentDocument.readyState === 'complete'; }
          catch { return true; }
        });
        if (ready) break;
        await new Promise((r) => setTimeout(r, 150));
      }
      await new Promise((r) => setTimeout(r, ${settle}));
      // The evidence is the frame when there is one: a label over it names
      // the option and would move on a frozen stage too.
      const frames = [...s.querySelectorAll('iframe')]
        .map((f) => f.getBoundingClientRect())
        .filter((r) => r.width > 8 && r.height > 8)
        .sort((a, b) => b.width * b.height - a.width * a.height);
      const r = frames[0] ?? s.getBoundingClientRect();
      return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: Math.min(r.height, 2000) };
    })()`,
  );
  if (!rect || rect.width < 8 || rect.height < 8) return null;
  const shot = await send(ws, "Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { ...rect, scale: 1 },
  });
  return Buffer.from(shot.data, "base64");
}

const MEDIA_STILL = [
  { name: "prefers-color-scheme", value: "dark" },
  { name: "prefers-reduced-motion", value: "reduce" },
];
const MEDIA_MOVING = [
  { name: "prefers-color-scheme", value: "dark" },
  { name: "prefers-reduced-motion", value: "no-preference" },
];

const rows = [];
let failed = 0;
try {
  const ws = await connect();
  await send(ws, "Page.enable");
  await send(ws, "Runtime.enable");
  await send(ws, "Emulation.setDeviceMetricsOverride", {
    width: W,
    height: H,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send(ws, "Emulation.setEmulatedMedia", { features: MEDIA_STILL });

  // The open steps, from the desk itself.
  await go(ws, withKey("/design/lab"));
  const steps = await evaluate(
    ws,
    `[...new Set([...document.querySelectorAll('a[href*="session="]')]
        .map((a) => new URL(a.href).searchParams.get('session')))]
        .filter((s) => s && s.includes('.') && !s.endsWith('.items'))`,
  );
  // `--only` may name a step the desk no longer lists (an answered one), so a
  // layout can be measured on any step the board still declares.
  const wanted = onlyStep
    ? [onlyStep]
    : steps.filter((s) => !onlyBoard || s.startsWith(`${onlyBoard}.`));
  if (wanted.length === 0) {
    console.log("lab:demo found no open step to press.");
  }

  for (const step of wanted) {
    const board = step.slice(0, step.indexOf("."));
    const url = withKey(
      `/design/lab/${board}?session=${encodeURIComponent(step)}`,
    );

    // ── THE LAYOUT, at a reviewer's screen: 1440x900 ─────────────────────
    await send(ws, "Emulation.setDeviceMetricsOverride", {
      width: W,
      height: SCREEN,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await go(ws, url);
    await evaluate(ws, PAGE_LIB);
    const geo = await evaluate(ws, "window.__labDemo.geo()");
    const count = await evaluate(ws, "window.__labDemo.options().length");
    if (count < 2 || geo.top === null) {
      rows.push({
        step,
        geo,
        verdict: "skip",
        words: geo.top === null && geo.kind === "words",
        note:
          geo.top === null
            ? geo.kind === "words"
              ? "no stage: its options are words"
              : "a catalog's winner, pressed on its own cards"
            : "fewer than two pictured options",
      });
      await send(ws, "Emulation.setDeviceMetricsOverride", {
        width: W,
        height: H,
        deviceScaleFactor: 1,
        mobile: false,
      });
      continue;
    }
    const layout = [];
    const outOfReach = geo.top > SCREEN * REACH_LIMIT;
    if (outOfReach)
      layout.push(
        `OUT OF REACH: the stage starts ${(geo.top / SCREEN).toFixed(2)} of a screen down`,
      );
    await evaluate(ws, "window.scrollTo(0, 0)");
    await sleep(150);
    const dockTop = await evaluate(ws, "window.__labDemo.dock()");
    await evaluate(ws, "window.scrollTo(0, document.documentElement.scrollHeight)");
    await sleep(250);
    const dockFoot = await evaluate(ws, "window.__labDemo.dock()");
    if (!dockTop || !dockFoot)
      layout.push(
        `NO DOCK: off screen at the ${!dockTop ? "top" : "foot"} of the page`,
      );
    await evaluate(ws, "window.scrollTo(0, 0)");
    for (let i = 0; i < count; i++) {
      const id = await evaluate(ws, `window.__labDemo.show(${i})`);
      await sleep(250);
      const want = await evaluate(
        ws,
        `window.__labDemo.options()[${i}].getAttribute('data-label') || ''`,
      );
      const said = await evaluate(ws, "window.__labDemo.label()");
      if (!said || !said.includes(want))
        layout.push(`UNLABELLED: showing "${want}", the head says "${said}"`);
      const cut = await evaluate(ws, `window.__labDemo.clipped(${JSON.stringify(id)})`);
      if (cut) layout.push(`CLIPPED: "${want}": ${cut}`);
    }

    // ── THE PICTURES, in a window tall enough to hold a whole option ─────
    await send(ws, "Emulation.setDeviceMetricsOverride", {
      width: W,
      height: H,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await go(ws, url);
    await evaluate(ws, PAGE_LIB);
    // One capture before anything is measured, so the first is not of a
    // stage that is still mounting its frame or drawing its first reading.
    await stageShot(ws, await evaluate(ws, "window.__labDemo.show(0)"));
    const shots = [];
    for (let i = 0; i < count; i++) {
      const id = await evaluate(ws, `window.__labDemo.show(${i})`);
      const label = await evaluate(
        ws,
        `(window.__labDemo.options()[${i}].getAttribute('data-label') || '').slice(0, 28)`,
      );
      const png = await stageShot(ws, id);
      if (!png) break;
      shots.push({
        id,
        label,
        hash: createHash("sha1").update(png).digest("hex"),
        png,
      });
    }
    if (shots.length < 2) {
      rows.push({ step, geo, verdict: "skip", note: "the stage could not be captured" });
      continue;
    }
    const decoded = shots.map((s) => decodePng(s.png));
    let max = 0;
    const same = [];
    for (let a = 0; a < shots.length; a++)
      for (let b = a + 1; b < shots.length; b++) {
        const d =
          shots[a].hash === shots[b].hash ? 0 : differ(decoded[a], decoded[b]);
        max = Math.max(max, d);
        if (d < threshold) same.push(`${shots[a].label} = ${shots[b].label}`);
        if (verbose)
          console.log(
            `  ${step}: ${shots[a].label} vs ${shots[b].label}: ${d.toFixed(3)}%`,
          );
      }
    let ok = max >= threshold;
    let how = `the stage moves by up to ${max.toFixed(2)}%`;
    if (!ok) {
      // Still pictures that match may be a question about motion: read what
      // each option declares, with motion allowed.
      await send(ws, "Emulation.setEmulatedMedia", { features: MEDIA_MOVING });
      await go(ws, url);
      await evaluate(ws, PAGE_LIB);
      const motions = [];
      for (let i = 0; i < count; i++) {
        const id = await evaluate(ws, `window.__labDemo.show(${i})`);
        await stageShot(ws, id);
        motions.push(
          await evaluate(ws, `window.__labDemo.motion(${JSON.stringify(id)})`),
        );
      }
      await send(ws, "Emulation.setEmulatedMedia", { features: MEDIA_STILL });
      if (new Set(motions).size > 1) {
        ok = true;
        how = "the options differ in motion only (the animations the stage declares)";
      }
      if (verbose) motions.forEach((m, i) => console.log(`  ${step}: motion ${i}: ${m}`));
    }
    const broken = layout.length > 0;
    if (!ok || broken) failed++;
    const first = layout[0]?.split(":")[0];
    rows.push({
      step,
      geo,
      layout,
      verdict: broken ? first : ok ? "ok" : "FROZEN",
      note: `${shots.length} options, ${how}${
        ok && same.length && max >= threshold
          ? `; same picture: ${same.join(", ")}`
          : ""
      }`,
    });
  }
  ws.close();
} finally {
  chrome.kill("SIGKILL");
  await sleep(200);
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    // A profile Chrome is still letting go of is the OS's to clean.
  }
}

const pad = Math.max(...rows.map((r) => r.step.length), 4);
const screens = (px) => (px / SCREEN).toFixed(1);
for (const r of rows) {
  const g = r.geo ?? {};
  const size = g.height
    ? `${screens(g.height).padStart(4)} screens, ${String(g.words).padStart(4)} words`
    : "";
  console.log(
    `${r.step.padEnd(pad)}  ${r.verdict.padEnd(12)}  ${size.padEnd(26)}  ${r.note}`,
  );
  for (const finding of r.layout ?? [])
    console.log(`${" ".repeat(pad)}  ${finding}`);
}
/**
 * ★ "SKIPPED" IS A COST, NOT AN EXEMPTION. A skipped step is one with nothing
 * to press: its options are words, so this script cannot judge it and neither
 * can a reviewer at a glance. That is the format Will has objected to since the
 * first sitting ("designing a few variations always beats a mountain of
 * research text"), so it is printed as a share of the sitting rather than
 * filed quietly at the end. It is not a failure: a question about a price or a
 * plan has nothing to draw, and `registry.test.ts` makes such an ask carry the
 * `look` line that says what to compare instead.
 */
const wordsOnly = rows.filter((r) => r.words).length;
const share = rows.length ? Math.round((wordsOnly / rows.length) * 100) : 0;
const sized = rows.filter((r) => r.geo?.height);
const tallest = sized.length
  ? sized.reduce((a, b) => (a.geo.height > b.geo.height ? a : b))
  : null;
const wordiest = sized.length
  ? sized.reduce((a, b) => (a.geo.words > b.geo.words ? a : b))
  : null;
console.log(`\n${rows.length} steps, ${failed} failing.`);
if (tallest)
  console.log(
    `tallest: ${tallest.step} at ${screens(tallest.geo.height)} screens · ` +
      `wordiest: ${wordiest.step} at ${wordiest.geo.words} words · ` +
      `a reviewer's screen is taken as ${SCREEN}px.`,
  );
console.log(
  wordsOnly
    ? `${wordsOnly} of them (${share}%) ask with nothing to press: words only, judged on their \`look\` line.`
    : "Every step draws its options.",
);
process.exit(failed ? 1 : 0);
