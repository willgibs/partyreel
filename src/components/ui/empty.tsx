import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * THE ONE EMPTY PLACE (identity r2's carried call `one-empty`, drawn in
 * status=lights): "nothing here yet" is one atom everywhere, a glyph, a title,
 * a line and an action, and never a dashed box. The glyph stands in a LENS, a
 * round of the ground's muted tone ringed by a step and a soft halo, the way a
 * camera shows nothing: a lens with nothing in front of it.
 *
 * ★ THE HOOKS ARE THE BOARD'S, FIXED (`empty`, `empty-glyph`, `empty-copy`,
 * `empty-title`, `empty-line`, `empty-action`): identity's sheets style them,
 * and a rule that names a hook the atom does not draw reaches nothing.
 *
 * ★ ITS GLYPH IS AN ELEMENT (`icon={<Images />}`), so a server page can hand it
 * one (`design-system.md`: a function cannot cross into a client atom); the
 * atom sizes it. No glyph is the quiet form: the title and the line alone.
 *
 * The title is a heading wherever it names the place (`titleAs`, an `h3` by
 * default, since an empty place sits under its section's own heading); a
 * place whose head already says what it is passes `p`. Either way it is on the
 * ladder's `subsection` step at the heading face's one weight (Will,
 * 2026-09-18: no one-off sizes; 2026-09-29: the heavier weight), so an empty
 * place is quiet by its missing glyph, never by a thin title.
 */
function Empty({
  icon,
  title,
  line,
  action,
  titleAs: Title = "h3",
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "title"> & {
  /** The glyph, as an element (`<Images />`); none for the quiet form. */
  icon?: React.ReactNode
  /** What is not here yet, in a few words. */
  title: React.ReactNode
  /** What brings it here, a sentence. */
  line?: React.ReactNode
  /** The one act that starts it (a `Button`). */
  action?: React.ReactNode
  titleAs?: "h2" | "h3" | "h4" | "p"
}) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex flex-col items-center gap-3 px-5 py-8 text-center",
        className,
      )}
      {...props}
    >
      {icon ? (
        <span
          data-slot="empty-glyph"
          aria-hidden
          // The lens: its glass the ground's muted tone, a step for its rim, a
          // hairline inside and a soft halo out (a drawing, not elevation).
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(closest-side,var(--muted)_0_62%,var(--secondary)_63%_100%)] text-muted-foreground shadow-[inset_0_0_0_1px_var(--border),0_0_0_6px_color-mix(in_oklab,var(--muted)_60%,transparent)] [&_svg]:size-[22px] [&_svg]:shrink-0"
        >
          {icon}
        </span>
      ) : null}
      <div data-slot="empty-copy" className="flex flex-col items-center gap-1">
        <Title
          data-slot="empty-title"
          className="font-heading text-subsection text-balance"
        >
          {title}
        </Title>
        {line ? (
          <span
            data-slot="empty-line"
            className="max-w-[32ch] text-sm text-pretty text-muted-foreground"
          >
            {line}
          </span>
        ) : null}
      </div>
      {action ? (
        <span data-slot="empty-action" className="pt-1">
          {action}
        </span>
      ) : null}
    </div>
  )
}

export { Empty }
