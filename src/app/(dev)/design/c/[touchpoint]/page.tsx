import { notFound } from "next/navigation";
import { Check } from "lucide-react";

import { ArrivalVariants } from "../../components/arrival-variants";
import { ButtonVariants } from "../../components/button-variants";
import { HostDashboardVariants } from "../../components/host-dashboard-variants";
import { HostEventVariants } from "../../components/host-event-variants";
import { HostEventPageVariants } from "../../components/host-event-page-variants";
import { HostEventBuildVariants } from "../../components/host-event-build-variants";
import { GalleryActionsVariants } from "../../components/gallery-actions-variants";
import { EntryVariants } from "../../components/entry-variants";
import { EventCardVariants } from "../../components/event-card-variants";
import { FormVariants } from "../../components/form-variants";
import { GalleryVariants } from "../../components/gallery-variants";
import { HeaderVariants } from "../../components/header-variants";
import { LightboxVariants } from "../../components/lightbox-variants";
import { QrCardVariants } from "../../components/qr-card-variants";
import { StateVariants } from "../../components/state-variants";
import { UploadVariants } from "../../components/upload-variants";
import { requireDesignKey } from "../../gate";
import { ModeShell } from "../../mode-shell";
import {
  getTouchpoint,
  SURFACE_LABEL,
  type TouchpointId,
} from "../../touchpoints";

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
  "host-event-page": HostEventPageVariants,
  "host-event-build": HostEventBuildVariants,
  "gallery-actions": GalleryActionsVariants,
};

// One UX touchpoint, its 2-3 explorations side by side on the locked system.
// The interactive picking is retired (lab refresh): the shipped variant + its
// rationale render as a read-only record, so the page is the design history.
// The sidebar (lab-nav.tsx) owns navigation between touchpoints.
export default async function TouchpointPage({
  params,
  searchParams,
}: {
  params: Promise<{ touchpoint: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);
  const { touchpoint: slug } = await params;
  const touchpoint = getTouchpoint(slug);
  if (!touchpoint) notFound();
  const Variants = VARIANTS[touchpoint.id];
  const shippedName =
    touchpoint.decision !== undefined
      ? touchpoint.variants[touchpoint.decision - 1]
      : null;

  return (
    <ModeShell fontClass="font-opt-urbanist">
      <header className="mx-auto w-full max-w-5xl px-4 pt-4 pb-2">
        <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
          {SURFACE_LABEL[touchpoint.surface]} · Sandbox
        </p>
        <h1 data-dir-display className="mt-1 text-3xl tracking-tight text-balance">
          {touchpoint.title}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          {touchpoint.note}.
        </p>
        {/* The catalog record: the shipped direction (named, not a variant
            number) plus the rationale prose. Unshipped reads as exploring. */}
        <div className="mt-3.5">
          {touchpoint.decision !== undefined ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-[11px] font-medium text-background">
                <Check className="size-3" />
                Shipped
              </span>
              {shippedName && (
                <span className="text-sm font-medium">{shippedName}</span>
              )}
            </div>
          ) : (
            <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              Exploring
            </span>
          )}
          {touchpoint.decisionNote && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {touchpoint.decisionNote}
            </p>
          )}
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-4 pb-20">
        <Variants />
      </div>
    </ModeShell>
  );
}
