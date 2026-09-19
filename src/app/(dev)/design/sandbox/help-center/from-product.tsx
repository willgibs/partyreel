"use client";

import { LifeBuoy, TriangleAlert, User } from "lucide-react";

import { ReportDialog } from "@/components/guest/report-dialog";

import { stopLinks } from "./vocab";

/**
 * DECISION 4: FROM THE PRODUCT. Today NO guest surface links to help at all
 * (the report dialog, the guest header, the album page, the entry modal and
 * the password gate: zero hits) — the real `ReportDialog` is drawn in every
 * shape unchanged, because it is the one exit that exists today regardless
 * of what this decision adds beside it. `menu` and `contextual` add UI that
 * does not exist yet, so those additions are hand-built proposals, labelled
 * as such, rather than a screenshot of something shipped.
 */
export type ProductShape = "none" | "menu" | "contextual";

function GuestHeaderStub({ menu }: { menu?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b bg-background px-4 py-3">
      <span className="font-heading text-sm">Maya &amp; Sam&rsquo;s wedding</span>
      <div className="flex items-center gap-2">
        <ReportDialog qrToken="board-fixture" />
        {menu ? (
          <div className="relative">
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full border bg-card text-muted-foreground"
              aria-hidden
            >
              <User className="size-4" />
            </button>
            <div className="absolute top-10 right-0 z-10 w-44 rounded-xl border bg-popover p-1 text-sm shadow-lift ring-1 ring-foreground/10">
              <div className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-muted-foreground">
                <LifeBuoy className="size-4" /> Help center
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full border bg-card text-muted-foreground"
            aria-hidden
          >
            <User className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function FailedTileStub({ contextual }: { contextual?: boolean }) {
  return (
    <div className="mx-4 mt-4 flex items-center gap-3 rounded-xl border bg-card p-3">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted/60 opacity-40">
        <TriangleAlert className="size-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium text-foreground">Your connection dropped.</p>
        {contextual ? (
          <a href="#" className="text-foreground underline decoration-border underline-offset-4">
            See why uploads fail
          </a>
        ) : (
          <span className="text-muted-foreground">Tap to retry</span>
        )}
      </div>
    </div>
  );
}

export function FromProductPreview({ shape }: { shape: ProductShape }) {
  return (
    <div onClickCapture={stopLinks} className="bg-background text-foreground">
      <GuestHeaderStub menu={shape === "menu"} />
      <FailedTileStub contextual={shape === "contextual"} />
      <div className="p-4 text-sm text-muted-foreground">
        {shape === "none" && "Report is the only control that leaves this page today."}
        {shape === "menu" && "A proposed Help center row, added to the guest's own account menu."}
        {shape === "contextual" && "A proposed link riding the failed tile itself, straight to the matching fix."}
      </div>
    </div>
  );
}
