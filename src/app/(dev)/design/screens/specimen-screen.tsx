import { MotionSpecimens } from "./specimens";

/**
 * Screen 5: the system specimen. Judges the SYSTEM rather than a screen: type
 * scale, the color policy stated out loud, component states, and live motion.
 */
export function SpecimenScreen({ typeLabel }: { typeLabel: string }) {
  return (
    <div className="space-y-3 py-6">
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Type */}
        <div data-dir-card className="p-5">
          <p className="text-[11px] font-medium text-muted-foreground">
            Type · {typeLabel} display, Inter body
          </p>
          <p data-dir-display className="mt-3 text-5xl leading-none">
            Aa
          </p>
          <p data-dir-display className="mt-3 text-2xl leading-snug text-balance">
            Every guest is your photographer
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Body text stays in Inter for clarity at small sizes. The display
            face carries the personality; the body carries the information.
          </p>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            CAPTION / 12px mono for counts and timestamps
          </p>
        </div>

        {/* Color policy */}
        <div data-dir-card className="p-5">
          <p className="text-[11px] font-medium text-muted-foreground">
            Color policy
          </p>
          <div className="mt-3 flex gap-2">
            {[
              ["Background", "var(--background)"],
              ["Card", "var(--card)"],
              ["Muted", "var(--muted)"],
              ["Border", "var(--border)"],
              ["Ink", "var(--foreground)"],
            ].map(([label, token]) => (
              <div key={label} className="flex-1">
                <div
                  className="h-12 rounded-[calc(var(--radius)*0.6)] border border-border"
                  style={{ background: token }}
                />
                <p className="mt-1 text-center text-[10px] text-muted-foreground">
                  {label}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed">
            No BRAND color exists: the chrome is ink and paper, and the photos
            supply the rest. STATE colors are allowed for instant meaning
            (success green, error red), as punctuation only, never a wash.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-medium"
              style={{
                background: "var(--success)",
                color: "var(--success-foreground)",
              }}
            >
              Posted to the gallery
            </span>
            <span className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
              Waiting for host approval
            </span>
            <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-medium text-destructive">
              Upload failed
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Buttons */}
        <div data-dir-card className="p-5">
          <p className="text-[11px] font-medium text-muted-foreground">
            Pressables · all carry 140ms press feedback
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <button
              data-dir-press
              className="h-10 rounded-[var(--radius-action)] bg-primary px-5 text-sm font-medium text-primary-foreground"
            >
              Start free
            </button>
            <button
              data-dir-press
              className="h-10 rounded-[var(--radius-action)] border border-border bg-card px-5 text-sm font-medium"
            >
              Save event
            </button>
            <button
              data-dir-press
              className="h-10 rounded-[var(--radius-action)] px-4 text-sm font-medium text-muted-foreground"
            >
              Just browsing
            </button>
            <button
              data-dir-press
              className="h-10 rounded-[var(--radius-action)] bg-destructive/10 px-5 text-sm font-medium text-destructive"
            >
              Delete
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2.5">
            <div className="h-10 flex-1 rounded-[calc(var(--radius)*0.8)] border border-input bg-card px-3.5 text-sm leading-10 text-muted-foreground">
              maya-and-jay
            </div>
            <div className="flex h-6 w-10 items-center rounded-full bg-foreground p-0.5">
              <div className="ml-auto size-5 rounded-full bg-background" />
            </div>
          </div>
        </div>

        {/* Skeleton / loading */}
        <div data-dir-card className="p-5">
          <p className="text-[11px] font-medium text-muted-foreground">
            Loading states
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="size-10 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/5 animate-pulse rounded-full bg-muted" />
              <div className="h-3 w-2/5 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-[calc(var(--radius)*0.5)] bg-muted"
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Skeletons mirror the gallery grid so loading already looks like the
            page it becomes.
          </p>
        </div>
      </div>

      {/* Motion, live. */}
      <div>
        <p className="mb-2 text-[11px] font-medium text-muted-foreground">
          Motion · Crisp, 200ms strong ease-out, zero bounce. Dark mode adds a
          blur-masked entrance.
        </p>
        <MotionSpecimens />
      </div>
    </div>
  );
}
