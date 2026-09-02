import { Suspense } from "react";
import { cookies } from "next/headers";

import { requireDesignKey } from "@/lib/design-gate/server";
import { ProbeTabs, UseClientSection } from "./probe-tabs";

/**
 * THE STREAMING-PATTERN PROBE (permanent, gated - the /design/boom precedent).
 *
 * Phase 5 S1 shipped the dashboard with ASYNC SERVER components as children
 * of the client radix TabsContent, behind Suspense. In production the stream
 * closed with the boundaries unresolved: every fallback stranded (skeletons
 * forever) and the tabs subtree never hydrated (dead clicks) - zero errors
 * anywhere. The guest page's pattern (a promise created in the PAGE BODY,
 * passed to a CLIENT component that use()es it) streams fine through the
 * same proxy/infra.
 *
 * This page reproduces the three candidate shapes side by side against the
 * REAL prod runtime, each resolving after a 1.5s delay:
 *   A. async server child inside client TabsContent (the shape that broke)
 *   B. same, but the child also touches cookies() (dynamic API inside a
 *      streamed boundary - the second suspect)
 *   C. the guest-proven shape: body-created promise -> client use()
 * Each panel prints STREAMED-OK when its boundary completes. Verify on the
 * deployed site (dev streaming behaves differently): whichever stays a
 * "waiting" fallback is the broken shape. Findings live in
 * docs/systems/architecture.md (the streaming contract).
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ServerChildPlain() {
  await sleep(1500);
  return <p data-probe="a">STREAMED-OK-A (async server child, no dynamic API)</p>;
}

async function ServerChildWithCookies() {
  await sleep(1500);
  const jar = await cookies();
  return (
    <p data-probe="b">
      STREAMED-OK-B (async server child + cookies(): {jar.size} cookies)
    </p>
  );
}

async function loadProbeData(): Promise<string> {
  await sleep(1500);
  return "STREAMED-OK-C (body promise -> client use())";
}

export default async function StreamProbePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);

  // The guest-proven shape: created in the body, NOT awaited.
  const bodyPromise = loadProbeData();

  return (
    <div className="mx-auto max-w-xl space-y-6 px-6 py-16">
      <h1 className="text-xl font-semibold">Streaming-pattern probe</h1>
      <p className="text-sm text-muted-foreground">
        Three Suspense shapes against the real runtime. Each resolves after
        1.5s; a panel stuck on &ldquo;waiting&rdquo; = the stranded shape.
      </p>
      <ProbeTabs
        a={
          <Suspense fallback={<p data-probe="a">waiting A</p>}>
            <ServerChildPlain />
          </Suspense>
        }
        b={
          <Suspense fallback={<p data-probe="b">waiting B</p>}>
            <ServerChildWithCookies />
          </Suspense>
        }
        c={
          <Suspense fallback={<p data-probe="c">waiting C</p>}>
            <UseClientSection promise={bodyPromise} />
          </Suspense>
        }
      />
    </div>
  );
}
