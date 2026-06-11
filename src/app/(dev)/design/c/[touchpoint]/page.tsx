import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ButtonVariants } from "../../components/button-variants";
import { EntryVariants } from "../../components/entry-variants";
import { GalleryVariants } from "../../components/gallery-variants";
import { HeaderVariants } from "../../components/header-variants";
import { UploadVariants } from "../../components/upload-variants";
import { requireDesignKey, withDesignKey } from "../../gate";
import { ModeShell } from "../../mode-shell";
import { getTouchpoint, TOUCHPOINTS, type TouchpointId } from "../../touchpoints";

const VARIANTS: Record<TouchpointId, React.ComponentType> = {
  entry: EntryVariants,
  upload: UploadVariants,
  gallery: GalleryVariants,
  header: HeaderVariants,
  buttons: ButtonVariants,
};

// One UX touchpoint, 2-3 variants side by side, on the locked mono system set
// in Instrument Serif (the working type favorite, size-calibrated). The
// light/dark toggle applies here too: judge each variant in both modes.
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
            Component touchpoint · set in Instrument Serif
          </p>
          <h1
            data-dir-display
            className="mt-1 text-3xl tracking-tight text-balance"
          >
            {touchpoint.title}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {touchpoint.note}. Pick a number per touchpoint; mixing across
            touchpoints is the point.
          </p>
        </header>

        <div className="mx-auto w-full max-w-5xl px-4 pb-20">
          <Variants />
        </div>
      </ModeShell>
    </div>
  );
}
