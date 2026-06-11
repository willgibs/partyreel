import { SelectButton } from "../selection";
import { PhoneShell } from "../screens/phone-shell";

/**
 * One labeled variant in a touchpoint comparison: a number, a name, the
 * one-line case for it, the Select control (writes the localStorage pick for
 * the page's SelectionScope), and the mock (phone-framed unless framed=false).
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
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold">
            <span className="mr-2 inline-flex size-5 items-center justify-center rounded-md bg-foreground font-mono text-[11px] text-background">
              {n}
            </span>
            {name}
          </p>
          <SelectButton n={n} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{rationale}</p>
      </div>
      {framed ? <PhoneShell className="max-w-[320px]">{children}</PhoneShell> : children}
    </div>
  );
}
