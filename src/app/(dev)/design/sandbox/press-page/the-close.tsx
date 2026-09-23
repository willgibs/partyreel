"use client";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { REPLY_LINE } from "@/lib/constants/contact";

import { FIXTURE_NAME, FixtureNote } from "./shared";

/**
 * DECISION 6 (waits on `a-human`): HOW THE PAGE CLOSES. The heading and body
 * copy stay the real close block's own words; `humanOption` (the board's
 * live answer to `a-human`, read by board.tsx) swaps "Send a message" for a
 * name when one has been picked, so this decision's evidence is honestly
 * drawn IN whatever world `a-human` has already settled, per exploration.ts's
 * function-preview convention.
 */

function CloseShell({
  action,
  note,
}: {
  action: React.ReactNode;
  note?: React.ReactNode;
}) {
  return (
    <section className="py-16 sm:py-20">
      <Container className="flex flex-col items-center gap-5 text-center">
        <h2 className="max-w-2xl font-heading text-prose text-balance">
          Need anything else?
        </h2>
        <p className="max-w-xl text-pretty text-muted-foreground">
          Interviews, higher-resolution assets, or a walkthrough of the product.{" "}
          {REPLY_LINE}
        </p>
        {action}
        {note}
      </Container>
    </section>
  );
}

function AsToday() {
  return <CloseShell action={<Button size="cta">Send a message</Button>} />;
}

function ContactDoor({ named }: { named: boolean }) {
  return (
    <CloseShell
      action={
        <Button size="cta">
          {named ? `Write to ${FIXTURE_NAME}` : "Send a message"}
        </Button>
      }
      note={
        <FixtureNote className="mx-auto text-center">
          The button carries /contact?topic=press, so the Press chip is
          already picked on arrival.
        </FixtureNote>
      }
    />
  );
}

function InlineForm({ named }: { named: boolean }) {
  return (
    <section className="py-16 sm:py-20">
      <Container className="mx-auto flex max-w-md flex-col items-center gap-5 text-center">
        <h2 className="font-heading text-prose text-balance">
          Need anything else?
        </h2>
        <p className="text-pretty text-muted-foreground">
          {named ? `Write to ${FIXTURE_NAME} directly.` : REPLY_LINE}
        </p>
        <div className="w-full max-w-sm text-left">
          <label className="text-sm font-medium" htmlFor="pp-close-note">
            Your note
          </label>
          <textarea
            id="pp-close-note"
            rows={3}
            readOnly
            className="mt-1.5 w-full resize-none rounded-tile border bg-background p-3 text-sm text-muted-foreground"
            defaultValue="Working on a piece about..."
          />
          <label className="mt-3 block text-sm font-medium" htmlFor="pp-close-email">
            A way to reply
          </label>
          <input
            id="pp-close-email"
            readOnly
            className="mt-1.5 w-full rounded-tile border bg-background p-3 text-sm text-muted-foreground"
            defaultValue="you@example.com"
          />
          <Button size="cta" className="mt-4 w-full">
            Send
          </Button>
        </div>
      </Container>
    </section>
  );
}

export function ClosePreview({
  variant,
  humanOption = "role-only",
}: {
  variant: "as-today" | "contact-door" | "inline-form";
  humanOption?: string;
}) {
  const named = humanOption === "named-contact" || humanOption === "founder-card";
  if (variant === "contact-door") return <ContactDoor named={named} />;
  if (variant === "inline-form") return <InlineForm named={named} />;
  return <AsToday />;
}
