import { EventHead } from "@/components/guest/event-experience-head";
import { Logo } from "@/components/shared/logo";

/**
 * THE GUEST VIEW'S WAIT: the cover's own house light, at the cover's own height, under the guest's header, while the
 * guests' read resolves (the door, the counts, the Guests list; the album itself streams in behind its own skeleton).
 * So her hub's phone, or a new tab, shows the album's first frame at once and its photographs dissolve in over it, as
 * on a guest's own phone, never an empty white screen.
 */
export default function AsGuestLoading() {
  return (
    <div
      data-as-guest="loading"
      aria-busy="true"
      className="flex min-h-full flex-1 flex-col"
    >
      <header className="dark relative z-20 flex h-14 shrink-0 items-center border-b border-transparent px-5 text-foreground">
        <Logo />
      </header>
      <EventHead side="album" className="-mt-14">
        <span className="sr-only">Loading</span>
      </EventHead>
    </div>
  );
}
