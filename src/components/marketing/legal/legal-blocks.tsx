import {
  HeadingAnchor,
  HEADING_SCROLL_MT,
} from "@/components/marketing/reading/heading-anchor";
import type { LegalBlock } from "@/lib/constants/legal";
import { cn } from "@/lib/utils";

/**
 * THE BLOCK RENDERER: the only place a legal paragraph, list, table, sub-heading
 * or note gets its classes. Content modules describe; this file paints. The
 * body register is the R5 shell's (small, muted, leading-6): the two documents
 * are long and read at that size like a contract should, while the "In short"
 * lines and the notes step up to ink.
 */
export function LegalBlocks({
  sectionId,
  blocks,
}: {
  sectionId: string;
  blocks: LegalBlock[];
}) {
  return (
    <div className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "p":
            return (
              <p key={i} className="text-pretty">
                {block.content}
              </p>
            );
          case "list": {
            const Tag = block.ordered ? "ol" : "ul";
            return (
              <Tag
                key={i}
                className={cn(
                  "space-y-1.5 pl-5 marker:text-faint",
                  block.ordered ? "list-decimal" : "list-disc",
                )}
              >
                {block.items.map((item, j) => (
                  <li key={j} className="pl-1 text-pretty">
                    {item}
                  </li>
                ))}
              </Tag>
            );
          }
          case "table":
            return (
              // The wrapper scrolls, never the page (the responsive rule).
              <div key={i} className="overflow-x-auto">
                <table className="w-full min-w-[28rem] border-collapse text-left">
                  {block.caption && (
                    <caption className="pb-2 text-left text-xs text-muted-foreground">
                      {block.caption}
                    </caption>
                  )}
                  <thead>
                    <tr className="border-b">
                      {block.columns.map((col) => (
                        <th
                          key={col.header}
                          scope="col"
                          className="py-2 pr-4 text-label font-medium text-muted-foreground uppercase"
                        >
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r} className="border-b align-top">
                        {row.map((cell, c) => (
                          <td
                            key={c}
                            className={cn(
                              "py-2.5 pr-4",
                              c === 0 && "text-foreground",
                              // A numeric column takes tabular figures so the
                              // durations and amounts align down the column.
                              block.columns[c]?.numeric &&
                                "text-xs whitespace-nowrap tabular-nums",
                            )}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "sub": {
            const id = `${sectionId}-${block.id}`;
            return (
              <h3
                key={i}
                id={id}
                className={cn(
                  "group pt-2 font-heading text-subsection text-foreground",
                  HEADING_SCROLL_MT,
                )}
              >
                {block.title}
                <HeadingAnchor id={id} />
              </h3>
            );
          }
          case "note":
            // The set-apart register inside a paper body (the /contact panel
            // surface): bordered, a whisper of muted ground, ink text. It is
            // how a disclaimer is made conspicuous without shouting in caps.
            return (
              <div
                key={i}
                className="border-y bg-muted/40 px-4 py-4 text-pretty text-foreground"
              >
                {block.content}
              </div>
            );
        }
      })}
    </div>
  );
}
