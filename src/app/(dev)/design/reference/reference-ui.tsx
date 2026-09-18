import { PageHeader } from "@/app/(dev)/design/(shell)/_shell/page-header";
import { Section } from "@/app/(dev)/design/(shell)/_shell/section";
import { Specimen } from "@/app/(dev)/design/gallery/specimen";
import { cn } from "@/lib/utils";

/**
 * THE LIBRARY'S FRAMING KIT, folded into the shell's templates (the Library x
 * Lab round, 2026-09-15).
 *
 * This file used to carry its own page header, its own section and its own
 * specimen frame, written before the shell existed. Three of the four now
 * DELEGATE, so the library reads exactly like the lab: `RefHeader` is the
 * shell's `PageHeader` (whose breadcrumbs make the old `eyebrow` prop
 * redundant), `RefSection` is `Section` (whose anchor the table of contents
 * lists), and `Spec` is the gallery's `Specimen` frame (which adds the
 * light-and-dark split every framed block should have had). The names stay so
 * the pages that call them keep working; a new page composes the shell pieces
 * directly.
 *
 * What is genuinely the library's own, and stays: the reading column, the
 * wrapping row, and the live token swatch.
 */

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * The reading column every library page sits in: the same width and gutters
 * the shell gives its inline table of contents, and a `div` rather than a
 * `main` because the shell already renders the page's one main landmark.
 */
export function Column({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6", className)}
    >
      {children}
    </div>
  );
}

export function RefHeader({
  title,
  blurb,
}: {
  /** Retired (the Library x Lab round, 2026-09-15): the breadcrumbs say it. */
  eyebrow?: string;
  title: string;
  blurb: string;
}) {
  return <PageHeader title={title} description={blurb} />;
}

export function RefSection({
  id,
  title,
  blurb,
  children,
}: {
  /** The anchor (defaults to the title, slugged) the table of contents lists. */
  id?: string;
  title: string;
  blurb?: string;
  children: React.ReactNode;
}) {
  return (
    <Section id={id ?? slug(title)} title={title} blurb={blurb}>
      {children}
    </Section>
  );
}

/** The framed specimen: a label, a quiet hint, and the light-and-dark split. */
export function Spec({
  label,
  hint,
  contentClassName,
  children,
}: {
  label?: string;
  hint?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <Specimen label={label} hint={hint} contentClassName={contentClassName}>
      {children}
    </Specimen>
  );
}

/** A wrapping row for inline specimens (a button family, badges, etc.). */
export function Row({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {children}
    </div>
  );
}

/** A live color swatch: the real CSS var as the fill, so it tracks the theme. */
export function Swatch({ name, varName }: { name: string; varName: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div
        className="h-12 w-full"
        style={{ backgroundColor: `var(${varName})` }}
      />
      <div className="bg-card px-2.5 py-1.5">
        <p className="truncate text-[12px] font-medium">{name}</p>
        <p className="truncate text-[10px] text-muted-foreground">{varName}</p>
      </div>
    </div>
  );
}
