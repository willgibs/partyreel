/**
 * THE GUEST ALBUM'S ONE VIEW MENU, AS ARITHMETIC (album-order; `album-columns` r2's density, take-home's Yours, and
 * customize r1's note, Will 2026-10-05: "guests should always have sort/filter available to browse the gallery as
 * they'd like, doesn't need to be overcomplicated"). Three groups behind the one View button, the host's shape
 * (`event-gallery.tsx`): Size, Sort and Filter, and nothing more.
 *
 * Pure, and exported, so every gate is a unit test away:
 *   1. SIZE SPEAKS IN PHOTOGRAPHS A ROW once the album has been laid out (`perRow`, from the width the rows were laid
 *      at), and in its plain names before (the server has no width).
 *   2. SORT IS THE HOST'S OWN CONTROL (`sortViewGroup`): Newest first or Oldest first, its value the album's order as
 *      she sees it now (the turn's, or hers). Present wherever the page hands an order down.
 *   3. FILTER OFFERS ONLY WHAT HAS SOMETHING TO SHOW: Photos and Videos where the album holds both kinds, Yours (with
 *      her count) while she owns one; no Filter group at all where All would stand alone. The same counts decide the
 *      lens itself (`lensAlbum`), so the menu and the album can never disagree.
 */
import type {
  ViewMenuDensityGroup,
  ViewMenuGroup,
} from "@/components/shared/view-menu";
import { formatCount } from "@/lib/format/count";
import {
  sortViewGroup,
  type AlbumFilter,
  type AlbumSort,
} from "@/lib/shared/album-order";
import { perRowFor, type RowStep } from "@/lib/shared/album-rows";

export function buildGuestViewGroups({
  step,
  setStep,
  boxWidth,
  sort,
  setSort,
  filter,
  setFilter,
  kinds,
  ownedCount,
}: {
  step: RowStep;
  setStep: (step: RowStep) => void;
  /** The width the rows were laid at (null before the album has measured its box). */
  boxWidth: number | null;
  /** The album's order as she sees it now. */
  sort: AlbumSort;
  /** Her choice of order; absent where no order was handed down (a standalone album), and so no Sort. */
  setSort?: (sort: AlbumSort) => void;
  /** The lens actually live (`lensAlbum`'s `filter`), never a stale intent. */
  filter: AlbumFilter;
  setFilter: (filter: AlbumFilter) => void;
  /** The WHOLE album's kinds. */
  kinds: { photos: number; videos: number };
  /** How many of the WHOLE album are hers. */
  ownedCount: number;
}): (ViewMenuGroup | ViewMenuDensityGroup)[] {
  const groups: (ViewMenuGroup | ViewMenuDensityGroup)[] = [
    {
      kind: "density",
      id: "size",
      label: "Size",
      value: step,
      onChange: setStep,
      perRow:
        boxWidth !== null ? (s: RowStep) => perRowFor(boxWidth, s) : undefined,
    },
  ];
  if (setSort) groups.push(sortViewGroup(sort, setSort));
  const options: { value: AlbumFilter; label: string }[] = [
    { value: "all", label: "All" },
  ];
  if (kinds.photos > 0 && kinds.videos > 0)
    options.push(
      { value: "photos", label: "Photos" },
      { value: "videos", label: "Videos" },
    );
  if (ownedCount > 0)
    options.push({
      value: "yours",
      label: `Yours (${formatCount(ownedCount)})`,
    });
  if (options.length > 1)
    groups.push({
      id: "filter",
      label: "Filter",
      value: filter,
      onChange: (v) => setFilter(isAlbumFilter(v) ? v : "all"),
      options,
    });
  return groups;
}

const isAlbumFilter = (v: string): v is AlbumFilter =>
  v === "all" || v === "photos" || v === "videos" || v === "yours";

/** The line over a filtered album names the lens it shows, beside its count and its one way out. */
export const LENS_WORDS: Record<Exclude<AlbumFilter, "all">, string> = {
  photos: "Showing photos",
  videos: "Showing videos",
  yours: "Showing yours",
};
