import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PrintButton } from "@/components/app/print/print-button";
import { PrintStock } from "@/components/app/print/print-stock";
import { getEvent } from "@/lib/db/queries/events";
import { preferredEventUrl } from "@/lib/events/share-urls";
import { PRINT_STOCK, STOCK_IDS, resolveStock } from "@/lib/qr/stock";
import { getSiteUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Print" };

// The sheet carries presign-free, server-rendered codes, but the EVENT is read
// per request through RLS, so this must never be statically cached.
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<{ stock?: string }>;
};

/**
 * THE PAPER (Will, `venue=sheet`, 2026-09-21: "This is a great spark to a bigger
 * idea. We should have a full gallery of printable QR designs ready to go...
 * Would make it very easy to use quickly for events, rather than always
 * requiring the host to design the rest of the assets").
 *
 * One page, three pieces, one press. The screen half is the picker and the
 * button; the paper half is `PrintStock`, which is the only thing `@media print`
 * leaves standing (`globals.css`, the `[data-print-stock]` block).
 *
 * ★ THE PICKER IS THREE LINKS, NOT A CLIENT TOGGLE. Nine codes have to be in the
 * markup before the print dialog opens, and anything that re-renders them on the
 * client can lose that race — a code that has not painted prints as a blank
 * square, silently, on paper nobody checks until the party. A navigation cannot
 * lose it: the sheet is server-rendered for whichever piece the URL names.
 *
 * ★ THE CODE ENCODES THE PERMANENT LINK, ALWAYS. A slug can be released; a card
 * already on a table cannot be reprinted. The line a person READS underneath is
 * the pretty url when the host has claimed one, which is the same split the
 * event header's link row already ships.
 */
export default async function PrintStockPage({
  params,
  searchParams,
}: PageProps) {
  const { eventId } = await params;
  const { stock } = await searchParams;

  const event = await getEvent(eventId);
  // getEvent is RLS-scoped and filters deleted_at, so a missing, foreign or
  // deleted event resolves to null — a 404, never a hint that it exists.
  if (!event) notFound();

  const siteUrl = await getSiteUrl();
  const joinUrl = `${siteUrl}/e/${event.qr_token}`;
  // The hub's own builder, so the line printed under a code is a link that
  // opens: a slug lives at `/e/<slug>`, never at the site's root.
  const readable = preferredEventUrl(siteUrl, {
    qrToken: event.qr_token,
    customSlug: event.custom_slug,
  }).replace(/^https?:\/\//, "");
  const piece = resolveStock(stock);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div data-print-hide className="space-y-6">
        <Link
          href={`/dashboard/${event.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to {event.name}
        </Link>
        <div className="space-y-1">
          <h1 className="font-heading text-page">Get the code out there</h1>
          <p className="text-sm text-muted-foreground">
            Pick a piece, print it, put it where the guests are.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STOCK_IDS.map((id) => {
            const option = PRINT_STOCK[id];
            const selected = option.id === piece.id;
            return (
              <Link
                key={id}
                href={`/dashboard/${event.id}/print?stock=${id}`}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left transition-colors",
                  selected
                    ? "border-brand bg-muted/40"
                    : "border-border hover:border-foreground/30",
                )}
              >
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="block text-caption text-muted-foreground">
                  {option.spec} · the code at {option.codeMm} mm
                </span>
              </Link>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PrintButton stockLabel={piece.label} />
          <p className="text-sm text-muted-foreground">
            Save as PDF is a destination in the same dialog. Print at 100%, with
            no scaling, and the sheet fits Letter and A4 alike.
          </p>
        </div>
      </div>

      {/* The sheet itself, at its real size. On screen it sits on the page like
          a proof; in print it is the only thing left. */}
      <div className="mt-8 flex justify-center">
        <div className="shadow-layer ring-1 ring-black/10">
          <PrintStock
            stockId={piece.id}
            eventName={event.name}
            joinUrl={joinUrl}
            readableUrl={readable}
          />
        </div>
      </div>
    </div>
  );
}
