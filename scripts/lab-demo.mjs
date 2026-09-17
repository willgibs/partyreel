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
 * ★ IT LOOKS INSIDE THE FRAME, NOT AT THE LABEL OVER IT. A stage that is a frame
 * carries a title that names the pressed option, so the words change on every
 * press whether or not the evidence does: measured on the whole stage, the very
 * bug this was written for passed at 1.6 percent. When the stage holds a frame
 * the picture that is compared is the frame's own box, and the first option is
 * pressed once before anything is measured, so no capture is of a stage that is
 * still arriving.
 *
 * It presses tiles and cards only, never a Copy button (that writes the OS
 * clipboard), and it runs in its own throwaway Chrome profile, so it touches no
 * reviewer's held answers. Exit 1 on any failing step.
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

// In the page: the pressable pictured options, and the stage under them.
const PAGE_LIB = `
  window.__labDemo = {
    options() {
      return [...document.querySelectorAll('main [role="button"][aria-pressed]')]
        .filter((el) => el.querySelector('[data-lab-specimen]'));
    },
    stage() {
      const all = [...document.querySelectorAll('main [data-lab-specimen]')].filter(
        (el) =>
          !el.hasAttribute('inert') &&
          !el.closest('[inert]') &&
          !el.closest('[role="button"]') &&
          !el.querySelector('[role="button"][aria-pressed]'),
      );
      return all[all.length - 1] ?? null;
    },
    /** Every animation and transition the stage declares, its frames included. */
    motion() {
      const s = this.stage();
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
  };
`;

async function stageShot(ws) {
  const rect = await evaluate(
    ws,
    `(async () => {
      const s = window.__labDemo.stage();
      if (!s) return null;
      s.scrollIntoView({ block: 'start' });
      // Let a lazily mounted frame arrive, then let every frame in the stage load.
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
      // The evidence is the frame when there is one: the label over it names
      // the pressed option and would move on a frozen stage too.
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
  const wanted = steps.filter(
    (s) =>
      (!onlyBoard || s.startsWith(`${onlyBoard}.`)) &&
      (!onlyStep || s === onlyStep),
  );
  if (wanted.length === 0) {
    console.log("lab:demo found no open step to press.");
  }

  for (const step of wanted) {
    const board = step.slice(0, step.indexOf("."));
    await go(
      ws,
      withKey(`/design/lab/${board}?session=${encodeURIComponent(step)}`),
    );
    await evaluate(ws, PAGE_LIB);
    const count = await evaluate(ws, "window.__labDemo.options().length");
    const hasStage = await evaluate(ws, "!!window.__labDemo.stage()");
    if (count < 2 || !hasStage) {
      rows.push({
        step,
        verdict: "skip",
        note: !hasStage ? "no stage under the tiles" : "fewer than two pictured options",
      });
      continue;
    }
    // One press before anything is measured, so the first capture is not of a
    // stage that is still mounting its frame or drawing its first reading.
    await evaluate(ws, "window.__labDemo.options()[0].click()");
    await stageShot(ws);
    const shots = [];
    for (let i = 0; i < count; i++) {
      const label = await evaluate(
        ws,
        `(() => { const el = window.__labDemo.options()[${i}]; el.click();
           return (el.getAttribute('data-lab-card') || el.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 28); })()`,
      );
      const png = await stageShot(ws);
      if (!png) break;
      shots.push({
        label,
        hash: createHash("sha1").update(png).digest("hex"),
        png,
      });
    }
    if (shots.length < 2) {
      rows.push({ step, verdict: "skip", note: "the stage could not be captured" });
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
      await go(
        ws,
        withKey(`/design/lab/${board}?session=${encodeURIComponent(step)}`),
      );
      await evaluate(ws, PAGE_LIB);
      const motions = [];
      for (let i = 0; i < count; i++) {
        await evaluate(ws, `window.__labDemo.options()[${i}].click()`);
        await stageShot(ws);
        motions.push(await evaluate(ws, "window.__labDemo.motion()"));
      }
      await send(ws, "Emulation.setEmulatedMedia", { features: MEDIA_STILL });
      if (new Set(motions).size > 1) {
        ok = true;
        how = "the options differ in motion only (the animations the stage declares)";
      }
      if (verbose) motions.forEach((m, i) => console.log(`  ${step}: motion ${i}: ${m}`));
    }
    if (!ok) failed++;
    rows.push({
      step,
      verdict: ok ? "ok" : "FROZEN",
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
for (const r of rows)
  console.log(`${r.step.padEnd(pad)}  ${r.verdict.padEnd(6)}  ${r.note}`);
console.log(
  `\n${rows.length} steps, ${failed} frozen, ${rows.filter((r) => r.verdict === "skip").length} skipped`,
);
process.exit(failed ? 1 : 0);
