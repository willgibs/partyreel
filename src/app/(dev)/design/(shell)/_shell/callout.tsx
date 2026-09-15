import { cn } from "@/lib/utils";

export type CalloutKind =
  | "not-law"
  | "provisional"
  | "agent-authored"
  | "will"
  | "note";

const LABEL: Record<CalloutKind, string> = {
  "not-law": "Not law",
  provisional: "Provisional",
  "agent-authored": "Agent-authored",
  will: "Will's ruling",
  note: "Note",
};

/**
 * The authority of what follows, said once at the top of a page or a block:
 * a doctrine page is precedent, a policy is provisional, a ruling is Will's.
 * The words are the reader's cue; the tone is quiet on purpose (the law is
 * short, and a loud banner on every page would drown it).
 */
export function Callout({
  kind,
  title,
  children,
  className,
}: {
  kind: CalloutKind;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "rounded-xl border px-4 py-3 text-sm leading-relaxed",
        kind === "will"
          ? "border-foreground/30 bg-card"
          : "border-border bg-muted/40 text-muted-foreground",
        className,
      )}
    >
      <p className="text-[11px] font-semibold tracking-wider text-foreground/80 uppercase">
        {title ?? LABEL[kind]}
      </p>
      <div className="mt-1">{children}</div>
    </aside>
  );
}
