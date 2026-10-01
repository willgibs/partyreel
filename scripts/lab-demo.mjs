#!/usr/bin/env node
/**
 * THE LAB DEMO CHECK (2026-09-17): every step of the review that is still open
 * has to SHOW its options. For each step it presses every option that carries a
 * picture and fails when the stage under the tiles does not visibly change.
 *
 *   pnpm lab:demo --base http://localhost:3131   # the open steps of the boards YOUR change reached
 *   pnpm lab:demo --base ... --all               # every open step on the desk (or FULL=1)
 *   pnpm lab:demo --base ... --board floating-surfaces      # named boards, comma-separated
 *   pnpm lab:demo --base ... --since HEAD^1      # the boards a merge reached
 *   pnpm lab:demo --base ... --only floating-surfaces.radius
 *   pnpm lab:demo --base https://<alias>         # the key rides DESIGN_PREVIEW_KEY
 *   pnpm lab:demo --base ... --reach-limit 0.4   # a stricter reach (the stage's top, of a screen)
 *   pnpm lab:demo --base ... --state screen=phone # every step pressed wearing a knob (repeatable)
 *   pnpm lab:demo --base ... --width 375         # the sitting at a phone's width
 *
 * ★ IT PRESSES WHAT THE CHANGE REACHED (the lab revamp, 2026-09-29): the boards
 * `scripts/lab-scope.mjs` finds in this tree's change (its own folder, its
 * ledger, a production file its drawings import), the whole desk only on
 * `--all` or `FULL=1`; the scope is its first lines.
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
 * an answered step is never pressed. A step passes when at least one pair of its
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
 * (2026-09-17, rebuilt 2026-09-18; a gate at a desk and a phone, lab-focus,
 * 2026-09-29). A stage that changes is worth nothing if the reviewer cannot
 * see it. The first fix pinned the stage above the options in a 40vh window,
 * and Will could not see what he was answering ("The top preview UI of our lab
 * is covered by the answer UI, and I cannot scroll it"); the context layer
 * then grew a wall above the pictures, until at a desk the frames started
 * under the fold and the dock cut them ("a Jackson Pollock painting of text").
 * So every step is measured on the two screens he reads on, 1440 by 900 and
 * 375 by 812, whatever `--width` the pictures are taken at, with every option
 * shown in turn, and a step FAILS when:
 *  - FOLD: the stage starts further down the first screen than
 *    `--reach-limit` (0.5) of it, measured from the page's top, so something
 *    above the question grew the wall back (the reach lines three lanes filed,
 *    and ROADMAP's phone-fold line, as a check);
 *  - CUT: a frame of the shown option (its box, where the option draws none)
 *    ends under the dock or off the screen's side, so the option is not seen
 *    whole on the first screen;
 *  - CLIPPED: anything around an option's preview cuts it short, which is the
 *    window he could not scroll;
 *  - UNLABELLED: the stage head does not name the option it is showing, which
 *    is "labels on which height is which";
 *  - NO DOCK: the dock is off screen at the top of the page or at its foot.
 * Every row says where each screen's stage starts and how far above the dock
 * its frames end.
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
 * ★ EVERY FRAME, NOT THE FIRST (the lab revamp, 2026-09-29, from claims-r3). An
 * option drawn at 1440 and at 375 is two frames, and comparing only one read
 * `identity-claims` r3's quiet and bell as the same picture: their difference
 * lived in the other frame. Each frame of an option is captured on its own and
 * compared with the same frame of every other option, and two options are the
 * same picture only when every frame is. `--save-shots` keeps every frame, named
 * by its title (`<board>.<ask>.<option>.<n>-<title>-<width>.png`).
 *
 * ★ AND IN MORE THAN ITS DEFAULT KNOBS (the lab revamp, from `lab:demo`'s own
 * ROADMAP line). A step is drawn wearing the board's defaults, so a config's
 * other states were never pressed; `--state <control>=<option>` (repeatable)
 * rides every step's URL, which is how the board reads its state, and the whole
 * pass runs wearing it. `--width 375` runs the sitting at a phone's width.
 *
 * ★ IT READS THE CAPTIONS A LANE PROVES A FRAME BY. A frame's measured
 * caption ("Measured: 26 words, the headline on 1 line...") is out of Will's
 * view on a step (design.css) and still in the page; `--verbose` prints every
 * frame's name and caption beside its option, so a lane reads them here or on
 * the whole board.
 *
 * ★ A STALL SAYS WHAT IT WAITS ON (demo-stall, 2026-09-30). "Page.navigate did
 * not answer" failed three gates in five and named nothing, so its cause was
 * guessed (a busy renderer) for a week. It was the network: six image requests
 * the dev server never answered held every connection Chrome opens to one
 * server over HTTP/1.1, and the next navigation queued behind them without
 * leaving the browser. So a TIMED OUT row now says whether the navigation's
 * own request went out, which requests the server is holding and for how long,
 * how many wait behind them, how busy the renderers are, and whether the server
 * answers a new connection (`waitingOn`).
 *
 * It presses the options' tabs only, and never the one already shown (a
 * second press PICKS), never a Copy button (that writes the OS clipboard), and
 * it runs in its own throwaway Chrome profile, so it touches no reviewer's held
 * answers. Exit 1 on any failing step.
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inflateSync } from "node:zlib";

import { describeScope, scopeFromArgs } from "./lab-scope.mjs";

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
// `--save-shots <dir>`: keep every option's picture on disk as `<board>.<ask>.<option>-<width>.png` (the Orchestrator's
// review sheet puts each of Will's verdicts beside the drawing it answered; 2026-09-20). Off by default: the pictures
// are measured, never stored, unless asked.
const SAVE_SHOTS = opt("--save-shots", "");
if (SAVE_SHOTS) mkdirSync(SAVE_SHOTS, { recursive: true });
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
const onlyStep = opt("--only", "");
/** `--state <control>=<option>`, repeatable: knobs every step is pressed wearing. */
const STATES = argv.flatMap((a, i) =>
  a === "--state" ? [argv[i + 1] ?? ""] : [],
);
for (const s of STATES)
  if (!/^[a-z0-9-]+=[a-z0-9-]+$/.test(s)) {
    console.error(
      `lab:demo: --state takes <control>=<option>, and "${s}" is not one.`,
    );
    process.exit(2);
  }
// Which boards to press: the named ones, else the ones this change reached.
const scope = scopeFromArgs(argv);
for (const line of describeScope(scope)) console.log(line);
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

/** The window's width: a reviewer's desktop, or `--width 375` for the sitting on a phone. */
const W = Number(opt("--width", 1440));
const PHONE = W < 768;
/**
 * The window the PICTURES are taken in: tall enough to hold a whole option
 * under the step's head without scrolling, because a capture that has to reach
 * beyond the window is a capture Chrome recomposites (see the clip's note in
 * `frameShot`). A step's head runs to about 700px, so this holds a 2,300px
 * option whole.
 */
const H = 3000;
/**
 * The screen a reviewer actually has, for judging how far they must travel.
 * The window above is tall on purpose (a whole step in one capture), so reach
 * and height are measured in pixels and divided by this.
 */
const SCREEN = PHONE ? 812 : 900;
if (STATES.length || PHONE)
  console.log(
    `WEARING ${[...STATES, `width=${W}`].join(" ")}: every step is pressed in this state`,
  );
/**
 * How far down the first screen the stage may start, as a share of it,
 * measured from the page's top. The step is pictures first (lab-focus,
 * 2026-09-29): the spine, one line of where, the question, the tabs and the
 * option's line stand above the stage and start it about a third of the way
 * down at a desk and at a phone; past half, something grew the wall back.
 */
const REACH_LIMIT = Number(opt("--reach-limit", 0.5));
/** The two screens every step is measured on, whatever `--width` the pictures are taken at. */
const REACH_SCREENS = [
  { w: 1440, h: 900, mobile: false },
  { w: 375, h: 812, mobile: true },
];
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
    // ★ A PAGE LEFT IS A PAGE GONE (demo-stall, 2026-09-30). This run never
    // goes back, so the back/forward cache could only ever keep a page it left
    // alive, and it did, with its requests: on a server that never answered six
    // image sizes, a step's last page kept all six of Chrome's connections to
    // the server for a minute after it was left, and the next step's navigation
    // waited behind them (netlog: sent 10.3 s, cancelled 108.2 s, 60 s after the
    // page was left; with this flag the same run on the same server passes).
    "--disable-features=BackForwardCache",
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
function send(ws, method, params = {}, ceiling = callTimeout) {
  return new Promise((resolve, reject) => {
    const id = ++seq;
    const timer = setTimeout(() => {
      if (!pending.has(id)) return;
      pending.delete(id);
      reject(new Stalled(`${method} did not answer in ${ceiling}ms`));
    }, ceiling);
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
// ── What the page has open, so a stall can name what it waits on ─────────
/**
 * Every request the page and its frames have open, by DevTools id: where it
 * goes, whether it went out on a connection (`requestWillBeSentExtraInfo`,
 * which a request queued inside Chrome or served from its cache never gets)
 * and whether any answer came back. A document's requests leave with it, and
 * DevTools does not always say so, so a new document drops its predecessor's.
 */
const open = new Map();
/** A request's "sent" can arrive before the request itself; its moment waits here. */
const sentEarly = new Map();
/** The page's own frame, whose Document requests are its navigations. */
let mainFrame = null;
/** The browser's own session: the renderers' CPU, which no page call can read mid-navigation. */
let browserWs = null;

function track(method, p) {
  if (method === "Page.loadEventFired") loaded = true;
  else if (method === "Network.requestWillBeSent") {
    // A redirect re-sends the same id: its new hop has not gone out yet.
    open.set(p.requestId, {
      url: p.request.url,
      type: p.type,
      frame: p.frameId,
      loader: p.loaderId,
      since: Date.now(),
      // When it went out on a connection, if it has (`sent` below).
      sentAt: sentEarly.get(p.requestId) ?? null,
      answered: false,
    });
    sentEarly.delete(p.requestId);
  } else if (method === "Network.requestWillBeSentExtraInfo") {
    const r = open.get(p.requestId);
    if (r) r.sentAt ??= Date.now();
    else sentEarly.set(p.requestId, Date.now());
  } else if (method === "Network.responseReceived") {
    const r = open.get(p.requestId);
    if (r) r.answered = true;
  } else if (
    method === "Network.loadingFinished" ||
    method === "Network.loadingFailed"
  )
    open.delete(p.requestId);
  else if (method === "Page.frameNavigated") {
    if (!p.frame.parentId) {
      mainFrame = p.frame.id;
      sentEarly.clear();
    }
    for (const [id, r] of open)
      if (
        (!p.frame.parentId || r.frame === p.frame.id) &&
        r.loader !== p.frame.loaderId
      )
        open.delete(id);
  } else if (method === "Page.frameDetached")
    for (const [id, r] of open) if (r.frame === p.frameId) open.delete(id);
}

/** Replies to their callers, events to `track`. */
function listen(ws) {
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const p = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error.message));
      else p.resolve(msg.result);
    } else if (msg.method) track(msg.method, msg.params);
  };
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
        listen(ws);
        const { webSocketDebuggerUrl } = await (
          await fetch(`http://127.0.0.1:${port}/json/version`)
        ).json();
        browserWs = new WebSocket(webSocketDebuggerUrl);
        await new Promise((r) => (browserWs.onopen = r));
        listen(browserWs);
        return ws;
      }
    } catch {
      // Chrome is still opening its port.
    }
    await sleep(150);
  }
  throw new Error("Chrome never opened its debugging port");
}

/** A URL as a row prints it: the origin and the key dropped, an image's source decoded. */
function shortUrl(u) {
  try {
    const url = new URL(u);
    url.searchParams.delete("key");
    const q = url.searchParams.toString();
    return decodeURIComponent(`${url.pathname}${q ? `?${q}` : ""}`);
  } catch {
    return u;
  }
}

/**
 * The page's open requests to the server under test: its own navigation, the
 * requests the server has and has not answered (the longest held first), and
 * the ones queued inside Chrome for a connection.
 */
function openToServer() {
  const host = new URL(base).host;
  const ours = [...open.values()].filter((r) => {
    try {
      return new URL(r.url).host === host;
    } catch {
      return false;
    }
  });
  const nav = ours
    .filter((r) => r.type === "Document" && r.frame === mainFrame)
    .at(-1);
  const rest = ours.filter((r) => r !== nav && !r.answered);
  const held = rest
    .filter((r) => r.sentAt !== null)
    .sort((a, b) => a.sentAt - b.sentAt);
  const queued = rest.filter((r) => r.sentAt === null);
  return { host, nav, held, queued };
}

/** How long ago a moment was, as a row says it. */
const ago = (t) => `${Math.round((Date.now() - t) / 1000)}s`;

/** Requests the server holds, as lines: how many and for how long, then each URL once with its count. */
function heldLines(held, host) {
  const groups = new Map();
  for (const r of held)
    groups.set(shortUrl(r.url), (groups.get(shortUrl(r.url)) ?? 0) + 1);
  const images = held.every((r) => new URL(r.url).pathname === "/_next/image");
  return [
    `${held.length} request${held.length === 1 ? "" : "s"} to ${host} went out and ${held.length === 1 ? "has" : "have"} no answer, the oldest for ${ago(held[0].sentAt)}` +
      // ★ SIX IS CHROME'S CEILING PER SERVER over HTTP/1.1 (a dev server and
      // `next start` speak nothing else), so six held is a dead origin for
      // this browser: every later request, a navigation included, waits.
      (held.length >= 6
        ? ", which is every connection Chrome opens to one server"
        : "") +
      (images
        ? ": every one a /_next/image (an image optimizer that never answers a size: testing-verification.md)"
        : ""),
    ...[...groups]
      .slice(0, 8)
      .map(([u, n]) => `  ${u}${n > 1 ? ` (x${n})` : ""}`),
    ...(groups.size > 8 ? [`  and ${groups.size - 8} more`] : []),
  ];
}

/**
 * ★ AND A PICTURE THE SERVER STARVED SAYS SO. With pages left through
 * about:blank and the back/forward cache off, a server that never answers a
 * size no longer stalls the walk, so the same fault would pass unseen, its
 * frames captured without those images (`about-press.kit` read 44.61 percent
 * apart with its band's share card unanswered, 45.05 whole). A step whose page
 * still has requests unanswered past the capture's ceiling prints them under
 * its row: not a failure, since the board may be perfect, but pictures nobody
 * should trust until the server is restarted.
 */
function starved() {
  const { host, held } = openToServer();
  const late = held.filter((r) => Date.now() - r.sentAt > settleMax);
  return late.length ? heldLines(late, host) : [];
}

/**
 * ★ WHAT A STALLED CALL WAITS ON, as evidence, never a guess. Nothing here
 * asks the page: while a page's own navigation is pending DevTools holds every
 * call that needs its renderer until the navigation commits (measured: an
 * evaluate unanswered for 3 s on a renderer at 0% CPU), so an unanswered
 * evaluate says nothing about the main thread. The renderers' CPU comes from
 * the browser's own session, the requests from what `track` saw, and the
 * server's health from a fetch of the step's URL on a connection of its own.
 */
async function waitingOn(stepUrl, stalled) {
  const { host, nav, held, queued } = openToServer();
  const lines = [];
  if (nav)
    lines.push(
      nav.sentAt === null
        ? `the navigation's request never left Chrome (${ago(nav.since)})`
        : nav.answered
          ? "the navigation's request was answered, its document never loaded"
          : `the server has had the navigation's request ${ago(nav.sentAt)} and not answered it`,
    );
  else if (stalled.startsWith("Page.navigate"))
    // No request at all: the page being left has not let the navigation go.
    lines.push(
      "the navigation never asked for its page: the page being left has not let it go (a beforeunload, or a busy main thread)",
    );
  if (held.length) lines.push(...heldLines(held, host));
  if (queued.length)
    lines.push(
      `${queued.length} more request${queued.length === 1 ? "" : "s"} to ${host} wait inside Chrome for a connection`,
    );
  if (!nav && !held.length && !queued.length)
    lines.push(`no request to ${host} is open`);
  // The renderers: CPU seconds read twice, a second apart.
  try {
    const cpu = async () =>
      Object.fromEntries(
        (
          await send(browserWs, "SystemInfo.getProcessInfo", {}, 5000)
        ).processInfo
          .filter((p) => p.type === "renderer")
          .map((p) => [p.id, p.cpuTime]),
      );
    const a = await cpu();
    await sleep(1000);
    const b = await cpu();
    const busiest = Math.max(
      0,
      ...Object.keys(b).map((id) => b[id] - (a[id] ?? b[id])),
    );
    lines.push(
      busiest > 0.5
        ? `a renderer is busy: ${Math.round(busiest * 100)}% of a core over a second`
        : `the renderers are idle (the busiest at ${(busiest * 100).toFixed(1)}% of a core over a second)`,
    );
  } catch {
    lines.push("the renderers' CPU could not be read");
  }
  // The server, on a connection of its own.
  const t = Date.now();
  try {
    const r = await fetch(stepUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    await r.arrayBuffer();
    lines.push(
      `the server answers the step's URL on a new connection in ${Date.now() - t}ms (${r.status})`,
    );
  } catch {
    lines.push(
      "the server does not answer the step's URL on a new connection either (10s)",
    );
  }
  return lines;
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

/** The window and the media the page is drawn in now (serialized), so a page asking for the same goes straight there. */
let drawn = { metrics: "", media: "" };

/**
 * ★ LEAVE, THEN RESIZE (demo-stall, 2026-09-30). The window used to be resized
 * on the page it was about to leave: the stage re-fitted every frame to the new
 * width, every photograph's srcset chose a new size, and some seventy image
 * requests went out for sizes the dev server had never made, only for the
 * navigation to cancel them 130 ms later. Work thrown away at best; at worst
 * (Next 16.2's dev image optimizer, testing-verification.md) a size cancelled
 * that early was never answered again, six of those held every connection
 * Chrome opens to the server, and the next step's navigation never left the
 * browser: `about-press.facts`, three gates in five. So a new window or media
 * is set on about:blank, between the two pages, where nothing is drawn to
 * re-fit, and the page it was asked for loads in it from its first frame.
 */
async function go(ws, url, { metrics, media } = {}) {
  const m = metrics ? JSON.stringify(metrics) : drawn.metrics;
  const e = media ? JSON.stringify(media) : drawn.media;
  if (m !== drawn.metrics || e !== drawn.media) {
    await load(ws, "about:blank");
    if (m !== drawn.metrics)
      await send(ws, "Emulation.setDeviceMetricsOverride", metrics);
    if (e !== drawn.media)
      await send(ws, "Emulation.setEmulatedMedia", { features: media });
    drawn = { metrics: m, media: e };
  }
  await load(ws, url);
  await sleep(1200);
}

async function load(ws, url) {
  loaded = false;
  await send(ws, "Page.navigate", { url });
  for (let i = 0; i < 300 && !loaded; i++) await sleep(100);
}

// In the page: the dock's pictured options, each option's view, and the step's frame.
const PAGE_LIB = `
  window.__labDemo = {
    options() {
      return [...document.querySelectorAll('main [data-lab-tabs] [data-lab-option]')];
    },
    view(id) {
      return document.querySelector('main [data-lab-stage] [data-lab-view][data-option="' + CSS.escape(id) + '"]');
    },
    stage() {
      return document.querySelector('main [data-lab-stage]');
    },
    /**
     * One option's frames, in the order the view draws them, each big enough
     * to judge and actually shown: frames stacked in one grid cell and toggled
     * by visibility share a box, so a hidden one would be captured as the one
     * over it and two different options would read as one picture.
     */
    frames(id) {
      const v = this.view(id);
      if (!v) return [];
      return [...v.querySelectorAll('iframe')].filter((f) => {
        const r = f.getBoundingClientRect();
        const shown = f.checkVisibility
          ? f.checkVisibility({ visibilityProperty: true, opacityProperty: true })
          : true;
        return shown && r.width > 8 && r.height > 8;
      });
    },
    /** Where the stage starts, how tall the step is, and how much it asks you to read. */
    geo() {
      const stage = this.stage();
      const head = document.querySelector('main .lab-step-head');
      const words = (document.querySelector('main')?.innerText || '').trim().split(/\\s+/).length;
      // PIXELS, not screens: the caller divides by a nominal screen.
      return {
        height: document.documentElement.scrollHeight,
        words,
        top: stage ? Math.round(stage.getBoundingClientRect().top + scrollY) : null,
        // The question's own head, which the reach is measured from.
        head: head ? Math.round(head.getBoundingClientRect().top + scrollY) : 0,
        // What a step with no stage asks on instead: options in words, or a
        // catalog's own cards (a winner is pressed on the cards).
        kind: document.querySelector('main .lab-word-options') ? 'words' : 'cards',
      };
    },
    /** What the stage head says it is showing. */
    label() {
      return (document.querySelector('main [data-lab-stage-head] [data-lab-stage-label]')?.textContent || '').trim();
    },
    /**
     * WHERE THE SHOWN OPTION STANDS ON THE FIRST SCREEN, read at the page's
     * top: the stage's top, the dock's, and every frame of the view (its own
     * box where it draws none), in the window's pixels.
     */
    reach(id) {
      const stage = this.stage();
      const dock = document.querySelector('main [data-lab-dock]');
      const v = this.view(id);
      if (!stage || !v) return null;
      const boxes = this.frames(id).map((f) => ({ title: (f.getAttribute('title') || '').split(', ')[0], r: f.getBoundingClientRect() }));
      if (!boxes.length) boxes.push({ title: 'the stage', r: v.getBoundingClientRect() });
      return {
        top: Math.round(stage.getBoundingClientRect().top),
        dock: dock ? Math.round(dock.getBoundingClientRect().top) : innerHeight,
        width: innerWidth,
        height: innerHeight,
        frames: boxes.map(({ title, r }) => ({ title, top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) })),
      };
    },
    /** Every frame's name and measured caption, for a lane (\`--verbose\`). */
    captions(id) {
      const v = this.view(id);
      if (!v) return [];
      return [...v.querySelectorAll('figure')].map((f) => ({
        title: (f.querySelector('[data-lab-frame-title]')?.textContent || '').trim(),
        caption: (f.querySelector('[data-lab-caption]')?.textContent || '').trim(),
      }));
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

/**
 * Waits one option's view out: its frames loaded, their pictures decoded, the
 * fonts in, the DOM still, and never sooner than the floor. Returns how many
 * frames it holds.
 */
async function settleView(ws, id) {
  return evaluate(
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
      return window.__labDemo.frames(${JSON.stringify(id)}).length;
    })()`,
  );
}

/**
 * ONE FRAME OF ONE OPTION, captured: the view's `k`th frame (its own box, so
 * the label over it never counts), or the whole view when it holds none.
 */
async function frameShot(ws, id, k) {
  const rect = await evaluate(
    ws,
    `(async () => {
      const s = window.__labDemo.view(${JSON.stringify(id)});
      if (!s) return null;
      const nap = (ms) => new Promise((r) => setTimeout(r, ms));
      const pick = () => {
        const f = window.__labDemo.frames(${JSON.stringify(id)})[${k}];
        return f
          ? { r: f.getBoundingClientRect(), title: (f.getAttribute('title') || '').split(', ')[0] }
          : { r: s.getBoundingClientRect(), title: 'stage' };
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
      const first = pick().r;
      window.scrollTo(0, Math.max(0, first.top + scrollY - 4));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await nap(120);
      const { r, title } = pick();
      const top = Math.max(0, r.top);
      const room = innerHeight - top;
      // Inside the window: composited, which is what a reader sees, and in
      // PAGE coordinates, which is what the clip is read in (desk-tune: a
      // viewport box drew every frame of a step taller than the window flat
      // or shifted, once the window had scrolled to it). Taller than the
      // window (a document too short to scroll the box up): page coordinates
      // and the old flag, because half a picture would compare two options
      // on a strip they share.
      return r.height <= room
        ? { x: Math.max(0, r.left) + scrollX, y: top + scrollY, width: r.width, height: r.height, beyond: false, title }
        : {
            x: Math.max(0, r.left + scrollX),
            y: r.top + scrollY,
            width: r.width,
            height: Math.min(r.height, 2000),
            beyond: true,
            title,
          };
    })()`,
  );
  if (!rect || rect.width < 8 || rect.height < 8) return null;
  const { beyond, title, ...clip } = rect;
  const shot = await send(ws, "Page.captureScreenshot", {
    format: "png",
    // Only for a stage taller than the window, which no board draws today:
    // the flag is what miscomposites, so it is paid for only where it is the
    // difference between a partial picture and none.
    captureBeyondViewport: beyond,
    clip: { ...clip, scale: 1 },
  });
  return { title, png: Buffer.from(shot.data, "base64") };
}

/** Every frame of one option, in the order the view draws them. */
async function stageShots(ws, id) {
  const n = await settleView(ws, id);
  if (n === null) return [];
  const shots = [];
  for (let k = 0; k < Math.max(1, n); k++) {
    const shot = await frameShot(ws, id, k);
    if (shot) shots.push(shot);
  }
  return shots;
}

/** A frame's title as a file name's part. */
const slug = (t) =>
  (t || "stage")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "stage";

const MEDIA_STILL = [
  { name: "prefers-color-scheme", value: "dark" },
  { name: "prefers-reduced-motion", value: "reduce" },
];
const MEDIA_MOVING = [
  { name: "prefers-color-scheme", value: "dark" },
  { name: "prefers-reduced-motion", value: "no-preference" },
];
/** The window the pictures are taken in (see `H`). */
const PICTURES = { width: W, height: H, deviceScaleFactor: 1, mobile: PHONE };

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
  mainFrame = (await send(ws, "Page.getFrameTree")).frameTree.frame.id;
  // Every request's comings and goings, for a stall to name (`waitingOn`);
  // the bodies are never read, so almost nothing is buffered.
  await send(ws, "Network.enable", {
    maxTotalBufferSize: 1_000_000,
    maxResourceBufferSize: 100_000,
  });

  // The open steps, from the desk itself.
  await go(ws, withKey("/design/lab"), {
    metrics: PICTURES,
    media: MEDIA_STILL,
  });
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
    : steps.filter(
        (s) => scope.all || scope.boards.includes(s.slice(0, s.indexOf("."))),
      );
  if (wanted.length === 0) {
    // Said with the scope, so "none to press" is never read as "your board has
    // no open steps" when the change simply reached no board.
    console.log(
      scope.all
        ? "lab:demo found no open step on the desk to press."
        : `lab:demo found no open step to press on ${scope.boards.length ? scope.boards.join(", ") : "any board this change reached"}.`,
    );
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
    const url = withKey(
      `/design/lab/${boardId}?session=${encodeURIComponent(step)}${STATES.map((s) => `&${s}`).join("")}`,
    );
    try {
      // ── THE LAYOUT, on the two screens he reads on: 1440x900 and 375x812 ─
      const layout = [];
      /** Per screen: where its stage starts, and the least room any option's frames leave above the dock. */
      const reached = [];
      let geo = null;
      let count = 0;
      let skipped = false;
      for (const screen of REACH_SCREENS) {
        const at = `${screen.w}`;
        await go(ws, url, {
          metrics: {
            width: screen.w,
            height: screen.h,
            deviceScaleFactor: 1,
            mobile: screen.mobile,
          },
          media: MEDIA_STILL,
        });
        await evaluate(ws, PAGE_LIB);
        const g = await evaluate(ws, "window.__labDemo.geo()");
        const n = await evaluate(ws, "window.__labDemo.options().length");
        if (!geo) {
          geo = g;
          count = n;
        }
        if (n < 2 || g.top === null) {
          skipped = true;
          break;
        }
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
            `NO DOCK at ${at}: off screen at the ${!dockTop ? "top" : "foot"} of the page`,
          );
        await evaluate(ws, "window.scrollTo(0, 0)");
        let top = null;
        let least = null;
        for (let i = 0; i < n; i++) {
          const id = await evaluate(ws, `window.__labDemo.show(${i})`);
          // A shown option is already fitted (every option shares the
          // stage's scale), and a zoom lands a frame or two after it is set.
          await sleep(300);
          const want = await evaluate(
            ws,
            `window.__labDemo.options()[${i}].getAttribute('data-label') || ''`,
          );
          const said = await evaluate(ws, "window.__labDemo.label()");
          if (!said || !said.includes(want))
            layout.push(
              `UNLABELLED at ${at}: showing "${want}", the head says "${said}"`,
            );
          const cut = await evaluate(
            ws,
            `window.__labDemo.clipped(${JSON.stringify(id)})`,
          );
          if (cut) layout.push(`CLIPPED at ${at}: "${want}": ${cut}`);
          await evaluate(ws, "window.scrollTo(0, 0)");
          const r = await evaluate(
            ws,
            `window.__labDemo.reach(${JSON.stringify(id)})`,
          );
          if (!r) continue;
          if (top === null) {
            top = r.top;
            if (r.top > r.height * REACH_LIMIT)
              layout.push(
                `FOLD at ${at}: the stage starts ${(r.top / r.height).toFixed(2)} of the way down the first screen, past ${REACH_LIMIT}`,
              );
          }
          for (const f of r.frames) {
            const room = r.dock - f.bottom;
            if (least === null || room < least) least = room;
            if (f.bottom > r.dock + 1)
              layout.push(
                `CUT at ${at}: "${want}": ${f.title || "a frame"} ends ${f.bottom - r.dock}px under the dock`,
              );
            if (f.right > r.width + 1 || f.left < -1)
              layout.push(
                `CUT at ${at}: "${want}": ${f.title || "a frame"} runs off the screen's side`,
              );
          }
        }
        reached.push({ at, top, height: screen.h, least });
      }
      if (skipped) {
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
        continue;
      }
      /** The reach, said on the row: where each screen's stage starts, and the room left above its dock. */
      const reachNote = reached
        .map(
          (r) =>
            `${r.at}: starts ${r.top === null ? "?" : (r.top / r.height).toFixed(2)} down, ${r.least === null ? "?" : r.least}px to the dock`,
        )
        .join(" · ");

      // ── THE PICTURES, in a window tall enough to hold a whole option ─────
      await go(ws, url, { metrics: PICTURES, media: MEDIA_STILL });
      await evaluate(ws, PAGE_LIB);
      // One capture before anything is measured, so the first is not of a
      // stage that is still mounting its frame or drawing its first reading.
      await stageShots(ws, await evaluate(ws, "window.__labDemo.show(0)"));
      const shots = [];
      for (let i = 0; i < count; i++) {
        const id = await evaluate(ws, `window.__labDemo.show(${i})`);
        const label = await evaluate(
          ws,
          `(window.__labDemo.options()[${i}].getAttribute('data-label') || '').slice(0, 28)`,
        );
        const frames = await stageShots(ws, id);
        if (frames.length === 0) break;
        // What the lane measured to prove each frame, which a step keeps out
        // of Will's view and in the page.
        if (verbose)
          for (const c of await evaluate(
            ws,
            `window.__labDemo.captions(${JSON.stringify(id)})`,
          ))
            console.log(
              `  ${step}.${id}: ${c.title}: ${c.caption || "no caption"}`,
            );
        shots.push({
          id,
          label,
          frames: frames.map((f) => ({
            ...f,
            hash: createHash("sha1").update(f.png).digest("hex"),
          })),
        });
        if (SAVE_SHOTS)
          frames.forEach((f, k) =>
            writeFileSync(
              join(
                SAVE_SHOTS,
                `${step}.${id}.${k + 1}-${slug(f.title)}-${W}.png`,
              ),
              f.png,
            ),
          );
      }
      // What the server still owes the page the pictures were taken on.
      const unanswered = starved();
      if (shots.length < 2) {
        rows.push({
          step,
          geo,
          verdict: "skip",
          note: "the stage could not be captured",
          unanswered,
        });
        continue;
      }
      const decoded = shots.map((s) => s.frames.map((f) => decodePng(f.png)));
      // Nothing to compare when nothing was painted: see `flatPicture`.
      const unpainted = decoded.every((frames) => frames.every(flatPicture));
      let max = 0;
      const same = [];
      for (let a = 0; a < shots.length; a++)
        for (let b = a + 1; b < shots.length; b++) {
          // Two options differ by their most different frame; a frame one
          // draws and the other does not is a difference by itself.
          const fa = shots[a].frames;
          const fb = shots[b].frames;
          let d = fa.length === fb.length ? 0 : 100;
          for (let k = 0; k < Math.min(fa.length, fb.length); k++)
            if (fa[k].hash !== fb[k].hash)
              d = Math.max(d, differ(decoded[a][k], decoded[b][k]));
          max = Math.max(max, d);
          if (d < threshold) same.push(`${shots[a].label} = ${shots[b].label}`);
          if (verbose)
            console.log(
              `  ${step}: ${shots[a].label} vs ${shots[b].label}: ${d.toFixed(3)}% over ${Math.max(fa.length, fb.length)} frame(s)`,
            );
        }
      let ok = max >= threshold;
      let how = `the stage moves by up to ${max.toFixed(2)}%`;
      if (!ok && !unpainted) {
        // Still pictures that match may be a question about motion: read what
        // each option declares, with motion allowed (the next step's `go`
        // puts the stillness back).
        await go(ws, url, { metrics: PICTURES, media: MEDIA_MOVING });
        await evaluate(ws, PAGE_LIB);
        const motions = [];
        for (let i = 0; i < count; i++) {
          const id = await evaluate(ws, `window.__labDemo.show(${i})`);
          await settleView(ws, id);
          motions.push(
            await evaluate(
              ws,
              `window.__labDemo.motion(${JSON.stringify(id)})`,
            ),
          );
        }
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
      const first = layout[0]?.split(":")[0].replace(/ at \d+$/, "");
      rows.push({
        step,
        geo,
        layout,
        unpainted,
        unanswered,
        verdict: broken
          ? first
          : unpainted
            ? "UNPAINTED"
            : ok
              ? "ok"
              : "FROZEN",
        note: `${
          unpainted
            ? `${shots.length} options, every capture one flat colour: this browser did not paint the stage (a composited layer), so judge it by eye`
            : `${shots.length} options (${shots[0].frames.length} frame${shots[0].frames.length === 1 ? "" : "s"} each), ${how}${
                ok && same.length && max >= threshold
                  ? `; same picture: ${same.join(", ")}`
                  : ""
              }`
        }; ${reachNote}`,
      });
    } catch (error) {
      // A stalled call or a dead page: record it with what it waited on, drop
      // the rest of this board, put the tab somewhere harmless, and walk on.
      failed++;
      boardBlown = `${error.message ?? error}; the rest of ${boardId} was not pressed`;
      const why =
        error instanceof Stalled ? await waitingOn(url, error.message) : [];
      rows.push({
        step,
        verdict: error instanceof Stalled ? "TIMED OUT" : "ERROR",
        note: boardBlown,
        why,
      });
      try {
        await send(ws, "Page.navigate", { url: "about:blank" });
      } catch {
        // The page is gone; the next board's navigate will say so.
      }
      // Whatever the stall left, the next page is drawn from a known window.
      drawn = { metrics: "", media: "" };
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
  // What the server never answered while the pictures were taken (`starved`).
  for (const [i, line] of (r.unanswered ?? []).entries())
    console.log(
      `${" ".repeat(pad)}  ${i === 0 ? "UNANSWERED: " : "  "}${line}`,
    );
  // A stall's evidence, under its row: what the call was waiting on.
  for (const [i, line] of (r.why ?? []).entries())
    console.log(
      `${" ".repeat(pad)}  ${i === 0 ? "WAITING ON: " : "  "}${line}`,
    );
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
