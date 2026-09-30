"use client";

import { useState } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { Term } from "./board-spec";
import { splitTerms } from "./terms";

/**
 * A LINE WITH ITS COINED WORDS MARKED (lab-focus, 2026-09-29). Will's brief:
 * a board's terms are one press away in the About panel, "also as a light
 * hint on a term where it appears". So a term in the question, the where line
 * or the shown option's line wears a dotted underline, and its meaning is one
 * hover (or one tap, on a phone) away. The words themselves never change.
 */
export function Glossed({
  text,
  terms,
}: {
  text: string;
  terms?: readonly Term[];
}) {
  const pieces = splitTerms(text, terms);
  if (pieces.length === 1 && !pieces[0].term) return <>{text}</>;
  return (
    <>
      {pieces.map((piece, i) =>
        piece.term ? (
          <TermHint key={i} term={piece.term}>
            {piece.text}
          </TermHint>
        ) : (
          piece.text
        ),
      )}
    </>
  );
}

/**
 * ONE TERM, AND ITS MEANING IN THE INK TOOLTIP (the production one: a label
 * for the thing under the cursor). The panel it lives in is portalled, so a
 * line cut to one line with an ellipsis never clips it.
 *
 * ★ THE TAP OPENS IT FROM THE WRAPPER, NOT FROM THE TRIGGER. A tooltip closes
 * itself on a press of its own trigger (radix's click handler), and a handler
 * on the trigger runs before radix's, so a toggle there opens and is closed
 * again in the same press. The press bubbles to the wrapper after radix has
 * spoken, so the wrapper's toggle is the last word, which is what a phone,
 * with no hover, needs.
 */
function TermHint({ term, children }: { term: Term; children: string }) {
  const [open, setOpen] = useState(false);
  // Its own provider, so a line can be glossed wherever it is mounted (the
  // kit's demo, a test) and not only under the app's.
  return (
    <span onClick={() => setOpen((o) => !o)}>
      <TooltipProvider delayDuration={0}>
        <Tooltip open={open} onOpenChange={setOpen}>
          <TooltipTrigger asChild>
            <span
              tabIndex={0}
              data-lab-term={term.term}
              className="cursor-help underline decoration-foreground/35 decoration-dotted underline-offset-[3px] outline-none focus-visible:decoration-foreground"
            >
              {children}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-72 text-left">
            <span>
              <span className="font-medium">{term.term}</span>: {term.means}
            </span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  );
}
