"use client";

import { ExternalLink } from "lucide-react";

import { useLabPrefs } from "@/components/lab/lab-prefs";
import { cn } from "@/lib/utils";

import {
  editorFor,
  githubFor,
  hrefFor,
  type LabRef,
  labelFor,
  parseRef,
} from "@/app/(dev)/design/_data/links";
import { LabLink } from "./shell-context";

/**
 * ONE LINK FOR EVERY REFERENCE (the Library x Lab round, 2026-09-15): a bible
 * rule, a component, a board, a record entry, a doc anchor, a proposal, a
 * track, a policy test, a source path, an external URL. Pass the string the
 * repo already writes (`docs/PROGRAM.md`,
 * `src/components/ui/button.tsx:40`, `bible 6`, `/design/lab/light`) or a
 * parsed LabRef; it lands on the lab page when one exists, else on the file
 * (in the editor when the reader has set an editor root, and on GitHub).
 * Replaces the two SourceLinks (gallery-ui, the rules page), which baked
 * process.cwd() into a vscode: URL that only worked on Will's machine.
 */
export function Ref({
  to,
  children,
  className,
  quiet,
}: {
  to: string | LabRef;
  children?: React.ReactNode;
  className?: string;
  /** Muted, for a meta line. */
  quiet?: boolean;
}) {
  const { editorRoot } = useLabPrefs();
  const ref = typeof to === "string" ? parseRef(to) : to;
  const label = children ?? labelFor(ref);
  const base = cn(
    "underline-offset-2 hover:underline",
    quiet ? "text-muted-foreground hover:text-foreground" : "",
    className,
  );

  if (ref.kind === "external") {
    return (
      <a
        href={ref.url}
        target="_blank"
        rel="noreferrer"
        className={cn(base, "inline-flex items-center gap-1")}
      >
        {label}
        <ExternalLink className="size-3 opacity-60" aria-hidden />
      </a>
    );
  }

  const href = hrefFor(ref);
  if (href) {
    return (
      <LabLink href={href} className={base}>
        {label}
      </LabLink>
    );
  }

  // A file with no page of its own: the editor when we know where the repo
  // is on this machine, and GitHub always.
  const editor = editorRoot ? editorFor(ref, editorRoot) : null;
  const gh = githubFor(ref);
  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      {editor ? (
        <a href={editor} className={cn(base, "break-all")}>
          {label}
        </a>
      ) : (
        <span className={cn("break-all", quiet && "text-muted-foreground")}>
          {label}
        </span>
      )}
      {gh && (
        <a
          href={gh}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-muted-foreground hover:underline"
        >
          gh
        </a>
      )}
    </span>
  );
}
