// Layout for the guest-facing token route (/e/[token] — the single event link, guest-flow.md).
// Mobile-first: guests arrive on a phone via a scanned QR, so the canvas is a single narrow
// column with no host chrome (the event page renders its own auth-aware header — see
// guest-header.tsx: logged-out → "Start for free", logged-in → account menu).
import { AppDesignIsland } from "@/components/dev/app-design-island";

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      {children}
      {/* Key-gated (server-validated ?key=), inert for every guest: a board's
          candidate block and the rounding knobs reach the guest surface too,
          so a sitting is judged on the demo album. */}
      <AppDesignIsland />
    </div>
  );
}
