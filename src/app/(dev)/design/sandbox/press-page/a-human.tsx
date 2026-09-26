"use client";

import { Container } from "@/components/shared/container";
import { PRESS_FACTS } from "@/lib/constants/press";
import { cn } from "@/lib/utils";

import { FIXTURE_NAME, FIXTURE_TITLE, FixtureNote } from "./shared";

/**
 * DECISION 5: WHETHER ANYONE IS NAMED. Every option keeps the real fact row's
 * shape and its real address (help@partyreel.com); only what sits beside or
 * above it changes. `named-contact` and `founder-card` both use the one
 * fixture name every "named" option on this board shares (shared.tsx).
 */

const INLINE_LINK =
  "underline decoration-current/30 underline-offset-4 transition-colors duration-150 hover:decoration-current";

const ROLE_EMAIL = PRESS_FACTS.find((f) => f.label === "Press contact")!.value;

function ContactRow({ value }: { value: string }) {
  return (
    <div className="grid gap-1 border-t py-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)] sm:items-baseline sm:gap-12">
      <dt className="text-sm font-medium">Press contact</dt>
      <dd className="text-sm text-pretty text-muted-foreground">
        <a href={`mailto:${ROLE_EMAIL}`} className={cn("text-foreground", INLINE_LINK)}>
          {value}
        </a>
      </dd>
    </div>
  );
}

function RoleOnly() {
  return (
    <dl className="max-w-lg">
      <ContactRow value={ROLE_EMAIL} />
    </dl>
  );
}

function NamedContact() {
  return (
    <dl className="max-w-lg">
      <ContactRow value={`${FIXTURE_NAME}, ${ROLE_EMAIL}`} />
      <FixtureNote>
        {FIXTURE_NAME} is a fixture name for this board only, standing in for
        whoever a real answer would name.
      </FixtureNote>
    </dl>
  );
}

function FounderCard() {
  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 rounded-tile border bg-muted/40 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background">
          {FIXTURE_NAME.split(" ")
            .map((n) => n[0])
            .join("")}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">{FIXTURE_NAME}</p>
          <p className="text-sm text-muted-foreground">
            {FIXTURE_TITLE}, Partyreel
          </p>
        </div>
      </div>
      <dl className="mt-5">
        <ContactRow value={ROLE_EMAIL} />
      </dl>
      <FixtureNote>
        {FIXTURE_NAME} is a fixture name for this board only; picking this
        option is picking the CARD, not the person.
      </FixtureNote>
    </div>
  );
}

export function HumanPreview({
  variant,
}: {
  variant: "role-only" | "named-contact" | "founder-card";
}) {
  return (
    <Container className="py-10">
      {variant === "named-contact" ? (
        <NamedContact />
      ) : variant === "founder-card" ? (
        <FounderCard />
      ) : (
        <RoleOnly />
      )}
    </Container>
  );
}
