/**
 * EVERY MAIL PARTYREEL SENDS, IN ONE SHELL (Will, `emails` r1, 2026-09-28). Each template returns a
 * `Mail`: its subject, its HTML and its plain-text twin, both drawn from the same parts, so the two
 * can never say different things. Sent at most once per state through `sendOnce()` (send.ts).
 *
 * His picks, and where each lives below:
 *  - `shell=unified`: one `composeMail()` for all ten. The four operator alerts wear the host card at
 *    the host card's width; only the foot's words differ (a host's reason, or the operator's line).
 *  - `brand=wordmark`: the wordmark heads every card, and the button wears the brand's ink rather
 *    than the rose (#e11d48) the product used nowhere else. A hosted PNG, not the SVG the site
 *    inlines: see `WORDMARK`.
 *  - `dark=light`: the mail declares light only (the meta pair and the CSS) on an explicit white
 *    card. His note: "less opportunity for error as well (such as mismatched theme styles)". The
 *    clients that invert anyway (Outlook, some Gmail builds) never invert an image, so the wordmark
 *    sits on its own white plate, and every other colour is ink, white or a grey that stays legible
 *    either way round.
 *  - `sender=tagged`: every operator subject starts "[Partyreel]"; host mail keeps the plain
 *    "Partyreel <noreply@...>" sender (EMAIL_FROM), unchanged.
 *  - `foot=commercial`, as his note refines it: no postal address on any mail (US CAN-SPAM asks for
 *    one only on marketing mail, and all ten are account or service mail); a divider, then one
 *    "You're receiving this because..." line true to that mail; and an unsubscribe on the renewal
 *    nudge alone, linking its Email preferences switch. The over-cap three keep only the reason,
 *    because they warn before files are removed and a switch there could cost a host photographs
 *    unwarned.
 *
 * Copy stays short and action-first, one clear button. Every string a person or a sweep supplies is
 * escaped on its way into HTML; the text twin carries it raw, since plain text is never parsed.
 */
import { BRAND_HEX, SITE_URL } from "@/lib/constants/site";

/** What every template returns, and all `sendOnce` sends. */
export type Mail = { subject: string; html: string; text: string };

// ── The parts ────────────────────────────────────────────────────────────────────────────────────

/** A run of words inside a paragraph: plain, emphasised, or a code identifier (the alerts'). */
type Inline = string | { strong: string } | { code: string };

type Block =
  /** A paragraph. */
  | { kind: "p"; parts: Inline[] }
  /** Labelled facts, one to a line ("Reason: ..."): the operator alerts' ledger. */
  | { kind: "fields"; rows: { label: string; value: string }[] }
  /** A labelled block of someone's own words, line breaks kept (a form's message). */
  | { kind: "message"; label: string; text: string };

type Link = { href: string; label: string };

type MailParts = {
  subject: string;
  heading: string;
  blocks: Block[];
  cta?: Link;
  /** Under the divider: why this mail came (host), or the operator's line; an optional link after. */
  foot: { line: string; link?: Link };
  /** The inbox preview. The first paragraph's words when omitted, which is the mail's first line. */
  preview?: string;
};

const p = (...parts: Inline[]): Block => ({ kind: "p", parts });
const strong = (text: string): Inline => ({ strong: text });
const code = (text: string): Inline => ({ code: text });

// ── The look ─────────────────────────────────────────────────────────────────────────────────────

/*
 * Mail cannot read the CSS tokens, so the few it wears are literals here, each named for the token it
 * mirrors (globals.css, the light register). BRAND_HEX is the ink's own home.
 */
const INK = BRAND_HEX; // --primary: text, the button, emphasis
const PAPER = "#ffffff"; // the card, and the wordmark's plate (the PNG bakes this same white)
const MAT = "#f2f2f7"; // .surface-mat's ground, around the card
const MUTED = "#57575d"; // --muted-foreground: the foot's words, 7.2:1 on the card
const RULE = "#dadadf"; // --border: the divider and the card's hairline
const FONT =
  "Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

/** The card's outer width, and its inner padding (24 on a phone, through the head's one query). */
const CARD_WIDTH = 560;
const PAD = 32;

/**
 * THE WORDMARK, HOSTED. Mail clients differ on SVG (caniemail, 2026-09-16: Outlook for Windows
 * through 2016 and Outlook for Mac 2016 draw none, Gmail rasterises it), so the head wears a PNG made
 * from the kit's own mark at 2x (`scripts/build-email-wordmark.mjs`; templates.test.ts pins the file's
 * pixels to twice this size). Its origin is the canonical site's, never a preview's: a mail outlives
 * every deployment, and each one that sends builds with the production origin. The ink is 22px, the
 * app header's own; the white plate around it adds `inset` on every side, which the head row takes
 * back so the ink, not the plate, lines up with the heading. A new mark ships as wordmark-v2.png, so
 * a mail already in an inbox keeps the mark it was sent with.
 */
export const WORDMARK = {
  src: `${SITE_URL}/email/wordmark-v1.png`,
  width: 122,
  height: 38,
  inset: 8,
  alt: "Partyreel",
} as const;

/**
 * The head's stylesheet: light only (Apple Mail and, for this exact value, Gmail's apps honour it),
 * iOS's automatic links on dates and times drawn as the text around them (every warning here names a
 * date), and a phone's narrower padding. Everything load-bearing is inline besides; a client that
 * strips this block loses only the phone padding.
 */
const HEAD_CSS = [
  ":root{color-scheme:light only;supported-color-schemes:light only}",
  "body{margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}",
  "a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important}",
  `@media (max-width:600px){.pr-ground{padding:16px 12px!important}.pr-head{padding:16px 24px 0 ${24 - WORDMARK.inset}px!important}.pr-row{padding-left:24px!important;padding-right:24px!important}.pr-foot{padding:24px!important}}`,
].join("");

/** The inbox preview's tail: invisible joiners that keep a client from pulling the body in after it. */
const PREVIEW_TAIL = "&#847;&zwnj;&nbsp;".repeat(60);

// ── Rendering ────────────────────────────────────────────────────────────────────────────────────

/** Escape text for HTML: element content and double-quoted attribute values alike. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inlineHtml(parts: Inline[]): string {
  return parts
    .map((run) => {
      if (typeof run === "string") return esc(run);
      if ("strong" in run)
        return `<strong style="font-weight:600;color:${INK};">${esc(run.strong)}</strong>`;
      return `<code style="font-family:${MONO};font-size:13px;background-color:${MAT};border-radius:4px;padding:1px 4px;">${esc(run.code)}</code>`;
    })
    .join("");
}

function inlineText(parts: Inline[]): string {
  return parts
    .map((run) =>
      typeof run === "string" ? run : "strong" in run ? run.strong : run.code,
    )
    .join("");
}

const TEXT_STYLE = `font-family:${FONT};font-size:15px;line-height:24px;color:${INK};mso-line-height-rule:exactly;`;

function blockHtml(block: Block): string {
  switch (block.kind) {
    case "p":
      return `<p style="margin:12px 0 0;${TEXT_STYLE}">${inlineHtml(block.parts)}</p>`;
    case "fields":
      return block.rows
        .map(
          (row, i) =>
            `<p style="margin:${i === 0 ? 12 : 4}px 0 0;${TEXT_STYLE}">${inlineHtml([strong(`${row.label}:`), ` ${row.value}`])}</p>`,
        )
        .join("");
    case "message":
      return [
        `<p style="margin:16px 0 0;${TEXT_STYLE}">${inlineHtml([strong(`${block.label}:`)])}</p>`,
        `<p style="margin:4px 0 0;white-space:pre-wrap;${TEXT_STYLE}">${esc(normalizeBreaks(block.text)).replace(/\n/g, "<br>")}</p>`,
      ].join("");
  }
}

function blockText(block: Block): string {
  switch (block.kind) {
    case "p":
      return inlineText(block.parts);
    case "fields":
      return block.rows.map((row) => `${row.label}: ${row.value}`).join("\n");
    case "message":
      return `${block.label}:\n${normalizeBreaks(block.text)}`;
  }
}

function normalizeBreaks(s: string): string {
  return s.replace(/\r\n?/g, "\n");
}

/**
 * The words the inbox shows beside the subject: the first paragraph (the mail's own first line), or
 * the template's own. Without it a client would open the preview on the wordmark's name.
 */
function previewOf(parts: MailParts): string {
  const first = parts.blocks.find((b) => b.kind === "p");
  if (parts.preview === undefined) {
    return (first ? blockText(first) : parts.heading)
      .replace(/\s+/g, " ")
      .trim();
  }
  // Someone's own message would otherwise ride twice in the HTML, whole; an inbox shows a line of it.
  const flat = parts.preview.replace(/\s+/g, " ").trim();
  return flat.length > 200 ? `${flat.slice(0, 199).trimEnd()}…` : flat;
}

/**
 * THE SHELL. Tables, inline styles and `bgcolor` because that is what every client draws the same;
 * one ghost table for Outlook for Windows, which knows no `max-width`. Rows, not one padded cell, so
 * the head row can take back the plate's inset on the left.
 */
function renderHtml(parts: MailParts): string {
  const head = `<tr><td class="pr-head" style="padding:${PAD - WORDMARK.inset}px ${PAD}px 0 ${PAD - WORDMARK.inset}px;"><img src="${esc(WORDMARK.src)}" width="${WORDMARK.width}" height="${WORDMARK.height}" alt="${WORDMARK.alt}" style="display:block;width:${WORDMARK.width}px;height:${WORDMARK.height}px;border:0;outline:none;text-decoration:none;font-family:${FONT};font-size:18px;font-weight:700;line-height:${WORDMARK.height}px;color:${INK};"></td></tr>`;

  const body = `<tr><td class="pr-row" style="padding:${24 - WORDMARK.inset}px ${PAD}px 0;"><h1 style="margin:0;font-family:${FONT};font-size:20px;line-height:28px;font-weight:700;letter-spacing:-0.01em;color:${INK};mso-line-height-rule:exactly;">${esc(parts.heading)}</h1>${parts.blocks.map(blockHtml).join("")}</td></tr>`;

  // The button, 40px tall on the kit's 16px corner. ★ Its ink border is invisible on its ink fill, and
  // that is the point: a client that recolours a light mail darkens the card but leaves a dark fill
  // alone, so without the border the button would sink into the card; the recolouring lightens a
  // dark border like any dark line, and the edge survives.
  const cta = parts.cta
    ? `<tr><td class="pr-row" style="padding:24px ${PAD}px 0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="${INK}" style="border-radius:16px;background-color:${INK};"><a href="${esc(parts.cta.href)}" target="_blank" style="display:inline-block;padding:9px 19px;border:1px solid ${INK};font-family:${FONT};font-size:15px;line-height:20px;font-weight:600;color:${PAPER};text-decoration:none;border-radius:16px;mso-line-height-rule:exactly;">${esc(parts.cta.label)}</a></td></tr></table></td></tr>`
    : "";

  const link = parts.foot.link
    ? ` <a href="${esc(parts.foot.link.href)}" target="_blank" style="color:${MUTED};text-decoration:underline;">${esc(parts.foot.link.label)}</a>`
    : "";
  const foot = `<tr><td class="pr-foot" style="padding:28px ${PAD}px ${PAD}px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td data-foot style="border-top:1px solid ${RULE};padding-top:16px;"><p style="margin:0;font-family:${FONT};font-size:13px;line-height:20px;color:${MUTED};mso-line-height-rule:exactly;">${esc(parts.foot.line)}${link}</p></td></tr></table></td></tr>`;

  return [
    "<!doctype html>",
    '<html lang="en" dir="ltr" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">',
    "<head>",
    '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="x-apple-disable-message-reformatting">',
    '<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">',
    '<meta name="color-scheme" content="light only">',
    '<meta name="supported-color-schemes" content="light only">',
    `<title>${esc(parts.subject)}</title>`,
    `<style>${HEAD_CSS}</style>`,
    "<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->",
    "</head>",
    `<body style="margin:0;padding:0;background-color:${MAT};" bgcolor="${MAT}">`,
    `<div aria-hidden="true" style="display:none;overflow:hidden;max-height:0;max-width:0;opacity:0;font-size:1px;line-height:1px;color:${MAT};mso-hide:all;">${esc(previewOf(parts))}${PREVIEW_TAIL}</div>`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${MAT}" style="background-color:${MAT};"><tr><td class="pr-ground" align="center" style="padding:32px 16px;">`,
    `<!--[if mso]><table role="presentation" width="${CARD_WIDTH}" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAPER}" style="max-width:${CARD_WIDTH}px;background-color:${PAPER};border:1px solid ${RULE};border-radius:8px;border-collapse:separate;">`,
    head,
    body,
    cta,
    foot,
    "</table>",
    "<!--[if mso]></td></tr></table><![endif]-->",
    "</td></tr></table>",
    "</body>",
    "</html>",
  ]
    .filter(Boolean)
    .join("\n");
}

/** The plain-text twin: the same parts in reading order, a link spelled out after its label. */
function renderText(parts: MailParts): string {
  const sections = [parts.heading, ...parts.blocks.map(blockText)];
  if (parts.cta) sections.push(`${parts.cta.label}: ${parts.cta.href}`);
  const foot = parts.foot.link
    ? `${parts.foot.line}\n${parts.foot.link.label}: ${parts.foot.link.href}`
    : parts.foot.line;
  return `${sections.join("\n\n")}\n\n---\n\n${foot}\n`;
}

/** Every template ends here: one set of parts, two renderings. */
function composeMail(parts: MailParts): Mail {
  return {
    subject: parts.subject,
    html: renderHtml(parts),
    text: renderText(parts),
  };
}

/** The tag every operator subject starts with, so one filter catches all four (`sender=tagged`). */
export const OPERATOR_TAG = "[Partyreel]";

// ── Host mail: the six lifecycle mails ───────────────────────────────────────────────────────────

export function overCapGraceStartEmail(opts: {
  capLabel: string;
  deadline: string;
  dashboardUrl: string;
}): Mail {
  return composeMail({
    subject: "Your Partyreel storage is over the limit",
    heading: "You're over your storage limit",
    blocks: [
      p(
        `Your account is now using more than your plan's ${opts.capLabel}. You have until `,
        strong(opts.deadline),
        " to upgrade or remove some media. After that, we'll automatically reduce your storage (largest files first) to fit your plan. Removed items stay recoverable for 30 days.",
      ),
    ],
    cta: { href: opts.dashboardUrl, label: "Manage storage" },
    foot: {
      line: "You're receiving this because your Partyreel account is over its storage limit.",
    },
  });
}

export function overCapReminderEmail(opts: {
  deadline: string;
  dashboardUrl: string;
}): Mail {
  return composeMail({
    subject: "Reminder: your Partyreel storage will be reduced soon",
    heading: "A few days left to resolve your storage",
    blocks: [
      p(
        "Heads up: on ",
        strong(opts.deadline),
        " we'll automatically reduce your storage to fit your plan if you're still over the limit. Upgrade or remove some media to keep everything.",
      ),
    ],
    cta: { href: opts.dashboardUrl, label: "Manage storage" },
    foot: {
      line: "You're receiving this because your Partyreel account is still over its storage limit.",
    },
  });
}

export function overCapReducedEmail(opts: {
  recoverableUntil: string;
  dashboardUrl: string;
}): Mail {
  return composeMail({
    subject: "We reduced your Partyreel storage to fit your plan",
    heading: "Your storage was reduced",
    blocks: [
      p(
        "Because your account stayed over its limit, we removed your largest files to bring it back under your plan. They stay in Deleted until ",
        strong(opts.recoverableUntil),
        ". You're over your limit, so upgrade or free up space first, then restore them from each event's Deleted section.",
      ),
    ],
    cta: { href: opts.dashboardUrl, label: "Manage storage" },
    foot: {
      line: "You're receiving this because we removed files from your Partyreel account.",
    },
  });
}

/**
 * The one mail with an unsubscribe (`foot=commercial`): it asks for a purchase, so a holder can turn
 * it off. `preferencesUrl` is the Email preferences switch that governs it, and `passes.ts` reads
 * that switch before it sends.
 */
export function renewalNudgeEmail(opts: {
  expiresOn: string;
  renewUrl: string;
  preferencesUrl: string;
}): Mail {
  return composeMail({
    subject: "Your Partyreel Event Pass expires soon",
    heading: "Renew your Event Pass",
    blocks: [
      p(
        "Your Event Pass expires on ",
        strong(opts.expiresOn),
        ". Renew to keep your event and its media online for another year. When a pass lapses, the account drops to the Free plan.",
      ),
    ],
    cta: { href: opts.renewUrl, label: "Renew Event Pass" },
    foot: {
      line: "You're receiving this because you hold a Partyreel Event Pass.",
      link: {
        href: opts.preferencesUrl,
        label: "Unsubscribe from Event Pass reminders",
      },
    },
  });
}

export function inactivityWarningEmail(opts: {
  eventName: string;
  deadline: string;
  dashboardUrl: string;
}): Mail {
  return composeMail({
    subject: "Your Partyreel event will be removed soon",
    heading: "Keep your event active",
    blocks: [
      p(
        "Your event ",
        strong(opts.eventName),
        " hasn't been used in a while. To keep free accounts tidy, we remove events after 6 months of inactivity. Yours is set for removal on ",
        strong(opts.deadline),
        ". Just sign in or open it before then to keep it.",
      ),
    ],
    cta: { href: opts.dashboardUrl, label: "Keep my event" },
    foot: {
      line: `You're receiving this because you host ${opts.eventName} on Partyreel's Free plan.`,
    },
  });
}

export function inactivityRemovedEmail(opts: {
  eventName: string;
  recoverableUntil: string;
  dashboardUrl: string;
}): Mail {
  return composeMail({
    subject: "Your Partyreel event was removed (recoverable for now)",
    heading: "Your event was removed",
    blocks: [
      p(
        "Your event ",
        strong(opts.eventName),
        " was removed after 6 months of inactivity (a free-account policy). It's still recoverable until ",
        strong(opts.recoverableUntil),
        ": restore it yourself from your dashboard's Deleted filter. After that it's permanently deleted.",
      ),
    ],
    cta: { href: opts.dashboardUrl, label: "Restore my event" },
    foot: {
      line: `You're receiving this because ${opts.eventName} was removed from your Partyreel account.`,
    },
  });
}

// ── Operator mail: the four alerts to the ops inbox ──────────────────────────────────────────────

/** A /contact submission. Sent with Reply-To = the submitter, so a reply goes straight back to them. */
export function contactFormEmail(opts: {
  name: string;
  email: string;
  subject?: string;
  message: string;
  /** The topic LABEL (contactTopicLabel), tagged into the subject for inbox scanning and filters. */
  topic?: string;
}): Mail {
  const trimmedSubject = opts.subject?.trim();
  const topicTag = opts.topic ? ` [${opts.topic}]` : "";
  return composeMail({
    subject: trimmedSubject
      ? `${OPERATOR_TAG} Contact form${topicTag}: ${trimmedSubject}`
      : `${OPERATOR_TAG} Contact form${topicTag} from ${opts.name}`,
    heading: "New contact form submission",
    blocks: [
      {
        kind: "fields",
        rows: [
          { label: "From", value: `${opts.name} <${opts.email}>` },
          ...(opts.topic ? [{ label: "Topic", value: opts.topic }] : []),
          ...(trimmedSubject
            ? [{ label: "Subject", value: trimmedSubject }]
            : []),
        ],
      },
      { kind: "message", label: "Message", text: opts.message },
    ],
    foot: {
      line: "Reply to this email to respond directly (Partyreel contact form).",
    },
    preview: opts.message,
  });
}

/**
 * The orphan-sweep circuit-breaker tripped (durability-backups.md). No button: a "go investigate"
 * page, not a click-through. Sent at most once per (reason, day) via sendOnce.
 */
export function orphanBreakerEmail(opts: {
  reason: string;
  candidates: number;
  mediaCount: number;
  objectsScanned: number;
}): Mail {
  return composeMail({
    subject: `${OPERATOR_TAG} Orphan-sweep blocked: no objects deleted (${opts.reason})`,
    heading: "Orphan-sweep circuit-breaker tripped",
    blocks: [
      p(
        "The daily purge cron's orphan sweep was about to delete an unusually large set of R2 objects, so it was blocked. ",
        strong("No objects were deleted."),
      ),
      {
        kind: "fields",
        rows: [
          { label: "Reason", value: opts.reason },
          { label: "Orphan candidates", value: String(opts.candidates) },
          {
            label: "Objects scanned this run",
            value: String(opts.objectsScanned),
          },
          { label: "Media rows in DB", value: String(opts.mediaCount) },
        ],
      },
      p(
        strong("What to check:"),
        " confirm the Supabase ",
        code("media"),
        " table is intact (not mid-restore, not a bad migration, not an RLS/query bug). If the DB is healthy and these really are orphans, run an explicit one-off purge with the breaker overridden. If not, the sweep correctly protected the bucket.",
      ),
    ],
    foot: {
      line: "Partyreel operations alert (orphan-sweep safety, durability-backups.md). Sent at most once per day per reason.",
    },
  });
}

/**
 * The backup-prune circuit-breaker tripped (durability-backups.md). No button. Sent at most once per
 * (reason, day) via sendOnce. The prune is the ONLY job that deletes from the last-resort backup, so a
 * trip means it REFUSED to run and deleted nothing.
 */
export function pruneBreakerEmail(opts: {
  reason: string;
  candidates: number;
  mediaCount: number;
  objectsScanned: number;
  mode: string;
}): Mail {
  return composeMail({
    subject: `${OPERATOR_TAG} Backup prune blocked: no objects deleted (${opts.reason})`,
    heading: "Backup-prune circuit-breaker tripped",
    blocks: [
      p(
        "The weekly deletion-aware backup prune was about to delete backup objects whose source looked gone, but the source looks pathological, so it was blocked. ",
        strong("No backup objects were deleted."),
      ),
      {
        kind: "fields",
        rows: [
          { label: "Reason", value: opts.reason },
          { label: "Prune candidates", value: String(opts.candidates) },
          {
            label: "Backup objects scanned this run",
            value: String(opts.objectsScanned),
          },
          { label: "Media rows in DB", value: String(opts.mediaCount) },
          { label: "Prune mode", value: opts.mode },
        ],
      },
      p(
        strong("What to check:"),
        " confirm the Supabase ",
        code("media"),
        " table is intact (not mid-restore, not a bad migration, not an RLS/query bug) and the primary R2 bucket is populated. The prune deletes from the last-resort backup, so it fails closed: it deleted nothing and is waiting for a healthy source.",
      ),
    ],
    foot: {
      line: "Partyreel operations alert (backup-prune safety, durability-backups.md). Sent at most once per day per reason.",
    },
  });
}

/**
 * A REPORT THAT CANNOT WAIT FOR THE MORNING (admin-triage r2, his word in chat): a child-abuse report, whether
 * its confirmed reporter's instant hide took the item down or it arrived unconfirmed and is still up. It goes to
 * the ops inbox at once, beside the portal's own count, so a false hide lasts minutes and a real one is acted on.
 * ★ IT CARRIES NOTHING OF THE REPORT'S CONTENT OR ITS REPORTER: no photo, no reason, no address, only the album's
 * name, what happened to the item and where to act, because an inbox is a place the runbook's "never forward"
 * cannot reach. No button (an operator alert's shape); the portal is the one place it is judged. Sent at most once
 * per event per ten minutes through sendOnce, so a burst is one mail and the queue says the rest.
 */
export function urgentReportEmail(opts: {
  eventName: string;
  /** The instant hide took the item down pending review. */
  hidden: boolean;
  /** The portal's Reports, on the admin host. */
  reportsUrl: string;
}): Mail {
  return composeMail({
    subject: opts.hidden
      ? `${OPERATOR_TAG} Child-abuse report: an item was hidden pending review`
      : `${OPERATOR_TAG} Child-abuse report: waiting in front of the queue`,
    heading: opts.hidden
      ? "A child-abuse report hid an item"
      : "A child-abuse report is waiting",
    blocks: [
      p(
        opts.hidden
          ? "A reporter who confirmed their email reported an item as child abuse, so it was hidden from every viewer at once. "
          : "A reporter who did not confirm an email reported an item as child abuse, so it is still up. ",
        strong(
          opts.hidden
            ? "Review it now: if the report is false, Dismiss puts the item back."
            : "Review it now: it stays up until you act.",
        ),
      ),
      {
        kind: "fields",
        rows: [
          { label: "Album", value: opts.eventName },
          { label: "Reports", value: opts.reportsUrl },
        ],
      },
      p(
        "The runbook: look only to confirm it, never to study it, and never forward or screenshot it.",
      ),
    ],
    foot: {
      line: "Partyreel operations alert (child-safety reports, trust-safety-forensics.md). Sent at most once per album per ten minutes.",
    },
  });
}

/**
 * ASK FOR PROOF (admin-triage r2, `proof=confirm`): the one mail an operator sends a reporter by hand, to the
 * address she confirmed on the form, which the report keeps only until it closes. The question is the operator's
 * own words; the button opens the page where her answer is added to the report itself (`/report/<token>`), so
 * the claim and its proof are read in one place. ★ BEHIND A SWITCH LEFT OFF (`ops_flags.report_proof_mail_enabled`,
 * seeded false): his rule holds every new product mail for the email exploration, so the ask and its record are
 * built whole and this mail waits on his yes. Never for a child-abuse report (the action refuses it).
 */
export function reportProofAskEmail(opts: {
  eventName: string;
  question: string;
  answerUrl: string;
}): Mail {
  return composeMail({
    subject: `About your report on ${opts.eventName}`,
    heading: "We need a little more to act on your report",
    blocks: [
      p(
        `You reported something in ${opts.eventName}. Before anything comes down, the person reviewing it asks:`,
      ),
      { kind: "message", label: "Their question", text: opts.question },
    ],
    cta: { href: opts.answerUrl, label: "Add to your report" },
    foot: {
      line: "You're receiving this because you confirmed this address with a report. It's deleted when the report closes, and the host is never told who reported.",
    },
  });
}

/** A /careers application. Reply-To = the applicant. */
export function applicationReceivedEmail(opts: {
  role: string;
  name: string;
  email: string;
  links?: string;
  message: string;
}): Mail {
  const links = opts.links?.trim();
  return composeMail({
    subject: `${OPERATOR_TAG} Application: ${opts.role} from ${opts.name}`,
    heading: "New job application",
    blocks: [
      {
        kind: "fields",
        rows: [
          { label: "Role", value: opts.role },
          { label: "From", value: `${opts.name} <${opts.email}>` },
          ...(links ? [{ label: "Links", value: links }] : []),
        ],
      },
      { kind: "message", label: "Message", text: opts.message },
    ],
    foot: {
      line: "Reply to this email to respond directly (Partyreel careers).",
    },
    preview: opts.message,
  });
}
