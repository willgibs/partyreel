"use client";

import { Search, SearchX } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

import { Container } from "@/components/shared/container";
import { Button } from "@/components/ui/button";
import type { HelpSearchItem } from "@/lib/content/help";

// The help hero + an instant client-side filter. The server renders the full browse
// (popular row + category sections, icons and all) and passes it as `children`; this
// component shows that browse when the box is empty and swaps in a text-only results
// list while the user types. Because the browse arrives as already-rendered children,
// no category icons need to cross the server→client boundary. `import type` keeps the
// fs-reading help.ts loader out of this client bundle.
export function HelpSearch({
  items,
  children,
}: {
  items: HelpSearchItem[];
  children: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const q = trimmed.toLowerCase();

  const results = useMemo(() => {
    if (!q) return [];
    const terms = q.split(/\s+/);
    return items.filter((item) => {
      const haystack = [
        item.title,
        item.description,
        item.categoryTitle,
        ...item.keywords,
      ]
        .join(" ")
        .toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [q, items]);

  return (
    <>
      <section className="border-b">
        <Container className="flex flex-col items-center gap-6 py-16 text-center sm:py-20">
          <span className="text-sm font-medium text-brand">Help center</span>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tighter text-balance sm:text-5xl">
            How can we help?
          </h1>
          <p className="max-w-xl text-lg text-pretty text-muted-foreground">
            Guides for hosts and guests: setup, sharing, privacy, plans, and the
            highlight reel.
          </p>
          <div className="relative w-full max-w-xl">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search help articles…"
              aria-label="Search help articles"
              className="h-12 w-full rounded-full border bg-background pr-4 pl-12 text-base shadow-sm transition-[box-shadow,border-color] duration-150 outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>
        </Container>
      </section>

      {q ? (
        <Container className="py-12 sm:py-16">
          {results.length > 0 ? (
            <div className="mx-auto max-w-3xl">
              <p className="mb-6 text-sm text-muted-foreground">
                {`${results.length} ${
                  results.length === 1 ? "result" : "results"
                } for “${trimmed}”`}
              </p>
              <ul className="flex flex-col gap-3">
                {results.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/help/${item.slug}`}
                      className="group block rounded-xl border bg-card p-5 transition-colors duration-150 hover:border-brand/40"
                    >
                      <p className="text-xs font-medium text-brand">
                        {item.categoryTitle}
                      </p>
                      <h2 className="mt-1 font-heading text-base font-medium transition-colors duration-150 group-hover:text-brand">
                        {item.title}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
              <SearchX className="size-10 text-muted-foreground" aria-hidden />
              <p className="text-pretty text-muted-foreground">
                No articles match &ldquo;{trimmed}&rdquo;. Try different words,
                or reach out and we&rsquo;ll point you in the right direction.
              </p>
              <Button asChild>
                <Link href="/contact">Contact us</Link>
              </Button>
            </div>
          )}
        </Container>
      ) : (
        children
      )}
    </>
  );
}
