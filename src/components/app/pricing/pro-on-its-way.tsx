import { SUPPORT_EMAIL } from "@/lib/constants/site";

/**
 * ★ HER OWN WORDS WHILE HER CREDITED PRO LANDS (billing-orphans; when is `billing/pro-pending.ts`'s). Her passes
 * became Pro credit a moment before her Pro plan is written, so the Plan card above reads a pass with nothing behind
 * it: this line says what is happening and what to do if it never finishes. Server-rendered, presentation only.
 */
export function ProOnItsWay() {
  return (
    <div
      role="status"
      data-note="pro-on-its-way"
      className="space-y-1 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm"
    >
      <p className="font-medium text-foreground">
        Your Pro plan is on its way.
      </p>
      <p className="text-pretty text-muted-foreground">
        Your Event Pass is now credit toward it, so this card may still show
        your old plan for a moment. Pro usually lands within a minute: refresh
        to see it. If it still isn&rsquo;t here in an hour, email{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
        >
          {SUPPORT_EMAIL}
        </a>{" "}
        from this account and we&rsquo;ll finish it for you.
      </p>
    </div>
  );
}
