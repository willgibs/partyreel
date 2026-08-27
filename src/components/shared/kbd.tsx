import { cn } from "@/lib/utils";

/**
 * Keyboard-key chip. data-slot="kbd" honors the contract ui/tooltip.tsx already
 * styles for (`**:data-[slot=kbd]` selectors), so a Kbd dropped inside a
 * tooltip picks up that treatment for free. Set in the UI face (Inter), not
 * mono — the R6 mono ruling: mono is for numerals/tabular alignment only.
 */
export function Kbd({
  className,
  ...props
}: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-b-2 bg-muted px-1.5 font-sans text-[11px] font-medium text-muted-foreground select-none",
        className,
      )}
      {...props}
    />
  );
}
