import { Check, X } from "lucide-react";

import { Section } from "./section";

const WITHOUT = [
  "Photos scattered across a dozen phones",
  "Half of them never reach the group chat",
  "“Can you send me that one?” for weeks",
  "The best candids you never even saw",
];

const WITH = [
  "One QR code, everything in one gallery",
  "Guests upload in seconds, no app, no account",
  "You curate and share a single album",
  "Every angle of the night, together",
];

export function ProblemSolution() {
  return (
    <Section
      heading="The photos are out there. You just never get them."
      subhead="The group chat gets a handful. The rest stay stuck on everyone else's camera roll."
    >
      <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-heading text-sm font-medium text-muted-foreground">
            The morning after, without Partyreel
          </h3>
          <ul className="mt-4 space-y-3 text-sm">
            {WITHOUT.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <X className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border bg-card p-6 ring-1 ring-brand/30">
          <h3 className="font-heading text-sm font-medium">With Partyreel</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {WITH.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
