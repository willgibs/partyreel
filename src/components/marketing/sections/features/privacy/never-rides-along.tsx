import {
  ChevronRight,
  DoorOpen,
  ImagePlus,
  ListChecks,
  MailCheck,
  MapPinOff,
  SearchX,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";

/**
 * The quiet-protections section: what an upload does NOT carry with it. Four
 * named claims (specifics over adjectives, the home-privacy register) beside a
 * mock of the real Settings' first two rows (event-settings r1: each row a
 * sentence of where its group stands, `lib/events/guest-experience-summary.ts`),
 * the words the app says with review on and the email step at its default.
 * Static on purpose; the access switch above is this page's one moving part.
 */

const CLAIMS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: MapPinOff,
    // The RATIFIED metadata wording, verbatim (never extended).
    title: "Location data stays on the phone",
    body: "EXIF and GPS metadata are stripped in the browser before a photo ever uploads.",
  },
  {
    icon: SearchX,
    title: "Share links stay out of search engines",
    body: "Public means people with your link, not the open internet. An album is never something a stranger finds by searching.",
  },
  {
    icon: ListChecks,
    title: "Nothing has to go public unreviewed",
    body: "Turn on review and every upload waits for your approval before anyone else sees it.",
  },
  {
    icon: MailCheck,
    title: "A verified email to upload",
    body: "New events ask every uploader to confirm their email with a one-time code first. Free on every plan, on by default.",
  },
];

export function NeverRidesAlong() {
  return (
    <SectionShell
      eyebrow="Quiet protections"
      heading="What never rides along."
      subhead="Most of the privacy work happens before a photo is ever visible, in defaults you never have to think about."
    >
      {/* ONE column of claims, not a 2x2: at 1440 the old sub-grid squeezed
          this to a ~181px measure (28 chars a line, every heading wrapping)
          while the 375 stack read fine. Stacked, the claims run at the same
          comfortable measure the phone already had. Slots continue
          SectionShell's header count (0-2). */}
      <Reveal className="mx-auto mt-12 grid max-w-4xl items-center gap-x-12 gap-y-10 lg:grid-cols-[1fr_minmax(0,21rem)]">
        <div className="flex flex-col gap-8">
          {CLAIMS.map((claim, i) => (
            <div
              key={claim.title}
              data-mkt-reveal
              className="flex items-start gap-4"
              style={{ "--i": 3 + i } as CSSProperties}
            >
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border text-muted-foreground">
                <claim.icon className="size-4.5" strokeWidth={1.5} />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="font-heading text-subsection">{claim.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {claim.body}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div data-mkt-reveal style={{ "--i": 3 } as CSSProperties}>
          <SettingsMock />
        </div>
      </Reveal>
    </SectionShell>
  );
}

/**
 * Settings' first two rows, quoted: each title over its sentence, the live words underlined as the app
 * draws them, with review on and an email first at its default.
 */
function SettingsMock() {
  return (
    <div
      aria-hidden
      className="overflow-hidden rounded-2xl border bg-card ring-1 ring-foreground/5 select-none"
    >
      <MockRow Icon={DoorOpen} title="Who can get in">
        <Word>Anyone with the link</Word>, after <Word>confirming an email</Word>.
      </MockRow>
      <div className="h-px bg-border" />
      <MockRow Icon={ImagePlus} title="What guests can add">
        <Word>Photos</Word>, <Word>held until you approve them</Word>.
      </MockRow>
    </div>
  );
}

/** A live word, as the row draws it: underlined like a link's quieter cousin. */
function Word({ children }: { children: string }) {
  return (
    <span className="font-medium text-foreground underline decoration-foreground/35 decoration-dotted decoration-2 underline-offset-[5px]">
      {children}
    </span>
  );
}

function MockRow({
  Icon,
  title,
  children,
}: {
  Icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs leading-relaxed text-pretty text-muted-foreground">
          {children}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </div>
  );
}
