"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trackAttrs } from "@/lib/analytics/events";

/**
 * THE ONLY CLIENT JS ON THE PRINT PAGE: one press that opens the print dialog.
 *
 * `window.print()` and nothing else — a PDF is the same dialog's "Save as PDF"
 * destination on every desktop OS and "Share → Save to Files" on iOS, so a
 * second "Save as PDF" button would be a button that opens the identical dialog
 * and claims to do something different. The line beside it says so instead.
 */
export function PrintButton({ stockLabel }: { stockLabel: string }) {
  return (
    <Button
      type="button"
      onClick={() => window.print()}
      {...trackAttrs("cta_click", { cta: "print-stock", location: "print-page" })}
    >
      <Printer /> Print {stockLabel.toLowerCase()}
    </Button>
  );
}
