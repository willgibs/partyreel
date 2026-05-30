import { HOW_IT_WORKS } from "@/lib/constants/how-it-works";

import { Section } from "./section";

export function HowItWorks() {
  return (
    <Section
      id="how-it-works"
      eyebrow="How it works"
      heading="From QR to gallery in three steps"
    >
      <ol className="mt-14 grid gap-10 sm:grid-cols-3">
        {HOW_IT_WORKS.map(({ icon: Icon, title, body }, i) => (
          <li key={title} className="flex flex-col gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
              <Icon className="size-5" />
            </span>
            <h3 className="font-heading text-lg font-medium">
              <span className="mr-1 text-brand">{i + 1}.</span>
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">{body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
