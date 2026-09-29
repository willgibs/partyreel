"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * "Did this answer your question?" (R6), now a counted beacon (help-center r1 `feedback=beacon`,
 * Will: "One insert per click, visible only in admin; the reader sees the same thank-you or sorry").
 * "Yes" is still a thank-you moment and "No" still routes to the useful action, contact prefilled
 * with this article via ?about= (the C3 handoff); what changed is that the answer is no longer
 * thrown away. The drawn check is the 10-success-check recipe, the contact-form precedent.
 *
 * ★ THE READER NEVER WAITS ON THE COUNT. The post is fire-and-forget (`keepalive`, so a click
 * followed by a tap on "Up next" still lands) and its answer is never read: a refused, limited or
 * failed beacon changes nothing on screen, which is what "the same thank-you or sorry" means. The
 * route answers with no body anyway (`/api/help/feedback`), and a failure is counted where an
 * operator looks (the `help_feedback` signal), not where a reader does.
 *
 * ★ ONE CLICK, ONE POST. The row leaves the screen on the first click, and the ref holds the line
 * against a double-click landing twice before React re-renders.
 */
export function ArticleFeedback({
  slug,
  next,
}: {
  slug: string;
  /** The next article in the category: the "Up next" door after a Yes. */
  next?: { slug: string; title: string } | null;
}) {
  const [state, setState] = useState<"idle" | "yes" | "no">("idle");
  const sent = useRef(false);

  const answer = (helpful: boolean) => {
    if (sent.current) return;
    sent.current = true;
    setState(helpful ? "yes" : "no");
    sendFeedbackBeacon(slug, helpful);
  };

  return (
    <div className="mt-14 border-t pt-6">
      {state === "idle" && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <p className="text-sm font-medium text-foreground">
            Did this answer your question?
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => answer(true)}>
              Yes
            </Button>
            <Button variant="outline" size="sm" onClick={() => answer(false)}>
              No
            </Button>
          </div>
        </div>
      )}
      {state === "yes" && (
        <div className="flex items-center gap-2.5">
          <span className="mkt-check text-success" data-state="in" aria-hidden>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M20 6 9 17l-5-5"
                style={{ strokeDasharray: 24, strokeDashoffset: 24 }}
              />
            </svg>
          </span>
          <p className="text-sm text-muted-foreground">
            Glad it helped.
            {next && (
              <>
                {" "}
                Up next:{" "}
                <Link
                  href={`/help/${next.slug}`}
                  className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
                >
                  {next.title}
                </Link>
              </>
            )}
          </p>
        </div>
      )}
      {state === "no" && (
        <p className="text-sm text-muted-foreground">
          Sorry about that.{" "}
          <Link
            href={`/contact?about=${slug}`}
            className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors duration-150 hover:decoration-foreground"
          >
            Tell us what was missing
          </Link>{" "}
          and we&rsquo;ll fix the article.
        </p>
      )}
    </div>
  );
}

/** The beacon itself: one post, never awaited, never read (see the header). */
export function sendFeedbackBeacon(slug: string, helpful: boolean): void {
  try {
    void fetch("/api/help/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, helpful }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // A browser that refuses the request outright costs one count, never the reader's thank-you.
  }
}
