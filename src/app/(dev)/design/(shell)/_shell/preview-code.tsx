"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { CopyButton } from "./copy";

/**
 * A specimen with its source: Preview and Code as two tabs, the code copyable.
 * Phase 0's plain version; the lab-library track gives every specimen one.
 */
export function PreviewCode({
  preview,
  code,
  language = "tsx",
  className,
}: {
  preview: React.ReactNode;
  code: string;
  language?: string;
  className?: string;
}) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const tabClass = (t: typeof tab) =>
    cn(
      "px-2.5 py-1 text-[12px] font-medium transition-colors",
      tab === t
        ? "text-foreground"
        : "text-muted-foreground hover:text-foreground",
    );
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-2 py-1">
        <div role="tablist" className="flex">
          <button
            role="tab"
            type="button"
            aria-selected={tab === "preview"}
            onClick={() => setTab("preview")}
            className={tabClass("preview")}
          >
            Preview
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={tab === "code"}
            onClick={() => setTab("code")}
            className={tabClass("code")}
          >
            Code
          </button>
        </div>
        {tab === "code" && <CopyButton text={code} />}
      </div>
      {tab === "preview" ? (
        <div className="p-4">{preview}</div>
      ) : (
        <pre
          className="overflow-x-auto p-4 text-[12px] leading-relaxed"
          data-language={language}
        >
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
