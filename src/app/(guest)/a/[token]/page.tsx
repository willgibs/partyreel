import { Images } from "lucide-react";

import { Logo } from "@/components/shared/logo";

// PUBLIC album view (read-only, approved media only). Phase 2 wires
// get_public_album(share_token); that RPC returns R2 object KEYS for
// server-side presigning only — every key MUST be turned into a short-lived
// signed URL before it reaches the browser. NEVER expose raw object keys/URLs
// (ADR-0003, lib/r2). Uses the always-dark `gallery` surface so the media is
// the hero regardless of theme.
//
// Next 16: `params` is a Promise and MUST be awaited.
export default async function PublicAlbumPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-gallery text-gallery-foreground">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-5 py-16 text-center">
        <Logo />
        <div className="flex size-14 items-center justify-center rounded-full bg-white/10">
          <Images className="size-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">Shared album</h1>
          <p className="text-sm text-gallery-muted">
            The public gallery lands in the next build — approved photos and
            videos from the event will appear here.
          </p>
        </div>
        <p className="rounded-md bg-white/10 px-2 py-1 font-mono text-xs text-gallery-muted">
          album token: {token}
        </p>
      </div>
    </div>
  );
}
