import { MARKETING_IMAGES } from "@/lib/constants/marketing-media";

/**
 * THE REAL WORDS, NEVER RESHUFFLED. Every string below is copied byte for byte
 * from the call site named beside it, because this board's brief is explicit:
 * six boards elsewhere have already decided a toast's WORDS (guest-upload,
 * host-curation, export-flow, app-pricing), and this board keeps them while it
 * asks the system around them (where, material, life, stack, action). Nothing
 * here invents a message; a preview that needs one reads it from this file.
 *
 * The two album stills are `MARKETING_IMAGES`, the one fixture every board
 * reuses (no new asset, no rights question, `feedback_no_image_rights_tracking`).
 */

/** guest-upload.tsx:77 and :84 — the guest's own send, settled or refused. */
export const GUEST_SENT = "Sent, waiting for host approval";
export const GUEST_FAILED_TITLE = "Couldn't add that photo";
export const GUEST_FAILED_DESC = "That file is too large for this event.";

/** use-review-triage.ts:139,154,157-161 — the host's bulk verdict on a queue. */
export const HOST_APPROVED = (n: number) =>
  `Approved ${n} ${n === 1 ? "photo" : "photos"}`;
export const HOST_HIDDEN = "Hidden from everyone";
export const HOST_BULK_FAILED = "Couldn't update those. Please try again.";

/** use-export-download.ts:69,83,87 — one call, minting a download. */
export const EXPORT_LOADING = "Preparing your download…";
export const EXPORT_SUCCESS = "Your download is starting.";
export const EXPORT_FAILED = "Couldn't start that download.";

/** create-event-wizard.tsx:108-111 — the one refusal that already carries a button. */
export const PRICING_REFUSAL_TITLE = (plan: string) =>
  `Event limit reached on the ${plan} plan.`;
export const PRICING_REFUSAL_DESC = "Delete an event or upgrade to add more.";
export const PRICING_REFUSAL_ACTION = "Upgrade";

/** copy-share-link.tsx:26 — the rule's own worked example (`where`'s scene): the
 *  real, unmodified `CopyShareLink` draws its own success toast inline (never
 *  read from here), so only the failure path - the one case the halving rule
 *  spares - is a fixture `CopyShareLinkRedesigned` actually reads. */
export const COPY_FAILED = "Couldn't copy. Select the link and copy it manually.";

/** host-media-grid.tsx:263 — a plain `info`, the sixth kind, no state colour. */
export const RETIRED_INFO = "Only approved photos can be added to a reel.";

/** The one event every scene shares. */
export const EVENT_NAME = "Theo's 30th";
export const HOST_PLAN = "Free";

/** Two stills for backdrop texture; the toast is the subject, not the album. */
export const SCENE_IMAGE = MARKETING_IMAGES[3]?.src ?? MARKETING_IMAGES[0].src;
export const SCENE_IMAGE_2 = MARKETING_IMAGES[7]?.src ?? MARKETING_IMAGES[1].src;
