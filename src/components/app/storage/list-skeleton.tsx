import { Skeleton } from "@/components/ui/skeleton";

/** The size list before its first page lands: rows of its own shape, so nothing jumps when they do. */
export function ListSkeleton() {
  return (
    <ul aria-hidden className="-mx-2 space-y-0.5">
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="flex items-center gap-3 px-2 py-2">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="size-11" />
          <span className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3 w-36" />
          </span>
        </li>
      ))}
    </ul>
  );
}
