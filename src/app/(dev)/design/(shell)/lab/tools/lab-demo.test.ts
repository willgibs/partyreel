import { execFile } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer, type Server } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * A LAB RUN NEVER DRIVES ANOTHER LANE'S CHROME (lab-kit-2, from ROADMAP's line on `lab-demo.mjs`). The script took its
 * DevTools port from its own pid (`9400 + pid % 500`) and never looked: on a busy machine a run could land on a port
 * another lane's headless Chrome already held, fail to bind it, and find that lane's page there. brand-r1 drove another
 * lane's browser exactly so, once.
 *
 * Chrome here is a stand-in script that writes the arguments it was given and exits, so nothing opens a browser and the
 * port is the only thing under test: a pinned port something answers on is refused before any Chrome exists, a run that
 * pins nothing asks Chrome for a free port itself (a pid's guess is the failure), and a pinned free port reaches Chrome
 * as written. Every one is red on the pid's port, the refusal after the twelve seconds the old run spent polling a port
 * that was never its own.
 */
const run = promisify(execFile);
const SCRIPT = join(process.cwd(), "scripts", "lab-demo.mjs");

let dir = "";
let chrome = "";
let log = "";

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "lab-port-test-"));
  log = join(dir, "chrome-args.txt");
  chrome = join(dir, "chrome-stand-in.sh");
  writeFileSync(chrome, `#!/bin/sh\nprintf '%s\\n' "$@" > "${log}"\nexit 0\n`);
  chmodSync(chrome, 0o755);
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

/** lab:demo against a base it never reaches (the stand-in Chrome exits first), on the named board's empty scope. */
async function demo(...args: string[]) {
  rmSync(log, { force: true });
  return run(
    process.execPath,
    [SCRIPT, "--base", "http://localhost:9", "--board", "none", ...args],
    {
      env: { ...process.env, CHROME_PATH: chrome, DESIGN_PREVIEW_KEY: "" },
      timeout: 40_000,
    },
  ).then(
    ({ stdout, stderr }) => ({ code: 0, stdout, stderr }),
    (error: { code?: number; stdout?: string; stderr?: string }) => ({
      code: error.code ?? -1,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? "",
    }),
  );
}

/** A port nothing listens on, and a listener on another: a second Chrome's stand-in. */
function listen(): Promise<{ server: Server; port: number }> {
  return new Promise((resolve) => {
    const server = createServer((socket) => socket.end());
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        server,
        port: typeof address === "object" && address ? address.port : 0,
      });
    });
  });
}
async function freePort(): Promise<number> {
  const { server, port } = await listen();
  await new Promise((resolve) => server.close(resolve));
  return port;
}
const chromeArgs = () => readFileSync(log, "utf8").split("\n");

describe("lab:demo's DevTools port", () => {
  it("refuses a pinned port something already answers on, before it starts a Chrome", async () => {
    const other = await listen();
    try {
      const result = await demo("--chrome-port", String(other.port));
      expect(result.stderr).toContain(`port ${other.port} already has`);
      expect(result.code).toBe(3);
      // No browser was started on the strength of it.
      expect(existsSync(log)).toBe(false);
    } finally {
      other.server.close();
    }
  }, 60_000);

  it("asks Chrome for a free port when none is pinned, never a guess from its pid", async () => {
    const result = await demo();
    expect(chromeArgs()).toContain("--remote-debugging-port=0");
    // The stand-in leaves at once: the run says so, rather than polling a port that is not its own.
    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain("Chrome exited");
  }, 60_000);

  it("hands a pinned port that is free to Chrome as written", async () => {
    const port = await freePort();
    await demo("--chrome-port", String(port));
    expect(chromeArgs()).toContain(`--remote-debugging-port=${port}`);
  }, 60_000);

  it("refuses a pinned port that is no port", async () => {
    const result = await demo("--chrome-port", "80");
    expect(result.code).toBe(2);
    expect(result.stderr).toContain("--chrome-port takes a port");
    expect(existsSync(log)).toBe(false);
  }, 60_000);
});
