import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";

import { ArrivalVariants } from "../../components/arrival-variants";
import { ButtonVariants } from "../../components/button-variants";
import { HostDashboardVariants } from "../../components/host-dashboard-variants";
import { HostEventVariants } from "../../components/host-event-variants";
import { EntryVariants } from "../../components/entry-variants";
import { EventCardVariants } from "../../components/event-card-variants";
import { FormVariants } from "../../components/form-variants";
import { GalleryVariants } from "../../components/gallery-variants";
import { HeaderVariants } from "../../components/header-variants";
import { LightboxVariants } from "../../components/lightbox-variants";
import { QrCardVariants } from "../../components/qr-card-variants";
import { StateVariants } from "../../components/state-variants";
import { UploadVariants } from "../../components/upload-variants";
import { requireDesignKey, withDesignKey } from "../../gate";
import { ModeShell } from "../../mode-shell";
import { SelectionScope } from "../../selection";
import { getTouchpoint, TOUCHPOINTS, type TouchpointId } from "../../touchpoints";

const VARIANTS: Record<TouchpointId, React.ComponentType> = {
  entry: EntryVariants,
  upload: UploadVariants,
  gallery: GalleryVariants,
  header: HeaderVariants,
  buttons: ButtonVariants,
  lightbox: LightboxVariants,
  "event-card": EventCardVariants,
  forms: FormVariants,
  states: StateVariants,
  "qr-card": QrCardVariants,
  arrival: ArrivalVariants,
  "host-event": HostEventVariants,
  "host-dashboard": HostDashboardVariants,
};

// One UX touchpoint, 2-3 variants side by side, on the locked system
// (monochrome + Instrument Serif). When Will picks, the decision lands in
// touchpoints.ts and renders here as the Selected badge - the lab is the
// record, not just the showroom.
export default async function TouchpointPage({
  params,
  searchParams,
}: {
  params: Promise<{ touchpoint: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const key = await requireDesignKey(searchParams);
  const { touchpoint: slug } = await params;
  const touchpoint = getTouchpoint(slug);
  if (!touchpoint) notFound();
  const Variants = VARIANTS[touchpoint.id];

  return (
    <div>
      <nav className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-12 w-full max-w-5xl items-center gap-3 overflow-x-auto px-4">
          <Link
            href={withDesignKey("/design", key)}
            className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Index
          </Link>
          <span className="ml-auto flex items-center gap-1">
            {TOUCHPOINTS.map((t) => (
              <Link
                key={t.id}
                href={withDesignKey(`/design/c/${t.id}`, key)}
                aria-current={t.id === touchpoint.id ? "page" : undefined}
                className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
                  t.id === touchpoint.id
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {t.title}
              </Link>
            ))}
          </span>
        </div>
      </nav>

      <ModeShell fontClass="font-opt-instrument">
        <header className="mx-auto w-full max-w-5xl px-4 pt-4 pb-2">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Touchpoint {TOUCHPOINTS.findIndex((t) => t.id === touchpoint.id) + 1}{" "}
            of {TOUCHPOINTS.length}
          </p>
          <h1
            data-dir-display
            className="mt-1 text-3xl tracking-tight text-balance"
          >
            {touchpoint.title}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {touchpoint.note}. Tap Select on a variant; your pick saves in this
            browser and collects on the hub board.
          </p>
          {touchpoint.decision !== undefined && (
            <p className="mt-3 flex items-center gap-2 text-sm font-medium">
              <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-background">
                <Check className="size-3" />
              </span>
              Selected: variant {touchpoint.decision}
              {touchpoint.decisionNote && (
                <span className="font-normal text-muted-foreground">
                  · {touchpoint.decisionNote}
                </span>
              )}
            </p>
          )}
        </header>

        <div className="mx-auto w-full max-w-5xl px-4 pb-20">
          <SelectionScope id={touchpoint.id}>
            <Variants />
          </SelectionScope>
        </div>
      </ModeShell>
    </div>
  );
}
