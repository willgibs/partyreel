// usher/kit/redteam/drv.mjs: a red-team's persistent CDP driver for a headless Chrome of its own. It keeps sessions (and
// their emulation) alive across commands, takes commands over HTTP on 127.0.0.1:$DRV (default 9996), and appends every
// network, WebSocket, lifecycle and target event to $RT_DIR/drv-events.jsonl. A body is {key, method, params}, {key,
// eval}, {attach: targetId, key}, {sessions: true} or {key, events: true, since, filter, urlFilter, limit}.
//
// The walk's own folder is RT_DIR (the red-team's scratch folder, never the repo): the driver's events, `newctx.mjs`'s
// ctx.json and downloads, and `send.mjs`'s records all land there. A walk, alike on the Mac and a cloud seat (Linux,
// root: CHROME_PATH is the --no-sandbox wrapper spawn-prompt-cloud.txt makes):
//   node usher/kit/media-gen.mjs "$RT_DIR/media"   the walk's own photographs, a video and the fake camera's party-cam.y4m
//   "${CHROME_PATH:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}" --headless=new --remote-debugging-port=0 \
//     --user-data-dir="$RT_DIR/profile" --use-fake-ui-for-media-stream --use-fake-device-for-media-stream \
//     --use-file-for-fake-video-capture="$RT_DIR/media/party-cam.y4m" about:blank > "$RT_DIR/chrome.log" 2>&1 &
//   RT_DIR=... node drv.mjs &                    then, per device:
//   RT_DIR=... node newctx.mjs G1 375            a fresh context and page under the key G1 (a phone's width)
//   node h.mjs nav G1 http://localhost:3000/e/<qr>; node h.mjs text G1; node join.mjs G1 <qr> "RT Guest"
//   node signin.mjs willg97@gmail.com http://localhost:3000 H1 --open /dashboard   a test host's session in H1
// Chrome picks its own free port (port 0) and writes it into the profile's DevToolsActivePort, which the driver reads, so
// it can only reach this walk's Chrome; CDP_PORT pins one instead (`lsof -i :<port>` first: another lane's Chrome may
// hold it). DRV (default 9996) is the driver's own port: give each concurrent walk its own. Close your Chrome when the
// walk ends.
import http from "node:http";
import { appendFileSync } from "node:fs";
import { rtDir } from "./lib.mjs";
import { devToolsPort } from "../kit-env.mjs";
const LOG = `${rtDir()}/drv-events.jsonl`;
const LOGRE =
  /^(Network\.(requestWillBeSent|responseReceived|loadingFinished|loadingFailed|webSocket\w+)|Page\.(lifecycleEvent|frameNavigated)|Target\.(targetCreated|targetDestroyed|targetInfoChanged))$/;
const PORT = process.env.CDP_PORT
  ? +process.env.CDP_PORT
  : await devToolsPort(`${rtDir()}/profile`, null, 30_000);
const DRV = +(process.env.DRV || 9996);
const ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json();
const ws = new WebSocket(ver.webSocketDebuggerUrl);
await new Promise((r, j) => {
  ws.onopen = r;
  ws.onerror = j;
});
let id = 0;
const pending = new Map();
const sessions = new Map();
const events = [];
ws.onmessage = (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && pending.has(msg.id)) {
    const { res } = pending.get(msg.id);
    pending.delete(msg.id);
    res(msg);
    return;
  }
  if (msg.method) {
    const e = {
      t: Date.now(),
      sessionId: msg.sessionId,
      method: msg.method,
      params: msg.params,
    };
    events.push(e);
    if (events.length > 200000) events.shift();
    if (LOGRE.test(msg.method)) {
      try {
        appendFileSync(LOG, JSON.stringify(e) + "\n");
      } catch {}
    }
  }
};
const send = (method, params = {}, sessionId) =>
  new Promise((res) => {
    const i = ++id;
    pending.set(i, { res });
    ws.send(JSON.stringify({ id: i, method, params, sessionId }));
  });
await send("Target.setDiscoverTargets", { discover: true });
http
  .createServer(async (req, resp) => {
    let body = "";
    for await (const c of req) body += c;
    let out;
    try {
      const b = JSON.parse(body || "{}");
      if (b.attach) {
        const r = await send("Target.attachToTarget", {
          targetId: b.attach,
          flatten: true,
        });
        sessions.set(b.key, r.result.sessionId);
        await send("Page.enable", {}, r.result.sessionId);
        await send("Runtime.enable", {}, r.result.sessionId);
        await send("Network.enable", {}, r.result.sessionId);
        out = r;
      } else if (b.sessions) {
        out = Object.fromEntries(sessions);
      } else if (b.events) {
        const sid = sessions.get(b.key);
        const since = b.since || 0;
        out = events.filter(
          (e) =>
            e.t > since &&
            (!b.key || e.sessionId === sid) &&
            (!b.filter || new RegExp(b.filter).test(e.method)),
        );
        if (b.urlFilter)
          out = out.filter((e) =>
            JSON.stringify(e.params).match(new RegExp(b.urlFilter)),
          );
        out = out.slice(-(b.limit || 200));
      } else if (b.eval !== undefined) {
        out = await send(
          "Runtime.evaluate",
          {
            expression: b.eval,
            awaitPromise: true,
            returnByValue: true,
            userGesture: true,
            timeout: b.timeout || 60000,
          },
          sessions.get(b.key),
        );
      } else {
        out = await send(
          b.method,
          b.params || {},
          b.key ? sessions.get(b.key) : undefined,
        );
      }
    } catch (e) {
      out = { error: String(e) };
    }
    resp.end(JSON.stringify(out));
  })
  .listen(DRV, "127.0.0.1", () =>
    console.log(`drv up on ${DRV}, Chrome's CDP on ${PORT}`),
  );
