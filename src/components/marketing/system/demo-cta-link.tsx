import { trackAttrs } from "@/lib/analytics/events";
import { DEMO_CTA_LABEL } from "@/lib/constants/marketing-voice";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { cn } from "@/lib/utils";

/**
 * The recurring live-demo CTA (Track B system layer): renders the single-sourced
 * DEMO_CTA_LABEL, gated on DEMO_EVENT_URL — no demo event configured means no
 * link ANYWHERE (never a dead CTA). The chevron rides the learn-more-hover recipe
 * (mkt-learn, marketing.css chapter 2): it slides and its arms spread on hover.
 * `source` labels the demo_open analytics event; distinctive placements (the
 * CtaBand) pass their own, the long tail ships as "inline".
 */
export function DemoCtaLink({
  className,
  source = "inline",
}: {
  className?: string;
  source?: string;
}) {
  if (!DEMO_EVENT_URL) return null;
  return (
    <a
      href={DEMO_EVENT_URL}
      {...trackAttrs("demo_open", { source })}
      className={cn(
        "mkt-learn inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground",
        className,
      )}
    >
      {DEMO_CTA_LABEL}
      <span className="mkt-learn-chevron inline-flex" aria-hidden>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path className="mkt-learn-arm mkt-learn-arm-top" d="M6 4L10 8" />
          <path className="mkt-learn-arm mkt-learn-arm-bot" d="M10 8L6 12" />
        </svg>
      </span>
    </a>
  );
}
