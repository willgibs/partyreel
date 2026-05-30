import type { ComponentProps, ReactNode } from "react";

import { Container } from "@/components/shared/container";
import { cn } from "@/lib/utils";

type SectionProps = ComponentProps<"section"> & {
  /** Optional anchor target — header/footer links jump here (e.g. "faq"). */
  id?: string;
  eyebrow?: string;
  heading?: ReactNode;
  subhead?: ReactNode;
  /** Heading block alignment. Centered reads best for marketing sections. */
  align?: "center" | "left";
  /** Extra classes for the inner Container (e.g. width clamps). */
  containerClassName?: string;
};

// Shared marketing section: consistent vertical rhythm + an optional heading
// block, so every homepage section lines up without copy-pasting the wrapper.
// `scroll-mt-20` clears the sticky h-16 header when an anchor link jumps here.
export function Section({
  id,
  eyebrow,
  heading,
  subhead,
  align = "center",
  className,
  containerClassName,
  children,
  ...props
}: SectionProps) {
  const hasHeader = eyebrow || heading || subhead;

  return (
    <section
      id={id}
      className={cn("scroll-mt-20 py-20 sm:py-24", className)}
      {...props}
    >
      <Container className={containerClassName}>
        {hasHeader && (
          <div
            className={cn(
              "flex flex-col gap-3",
              align === "center"
                ? "mx-auto max-w-2xl text-center"
                : "max-w-2xl",
            )}
          >
            {eyebrow && (
              <span className="text-sm font-medium text-brand">{eyebrow}</span>
            )}
            {heading && (
              <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                {heading}
              </h2>
            )}
            {subhead && (
              <p className="text-pretty text-muted-foreground">{subhead}</p>
            )}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
}
