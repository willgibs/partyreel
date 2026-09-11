import { Eyebrow } from "@/components/marketing/system/eyebrow";

/**
 * THE FEATURE-HERO EYEBROW: the page's own label, alone (Will, 2026-09-02:
 * the "Features · The live album" breadcrumb pair "feels unbalanced"). The
 * up-link to /features lives in the nav and the footer, so the eyebrow does
 * one job. Shared on purpose so the six pages cannot drift; the `label` prop
 * stays so the call sites do not change.
 */
export function FeatureHeroEyebrow({
  label,
  ...props
}: { label: string } & React.ComponentProps<"span">) {
  return <Eyebrow {...props}>{label}</Eyebrow>;
}
