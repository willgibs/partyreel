/**
 * Plain, dependency-free transactional email templates (no react-email). Each returns
 * `{ subject, html }`. Keep copy short + action-oriented; one clear CTA. These are the
 * fast-follow lifecycle emails — sent at most once per state via sendOnce().
 */

// Escape user-controlled text (e.g. event names) before interpolating into email HTML.
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(
  heading: string,
  bodyHtml: string,
  cta?: { href: string; label: string },
) {
  const button = cta
    ? `<p style="margin:24px 0;"><a href="${cta.href}" style="background:#e11d48;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">${cta.label}</a></p>`
    : "";
  return `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:480px;margin:0 auto;color:#111;">
  <h1 style="font-size:18px;font-weight:700;">${heading}</h1>
  ${bodyHtml}
  ${button}
  <p style="color:#888;font-size:12px;margin-top:32px;">Partyreel · you're receiving this because you host an event with us.</p>
</div>`;
}

export function overCapGraceStartEmail(opts: {
  capLabel: string;
  deadline: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "Your Partyreel storage is over the limit",
    html: layout(
      "You're over your storage limit",
      `<p>Your account is now using more than your plan's ${opts.capLabel}. You have until <strong>${opts.deadline}</strong> to upgrade or remove some media. After that, we'll automatically reduce your storage (largest files first) to fit your plan. Removed items stay recoverable for 30 days.</p>`,
      { href: opts.dashboardUrl, label: "Manage storage" },
    ),
  };
}

export function overCapReminderEmail(opts: {
  deadline: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "Reminder: your Partyreel storage will be reduced soon",
    html: layout(
      "A few days left to resolve your storage",
      `<p>Heads up: on <strong>${opts.deadline}</strong> we'll automatically reduce your storage to fit your plan if you're still over the limit. Upgrade or remove some media to keep everything.</p>`,
      { href: opts.dashboardUrl, label: "Manage storage" },
    ),
  };
}

export function overCapReducedEmail(opts: {
  recoverableUntil: string;
  dashboardUrl: string;
}): {
  subject: string;
  html: string;
} {
  return {
    subject: "We reduced your Partyreel storage to fit your plan",
    html: layout(
      "Your storage was reduced",
      `<p>Because your account stayed over its limit, we removed your largest files to bring it back under your plan. They stay in Recently deleted until <strong>${opts.recoverableUntil}</strong>. You're over your limit, so upgrade or free up space first, then restore them from each event's Recently deleted section.</p>`,
      { href: opts.dashboardUrl, label: "Manage storage" },
    ),
  };
}

export function renewalNudgeEmail(opts: {
  expiresOn: string;
  renewUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "Your Partyreel Event Pass expires soon",
    html: layout(
      "Renew your Event Pass",
      `<p>Your Event Pass expires on <strong>${opts.expiresOn}</strong>. Renew to keep your event and its media online for another year. When a pass lapses, the account drops to the Free plan.</p>`,
      { href: opts.renewUrl, label: "Renew Event Pass" },
    ),
  };
}

export function inactivityWarningEmail(opts: {
  eventName: string;
  deadline: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "Your Partyreel event will be removed soon",
    html: layout(
      "Keep your event active",
      `<p>Your event <strong>${esc(opts.eventName)}</strong> hasn't been used in a while. To keep free accounts tidy, we remove events after 6 months of inactivity. Yours is set for removal on <strong>${opts.deadline}</strong>. Just sign in or open it before then to keep it.</p>`,
      { href: opts.dashboardUrl, label: "Keep my event" },
    ),
  };
}

export function inactivityRemovedEmail(opts: {
  eventName: string;
  recoverableUntil: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "Your Partyreel event was removed (recoverable for now)",
    html: layout(
      "Your event was removed",
      `<p>Your event <strong>${esc(opts.eventName)}</strong> was removed after 6 months of inactivity (a free-account policy). It's still recoverable until <strong>${opts.recoverableUntil}</strong>: restore it yourself from your dashboard's Recently deleted tab. After that it's permanently deleted.</p>`,
      { href: opts.dashboardUrl, label: "Restore my event" },
    ),
  };
}

// Internal operator notification for a /contact submission — NOT the host-facing
// `layout()` (its footer is wrong here). Send with Reply-To = the submitter so a
// reply goes straight back to them.
export function contactFormEmail(opts: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): { subject: string; html: string } {
  const trimmedSubject = opts.subject?.trim();
  return {
    subject: trimmedSubject
      ? `Contact form: ${trimmedSubject}`
      : `Contact form from ${opts.name}`,
    html: `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px;margin:0 auto;color:#111;">
  <h1 style="font-size:18px;font-weight:700;">New contact form submission</h1>
  <p style="margin:4px 0;"><strong>From:</strong> ${esc(opts.name)} &lt;${esc(opts.email)}&gt;</p>
  ${trimmedSubject ? `<p style="margin:4px 0;"><strong>Subject:</strong> ${esc(trimmedSubject)}</p>` : ""}
  <p style="margin:16px 0 4px;"><strong>Message:</strong></p>
  <p style="white-space:pre-wrap;margin:0;">${esc(opts.message)}</p>
  <p style="color:#888;font-size:12px;margin-top:24px;">Reply to this email to respond directly (Partyreel contact form).</p>
</div>`,
  };
}

// Internal operator alert — the orphan-sweep circuit-breaker tripped (ADR-0013). NOT host-facing,
// so it skips layout()'s "you host an event" footer (mirrors contactFormEmail). No CTA: this is a
// "go investigate" page, not a click-through. Sent at most once per (reason, day) via sendOnce.
export function orphanBreakerEmail(opts: {
  reason: string;
  candidates: number;
  mediaCount: number;
  objectsScanned: number;
}): { subject: string; html: string } {
  return {
    subject: `[Partyreel] Orphan-sweep blocked: no objects deleted (${opts.reason})`,
    html: `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px;margin:0 auto;color:#111;">
  <h1 style="font-size:18px;font-weight:700;">Orphan-sweep circuit-breaker tripped</h1>
  <p style="margin:8px 0;">The daily purge cron's orphan sweep was about to delete an unusually large set of R2 objects, so it was blocked. <strong>No objects were deleted.</strong></p>
  <p style="margin:4px 0;"><strong>Reason:</strong> ${esc(opts.reason)}</p>
  <p style="margin:4px 0;"><strong>Orphan candidates:</strong> ${opts.candidates}</p>
  <p style="margin:4px 0;"><strong>Objects scanned this run:</strong> ${opts.objectsScanned}</p>
  <p style="margin:4px 0;"><strong>Media rows in DB:</strong> ${opts.mediaCount}</p>
  <p style="margin:16px 0 4px;"><strong>What to check:</strong> confirm the Supabase <code>media</code> table is intact (not mid-restore, not a bad migration, not an RLS/query bug). If the DB is healthy and these really are orphans, run an explicit one-off purge with the breaker overridden. If not, the sweep correctly protected the bucket.</p>
  <p style="color:#888;font-size:12px;margin-top:24px;">Partyreel operations alert (orphan-sweep safety, ADR-0013). Sent at most once per day per reason.</p>
</div>`,
  };
}

// Internal operator notification for a /careers application. Reply-To = the applicant.
export function applicationReceivedEmail(opts: {
  role: string;
  name: string;
  email: string;
  links?: string;
  message: string;
}): { subject: string; html: string } {
  const links = opts.links?.trim();
  return {
    subject: `Application: ${opts.role} from ${opts.name}`,
    html: `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:560px;margin:0 auto;color:#111;">
  <h1 style="font-size:18px;font-weight:700;">New job application</h1>
  <p style="margin:4px 0;"><strong>Role:</strong> ${esc(opts.role)}</p>
  <p style="margin:4px 0;"><strong>From:</strong> ${esc(opts.name)} &lt;${esc(opts.email)}&gt;</p>
  ${links ? `<p style="margin:4px 0;"><strong>Links:</strong> ${esc(links)}</p>` : ""}
  <p style="margin:16px 0 4px;"><strong>Message:</strong></p>
  <p style="white-space:pre-wrap;margin:0;">${esc(opts.message)}</p>
  <p style="color:#888;font-size:12px;margin-top:24px;">Reply to this email to respond directly (Partyreel careers).</p>
</div>`,
  };
}
