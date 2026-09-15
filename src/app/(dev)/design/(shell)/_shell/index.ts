/**
 * THE SHELL'S KIT (the Library x Lab round, 2026-09-15): what a library or lab
 * page composes. Server-safe pieces (Section, Sub, StatRow, Callout, Tag, Kbd,
 * WidePage) and client pieces (PageHeader, Pager, Ref, LabLink, CopyButton,
 * CopyLink, PreviewCode) from one import.
 *
 * The shell also owns the things a page plugs INTO rather than renders: the
 * URL state (`useLabState` / `useSetLabParam`, the param model in
 * _data/state.ts), the keyboard (`useDigitKeys`, which the desk's review
 * session registers for `1`..`9`), and Copy page's source (`useCopySource`,
 * for a page that holds the real markdown).
 */
export { Callout, type CalloutKind } from "./callout";
export { CopyButton, CopyLink, CopyPage } from "./copy";
export { Kbd } from "./kbd";
export { useDigitKeys } from "./keys";
export { useCopySource } from "./page-facts";
export { PageHeader } from "./page-header";
export { Pager } from "./pager";
export { PreviewCode } from "./preview-code";
export { Ref } from "./ref";
export { Section, Sub } from "./section";
export {
  LabLink,
  useDesignKey,
  useKeyed,
  useLabState,
  useNav,
  usePalette,
  useSearchIndex,
  useSetLabParam,
} from "./shell-context";
export { StatRow } from "./stat-row";
export { Tag } from "./tag";
export { WidePage } from "./wide";
