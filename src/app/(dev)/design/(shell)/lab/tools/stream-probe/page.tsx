import { Suspense } from "react";
import { cookies } from "next/headers";

import { requireDesignKey } from "@/lib/design-gate/server";

import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Section } from "@/app/(dev)/design/(shell)/_shell/section";
import { ProbeTabs, UseClientSection } from "./probe-tabs";

/**
 * THE STREAMING-PATTERN PROBE (permanent, gated - the /design/lab/tools/boom precedent).
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
  return (
    <p data-probe="a">STREAMED-OK-A (async server child, no dynamic API)</p>
  );
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
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="Stream probe"
        description="Three Suspense shapes against the real runtime, side by side. Each resolves after 1.5 seconds; whichever panel stays on its waiting fallback is the shape that strands. Verify it on a deployment: dev streaming behaves differently."
      />
      <Section
        id="shapes"
        title="The three shapes"
        blurb="A: an async server child inside a client TabsContent. B: the same, touching cookies(). C: a promise made in the page body and read by a client component."
      >
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
      </Section>
      <Pager />
    </div>
  );
}
