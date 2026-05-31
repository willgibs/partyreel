import Link from "next/link";
import { QrCode } from "lucide-react";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="border-b">
      <Container className="flex flex-col items-center gap-6 py-24 text-center sm:py-32">
        <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          No app. No account. Just a QR code.
        </span>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tighter text-balance sm:text-5xl md:text-6xl">
          Every photo from your party, in one place.
        </h1>
        <p className="max-w-xl text-lg text-pretty text-muted-foreground">
          Partyreel collects the photos and videos your guests actually took —
          no more chasing group chats the morning after.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg" className="h-11 px-6 text-base">
            <Link href="/login">Start free</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-11 px-6 text-base"
          >
            <Link href="/pricing">See pricing</Link>
          </Button>
        </div>
        <HeroMosaic />
      </Container>
    </section>
  );
}

// Decorative faux-album preview — pure CSS, no real assets (we have none yet;
// real screenshots are a follow-up). aria-hidden because it carries no
// information the copy above doesn't already state.
const TILES = ["", "brand", "", "", "", "", "brand", ""] as const;

function HeroMosaic() {
  return (
    <div aria-hidden className="mt-12 w-full max-w-3xl">
      <div className="rounded-2xl border bg-card p-3 ring-1 ring-foreground/5">
        <div className="mb-3 flex items-center gap-1.5 px-1">
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <QrCode className="size-3" />
            partyreel.com/a/your-event
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {TILES.map((tile, i) => (
            <div
              key={i}
              className={cn(
                "aspect-square rounded-lg bg-muted",
                tile === "brand" && "bg-brand/15",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
