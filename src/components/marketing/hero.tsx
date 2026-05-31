import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import { DEMO_EVENT_URL } from "@/lib/demo";

import { AlbumFrame } from "./frames";

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
        {DEMO_EVENT_URL && (
          <Link
            href={DEMO_EVENT_URL}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand transition-colors duration-150 hover:text-brand/80"
          >
            Try the live demo
            <ArrowRight className="size-4" />
          </Link>
        )}
        <AlbumFrame className="mt-12 max-w-3xl" />
      </Container>
    </section>
  );
}
