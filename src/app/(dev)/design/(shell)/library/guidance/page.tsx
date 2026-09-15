import { requireDesignKey } from "@/lib/design-gate/server";

import { Callout } from "@/app/(dev)/design/(shell)/_shell/callout";
import { Markdown } from "@/app/(dev)/design/(shell)/_shell/markdown";
import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Pager } from "@/app/(dev)/design/(shell)/_shell/pager";
import { Ref } from "@/app/(dev)/design/(shell)/_shell/ref";
import { Section } from "@/app/(dev)/design/(shell)/_shell/section";
import { DOCS, readDoc, sectionOf } from "@/app/(dev)/design/_data/docs";

const CRAFT_ANCHOR = "the-craft-guidance-stack";

/**
 * GUIDANCE (the Library x Lab round, 2026-09-15): the craft stack and the
 * skills, the default an agent leaves on purpose. Phase 0 renders the craft
 * chapter of the design system doc where it still lives; the lab-rules track
 * moves it to docs/design/guidance.md with the skills table and this page
 * renders that file.
 */
export default async function GuidancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const sys = DOCS["design-system"];
  const craft = sectionOf(readDoc(sys.path).body, CRAFT_ANCHOR);
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <PageHeader
        title="Guidance"
        description="The craft stack and the skills: what an agent reaches for by default, and leaves only on purpose. Guidance never binds; the bible and the contracts do."
      />
      <Callout kind="provisional" className="mt-6">
        Guidance is the third level: below the law and the contracts, above
        precedent. The craft skill (
        <Ref to={{ kind: "doc", doc: "craft" }}>emil-design-eng</Ref>) is
        declared primary.
      </Callout>
      <Section
        id="craft"
        title="The craft stack"
        blurb="Rendered from the design system doc's chapter until docs/design/guidance.md exists."
        aside={
          <Ref
            to={{ kind: "doc", doc: "design-system", anchor: CRAFT_ANCHOR }}
            quiet
          >
            the chapter
          </Ref>
        }
      >
        {craft ? (
          <Markdown source={craft} from={sys.path} designKey={key} />
        ) : (
          <p className="text-sm text-muted-foreground">
            The chapter has moved; read the design system doc.
          </p>
        )}
      </Section>
      <Section
        id="skills"
        title="Skills"
        blurb="The installed skills and when to invoke them."
      >
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card text-sm">
          <li className="flex flex-wrap items-baseline gap-x-3 px-4 py-2">
            <span className="font-medium">emil-design-eng</span>
            <span className="text-muted-foreground">
              primary; every UI change (motion by frequency, press feedback,
              custom easing).
            </span>
            <Ref to={{ kind: "doc", doc: "craft" }} quiet>
              read it
            </Ref>
          </li>
        </ul>
      </Section>
      <Pager />
    </div>
  );
}
