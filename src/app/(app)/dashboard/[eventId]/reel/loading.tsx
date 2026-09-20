import { RouteSkeleton } from "@/components/shared/route-skeleton";

/**
 * The Studio's FIRST skeleton (`app-vocabulary` r1, `loading=asneeded`; the
 * ROADMAP line this closes). The route awaits `listEventMedia` + three more
 * queries before it can render either face (the pre-Create builder or the
 * Studio), the same presign-before-paint shape as the dashboard and the hub —
 * until now it simply froze the previous screen. RouteSkeleton's "studio"
 * shape is the room itself (reel-studio.tsx), not the pulse/hub's light app
 * chrome, because the real room sits outside the (app) shell entirely.
 */
export default function ReelStudioLoading() {
  return <RouteSkeleton variant="studio" />;
}
