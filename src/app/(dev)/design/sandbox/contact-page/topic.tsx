"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_TOPICS } from "@/lib/constants/contact";

import { PERSONAS } from "./fixtures";
import { FIELD, HintRow, PlainField, Stationery, stopLinks, TopicField } from "./pieces";

/**
 * DECISION 3: THE TOPIC. Drawn on the reporter's fixture (Press &
 * partnerships), the topic the site can do the least about deflecting.
 */
export type TopicShape = "required" | "gone" | "optional";

function BodyFields() {
  const persona = PERSONAS.reporter;
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <PlainField label="Name">
          <Input className={FIELD} defaultValue={persona.name} readOnly />
        </PlainField>
        <PlainField label="Email">
          <Input className={FIELD} defaultValue={persona.email} readOnly />
        </PlainField>
      </div>
      <PlainField label="Subject" optional>
        <Input className={FIELD} defaultValue={persona.subject} readOnly />
      </PlainField>
      <PlainField label="Message">
        <Textarea
          className="min-h-28 rounded-xl bg-background text-base md:text-base"
          defaultValue={persona.message}
          readOnly
        />
      </PlainField>
    </>
  );
}

export function TopicPreview({ shape }: { shape: TopicShape }) {
  const persona = PERSONAS.reporter;
  const hint = CONTACT_TOPICS.find((t) => t.value === persona.topic)?.hint;
  return (
    <div
      onClickCapture={stopLinks}
      className="mx-auto max-w-md bg-background p-6 text-foreground"
    >
      <Stationery>
        <form className="flex flex-col gap-5">
          {shape === "required" && (
            <>
              <TopicField defaultValue={persona.topic} />
              {hint && <HintRow hint={hint} />}
            </>
          )}
          {shape === "optional" && (
            <>
              <TopicField optional />
              <p className="text-xs text-muted-foreground">
                Skipped: a person sorts this note once it lands.
              </p>
            </>
          )}
          <BodyFields />
          <div className="flex items-center justify-between pt-1">
            <Button type="button" size="cta">
              Send message
            </Button>
          </div>
        </form>
      </Stationery>
    </div>
  );
}
