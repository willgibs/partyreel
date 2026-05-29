import { QrCode } from "lucide-react";

import { Logo } from "@/components/shared/logo";

// Guest JOIN + upload entry point — a scanned QR lands here. Phase 2 wires:
//   1. get_event_by_qr_token(token) to load the event,
//   2. create_guest(token, displayName) → issues a capability session_token,
//   3. browser → R2 multipart upload, then create_media(session_token, …).
// The guest has NO account and NO Supabase JWT — the opaque token IS the
// capability (ADR-0004). NEVER trust a client-supplied event id; always resolve
// through the token RPCs.
//
// Next 16: `params` is a Promise and MUST be awaited.
export default async function GuestJoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-5 py-16 text-center">
      <Logo />
      <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <QrCode className="size-6" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">
          You&rsquo;re invited to upload
        </h1>
        <p className="text-sm text-muted-foreground">
          Guest uploads open in the next build. You&rsquo;ll add your name and
          share photos and videos straight from your phone — no app, no account.
        </p>
      </div>
      <p className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
        event token: {token}
      </p>
    </div>
  );
}
