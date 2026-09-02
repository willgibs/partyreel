"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * The honest feedback row (R6): "Yes" is a thank-you moment (nothing is
 * recorded anywhere, so nothing pretends to be); "No" routes to the real
 * useful action — contact, prefilled with this article via ?about= (the C3
 * handoff). The drawn check is the 10-success-check recipe, the contact-form
 * precedent.
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

  return (
    <div className="mt-14 border-t pt-6">
      {state === "idle" && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <p className="text-sm font-medium text-foreground">
            Did this answer your question?
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setState("yes")}>
              Yes
            </Button>
            <Button variant="outline" size="sm" onClick={() => setState("no")}>
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
