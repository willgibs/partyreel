import { notFound } from "next/navigation";

import { JoinThenUpload } from "@/components/guest/join-then-upload";
import { Logo } from "@/components/shared/logo";
import { getEventByQrToken } from "@/lib/db/queries/guest-events";

// Event state (accepting_uploads, etc.) is read per request via the qr_token RPC.
export const dynamic = "force-dynamic";

// Guest JOIN + upload entry point — a scanned QR lands here. The opaque qr_token
// IS the capability (ADR-0004); we resolve the event through the RPC and never
// trust a client-supplied event id. Next 16: `params` is a Promise.
export default async function GuestJoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const result = await getEventByQrToken(token);
  // Missing / deleted resolves to not_found — a 404 (don't leak existence).
  if (!result.ok) notFound();
  const event = result.data;

  if (!event.accepting_uploads) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-5 py-16 text-center">
        <Logo />
        <h1 className="text-xl font-semibold tracking-tight">{event.name}</h1>
        <p className="text-sm text-muted-foreground">
          Uploads for this event are closed right now. Check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-5 pt-8 text-center">
        <Logo />
      </div>
      <JoinThenUpload event={event} qrToken={token} />
    </div>
  );
}
