import { requireDesignKey } from "@/lib/design-gate/server";

import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Section } from "@/app/(dev)/design/(shell)/_shell/section";
import { ToolsIndex } from "./tools-index";

/**
 * THE TOOLS (the Library x Lab round, 2026-09-15). The lab's instruments, as
 * opposed to its boards: a board argues a decision and asks for an answer, a
 * tool measures something or proves something and asks for nothing. They had
 * no index before this round, only sidebar entries, so the one thing that
 * distinguishes them was never said anywhere.
 */
export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="Tools"
        description="The lab's instruments. A board argues a decision and waits on an answer; a tool measures, tunes or proves something and waits on nobody. Listed from the lab's own navigation, so this page and the sidebar can never disagree."
      />
      <Section
        id="tools"
        title="Every tool"
        blurb="In the order the sidebar lists them."
      >
        <ToolsIndex />
      </Section>
      <Section
        id="boundary"
        title="A warning about the last one"
        blurb="The error boundary probe is the only page in the lab that is supposed to fail."
      >
        {/* Two faces: a bare <code> falls to the preflight's mono stack, so a
            name reads in the sans (design-system.md), and a name is held in
            one piece, so a line never ends on the `?` of `?boundary=global`. */}
        <Callout
          kind="note"
          title="It throws on purpose"
          className="[&_code]:font-sans [&_code]:whitespace-nowrap"
        >
          The boundary probe crashes during render so the error chain can be
          exercised against the real production build. Bare, it throws inside
          the page and lands on the root <code>error.tsx</code>; with{" "}
          <code>?boundary=global</code> it crashes the root layout itself and
          lands on <code>global-error.tsx</code>, the last-resort screen.
          Opening either is safe and breaks nothing; they are listed so nobody
          finds them by accident and reports a bug. Every other tool here is
          inert.
        </Callout>
      </Section>
    </div>
  );
}
