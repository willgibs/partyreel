import { Briefcase, Cake, Heart, Plane } from "lucide-react";

import { Section } from "./section";

const USE_CASES = [
  {
    icon: Heart,
    title: "Weddings",
    body: "Every guest's angle of the first dance — not just the photographer's.",
  },
  {
    icon: Cake,
    title: "Birthdays",
    body: "The candid moments from every table, gathered before anyone leaves.",
  },
  {
    icon: Briefcase,
    title: "Conferences",
    body: "Talks, booths, and hallway moments from hundreds of attendees in one feed.",
  },
  {
    icon: Plane,
    title: "Trips",
    body: "Pool everyone's photos from the whole trip instead of chasing them later.",
  },
];

export function UseCases() {
  return (
    <Section
      id="use-cases"
      eyebrow="Use cases"
      heading="Made for every kind of get-together"
      subhead="If people show up with phones, Partyreel collects what they capture."
    >
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {USE_CASES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex flex-col gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-brand">
              <Icon className="size-5" />
            </span>
            <h3 className="font-heading text-base font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
