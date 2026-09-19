"use client";

import { useState } from "react";

import { ArticleFeedback } from "@/components/marketing/help/article-feedback";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { stopLinks } from "./vocab";

/**
 * DECISION 5: FEEDBACK. "Did this answer your question?" flips local state
 * today and records nothing — fifty-nine articles have never once said which
 * of them fail. `ephemeral` draws the real, unedited `ArticleFeedback`; the
 * other two are one-prop copies of it (the real component takes no prop for
 * "also count this" or "also route this"), left interactive so a click
 * still reads the same thank-you or sorry copy either way.
 */
export type FeedbackShape = "ephemeral" | "beacon" | "routed";

const Check = () => (
  <span className="mkt-check text-success" aria-hidden>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  </span>
);

function BeaconFeedback() {
  const [state, setState] = useState<"idle" | "yes" | "no">("idle");
  const [tally, setTally] = useState({ yes: 41, no: 9 });
  const pick = (next: "yes" | "no") => {
    setTally((t) => ({ ...t, [next]: t[next] + 1 }));
    setState(next);
  };
  return (
    <div className="mt-14 border-t pt-6">
      {state === "idle" && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <p className="text-sm font-medium text-foreground">Did this answer your question?</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => pick("yes")}>
              Yes
            </Button>
            <Button variant="outline" size="sm" onClick={() => pick("no")}>
              No
            </Button>
          </div>
        </div>
      )}
      {state === "yes" && (
        <div className="flex items-center gap-2.5">
          <Check />
          <p className="text-sm text-muted-foreground">Glad it helped.</p>
        </div>
      )}
      {state === "no" && (
        <p className="text-sm text-muted-foreground">
          Sorry about that. <a href="#" className="font-medium text-foreground underline decoration-border underline-offset-4">Tell us what was missing</a>.
        </p>
      )}
      <p className="mt-3 text-xs text-faint tabular-nums">
        Recorded, this article: {tally.yes} helpful &middot; {tally.no} not (visible only in /admin).
      </p>
    </div>
  );
}

function RoutedFeedback() {
  const [state, setState] = useState<"idle" | "yes" | "note" | "sent">("idle");
  return (
    <div className="mt-14 border-t pt-6">
      {state === "idle" && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <p className="text-sm font-medium text-foreground">Did this answer your question?</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setState("yes")}>Yes</Button>
            <Button variant="outline" size="sm" onClick={() => setState("note")}>No</Button>
          </div>
        </div>
      )}
      {state === "yes" && (
        <div className="flex items-center gap-2.5">
          <Check />
          <p className="text-sm text-muted-foreground">Glad it helped.</p>
        </div>
      )}
      {state === "note" && (
        <div className="flex flex-col gap-2.5">
          <p className="text-sm text-muted-foreground">Sorry about that. What was missing?</p>
          <Textarea rows={2} placeholder="Optional, but it helps us fix the article" />
          <Button size="sm" className="w-fit" onClick={() => setState("sent")}>
            Send to the team
          </Button>
        </div>
      )}
      {state === "sent" && (
        <p className="text-sm text-muted-foreground">
          Logged, the same queue a contact note lands in. Usually a reply within a day.
        </p>
      )}
    </div>
  );
}

export function FeedbackPreview({ shape }: { shape: FeedbackShape }) {
  return (
    <div onClickCapture={stopLinks} className="bg-background p-6 text-foreground">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-muted-foreground">…the rest of the article, above.</p>
        {shape === "ephemeral" && <ArticleFeedback slug="an-upload-wont-finish" />}
        {shape === "beacon" && <BeaconFeedback />}
        {shape === "routed" && <RoutedFeedback />}
      </div>
    </div>
  );
}
