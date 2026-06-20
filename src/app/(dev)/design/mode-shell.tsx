/**
 * THE MONO MOCK SHELL: wraps a sandbox mock in the `.mono` design-language
 * tokens (the monochrome system the explorations are judged in).
 *
 * Theme (light/dark) now follows the global next-themes class via `.dark .mono`
 * (design.css) - the Workbench has ONE theme source, controlled from the sidebar
 * - so this no longer owns a mode store or a toggle. `data-dir-root` carries the
 * dark wash; `fontClass` sets the mock heading face (font-opt-urbanist).
 */
export function ModeShell({
  fontClass,
  children,
}: {
  fontClass: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-dir-root
      className={`mono ${fontClass} min-h-dvh bg-background text-foreground`}
    >
      {children}
    </div>
  );
}
