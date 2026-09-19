import { GuestBar } from "@/components/guest/guest-bar";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Navigation fallback for a public profile. The page is force-dynamic and does
 * real work before its first byte: the anon RPC, a viewer read, and a presign
 * for every cover on the grid, both halves of it. Without this file a tap on a
 * guest-list chip sat on the album with nothing moving until all of that
 * finished.
 *
 * ★ GuestBar, NOT GuestHeader, and for the same reason the 404 wears it: this
 * renders before the page below has resolved anything, and the real header is a
 * client island that would resolve a session and fetch a menu only to be thrown
 * away a moment later. The bar is the same height and the same wordmark, so the
 * swap costs no jump.
 *
 * The shape is the page's: the identity row (avatar, name, meta), a line where
 * a bio may be, and the first four cards of one 16:10 grid.
 */
export default function ProfileLoading() {
  return (
    <div className="flex min-h-full flex-1 flex-col" aria-busy>
      <GuestBar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10">
        <div className="flex flex-wrap items-center gap-5">
          <Skeleton className="size-20 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2 max-sm:basis-[calc(100%-6.25rem)]">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-52" />
          </div>
        </div>
        <Skeleton className="mt-4 h-4 w-full max-w-prose" />
        <div className="mt-10 space-y-3">
          <Skeleton className="h-3 w-16" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="aspect-[16/10] w-full rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
