#!/usr/bin/env node
/**
 * THE COMPUTE MODEL (compute-model, 2026-10-04): what each user action costs Vercel, measured on a local production
 * build, projected onto real events (`model.mjs`), and held to a standing budget (`budget.json`).
 *
 *   pnpm compute:model --port 3131                        # build, measure every scenario, hold them to the budget
 *   pnpm compute:model --port 3131 --no-build             # .next is already this tree's build (with the site URL below)
 *   pnpm compute:model --port 3131 --scenarios crawler-50,guest-hour-live
 *   pnpm compute:model --port 3131 --write-budget         # rewrite budget.json from this run, with headroom
 *   pnpm compute:model --port 3131 --host-cookie-env PR_HOST_COOKIE   # the host's session ("name=value; ..."), env only
 *   pnpm compute:model --port 3131 --out <dir>            # where results.json and requests.jsonl go (default: a temp dir)
 *   pnpm compute:model --port 3131 --lab-board <id>       # the lab demo's board (default: the desk's first open one)
 *   pnpm compute:model --port 3131 --event-name "<name>"  # the guest scenarios on an album of your own (default below)
 *   pnpm compute:model --reproject <dir> [--write-budget] # units, projections and levers again from a run's own ledger, held to the budget
 *
 * Exit 0 within budget, 1 when a scenario exceeds it (calls, or CPU on the budget's own machine), 2 when it could not measure. Not in the gate: it
 * builds, then drives Chrome for about fifteen minutes. Run it at milestones, and before anything that could multiply
 * calls (a poll, a prefetch, a proxy matcher, a new client fetch).
 *
 * WHY. Hobby allows 4 Active CPU-hours in a rolling 30 days and pauses every function past it, and we spent 3h 56m
 * with zero real users. We scale by the event, not the user: one host brings 100 guests, and every poll, prefetch and
 * proxy run is multiplied by every open phone. So a change that adds a call per poll is a regression even when every
 * page still looks right, and only a count can see it.
 *
 * HOW. `server.mjs` serves the build and records each request (calls on Vercel, the CPU Vercel would bill); a headless
 * Chrome of its own (`chrome.mjs`) plays each scenario the way the real client does, against this port only
 * (`phones.mjs` keeps what a scenario's phones are owed: all of them closed when it ends, errored or not, and the door
 * walked by pressing what is on screen). ★ LOCAL ONLY: the base is always http://localhost:<port>, every device blocks
 * Vercel's and Partyreel's hosts, and nothing here sends a request to Vercel. The guest scenarios run on the test event
 * "Compute model (test)" (willg97's, 1,000 photos seeded through the real write path by `scripts/seed-demo-event.mjs`),
 * or the live event `--event-name` names; its token is read with the service key from `.env.local` or the environment
 * and never printed. Each run adds one guest row per joining device and ten photos to that event. The photos it sends
 * are copies of six shapes in `$PARTYREEL_TEST_MEDIA/images` (the kit's `usher/kit/media-gen.mjs` writes them; a
 * folder without them is generated first, so a machine with no media of its own still runs).
 *
 * THE HOUR, COMPRESSED. A guest's hour plays in 60/K minutes (`--k`, default 20; the 12 s-poll hour at K/2, so a round
 * trip stays well inside its compressed interval): the page's Date runs K times fast and
 * every timer over ten seconds (the polls, the doorbell's batch tick, the link re-mint, Realtime's heartbeat) fires K
 * times sooner, so the real client's own cadence is counted request by request. Timers of ten seconds and under (a
 * slot's give-up, a join's timeout) keep real time, because network round trips do.
 */
import { spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { cpus, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  clockShim,
  device as openDevice,
  launchChrome,
  sleep,
} from "./chrome.mjs";
import { printProjections, project, scale, summarize } from "./model.mjs";
import { deviceRegistry, submitName, walkToName } from "./phones.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) =>
  argv.includes(name) ? (argv[argv.indexOf(name) + 1] ?? fallback) : fallback;
const fail = (msg, code = 2) => {
  console.error(`compute-model: ${msg}`);
  process.exit(code);
};

const reproject = opt("--reproject", "");
const port = Number(opt("--port", ""));
if (!reproject && (!Number.isInteger(port) || port < 1024 || port === 3000))
  fail("needs --port <your port> (never 3000, the Orchestrator's desk)");
const base = `http://localhost:${port}`;
const K = Number(opt("--k", "20"));
const out =
  opt("--out", "") ||
  reproject ||
  mkdtempSync(join(tmpdir(), "compute-model-"));
mkdirSync(out, { recursive: true });
const only = opt("--scenarios", "").split(",").filter(Boolean);
const budgetFile = opt("--budget", join(HERE, "budget.json"));
const labBoard = opt("--lab-board", "");
const hostCookieEnv = opt("--host-cookie-env", "");
const EVENT_NAME = opt("--event-name", "Compute model (test)");
const MEDIA =
  process.env.PARTYREEL_TEST_MEDIA || join(tmpdir(), "partyreel-test-media");
const FIXTURES = join(MEDIA, "images");

// ★ EVERY PHONE A SCENARIO OPENS IS CLOSED WHEN IT ENDS, errored or not (`phones.mjs`). A scenario that threw used to leave
// its devices open, polling under the labels of the scenarios after it; the scenarios open theirs through this one.
const phones = deviceRegistry(openDevice);
const device = phones.device;

/** A value from the worktree's `.env.local` (album-perf's pattern), or "". Never printed. */
function envLocal(name) {
  if (process.env[name]) return process.env[name];
  try {
    const m = readFileSync(join(ROOT, ".env.local"), "utf8").match(
      new RegExp(`^${name}=(.*)$`, "m"),
    );
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
  } catch {
    return "";
  }
}
const SUPABASE_URL = envLocal("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY =
  envLocal("SUPABASE_SECRET_KEY") || envLocal("SUPABASE_SERVICE_ROLE_KEY");

// ── The measuring server ─────────────────────────────────────────────────────────────────────────
/** The measuring server's control routes (a retry: a keep-alive socket the server closed fails its first write). */
async function ctl(what, q = "") {
  for (let i = 0; ; i++) {
    try {
      return await (await fetch(`${base}/__compute-model/${what}${q}`)).json();
    } catch (e) {
      if (i >= 2) throw e;
      await sleep(250);
    }
  }
}
const label = (name) => ctl("scenario", `?name=${encodeURIComponent(name)}`);
const recordsOf = (name) => ctl("records", `?name=${encodeURIComponent(name)}`);

async function portAnswers() {
  try {
    await fetch(base, { signal: AbortSignal.timeout(1_000) });
    return true;
  } catch {
    return false;
  }
}

// ── The test event (read with the service key; the token stays in memory) ───────────────────────
async function testEvent() {
  if (!SUPABASE_URL || !SERVICE_KEY)
    fail(
      "needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local (to read the test event's link)",
    );
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/events?name=eq.${encodeURIComponent(EVENT_NAME)}&deleted_at=is.null&select=id,qr_token,host_id&order=created_at.asc&limit=1`,
    {
      headers: {
        apikey: SERVICE_KEY,
        ...(SERVICE_KEY.startsWith("sb_")
          ? {}
          : { Authorization: `Bearer ${SERVICE_KEY}` }),
      },
      signal: AbortSignal.timeout(15_000),
    },
  );
  const [row] = res.ok ? await res.json() : [];
  if (!row)
    fail(
      `no live event named "${EVENT_NAME}": seed it through the real write path, e.g.\n` +
        `  node scripts/seed-demo-event.mjs <a folder of 1,000 small photos> --name "${EVENT_NAME}" --host willg97@gmail.com --guests "Ana P.,Ben K.,Cal M."`,
    );
  return { id: row.id, token: row.qr_token, hostId: row.host_id };
}

/** Ten distinct photos (a fixture with a few bytes after its end marker, so no two hash alike), in the out dir. */
function photos(n = 10) {
  if (!existsSync(join(FIXTURES, "wide-1920x1080.jpg"))) {
    const r = spawnSync(
      process.execPath,
      [
        join(ROOT, "usher/kit/media-gen.mjs"),
        MEDIA,
        "--photos",
        "0",
        "--videos",
        "0",
        "--prefix",
        "cm",
      ],
      { encoding: "utf8" },
    );
    if (r.status !== 0)
      fail(
        `no photos in ${FIXTURES}, and media-gen.mjs could not write them: ${(r.stderr || "").trim().slice(0, 200)}`,
      );
  }
  const dir = join(out, "photos");
  mkdirSync(dir, { recursive: true });
  const names = [
    "landscape-1600x1200",
    "portrait-1080x1350",
    "portrait-1200x1600",
    "square-1200x1200",
    "tall-1080x1920",
    "wide-1920x1080",
  ];
  return Array.from({ length: n }, (_, i) => {
    const src = readFileSync(join(FIXTURES, `${names[i % names.length]}.jpg`));
    const file = join(dir, `cm-${Date.now()}-${i}.jpg`);
    writeFileSync(
      file,
      Buffer.concat([src, Buffer.from(`compute-model ${Date.now()} ${i}`)]),
    );
    return file;
  });
}

// ── What a guest does (the real door, the real uploader) ─────────────────────────────────────────
/**
 * ★ THE JOIN PRESSES WHAT IS ON SCREEN, NOT WHAT IT ASSUMES LANDED (`phones.mjs`). The first scenario of a full run follows
 * the build, on the machine's busiest minute, and a press of the door's (Continue, Continue as guest, the name's Continue)
 * can do nothing: no mint is sent, the name sheet stays up, and the old twenty-second wait for it to close timed out at
 * the name step where the same join passed alone. Each press is repeated when the screen did not answer it. A join that
 * still fails says which step it was and keeps what the phone showed, where a bare timeout named nothing but a selector.
 */
async function joinAsGuest(page, token, name, { addPhotos = false } = {}) {
  const NAME = `input[placeholder="Your name"]`;
  const shown = (sel) =>
    `[...document.querySelectorAll(${JSON.stringify(sel)})].some((e) => e.getBoundingClientRect().height > 0)`;
  let step = "opening the link";
  try {
    await page.goto(`/e/${token}`);
    await page.idle({ quiet: 1_000 });
    step = "walking to the name field";
    await walkToName(page, { nameSelector: NAME });
    step = "typing the name";
    await sleep(600); // the sheet's own entrance
    await page.eval(`document.querySelector(${JSON.stringify(NAME)}).focus()`);
    await page.type(name);
    await page.waitFor(
      `document.querySelector(${JSON.stringify(NAME)}).value === ${JSON.stringify(name)}`,
      { timeout: 30_000 },
    );
    // The name's own Continue, in the name's own sheet (the welcome's stays mounted under it), pressed again only when it did
    // nothing: it is disabled ("Just a second…") while its mint is on its way, so a repeat never mints a second guest.
    // Named (the door mints her ticket: `POST /api/guests`), the door's last step offers the camera and the album's
    // picker; an uploader stays on it (its inputs take the files), anyone else looks around first.
    step = "pressing the name's Continue, waiting for the guest to be minted";
    await submitName(page, { nameSelector: NAME });
    step = "waiting for the door's last step";
    await page.waitFor(shown("button"), { timeout: 20_000 });
    if (!addPhotos) {
      step = "skipping the camera";
      await page.click("button", { text: "Skip for now" });
      await page.waitFor(
        `![...document.querySelectorAll("button")].some((b) => b.textContent.includes("Skip for now") && b.getBoundingClientRect().height > 0)`,
      );
      await sleep(800); // the sheet's exit: a press under it lands on its backdrop
    }
    await page.idle({ quiet: 1_500 });
  } catch (e) {
    const file = join(out, `join-failed-${name.replace(/\W+/g, "-")}.png`);
    await page.screenshot(file).catch(() => {});
    throw new Error(
      `${name} could not join, ${step} (the phone's screen: ${file}): ${e.message}`,
    );
  }
}

/**
 * The test event's media rows (the service key's count). A burst's files land in one complete (compute-uploads), so
 * what landed is counted in rows, never in completes.
 */
async function mediaRows(eventId) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/media?event_id=eq.${eventId}&select=id`,
    {
      method: "HEAD",
      headers: {
        apikey: SERVICE_KEY,
        Prefer: "count=exact",
        ...(SERVICE_KEY.startsWith("sb_")
          ? {}
          : { Authorization: `Bearer ${SERVICE_KEY}` }),
      },
      signal: AbortSignal.timeout(15_000),
    },
  );
  const rows = Number(res.headers.get("content-range")?.split("/")[1]);
  if (!res.ok || !Number.isFinite(rows))
    throw new Error(`the test event's rows: ${res.status}`);
  return rows;
}

/** Waits until the test event holds `n` rows more than `before` (the uploads have landed). */
async function landed(eventId, before, n, { timeout = 180_000 } = {}) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    const done = (await mediaRows(eventId)) - before;
    if (done >= n) return done;
    await sleep(500);
  }
  throw new Error(`only some of ${n} uploads completed in ${timeout / 1000}s`);
}

// ── The scenarios ────────────────────────────────────────────────────────────────────────────────
/**
 * THE DOORBELL DOWN: Realtime's socket refused the way a venue's wifi refuses it (Chrome's URL blocking does not reach
 * a WebSocket, so the page's own WebSocket fails it): supabase-js retries on its own back-off, the channel never
 * subscribes, and the album falls back to its 12 s poll.
 */
const REFUSE_REALTIME = `(() => {
  const Real = window.WebSocket;
  window.WebSocket = function (url, protocols) {
    if (!String(url).includes("/realtime/")) return new Real(url, protocols);
    const ws = new EventTarget();
    Object.assign(ws, { url: String(url), readyState: 0, protocol: "", extensions: "", bufferedAmount: 0, binaryType: "blob", send() {}, close() { ws.readyState = 3; } });
    setTimeout(() => {
      ws.readyState = 3;
      const err = new Event("error"), close = new CloseEvent("close", { code: 1006, wasClean: false });
      ws.onerror?.(err); ws.dispatchEvent(err);
      ws.onclose?.(close); ws.dispatchEvent(close);
    }, 50);
    return ws;
  };
  Object.assign(window.WebSocket, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 });
})();`;

const SCENARIOS = [
  {
    name: "guest-join-upload",
    about:
      "a guest opens the link, passes the door with a name, uploads 10 photos and sees them land (a second guest's album, open and live, hears the burst: `listener`)",
    async run({ browser, event }) {
      const listener = await device(browser, { base, name: "listener" });
      await label("setup");
      await joinAsGuest(listener, event.token, "Compute Listener");
      const uploader = await device(browser, { base, name: "uploader" });
      await label(this.name);
      await joinAsGuest(uploader, event.token, "Compute Uploader", {
        addPhotos: true,
      });
      // The album's picker input (the camera's carries `capture`), then the review step's Send.
      const before = await mediaRows(event.id);
      await uploader.setFiles("input[type=file][multiple]", photos(10));
      await sleep(1_000); // the review step's entrance: a press mid-flight lands on nothing
      await uploader.click("button", { text: "Send 10" });
      await landed(event.id, before, 10);
      // The album's own answer to the burst: the doorbell's batch tick (15 s) on both phones, then the 60 s net.
      await sleep(20_000);
      await uploader.idle({ quiet: 2_000 });
      await uploader.close();
      await listener.close();
    },
    /** The uploader's join (up to her first presign), her ten photos (from it), and what the burst cost the listener. */
    cut(recs) {
      const up = recs.filter((r) => r.device === "uploader");
      const first =
        up.find((r) => r.route === "/api/r2/presign-upload")?.t ?? Infinity;
      return {
        join: summarize(up.filter((r) => r.t < first)),
        upload: summarize(up.filter((r) => r.t >= first)),
        listener: summarize(recs.filter((r) => r.device === "listener")),
      };
    },
  },
  ...[
    {
      name: "guest-hour-live",
      live: true,
      k: K,
      about:
        "a returning guest opens the album and keeps it open and lit for an hour, the doorbell live, nobody uploading (the 60 s safety-net poll)",
    },
    // At the 12 s poll a round trip must stay well inside the compressed interval, so this hour runs at half the speed.
    {
      name: "guest-hour-down",
      live: false,
      k: Math.max(1, Math.round(K / 2)),
      about:
        "the same hour with the doorbell down (a venue's wifi that refuses websockets): the 12 s fallback poll",
    },
  ].map((s) => ({
    ...s,
    async run({ browser, event }) {
      const page = await device(browser, {
        base,
        name: "hour",
        init: [clockShim(s.k), ...(s.live ? [] : [REFUSE_REALTIME])],
      });
      await label("setup");
      await joinAsGuest(page, event.token, "Compute Hour");
      await label(this.name);
      const t0 = Date.now();
      await page.goto(`/e/${event.token}`);
      await sleep(3_600_000 / s.k);
      const endMs = Date.now() - t0;
      await page.close();
      return { k: s.k, endMs };
    },
    /**
     * The returning guest's load (the page and the burst of calls its mount makes, an aborted first sync of a remount
     * included: everything up to the last call in its first 15 s that is not the album's poll machinery), then the
     * rest, scaled to exactly one hour of the page's time (the load ate a little of the compressed hour).
     */
    cut(recs, { k, endMs }) {
      const POLL = new Set(["/api/album/guest/sync", "/api/album/guest/media"]);
      const first =
        1 +
        Math.max(
          0,
          ...recs
            .filter((r) => r.t < 15_000 && r.calls && !POLL.has(r.route))
            .map((r) => r.t),
        );
      const hours = ((endMs - first) * k) / 3_600_000;
      const hour = summarize(recs.filter((r) => r.t >= first));
      return {
        load: summarize(recs.filter((r) => r.t < first)),
        // Sums scaled to one hour; its routes as measured, with the hours they covered.
        hour: {
          ...scale(hour, 1 / hours),
          byRoute: hour.byRoute,
          measuredHours: Math.round(hours * 1000) / 1000,
        },
      };
    },
  })),
  {
    name: "guest-viewer-20",
    about: "a guest opens 20 photos in the viewer, one after another",
    async run({ browser, event }) {
      const page = await device(browser, { base, name: "viewer" });
      await label("setup");
      await joinAsGuest(page, event.token, "Compute Viewer");
      await label(this.name);
      await page.click("button", { text: "View photo" });
      await page
        .waitFor(`!!document.querySelector("[role=dialog] img")`)
        .catch(async (e) => {
          await page.screenshot(join(out, "viewer-failed.png"));
          throw e;
        });
      // What the viewer shows, read off its images (a proof the walk moved, since a free walk counts no call).
      const seen = new Set();
      const look = async () =>
        (
          await page.eval(
            `JSON.stringify([...document.querySelectorAll("[role=dialog] img")].map((i) => i.currentSrc.split("?")[0]))`,
          )
        )
          .split('","')
          .forEach((x) => seen.add(x));
      await sleep(1_000);
      await look();
      for (let i = 0; i < 19; i++) {
        await page.key("ArrowRight");
        await sleep(700);
        await look();
      }
      await page.key("Escape");
      await page.idle({ quiet: 1_500 });
      await page.close();
      return { imagesSeen: seen.size };
    },
  },
  {
    name: "guest-download",
    about:
      "a guest selects All and saves (the bulk download's Vercel side; the zip itself is the export Worker's)",
    async run({ browser, event }) {
      const page = await device(browser, { base, name: "download" });
      await label("setup");
      await joinAsGuest(page, event.token, "Compute Download");
      await page
        .send("Browser.setDownloadBehavior", { behavior: "deny" })
        .catch(() => {});
      await label(this.name);
      await page.click("button", { text: "Select" });
      await page.click("button", { text: "All" });
      await page.click("button", { text: "Save" });
      await page.idle({ quiet: 4_000, max: 120_000 });
      await page.close();
    },
  },
  {
    name: "host-dashboard",
    about:
      "a host's dashboard session: in and out of five events, the Display menu, back to the hub (needs --host-cookie-env)",
    async run({ browser }) {
      const raw = hostCookieEnv ? (process.env[hostCookieEnv] ?? "") : "";
      if (!raw)
        return {
          skipped:
            "no host session (--host-cookie-env NAME, the cookie in that env var)",
        };
      const cookies = raw
        .split(/;\s*/)
        .filter(Boolean)
        .map((c) => [c.slice(0, c.indexOf("=")), c.slice(c.indexOf("=") + 1)]);
      const page = await device(browser, {
        base,
        name: "host",
        cookies,
        viewport: { width: 1440, height: 900 },
      });
      await label(this.name);
      await page.goto("/dashboard");
      await page.idle({ quiet: 1_500 });
      const events = await page.eval(
        `[...new Set([...document.querySelectorAll('a[href^="/dashboard/"]')].map((a) => a.getAttribute("href")).filter((h) => /^\\/dashboard\\/[0-9a-f-]{36}$/.test(h)))].slice(0, 5)`,
      );
      if (!events?.length)
        return {
          skipped: "the session did not reach the dashboard (expired cookie?)",
        };
      for (const href of events) {
        await page.click(`a[href="${href}"]`);
        await page.idle({ quiet: 1_500 });
        await page
          .click("button", { text: "Display", timeout: 5_000 })
          .catch(() => {});
        await sleep(500);
        await page.key("Escape");
        await page.eval("history.back()");
        await page.idle({ quiet: 1_500 });
      }
      await page.close();
      return { events: events.length };
    },
  },
  {
    name: "visitor-5-pages",
    about:
      "a person reads the marketing site: the home page, then four pages by its own links (client navigation, prefetches)",
    async run({ browser }) {
      const page = await device(browser, {
        base,
        name: "visitor",
        viewport: { width: 1440, height: 900 },
      });
      await label(this.name);
      await page.goto("/");
      await page.idle({ quiet: 1_500 });
      for (const href of ["/how-it-works", "/pricing", "/features", "/about"]) {
        await page.click(`a[href="${href}"]`).catch(() => page.goto(href));
        await page.idle({ quiet: 1_500 });
      }
      await page.close();
    },
  },
  {
    name: "crawler-50",
    about:
      "a crawler reads 50 marketing pages from the sitemap (HTML only, no script)",
    async run() {
      await label("setup");
      const xml = await (await fetch(`${base}/sitemap.xml`)).text();
      // The sitemap's URLs carry the build's site URL; only their paths are fetched, and only from this server.
      const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
        .map((m) => new URL(m[1]).pathname)
        .filter((p) => !p.startsWith("/e/"))
        .slice(0, 50);
      await label(this.name);
      for (const p of paths)
        await (
          await fetch(`${base}${p}`, {
            headers: {
              "user-agent":
                "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
            },
          })
        ).arrayBuffer();
      return { pages: paths.length };
    },
  },
  {
    name: "lab-demo",
    about:
      "one `pnpm lab:demo` of a board (the desk's own check, as run against the alias)",
    async run() {
      const key = envLocal("DESIGN_PREVIEW_KEY");
      await label("setup");
      // The board: --lab-board, else the first board with an open step on the desk (the one a reviewer would press).
      const desk = await (
        await fetch(`${base}/design/lab?key=${encodeURIComponent(key)}`)
      ).text();
      const board =
        labBoard ||
        /href="\/design\/lab\/([a-z0-9-]+)\?[^"]*session=/.exec(desk)?.[1];
      if (!board) return { skipped: "no board with an open step on the desk" };
      await label(this.name);
      // Spawned, never spawnSync: a blocked event loop lets the server's keep-alive sockets die under this script.
      const child = spawn(
        process.execPath,
        [join(ROOT, "scripts/lab-demo.mjs"), "--base", base, "--board", board],
        {
          cwd: ROOT,
          env: { ...process.env, DESIGN_PREVIEW_KEY: key },
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      let stdout = "";
      child.stdout.on("data", (d) => (stdout += d));
      child.stderr.resume();
      const exit = await new Promise((r) => child.on("close", r));
      const steps = /(\d+) steps?, (\d+) failing/.exec(stdout);
      return {
        board,
        exit,
        steps: steps ? Number(steps[1]) : null,
        failing: steps ? Number(steps[2]) : null,
      };
    },
  },
];

function checkBudget(results) {
  let budget;
  try {
    budget = JSON.parse(readFileSync(budgetFile, "utf8"));
  } catch {
    console.log(`\nbudget: none at ${budgetFile}`);
    return true;
  }
  let ok = true;
  console.log(`\nbudget (${budgetFile.replace(`${ROOT}/`, "")}):`);
  // ★ CPU IS HELD ON ITS OWN MACHINE ONLY (Will's rising tide, 2026-10-06: a check that obstructs is upgraded). A CPU
  // line is one machine's measure (`measured.cpu`), and a 4-core cloud seat read guest-join-upload's first complete
  // at 1,606 ms of its 1,550 (a cold module load of ~700 ms, the M3 Max's 89): a machine difference, never a
  // regression. So elsewhere a CPU line is reported and never fails; calls hold everywhere (the same count anywhere).
  const here = results.meta?.cpu ?? cpus()[0]?.model ?? "?";
  const holdCpu = !budget.measured?.cpu || budget.measured.cpu === here;
  if (!holdCpu)
    console.log(
      `  (CPU reported, not held: the budget was measured on ${budget.measured.cpu}, this run on ${here})`,
    );
  for (const [name, b] of Object.entries(budget.scenarios)) {
    const m0 = results.scenarios[name];
    if (!m0 || m0.skipped) {
      console.log(`  ${name.padEnd(20)} not measured this run`);
      continue;
    }
    // A per-step line (the lab's demo: its work is the desk's open steps, which change) is held per step.
    const per = b.per === "step" ? Math.max(1, m0.steps ?? 1) : 1;
    const m = {
      calls: Math.round((m0.calls / per) * 10) / 10,
      vercelCpuMs: Math.round(m0.vercelCpuMs / per),
    };
    const over = [];
    if (m.calls > b.calls) over.push(`calls ${m.calls} > ${b.calls}`);
    const cpuOver = b.vercelCpuMs != null && m.vercelCpuMs > b.vercelCpuMs;
    if (cpuOver && holdCpu)
      over.push(`CPU ${m.vercelCpuMs} ms > ${b.vercelCpuMs} ms`);
    if (over.length) ok = false;
    const unit = per > 1 ? " a step" : "";
    const cpuNote =
      cpuOver && !holdCpu ? ", CPU over its line here (not held)" : "";
    console.log(
      `  ${name.padEnd(20)} ${over.length ? `OVER: ${over.join(", ")}${unit}` : `ok (${m.calls}/${b.calls} calls, ${Math.round(m.vercelCpuMs)}/${b.vercelCpuMs ?? "-"} ms${unit}${cpuNote})`}`,
    );
  }
  return ok;
}

function writeBudget(results) {
  const scenarios = {};
  for (const [name, m0] of Object.entries(results.scenarios)) {
    if (m0.skipped || m0.error) continue;
    const per = name === "lab-demo" && m0.steps ? m0.steps : 1;
    const m = { calls: m0.calls / per, vercelCpuMs: m0.vercelCpuMs / per };
    // Calls are near-deterministic (a poll's phase moves one or two). CPU is not: on a machine shared with other
    // lanes the same tree's hour moved 39% between two runs (2026-10-04), so CPU gets twice its measure, and never
    // less than 50 ms of room (a small total's noise is absolute). A call regression fails first; CPU catches a
    // render that doubles. A scenario of a call or two (the download's one mint) is held to its calls alone: one
    // cold call's CPU moved fourfold between runs (a first TLS handshake, a module's first load).
    scenarios[name] = {
      ...(per > 1 ? { per: "step" } : {}),
      calls: Math.ceil(Math.max(m.calls * 1.1, m.calls + 2)),
      vercelCpuMs:
        m0.calls < 10
          ? null
          : Math.ceil(Math.max(m.vercelCpuMs * 2, m.vercelCpuMs + 50) / 10) *
            10,
    };
  }
  const budget = {
    note: "pnpm compute:model fails when a scenario's calls or local Vercel-billed CPU (ms) exceed these. Written by --write-budget from a measured run, with headroom (calls +10%, CPU x2: it is noisy on a shared machine; a scenario under 10 calls is held to its calls alone); lower a line when a lever lands, never raise one to make a regression pass without saying why in its commit.",
    measured: results.meta,
    scenarios,
  };
  writeFileSync(budgetFile, `${JSON.stringify(budget, null, 2)}\n`);
  console.log(`\nbudget written: ${budgetFile}`);
}

function printTable(results) {
  console.log(
    `\n${"scenario".padEnd(20)} ${"calls".padStart(6)} ${"proxy".padStart(6)} ${"fn".padStart(5)} ${"CPU ms".padStart(9)} ${"ms/call".padStart(8)}`,
  );
  for (const [name, m] of Object.entries(results.scenarios)) {
    if (m.skipped) {
      console.log(`${name.padEnd(20)} skipped: ${m.skipped}`);
      continue;
    }
    console.log(
      `${name.padEnd(20)} ${String(m.calls).padStart(6)} ${String(m.proxyCalls).padStart(6)} ${String(m.fnCalls).padStart(5)} ${String(Math.round(m.vercelCpuMs)).padStart(9)} ${(m.calls ? m.vercelCpuMs / m.calls : 0).toFixed(1).padStart(8)}`,
    );
  }
}

// ── --reproject <dir>: the summaries, units and projections again from a run's own ledger (no server, no Chrome),
// for a change to the model that needs no new measurement.
if (reproject) {
  const results = JSON.parse(
    readFileSync(join(reproject, "results.json"), "utf8"),
  );
  const ledger = readFileSync(join(reproject, "requests.jsonl"), "utf8")
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l));
  for (const [name, m] of Object.entries(results.scenarios)) {
    if (m.skipped) continue;
    const recs = ledger.filter((r) => r.scenario === name);
    const cut = SCENARIOS.find((x) => x.name === name)?.cut;
    results.scenarios[name] = {
      ...m,
      ...summarize(recs),
      ...(cut && !m.error ? { units: cut(recs, m) } : {}),
    };
  }
  writeFileSync(
    join(reproject, "results.json"),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  printTable(results);
  printProjections(project(results));
  if (argv.includes("--write-budget")) writeBudget(results);
  // A replay is held to the budget too, so a budget question (a CPU line read on another machine) is judged again
  // without measuring again.
  process.exit(checkBudget(results) ? 0 : 1);
}

// ── Main ─────────────────────────────────────────────────────────────────────────────────────────
if (await portAnswers())
  fail(`something already answers on ${base}; stop it (by its port) first`);
if (!argv.includes("--no-build")) {
  console.log(
    `compute-model: building (NEXT_PUBLIC_SITE_URL=${base}) through the build lock`,
  );
  const b = spawnSync("zsh", ["scripts/build-lock.sh", "pnpm", "build"], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, NEXT_PUBLIC_SITE_URL: base },
  });
  if (b.status !== 0) fail("the build failed");
}
const event = await testEvent();
const server = spawn(
  process.execPath,
  [
    join(HERE, "server.mjs"),
    "--port",
    String(port),
    "--log",
    join(out, "requests.jsonl"),
  ],
  {
    cwd: ROOT,
    stdio: ["ignore", "inherit", "inherit"],
  },
);
const stop = () => server.kill();
process.on("exit", stop);
for (let i = 0; i < 120 && !(await portAnswers()); i++) await sleep(500);
if (!(await portAnswers())) fail("the measuring server never answered");

const chrome = await launchChrome({ headed: argv.includes("--headed") });
const sha = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: ROOT,
  encoding: "utf8",
}).stdout.trim();
const results = {
  meta: {
    sha,
    date: new Date().toISOString(),
    k: K,
    cpu: cpus()[0]?.model ?? "?",
    node: process.version,
  },
  scenarios: {},
};
try {
  // Warm the server (Vercel's instances under an event's load are warm; a cold start is the calibration's business).
  await label("warmup");
  const warm = await device(chrome.browser, { base, name: "warmup" });
  await warm.goto(`/e/${event.token}`);
  await warm.idle({ quiet: 1_500 });
  await warm.goto("/");
  await warm.idle({ quiet: 1_000 });
  await warm.close();
  for (const s of SCENARIOS) {
    if (only.length && !only.includes(s.name)) continue;
    const started = Date.now();
    process.stdout.write(`compute-model: ${s.name} ... `);
    let extra = {};
    try {
      extra = (await s.run({ browser: chrome.browser, event })) ?? {};
    } catch (e) {
      extra = { error: String(e.message ?? e).slice(0, 400) };
    }
    // Its phones go with it, errored or not, before the label moves on: an open one would poll under the next scenario's.
    await phones.closeAll();
    await label("(between)");
    const recs = await recordsOf(s.name);
    results.scenarios[s.name] = extra.skipped
      ? { about: s.about, ...extra }
      : {
          about: s.about,
          seconds: Math.round((Date.now() - started) / 1000),
          ...extra,
          ...summarize(recs),
          ...(s.cut && !extra.error ? { units: s.cut(recs, extra) } : {}),
        };
    const m = results.scenarios[s.name];
    console.log(
      m.skipped
        ? `skipped (${m.skipped})`
        : `${m.calls} calls, ${Math.round(m.vercelCpuMs)} ms${m.error ? ` (ERROR: ${m.error})` : ""}`,
    );
  }
} finally {
  await chrome.close();
  stop();
}

writeFileSync(
  join(out, "results.json"),
  `${JSON.stringify(results, null, 2)}\n`,
);
printTable(results);
printProjections(project(results));
console.log(
  `\nresults: ${join(out, "results.json")}; every request: ${join(out, "requests.jsonl")}`,
);
if (argv.includes("--write-budget")) writeBudget(results);
const errored = Object.values(results.scenarios).some((m) => m.error);
process.exit(errored ? 2 : checkBudget(results) ? 0 : 1);
