// Layout for the guest-facing token routes (/e/[token] join, /a/[token] album).
// Mobile-first: guests arrive on a phone via a scanned QR, so the canvas is a
// single narrow column with no host chrome. The public album opts into the
// always-dark `gallery` surface itself (see globals.css --gallery tokens) so
// media is the hero. Future guest-wide state (e.g. returning-guest display name
// from localStorage, Phase 2) belongs here.
export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}
