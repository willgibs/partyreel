#!/usr/bin/env node
/**
 * THE LAB DEMO CHECK (2026-09-17): every step of the review that is still open
 * has to SHOW its options. For each step it presses every option that carries a
 * picture and fails when the stage under the tiles does not visibly change.
 *
 *   pnpm lab:demo --base http://localhost:3131   # every open step, against YOUR dev server
 *   pnpm lab:demo --base ... --board floating-surfaces      # one board
 *   pnpm lab:demo --base ... --only floating-surfaces.radius
 *   pnpm lab:demo --base https://<alias>         # the key rides DESIGN_PREVIEW_KEY
 *   pnpm lab:demo --base ... --reach-limit 0.5   # a stricter travel budget
 *
 * `--base` is required (or `LAB_BASE` in the environment): there is no default,
 * because the only sane-looking default is the Orchestrator's own :3000 and a
 * lane that measures that is measuring somebody else's tree. A board that
 * stalls is failed on its own budget (`--board-timeout`, `--call-timeout`) and
 * the walk goes on.
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
 * And a step whose every capture is ONE FLAT COLOUR is UNPAINTED rather than
 * frozen: headless Chrome does not always rasterise a composited layer (a
 * scene built out of backdrop-filter over photographs), and accusing a board
 * of drawing the same picture four times when the tool drew none of them is
 * worse than saying nothing.
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
/**
 * ★ THERE IS NO DEFAULT BASE, AND THAT IS THE FIX (lab-tides, 2026-09-19).
 *
 * It used to default to `http://localhost:3000`, which is the ORCHESTRATOR's
 * port: a lane that forgot the flag measured a tree that was not its own and
 * was told "lab:demo found no open step to press", which reads as "your board
 * has no open steps". Two lanes misread their own desk that way in one day.
 * A wrong answer delivered confidently is worse than no answer, so the script
 * refuses to guess: pass `--base`, or set `LAB_BASE` once in the shell.
 */
const rawBase = opt("--base", process.env.LAB_BASE ?? "");
if (!rawBase) {
  console.error(
    "lab:demo needs the server to press: --base http://localhost:<your port>\n" +
      "  (or export LAB_BASE). There is no default on purpose: :3000 is the\n" +
      "  Orchestrator's tree, and a lane that measures it is measuring somebody\n" +
      "  else's board.",
  );
  process.exit(2);
}
const base = rawBase.replace(/\/+$/, "");
// The key may ride the environment: pnpm echoes a script's argv into any log it is redirected to,
// so `DESIGN_PREVIEW_KEY=... pnpm lab:demo` keeps it out of the log where `--key` would not.
const key = opt("--key", process.env.DESIGN_PREVIEW_KEY ?? "");
const onlyBoard = opt("--board", "");
const onlyStep = opt("--only", "");
const threshold = Number(opt("--threshold", 0.1));
/**
 * THE SETTLE IS A FLOOR, AND THE READINESS CHECK RUNS PAST IT (lab-tides,
 * 2026-09-19).
 *
 * It used to be a flat 1,600 ms sleep, which is not enough for a stage whose
 * frames are still fetching photographs: `guest-shape` reported three different
 * "same picture" pairs across four runs on a board whose frames load
 * photographs and a dynamically imported QR. So the capture now also waits for
 * the frames' own images, their fonts and the view to stop mutating.
 *
 * ★ BUT IT NEVER CAPTURES EARLIER THAN IT USED TO, and that is a correction to
 * this same change: waiting only for readiness captured a stage 1.3 s sooner,
 * and `host-curation.undo` (whose options differ by an undo toast that arrives
 * after the press) went from 1.50% to a FROZEN 0.00%. A capture that is too
 * early is the same lie as a capture that is too late. `--settle` is the floor
 * every capture still waits out, and `--settle-max` is the ceiling readiness
 * may push it to.
 */
const settle = Number(opt("--settle", 1600));
const settleMax = Number(opt("--settle-max", settle * 4));
/** How long a view must be still (no DOM mutations) before it is captured. */
const quiet = Number(opt("--quiet", 250));
/**
 * ★ A STALL IS A RESULT, NOT A HANG (lab-tides, 2026-09-19). A desk-wide run
 * sat on one board's first step for nine minutes at zero CPU with the
 * Orchestrator's alarm as the only way out: a DevTools reply that never
 * arrives leaves the whole run waiting on one promise. Every call now has a
 * ceiling, and a board that burns its budget is failed and walked past, so the
 * other thirty boards are still measured.
 */
const callTimeout = Number(opt("--call-timeout", 60_000));
const boardTimeout = Number(opt("--board-timeout", 300_000));
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
/**
 * The window the PICTURES are taken in: tall enough to hold a whole option
 * under the step's head without scrolling, because a capture that has to reach
 * beyond the window is a capture Chrome recomposites (see the clip's note in
 * `stageShot`). A step's head runs to about 700px, so this holds a 2,300px
 * option whole.
 */
const H = 3000;
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

/**
 * ★ A STAGE THIS BROWSER NEVER PAINTED (lab-tides, 2026-09-19). Four `glass`
 * steps read FROZEN at 0.00 percent with their frames' DOM plainly different
 * (blur 4, 8, 13 and 21 px, read through the frame's own `getComputedStyle`):
 * headless Chrome rasterised the whole scene as one flat colour, because a
 * scene built out of `backdrop-filter` over photographs is a composited layer
 * and this renderer does not always paint one into a capture. A tool that
 * cannot see a stage must say so rather than accuse the board of showing the
 * same picture four times, so a capture with no variance at all is reported as
 * UNPAINTED and judged by eye instead.
 */
function flatPicture(img) {
  let min = 255;
  let max = 0;
  // Every 97th pixel: a prime stride, so a regular pattern cannot alias into
  // looking flat, and a 1440x900 frame is still a thousand samples.
  for (let i = 0; i < img.w * img.h; i += 97) {
    const at = i * img.channels;
    for (let c = 0; c < 3; c++) {
      const v = img.data[at + c];
      if (v < min) min = v;
      if (v > max) max = v;
    }
  }
  return max - min < 8;
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
/** The error a blown ceiling throws, so a caller can tell it from a real one. */
class Stalled extends Error {}
/**
 * Every DevTools call under a ceiling. Without one, a wedged renderer leaves
 * this promise pending for ever and the run has no way to notice: the reply
 * simply never comes, the process sits at zero CPU, and the only cure is a
 * person with a clock (see `--call-timeout`).
 */
function send(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    const timer = setTimeout(() => {
      if (!pending.has(id)) return;
      pending.delete(id);
      reject(new Stalled(`${method} did not answer in ${callTimeout}ms`));
    }, callTimeout);
    pending.set(id, {
      resolve: (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      reject: (e) => {
        clearTimeout(timer);
        reject(e);
      },
    });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function connect() {
  for (let i = 0; i < 80; i++) {
    try {
      const list = await (
        await fetch(`http://127.0.0.1:${port}/json/list`)
      ).json();
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
      // The floor every capture waits out, and the ceiling readiness may push
      // it to. Nothing is ever captured before the floor.
      const floor = Date.now() + ${settle};
      const until = Date.now() + ${settleMax};
      const nap = (ms) => new Promise((r) => setTimeout(r, ms));
      const docsOf = () => {
        const out = [document];
        for (const f of s.querySelectorAll('iframe')) {
          try { if (f.contentDocument) out.push(f.contentDocument); } catch {}
        }
        return out;
      };
      // 1. Let a lazily mounted frame arrive, then let every frame in the view load.
      while (Date.now() < until) {
        const frames = [...s.querySelectorAll('iframe')];
        const ready = frames.every((f) => {
          try { return f.contentDocument && f.contentDocument.readyState === 'complete'; }
          catch { return true; }
        });
        if (ready) break;
        await nap(100);
      }
      // 2. ★ THE PICTURES THEMSELVES, which is what the flat 1,600 ms was
      //    really waiting for and often missed: a frame's photographs decode
      //    after its document is complete, and a board whose stage is four
      //    frames of a wedding reported three different "same picture" pairs
      //    across four runs. Every <img> in the view AND in each frame, the
      //    fonts with them, then the layout settled by two frames.
      while (Date.now() < until) {
        let waiting = 0;
        for (const d of docsOf())
          for (const img of d.querySelectorAll('img'))
            if (!img.complete || img.naturalWidth === 0) waiting++;
        if (!waiting) break;
        await nap(100);
      }
      await Promise.race([
        Promise.all(docsOf().map((d) => d.fonts && d.fonts.ready).filter(Boolean)),
        nap(Math.max(0, until - Date.now())),
      ]).catch(() => {});
      // 3. ★ AND THEN STILLNESS, which is the honest end of a settle: a
      //    dynamically imported QR mounts long after load and nothing about a
      //    document says it is coming. The view is captured once it has stopped
      //    MUTATING for the quiet window, or when the ceiling is reached. The
      //    floor below still applies: quiet is not the same as arrived.
      await new Promise((resolve) => {
        let timer = 0;
        const observers = [];
        const done = () => {
          clearTimeout(timer);
          for (const o of observers) o.disconnect();
          resolve();
        };
        const rest = () => {
          clearTimeout(timer);
          timer = setTimeout(done, ${quiet});
        };
        // Bounded by the FLOOR, not the ceiling: stillness may only use time
        // this capture was going to spend anyway. A stage that mutates for
        // ever (a scene driving itself from JS) would otherwise spend the
        // whole ceiling on every option, and a desk-wide run grew by half.
        const cap = setTimeout(done, Math.max(${quiet}, floor - Date.now()));
        for (const d of docsOf()) {
          try {
            const o = new (d.defaultView || window).MutationObserver(rest);
            o.observe(d.documentElement || d, { subtree: true, childList: true, attributes: true, characterData: true });
            observers.push(o);
          } catch {}
        }
        observers.push({ disconnect: () => clearTimeout(cap) });
        rest();
      });
      // 4. And never sooner than the flat settle this replaced.
      if (Date.now() < floor) await nap(floor - Date.now());
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      // The evidence is the frame when there is one: a label over it names
      // the option and would move on a frozen stage too.
      const box = () => {
        const frames = [...s.querySelectorAll('iframe')]
          .map((f) => f.getBoundingClientRect())
          .filter((r) => r.width > 8 && r.height > 8)
          .sort((a, b) => b.width * b.height - a.width * a.height);
        return frames[0] ?? s.getBoundingClientRect();
      };
      // ★ THE BOX IS SCROLLED INTO THE WINDOW AND CLIPPED THERE (lab-tides,
      //   2026-09-19, on the finding glass filed 2026-09-18). Capturing
      //   BEYOND the viewport makes Chrome resize its render surface and
      //   recomposite: a frame came back black (two identical grids read 84
      //   percent apart) and a backdrop-filter came back missing entirely, so
      //   four glass steps whose options differ only in the blur behind them
      //   read 0.00 percent and FROZEN with the DOM plainly different (blur
      //   4, 8, 13 and 21 px, measured). The window is taller than any stage
      //   this clips, so scrolling the box to the top and clipping inside the
      //   window captures what a reader sees, composited.
      const first = box();
      window.scrollTo(0, Math.max(0, first.top + scrollY - 4));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await nap(120);
      const r = box();
      const top = Math.max(0, r.top);
      const room = innerHeight - top;
      // Inside the window: viewport coordinates, composited, which is what a
      // reader sees. Taller than the window (a document too short to scroll
      // the box up): page coordinates and the old flag, because half a
      // picture would compare two options on a strip they share.
      return r.height <= room
        ? { x: Math.max(0, r.left), y: top, width: r.width, height: r.height, beyond: false }
        : {
            x: Math.max(0, r.left + scrollX),
            y: r.top + scrollY,
            width: r.width,
            height: Math.min(r.height, 2000),
            beyond: true,
          };
    })()`,
  );
  if (!rect || rect.width < 8 || rect.height < 8) return null;
  const { beyond, ...clip } = rect;
  const shot = await send(ws, "Page.captureScreenshot", {
    format: "png",
    // Only for a stage taller than the window, which no board draws today:
    // the flag is what miscomposites, so it is paid for only where it is the
    // difference between a partial picture and none.
    captureBeyondViewport: beyond,
    clip: { ...clip, scale: 1 },
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
/** The board being walked, when its clock started, and why it was abandoned. */
let walking = null;
let boardStarted = 0;
let boardBlown = null;
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
    // ── THE BOARD'S BUDGET ──────────────────────────────────────────────
    // A run walks every board on the desk, so one wedged board must not take
    // the other thirty with it. Each board gets its own clock; a board that
    // blows it (or stalls a DevTools call) is failed, its remaining steps are
    // printed as its own line, and the walk goes on.
    const boardId = step.slice(0, step.indexOf("."));
    if (boardId !== walking) {
      walking = boardId;
      boardStarted = Date.now();
      boardBlown = null;
    }
    const spent = Date.now() - boardStarted;
    if (!boardBlown && spent > boardTimeout)
      boardBlown = `the board's budget of ${boardTimeout}ms ran out after ${Math.round(spent / 1000)}s`;
    if (boardBlown) {
      failed++;
      rows.push({ step, verdict: "TIMED OUT", note: boardBlown });
      continue;
    }
    try {
      const url = withKey(
        `/design/lab/${boardId}?session=${encodeURIComponent(step)}`,
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
      await evaluate(
        ws,
        "window.scrollTo(0, document.documentElement.scrollHeight)",
      );
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
        const cut = await evaluate(
          ws,
          `window.__labDemo.clipped(${JSON.stringify(id)})`,
        );
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
        rows.push({
          step,
          geo,
          verdict: "skip",
          note: "the stage could not be captured",
        });
        continue;
      }
      const decoded = shots.map((s) => decodePng(s.png));
      // Nothing to compare when nothing was painted: see `flatPicture`.
      const unpainted = decoded.every(flatPicture);
      let max = 0;
      const same = [];
      for (let a = 0; a < shots.length; a++)
        for (let b = a + 1; b < shots.length; b++) {
          const d =
            shots[a].hash === shots[b].hash
              ? 0
              : differ(decoded[a], decoded[b]);
          max = Math.max(max, d);
          if (d < threshold) same.push(`${shots[a].label} = ${shots[b].label}`);
          if (verbose)
            console.log(
              `  ${step}: ${shots[a].label} vs ${shots[b].label}: ${d.toFixed(3)}%`,
            );
        }
      let ok = max >= threshold;
      let how = `the stage moves by up to ${max.toFixed(2)}%`;
      if (!ok && !unpainted) {
        // Still pictures that match may be a question about motion: read what
        // each option declares, with motion allowed.
        await send(ws, "Emulation.setEmulatedMedia", {
          features: MEDIA_MOVING,
        });
        await go(ws, url);
        await evaluate(ws, PAGE_LIB);
        const motions = [];
        for (let i = 0; i < count; i++) {
          const id = await evaluate(ws, `window.__labDemo.show(${i})`);
          await stageShot(ws, id);
          motions.push(
            await evaluate(
              ws,
              `window.__labDemo.motion(${JSON.stringify(id)})`,
            ),
          );
        }
        await send(ws, "Emulation.setEmulatedMedia", { features: MEDIA_STILL });
        if (new Set(motions).size > 1) {
          ok = true;
          how =
            "the options differ in motion only (the animations the stage declares)";
        }
        if (verbose)
          motions.forEach((m, i) =>
            console.log(`  ${step}: motion ${i}: ${m}`),
          );
      }
      const broken = layout.length > 0;
      // UNPAINTED is not a failure: the board may be perfect and this renderer
      // blind to it. It is printed loudly all the same, because a step nobody
      // can capture is a step nobody should trust this tool about.
      if ((!ok && !unpainted) || broken) failed++;
      const first = layout[0]?.split(":")[0];
      rows.push({
        step,
        geo,
        layout,
        unpainted,
        verdict: broken
          ? first
          : unpainted
            ? "UNPAINTED"
            : ok
              ? "ok"
              : "FROZEN",
        note: unpainted
          ? `${shots.length} options, every capture one flat colour: this browser did not paint the stage (a composited layer), so judge it by eye`
          : `${shots.length} options, ${how}${
              ok && same.length && max >= threshold
                ? `; same picture: ${same.join(", ")}`
                : ""
            }`,
      });
    } catch (error) {
      // A stalled call or a dead page: record it, drop the rest of this
      // board, put the tab somewhere harmless, and walk on.
      failed++;
      boardBlown =
        error instanceof Stalled
          ? `${error.message}; the rest of ${boardId} was not pressed`
          : `${error.message ?? error}; the rest of ${boardId} was not pressed`;
      rows.push({
        step,
        verdict: error instanceof Stalled ? "TIMED OUT" : "ERROR",
        note: boardBlown,
      });
      try {
        await send(ws, "Page.navigate", { url: "about:blank" });
      } catch {
        // The page is gone; the next board's navigate will say so.
      }
    }
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
const blind = rows.filter((r) => r.unpainted).length;
const wordsOnly = rows.filter((r) => r.words).length;
const share = rows.length ? Math.round((wordsOnly / rows.length) * 100) : 0;
const sized = rows.filter((r) => r.geo?.height);
const tallest = sized.length
  ? sized.reduce((a, b) => (a.geo.height > b.geo.height ? a : b))
  : null;
const wordiest = sized.length
  ? sized.reduce((a, b) => (a.geo.words > b.geo.words ? a : b))
  : null;
console.log(
  `\n${rows.length} steps, ${failed} failing${
    blind ? `, ${blind} this browser could not paint` : ""
  }.`,
);
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
