import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";

import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ORDERED_PLANS, tierHighlights } from "@/lib/constants/tiers";
import {
  MAX_VIDEO_BYTES,
  MAX_VIDEO_DURATION_SECONDS,
} from "@/lib/media/limits";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pricing" };

// Derived from the universal limits so the copy can never drift from what the
// uploader actually enforces (see lib/media/limits.ts).
const videoMinutes = Math.round(MAX_VIDEO_DURATION_SECONDS / 60);
const videoGb = Math.round(MAX_VIDEO_BYTES / 1024 ** 3);

export default function PricingPage() {
  return (
    <Container className="py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Simple pricing for every kind of party
        </h1>
        <p className="mt-4 text-muted-foreground">
          Start free. Upgrade when you need more events or bigger galleries.
        </p>
      </div>

      {/* Plans + every limit number are rendered from lib/constants/tiers.ts —
          the single source of truth that server-side enforcement also reads. */}
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ORDERED_PLANS.map((plan) => (
          <Card
            key={plan.tier}
            className={cn(
              "flex flex-col",
              plan.highlighted && "ring-2 ring-brand",
            )}
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{plan.name}</CardTitle>
                {plan.highlighted && <Badge>Most popular</Badge>}
              </div>
              <CardDescription>{plan.tagline}</CardDescription>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tracking-tight text-foreground">
                  {plan.priceLabel}
                </span>
                {plan.priceSuffix && (
                  <span className="text-sm text-muted-foreground">
                    {plan.priceSuffix}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-2.5 text-sm">
                {tierHighlights(plan.tier).map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-brand" />
                    <span className="text-muted-foreground">{line}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                className="w-full"
                variant={plan.highlighted ? "default" : "outline"}
              >
                <Link href="/login">{plan.ctaLabel}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">
        Every plan supports videos up to {videoMinutes} minutes and {videoGb} GB
        each. Your events stay up until you delete them — there&rsquo;s no
        expiry clock counting down on your memories.
      </p>
    </Container>
  );
}
