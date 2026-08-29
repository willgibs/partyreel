import { RoleMorphDelegate } from "@/components/marketing/sections/careers/role-morph";

/**
 * Careers-scoped layout: it exists ONLY to mount the morph delegate, which has
 * to be present on both the hub (to intercept a card click) and the role page
 * (to re-name the incoming emblem when the route commits). Scoping it here
 * keeps the listener off every other marketing route. No chrome: the (cinema)
 * layout above already owns the header and footer.
 */
export default function CareersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <RoleMorphDelegate />
      {children}
    </>
  );
}
