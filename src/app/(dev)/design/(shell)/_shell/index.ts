/**
 * THE SHELL'S KIT (the Library x Lab round, 2026-09-15): what a library or lab
 * page composes. Server-safe pieces (Section, Sub, StatRow, Callout, Tag,
 * WidePage) and client pieces (PageHeader, Pager, Ref, LabLink, CopyButton,
 * PreviewCode) from one import.
 */
export { Callout, type CalloutKind } from "./callout";
export { CopyButton, CopyPage } from "./copy";
export { PageHeader } from "./page-header";
export { Pager } from "./pager";
export { PreviewCode } from "./preview-code";
export { Ref } from "./ref";
export { Section, Sub } from "./section";
export { LabLink, useDesignKey, useKeyed, useNav } from "./shell-context";
export { StatRow } from "./stat-row";
export { Tag } from "./tag";
export { WidePage } from "./wide";
