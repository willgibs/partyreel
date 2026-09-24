import { AlertTriangle, BookOpen, Gavel, Info, PenLine } from "lucide-react";

import { cn } from "@/lib/utils";

export type CalloutKind =
  | "not-law"
  | "provisional"
  | "agent-authored"
  | "will"
  | "landmine"
  | "note";

const LABEL: Record<CalloutKind, string> = {
  "not-law": "Not law",
  provisional: "Provisional",
  "agent-authored": "Agent-authored",
  will: "Will's ruling",
  landmine: "Landmine",
  note: "Note",
};

const ICON = {
  "not-law": BookOpen,
  provisional: Info,
  "agent-authored": PenLine,
  will: Gavel,
  landmine: AlertTriangle,
  note: Info,
} as const;

/**
 * The authority of what follows, said once at the top of a page or a block: a
 * doctrine page is precedent, a policy is provisional, a ruling is Will's, a ★
 * is a trap. The words are the reader's cue and the tone is quiet on purpose
 * (the law is short, and a loud banner on every page would drown it), so the
 * only kind that carries weight is Will's: a solid left rule, because it is
 * the one kind that binds.
 *
 * Achromatic like everything else in the chrome (bible 6): the icon and the
 * rule do the telling, never a colour.
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
  const Icon = ICON[kind];
  const strong = kind === "will" || kind === "landmine";
  return (
    <aside
      className={cn(
        "rounded-xl border px-4 py-3 text-sm leading-relaxed",
        strong
          ? "border-l-2 border-border border-l-foreground bg-card text-foreground"
          : "border-border bg-muted/40 text-muted-foreground",
        className,
      )}
    >
      <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-foreground/80 uppercase">
        <Icon className="size-3 shrink-0" aria-hidden />
        {title ?? LABEL[kind]}
      </p>
      <div className="mt-1">{children}</div>
    </aside>
  );
}
