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
import {
  friendlyCapacity,
  planById,
  plansForTier,
} from "@/lib/constants/tiers";
import {
  MAX_VIDEO_BYTES,
  MAX_VIDEO_DURATION_SECONDS,
} from "@/lib/media/limits";
import { formatBytes } from "@/lib/utils";

export const metadata: Metadata = { title: "Pricing" };

// Derived from the universal limits so the copy can never drift from what the
// uploader actually enforces (see lib/media/limits.ts).
const videoMinutes = Math.round(MAX_VIDEO_DURATION_SECONDS / 60);
const videoGb = Math.round(MAX_VIDEO_BYTES / 1024 ** 3);

// "≈ X photos or Y min of video" from a byte cap — translated for shoppers.
function capacityLine(bytes: number): string {
  const cap = friendlyCapacity(bytes);
  return `≈ ${cap.photos.toLocaleString()} photos or ${cap.videoMinutes.toLocaleString()} min of video`;
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 size-4 shrink-0 text-brand" />
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}

export default function PricingPage() {
  // Cards + every number render from lib/constants/tiers.ts — the single source
  // of truth that server-side enforcement (tier_limits/create_media) also reads.
  const free = planById("free");
  const eventPass = planById("event_pass");
  const proPlans = plansForTier("pro");
  const proFrom = proPlans[0]; // cheapest Pro = the "from" price anchor

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

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {/* Free */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">{free.name}</CardTitle>
            <CardDescription>One event, on the house.</CardDescription>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {free.priceLabel}
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-2.5 text-sm">
              <Feature>1 event</Feature>
              <Feature>{formatBytes(free.storageBytes)} of storage</Feature>
              <Feature>{capacityLine(free.storageBytes)}</Feature>
              <Feature>No watermark</Feature>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" variant="outline">
              <Link href="/login">Start free</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Pro — the storage selector lives in one card. */}
        <Card className="flex flex-col ring-2 ring-brand">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Pro</CardTitle>
              <Badge>Most popular</Badge>
            </div>
            <CardDescription>
              For hosts who throw a lot of parties.
            </CardDescription>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight text-foreground">
                from {proFrom.priceLabel}
              </span>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-2.5 text-sm">
              <Feature>Unlimited events</Feature>
              {proPlans.map((p) => (
                <Feature key={p.id}>
                  {formatBytes(p.storageBytes)} — {p.priceLabel}
                </Feature>
              ))}
              <Feature>No watermark</Feature>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/login">Go Pro</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Event Pass */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">{eventPass.name}</CardTitle>
            <CardDescription>One big event, kept for a year.</CardDescription>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {eventPass.priceLabel}
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="space-y-2.5 text-sm">
              <Feature>1 event, kept for ~1 year</Feature>
              <Feature>
                {formatBytes(eventPass.storageBytes)} of storage
              </Feature>
              <Feature>{capacityLine(eventPass.storageBytes)}</Feature>
              <Feature>No subscription — pay once</Feature>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" variant="outline">
              <Link href="/login">Buy a pass</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">
        Every plan supports videos up to {videoMinutes} minutes and {videoGb} GB
        each. Your events stay up until you delete them — there&rsquo;s no
        expiry clock counting down on your memories.
      </p>
    </Container>
  );
}
