/**
 * The band's own voice for a line that needs a look: a tinted ground and a dot, the words in the ground's ink. One home
 * for the spend watch's card and the plan limits' (`spend-watch-card.tsx`, `limits-card.tsx`), a file of its own so
 * neither pulls the other's switches and actions in with it.
 */
export function AttentionLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 flex items-start gap-2 rounded-sm bg-warning/8 px-2 py-1 text-caption">
      <span
        aria-hidden
        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning"
      />
      <span>{children}</span>
    </p>
  );
}
