import { cn } from "@/lib/utils";

/**
 * The live-Reference framing kit. The Reference renders the REAL app components
 * and tokens (no mono, no mocks): it inherits the root next-themes theme, so
 * everything here is synced to production by construction. These helpers give it
 * the polished, catalog-like framing: a page header, titled sections, and the
 * bordered "library card" frame each specimen sits in.
 */

export function RefHeader({
  eyebrow,
  title,
  blurb,
}: {
  eyebrow: string;
  title: string;
  blurb: string;
}) {
  return (
    <header className="mb-2">
      <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
        {eyebrow}
      </p>
      <h1 className="font-heading mt-1 text-3xl text-balance">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {blurb}
      </p>
    </header>
  );
}

export function RefSection({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pt-10">
      <h2 className="text-sm font-semibold">{title}</h2>
      {blurb && (
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{blurb}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** The framed specimen: a label + an optional mono hint, over the live specimen. */
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
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {(label || hint) && (
        <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-2.5">
          {label && <p className="text-[13px] font-medium">{label}</p>}
          {hint && (
            <p className="font-mono text-[11px] text-muted-foreground">{hint}</p>
          )}
        </div>
      )}
      <div className={cn("p-5", contentClassName)}>{children}</div>
    </div>
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
export function Swatch({
  name,
  varName,
}: {
  name: string;
  varName: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div
        className="h-12 w-full"
        style={{ backgroundColor: `var(${varName})` }}
      />
      <div className="bg-card px-2.5 py-1.5">
        <p className="truncate text-[12px] font-medium">{name}</p>
        <p className="truncate font-mono text-[10px] text-muted-foreground">
          {varName}
        </p>
      </div>
    </div>
  );
}
