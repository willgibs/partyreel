import Link from "next/link";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="border-t">
      <Container className="flex flex-col items-center gap-6 py-20 text-center sm:py-24">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Start your first event free
        </h2>
        <p className="max-w-lg text-pretty text-muted-foreground">
          Create an event, share the QR, and watch the photos roll in. Your
          guests don&rsquo;t need an app or an account, just their phones.
        </p>
        <Button asChild size="lg" className="h-11 px-6 text-base">
          <Link href="/login">Start free</Link>
        </Button>
      </Container>
    </section>
  );
}
