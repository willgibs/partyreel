import { PhoneShell } from "./phone-shell";

/**
 * One labeled exploration in a touchpoint comparison: a number, a name, the
 * one-line case for it, and the mock (phone-framed unless framed=false). The
 * interactive Select control is retired (lab refresh, 2026-06-19) - variants are
 * pure reference explorations now; the shipped pick is recorded on the page.
 */
export function Variant({
  n,
  name,
  rationale,
  framed = true,
  children,
}: {
  n: number;
  name: string;
  rationale: string;
  framed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <div className="mb-3">
        <p className="text-sm font-semibold">
          <span className="mr-2 inline-flex size-5 items-center justify-center rounded-md bg-foreground font-mono text-[11px] text-background">
            {n}
          </span>
          {name}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{rationale}</p>
      </div>
      {framed ? (
        <PhoneShell className="max-w-[320px]">{children}</PhoneShell>
      ) : (
        children
      )}
    </div>
  );
}
