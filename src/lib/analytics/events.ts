/**
 * The marketing web-analytics taxonomy (the PURE half; the client half is ./web.ts).
 *
 * Why two files: server components need the event names + attribute builder without
 * pulling the "@vercel/analytics" runtime into server bundles, and the unit test
 * project needs a module with no env/vendor imports (lib/env.ts validates eagerly
 * and throws in the runner). Keep this file dependency-free.
 *
 * How instrumentation works: server components spread trackAttrs(...) onto the
 * clickable element; the single marketing island (components/marketing/system/
 * web-analytics.tsx) owns a delegated capture-phase click listener that turns
 * [data-track] clicks into track() calls. Client components with non-click moments
 * (a form's success branch) call track() from ./web.ts directly.
 *
 * Scope note: events only ever FIRE where that island is mounted (the (marketing)
 * layout), so shared components carrying these attributes stay silent on the app
 * surface by construction. Custom events record on Vercel Pro and up; on the
 * current Hobby plan only pageviews land, so this taxonomy ships wired-but-dormant
 * and activates at the Pro cutover (docs/systems/notifications-analytics-growth.md).
 *
 * Renaming an event later splits its history in the dashboard, so treat names as
 * append-only (events.test.ts pins them). Props: single lowercase words only (the
 * listener maps data-track-<prop> through the camelCased DOM dataset, so multiword
 * keys would round-trip wrong), and small/short values: Vercel caps custom-event
 * payloads at 2 properties on Pro (8 with the paid add-on), 255 chars each.
 */

export const WEB_EVENTS = [
  // A conversion-intent click on a "Start free" / "Log in" style CTA.
  // Props: cta (which button), location (header | hero | cta-band | footer | ...).
  "cta_click",
  // Any doorway into the demo event. Props: source (hero-ticket | footer-qr | ...).
  "demo_open",
  // The hero's sample-reel overlay was opened.
  "reel_play",
  // A Stripe checkout was initiated from marketing. Props: plan.
  "checkout_start",
  // The contact form submitted successfully (includes honeypot fake-oks; the
  // client cannot tell them apart and Vercel drops known bots platform-side).
  "contact_submit",
  // A careers application submitted successfully.
  "careers_apply",
  // An assistant deep link was followed. Props: target (chatgpt | claude).
  "assistant_click",
] as const;

export type WebEvent = (typeof WEB_EVENTS)[number];

export type WebEventProps = Record<string, string>;

/**
 * Build the data attributes that mark an element for the delegated listener.
 * Usage (server or client): <Link {...trackAttrs("cta_click", { cta: "start-free", location: "header" })} ...>
 */
export function trackAttrs(
  event: WebEvent,
  props?: WebEventProps,
): Record<string, string> {
  const attrs: Record<string, string> = { "data-track": event };
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      attrs[`data-track-${key}`] = value;
    }
  }
  return attrs;
}
