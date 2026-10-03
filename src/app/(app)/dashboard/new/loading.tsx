import { RouteSkeleton } from "@/components/shared/route-skeleton";

// Create's own wait (create-wizard r2, the room): a press of New event lands in the dark room at once and
// the screen arrives in it, never the dashboard's skeleton first (the nearest wait above this route).
export default function NewEventLoading() {
  return <RouteSkeleton variant="room" />;
}
