"use client";

import { Button } from "@/components/ui/button";

import { stopLinks } from "./vocab";

/**
 * DECISION 6: THE DEAD END. Every category maps to a marketing rung except
 * troubleshooting, which has none — so troubleshooting's eight articles end
 * with no "bigger picture" pointer at all, not by intent but because "no
 * feature" was read as "no rung". Drawn on the end matter of a fixture
 * troubleshooting article (`an-upload-wont-finish`), after its two related
 * articles, which are identical in every shape.
 *
 * Its links are a drawing's, plain anchors like the board's others: a
 * `next/link` prefetches its `#` as the board's own route without `?key=`,
 * which 404s in the console (build 14's red-team).
 */
export type DeadEndShape = "blank" | "band" | "rung";

const RELATED = [
  { slug: "messages-guests-might-see", title: "Messages guests might see" },
  {
    slug: "the-qr-wont-scan-or-the-link-wont-open",
    title: "The QR won't scan, or the link won't open",
  },
];

export function DeadEndPreview({ shape }: { shape: DeadEndShape }) {
  return (
    <div
      onClickCapture={stopLinks}
      className="bg-background p-6 text-foreground"
    >
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-muted-foreground">
          …the rest of the article, above.
        </p>
        <section className="mt-12 border-t pt-10">
          <h2 className="font-heading text-subhead">Related articles</h2>
          <ul className="mt-5 flex flex-col gap-3.5">
            {RELATED.map((item) => (
              <li key={item.slug}>
                <a
                  href="#"
                  className="font-medium text-foreground underline decoration-border underline-offset-4"
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </section>

        {shape === "rung" && (
          <p className="mt-10 text-sm text-muted-foreground">
            Working now?{" "}
            <a
              href="#"
              className="text-foreground underline decoration-border underline-offset-4"
            >
              See what a smooth upload looks like
            </a>
          </p>
        )}

        <section className="mt-10 rounded-2xl border bg-muted/30 p-8 text-center">
          <h2 className="font-heading text-subhead">Still need help?</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-pretty text-muted-foreground">
            {shape === "band"
              ? "That's every fix we know of for this one. Can't find the answer here? Reach out and we'll get back to you."
              : "Can't find the answer here? Reach out and we'll get back to you."}
          </p>
          <Button className="mt-4">Contact us</Button>
        </section>
      </div>
    </div>
  );
}
