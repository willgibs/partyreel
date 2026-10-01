// Next 16 server instrumentation hook. register() initializes Sentry for the active
// runtime; onRequestError forwards thrown errors from route handlers, Server Components,
// and the proxy to Sentry automatically (no per-site code needed for unhandled throws).
// It is Sentry's own capture with its flush held by the request (`captureRequestError`:
// Sentry's own never holds a Node.js function on Vercel, crumbs-40).
import { captureRequestError } from "@/lib/observability/sentry";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = captureRequestError;
