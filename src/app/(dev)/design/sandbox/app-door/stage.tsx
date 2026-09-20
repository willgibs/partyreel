"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { Check } from "lucide-react";

import { StyledQr } from "@/components/app/styled-qr";
import { PhoneShell } from "@/components/marketing/frames/phone-frame";
import { PageHeading } from "@/components/shared/page-heading";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { HOW_IT_WORKS } from "@/lib/constants/how-it-works";
import { marketingImage } from "@/lib/constants/marketing-media";
import { resolveQrPreset } from "@/lib/constants/qr-presets";
import { cn } from "@/lib/utils";

import { FILLING_IDS, FIRST_EVENT } from "./fixtures";
import { FlowCard, Screen, type ScreenId } from "./shells";
import { ClosingDoors } from "./welcome";

/**
 * `STAGE`: THE TOUR AS THREE REAL SCREENS OF THE PRODUCT, the copy beside
 * each one rather than inside it, ending on a peek at the wizard rather than
 * a goodbye sentence.
 *
 * ★ REAL SCREENS, NEVER THE MARKETING PICTURES. `film` a few files over
 * quotes the twelve bespoke how-it-works illustrations wholesale; this shape
 * exists to be its real contender, so every visual here is built from the
 * same primitives the app itself is (`StyledQr`, `Image` on the product's own
 * photographs, `PhoneShell`, the tile radius), composed fresh for this
 * moment rather than borrowed from the marketing chapter that already drew
 * these three beats for a different page. Two boards reaching for the same
 * picture would be the thing `PROGRAM.md` calls a finding, not a choice.
 *
 * ★ THE THREE BEATS ARE HIS OWN WORDS (the manifest's brief for `stage`): the
 * code on a table, a guest's phone, the album filling. The copy beside each
 * one is `HOW_IT_WORKS`, unchanged — the same three sentences `cards` and
 * `film` both tell, so what a reviewer is judging is the telling, not three
 * different stories wearing three different shapes.
 *
 * ★ "BESIDE", NOT ABOVE OR UNDER. At 1440 the copy and the screen share a row,
 * alternating sides the way the marketing spine does (`i % 2`), so four
 * beats in a straight line still has rhythm. In a hand there is no second
 * column: the screen becomes a band above its copy, `page=beside`'s own
 * answer to the same problem.
 */

const [CREATE, SHARE, FILL] = HOW_IT_WORKS;

/* ── the three real screens ──────────────────────────────────────────────── */

/** Beat one: the event's own code, live, the moment `create` produces. */
function LiveCodeVisual() {
  return (
    <Card className="mx-auto w-full max-w-[15.5rem]">
      <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
        <StyledQr
          value="https://partyreel.com/e/lab-preview"
          size={152}
          style={resolveQrPreset(null)}
        />
        <div>
          <p className="text-sm font-medium">{FIRST_EVENT.name}</p>
          <p className="text-xs text-muted-foreground">
            Scan to join, no app to download
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Beat two: the code in a guest's hand, which is what `share` actually
 * achieves. `PhoneShell` is the marketing frame library's generic bezel
 * (`src/components/marketing/frames/phone-frame.tsx`), never one of the
 * twelve step pictures; the tiles inside are the app's own three permitted
 * marks and its real copy ("Add photos", `floating-add-button.tsx`).
 */
function GuestPhoneVisual() {
  const picked = FILLING_IDS.slice(0, 3);
  return (
    <div className="mx-auto w-full max-w-[13.5rem]">
      <PhoneShell>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Add photos</span>
          <span className="text-[10px] text-muted-foreground">
            {FIRST_EVENT.name}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {picked.map((id, i) => (
            <span
              key={id}
              className="relative block aspect-square overflow-hidden rounded-lg"
            >
              <Image
                src={marketingImage(id).src}
                alt=""
                fill
                sizes="70px"
                className="object-cover"
              />
              {i === picked.length - 1 && (
                <span className="absolute inset-0 flex items-center justify-center bg-foreground/40">
                  <Check className="size-4 text-white" strokeWidth={3} />
                </span>
              )}
            </span>
          ))}
        </div>
      </PhoneShell>
    </div>
  );
}

/** Beat three: the host's own album, mid-evening, `fill`'s own moment. */
function AlbumFillingVisual({ screen }: { screen: ScreenId }) {
  const cols = screen === "375" ? 3 : 4;
  return (
    <div className="mx-auto w-full max-w-sm">
      <div className={cn("grid gap-1.5", cols === 3 ? "grid-cols-3" : "grid-cols-4")}>
        {FILLING_IDS.map((id, i) => (
          <span
            key={id}
            className="relative block aspect-square overflow-hidden rounded-tile"
          >
            <Image
              src={marketingImage(id).src}
              alt=""
              fill
              sizes="110px"
              className="object-cover"
            />
            {i < 2 && (
              <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-success text-white">
                <Check className="size-2.5" strokeWidth={3} />
              </span>
            )}
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground tabular-nums">
        {FILLING_IDS.length} photos so far, and counting
      </p>
    </div>
  );
}

/** One beat: the copy in its own column, the real screen in the other. */
function StageBeat({
  n,
  of,
  screen,
  reverse,
  label,
  title,
  body,
  visual,
}: {
  n: number;
  of: number;
  screen: ScreenId;
  reverse?: boolean;
  label: string;
  title: string;
  body: string;
  visual: ReactNode;
}) {
  const phone = screen === "375";
  return (
    <Screen n={n} of={of} label={label} wide>
      <div
        className={cn(
          "mx-auto flex w-full max-w-3xl flex-col gap-6",
          !phone && "flex-row items-center gap-10",
          !phone && reverse && "flex-row-reverse",
        )}
      >
        <div className={cn("flex flex-col gap-2 text-center", !phone && "flex-1 text-left")}>
          <h2 className="font-heading text-subsection">{title}</h2>
          <p className="text-muted-foreground">{body}</p>
        </div>
        <div className={cn(!phone && "flex-1")}>{visual}</div>
      </div>
    </Screen>
  );
}

/** The close: a dimmed peek at the create-event wizard, the tour's real door. */
function WizardDoorClose() {
  return (
    <FlowCard>
      <CardHeader className="space-y-1 text-center">
        <PageHeading>You&rsquo;re all set</PageHeading>
        <p className="text-muted-foreground">
          Create your first event and share the code. Guests start adding
          photos in seconds.
        </p>
      </CardHeader>
      <CardContent>
        {/* The wizard's own Details step, dimmed and unfocusable behind the
            doors below: never a second interactive form on a still, only the
            shape of the thing the primary button actually opens. */}
        <div
          aria-hidden
          className="relative overflow-hidden rounded-xl border bg-muted/40 p-4"
        >
          <p className="text-xs font-medium text-muted-foreground">
            Event name
          </p>
          <div className="mt-1.5 h-9 rounded-md border bg-background" />
          <p className="mt-3 text-xs font-medium text-muted-foreground">
            Date
          </p>
          <div className="mt-1.5 h-9 w-32 rounded-md border bg-background" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <ClosingDoors />
      </CardFooter>
    </FlowCard>
  );
}

/* ── the whole shape, screens 2 to 5 (screen 1, the name, is welcome.tsx's) ── */

export function StageSteps({ screen, of }: { screen: ScreenId; of: number }) {
  return (
    <>
      <StageBeat
        n={2}
        of={of}
        screen={screen}
        label="The code, live"
        title={CREATE.title}
        body={CREATE.body}
        visual={<LiveCodeVisual />}
      />
      <StageBeat
        n={3}
        of={of}
        screen={screen}
        reverse
        label="A guest's phone"
        title={SHARE.title}
        body={SHARE.body}
        visual={<GuestPhoneVisual />}
      />
      <StageBeat
        n={4}
        of={of}
        screen={screen}
        label="The album, filling"
        title={FILL.title}
        body={FILL.body}
        visual={<AlbumFillingVisual screen={screen} />}
      />
      <Screen n={5} of={of} label="The wizard's door">
        <WizardDoorClose />
      </Screen>
    </>
  );
}
