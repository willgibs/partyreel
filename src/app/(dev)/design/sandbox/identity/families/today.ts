import { BTN } from "./states";

/**
 * AS TODAY: production, untouched, with one addition the specimen needs.
 *
 * A specimen pins a state open (`data-demo`), and production writes its
 * states as Tailwind variants (`hover:bg-muted`, `focus-visible:ring-3`,
 * `active:scale-[0.97]`) that only a real cursor reaches. So this sheet is
 * those variants, copied value for value from `src/components/ui/`, onto the
 * pinned twin and nothing else: a real hover in a screen still runs
 * production's own rule.
 */
const PINNED_FOCUS = `
  border-color: var(--ring);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 50%, transparent);
`;

export const TODAY_CSS = `
${BTN}[data-variant="outline"][data-demo~="hover"],
${BTN}[data-variant="ghost"][data-demo~="hover"] {
  background-color: var(--muted);
  color: var(--foreground);
}
.dark ${BTN}[data-variant="outline"][data-demo~="hover"] {
  background-color: color-mix(in oklab, var(--input) 50%, transparent);
}
.dark ${BTN}[data-variant="ghost"][data-demo~="hover"] {
  background-color: color-mix(in oklab, var(--muted) 50%, transparent);
}
${BTN}[data-variant="secondary"][data-demo~="hover"] {
  background-color: color-mix(in oklab, var(--secondary) 80%, transparent);
}
${BTN}[data-variant="destructive"][data-demo~="hover"] {
  background-color: color-mix(in oklab, var(--destructive) 20%, transparent);
}
${BTN}[data-demo~="press"] { scale: 0.97; }
${BTN}[data-demo~="focus"],
[data-slot="input"][data-demo~="focus"],
[data-slot="select-trigger"][data-demo~="focus"],
[data-slot="toggle-group-item"][data-demo~="focus"],
[data-slot="tabs-trigger"][data-demo~="focus"],
[data-slot="switch"][data-demo~="focus"] { ${PINNED_FOCUS} }
[data-slot="toggle-group-item"][data-demo~="hover"] {
  background-color: var(--muted);
  color: var(--foreground);
}
[data-slot="tabs-trigger"][data-demo~="hover"] { color: var(--foreground); }
`;
