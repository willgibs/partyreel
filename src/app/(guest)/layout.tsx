// Layout for the guest-facing token route (/e/[token] — the single event link, ADR-0010).
// Mobile-first: guests arrive on a phone via a scanned QR, so the canvas is a single narrow
// column with no host chrome (the event page renders its own auth-aware header — see
// guest-header.tsx: logged-out → "Start for free", logged-in → account menu).
export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}
