"use client";

import { Textarea } from "@/components/ui/textarea";
import { CONTACT_TOPICS } from "@/lib/constants/contact";
import { REPLY_LINE } from "@/lib/constants/contact";

import { PERSONAS } from "./fixtures";
import { HintRow, PlainField, Stationery, stopLinks, TopicField } from "./pieces";

/**
 * DECISION 4: URGENCY. Drawn on the host's fixture, mid-event, something
 * broke: the case the manifest names ("a host mid-event queues behind a
 * press inquiry on the same 8-an-hour gate").
 */
export type UrgencyShape = "one" | "door" | "stated";

const BUG_HINT = CONTACT_TOPICS.find((t) => t.value === "bug")!.hint!;

/** Placeholder timing, judged for its size and wrapping, never its words
 *  (the copy is open, bible 10): the point is that a bug reads first and a
 *  press ask reads slower, stated rather than left to guesswork. */
const STATED_TIME: Record<string, string> = {
  bug: "Read first, ahead of the rest.",
  hosting: "Read within the day.",
  guest: "Read within the day.",
  billing: "Read within the day.",
  privacy: "Read within the day.",
  press: "Read within two to three days.",
  other: "Read within the day.",
};

export function UrgencyPreview({ shape }: { shape: UrgencyShape }) {
  const persona = PERSONAS.host;
  return (
    <div
      onClickCapture={stopLinks}
      className="mx-auto max-w-md bg-background p-6 text-foreground"
    >
      <Stationery>
        <div className="flex flex-col gap-5">
          {shape === "door" && (
            <div className="flex flex-col gap-1.5 rounded-xl border border-dashed border-foreground/25 px-4 py-3">
              <p className="text-sm font-medium">
                Something&rsquo;s wrong right now?
              </p>
              <p className="text-sm text-pretty text-muted-foreground">
                Check troubleshooting first; a note here still gets a reply,
                and it is flagged for a faster look.
              </p>
            </div>
          )}
          <TopicField defaultValue={persona.topic} />
          {shape !== "stated" && <HintRow hint={BUG_HINT} />}
          {shape === "stated" && (
            <div className="flex flex-col gap-1.5 rounded-xl bg-background px-4 py-3 text-sm text-muted-foreground">
              <span className="text-pretty">{BUG_HINT.text}</span>
              <span className="font-medium text-foreground">
                {STATED_TIME.bug}
              </span>
            </div>
          )}
          <PlainField label="Message">
            <Textarea
              className="min-h-24 rounded-xl bg-background text-base md:text-base"
              defaultValue={persona.message}
              readOnly
            />
          </PlainField>
          <p className="text-xs text-muted-foreground">{REPLY_LINE}</p>
        </div>
      </Stationery>
    </div>
  );
}
