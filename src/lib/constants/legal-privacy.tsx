import { LegalLink } from "@/components/marketing/legal/legal-link";

import {
  LEGAL_PARTY,
  note,
  p,
  sub,
  table,
  ul,
  type LegalSection,
} from "./legal";

/**
 * THE PRIVACY POLICY (version 1.0, the legal round, 2026-09-01). Formal but
 * readable by ruling: contractual language in plain English sentences, with
 * the "In short" line carrying the friendly register. Every claim is
 * verifiable in the product; the sources are named in comments where a number
 * or a mechanism could drift. ★ Never restate a number from memory: change the
 * code, then this file (the round's red-team read every figure against its
 * source).
 *
 * ★ CI-FENCED VOCABULARY (content-policy.test.ts + no-em-dash-policy.test.ts):
 * no em-dashes; none of the fenced reply-time, authority, child-safety or
 * upload-meter words (the regexes in content-policy.test.ts are the list; this
 * comment cannot quote them because the fence reads comments too); no
 * human-reply promises.
 *
 * Section ids are the anchor contract (the rail, deep links, help articles).
 * The eight R5 ids survive; the new ones sit around them.
 */
const PRIVACY_EMAIL = (
  <LegalLink href={`mailto:${LEGAL_PARTY.privacyEmail}`}>
    {LEGAL_PARTY.privacyEmail}
  </LegalLink>
);
const CONTACT_PAGE = <LegalLink href="/contact">contact page</LegalLink>;

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    summary:
      "This policy explains what Partyreel keeps about you, why, who can see it, and what you can do about it.",
    blocks: [
      p(
        <>
          This Privacy Policy describes how {LEGAL_PARTY.entityName}, doing
          business as Partyreel (&ldquo;Partyreel&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;), collects, uses, shares and protects information
          when you use partyreel.com, the Partyreel host application, event
          links and QR codes, and the related services (together, the
          &ldquo;Service&rdquo;). It applies to hosts who create events, guests
          who view or contribute to them, visitors to our website, and anyone
          who writes to us.
        </>,
      ),
      p(
        <>
          For your account, our website, billing and our own communications,
          Partyreel decides how and why information is processed (in European
          terms, we are the controller). Inside an event, the host decides who
          may see the album, whether guests must verify an email, and what stays
          in it; we store and serve the album on the host&rsquo;s instructions
          and under this policy. Where this policy treats hosts and guests
          differently, the difference comes from that split.
        </>,
      ),
      p(
        <>
          Each section opens with a plain-language summary. The summary is there
          to help you understand the section; if the two ever seem to differ,
          the full text governs. This policy forms part of our{" "}
          <LegalLink href="/terms">Terms of Service</LegalLink>.
        </>,
      ),
    ],
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    summary:
      "An email and a display name, the events and media you add, and a small technical record around each upload and visit.",
    blocks: [
      p(
        "We collect only what the Service needs to run, and we collect it in the categories below.",
      ),
      sub("hosts", "Account information (hosts)"),
      ul(
        <>
          <strong className="text-foreground">Email address</strong>, verified
          when you sign up. It is your sign-in and the address our service email
          goes to.
        </>,
        <>
          <strong className="text-foreground">Display name</strong>, which is
          required and is shown wherever you appear: on your events, beside your
          uploads, in guest lists and on your profile if you claim one.
        </>,
        <>
          <strong className="text-foreground">Avatar</strong>, if you add one.
          Avatars are stored at a public address, so anyone who has that address
          can view the image.
        </>,
        <>
          <strong className="text-foreground">Sign-in details.</strong> A
          password, if you set one, is held only as a protected hash by our
          authentication provider and is never visible to us. If you sign in
          with Google, we receive your name, email address and Google account
          identifier, and we request nothing else from Google. One-time codes we
          email you expire after a short time.
        </>,
        <>
          <strong className="text-foreground">Billing references.</strong> When
          you buy a plan, Stripe gives us a customer reference and a
          subscription or purchase reference, your plan, and the invoice
          history. Your full card number never reaches us.
        </>,
      ),
      sub("guests", "Guest information"),
      ul(
        <>
          <strong className="text-foreground">A verified email address</strong>{" "}
          when the host of an event requires one (the default for new events).
          It is visible to that event&rsquo;s host and never to other guests.
        </>,
        <>
          <strong className="text-foreground">A session token</strong> stored in
          your browser that ties you to the events you have joined. It carries
          no name and nothing about you.
        </>,
        <>
          If you sign in as a guest, the display-name rule for hosts applies to
          you. Uploads made without signing in, where a host allows them, carry
          no name and are attributed to &ldquo;Anonymous&rdquo;.
        </>,
      ),
      sub("events", "Events and media"),
      ul(
        "The event name, date, description, cover and settings a host chooses.",
        "The photos and videos you upload, and the smaller preview image we generate from each one for browsing.",
        "Likes, saved events, follows and blocks, if you use those features, and any reports you file. Reports are stored without your identity.",
      ),
      sub("upload-records", "Upload records"),
      // ADR-0020 (A3-lite capture): the one-paragraph disclosure the ADR
      // anticipated. Fields = upload_forensics columns; retention = the
      // media-lifetime cascade (trust-safety-forensics.md).
      p(
        <>
          For every completed upload we keep a technical record: the IP address
          the upload came from, the time, the browser and device description
          your browser sends (including any client hints), a coarse location
          derived from the IP address (country and region, never a street
          address), a random identifier our site stores in your browser so we
          can recognise the same device across events, and which host or guest
          made the upload. We keep this record solely to investigate abuse,
          respond to valid legal process and meet our legal obligations. It is
          never shown to hosts or guests, it is never used to build a profile of
          you, and it is deleted with the upload it belongs to.
        </>,
      ),
      sub("technical", "Technical and usage information"),
      ul(
        <>
          The cookies and browser storage described under{" "}
          <LegalLink href="#cookies">Cookies</LegalLink>.
        </>,
        // action_attempts / unlock_attempts: HMAC-hashed IP, 24h sweep.
        "A hashed form of your IP address, kept for 24 hours, so we can limit abusive bursts of requests. The hash cannot be turned back into the address.",
        // link_stats: aggregate counters only, no identity.
        "For each event, a daily count of QR scans and album views. The count is a number; no visitor identity is stored with it.",
        // Vercel Web Analytics + Speed Insights, marketing routes only.
        "On our marketing pages only, cookieless, aggregate analytics: the page viewed, the referring site, the country and the device type. It never identifies you and does not follow you to other sites. The host application, event pages and admin pages carry no analytics at all.",
        // Sentry: errors + on-error replay, maskAllText + blockAllMedia.
        "When something breaks, an error report: the technical details of the fault and, for some errors, a masked replay of the page interaction in which all text is hidden and all images and video are blocked, so we can reproduce what went wrong. Error reports strip email addresses and signed links before they leave the browser.",
      ),
      sub("communications", "Communications"),
      ul(
        "If you write to us through the contact page: your name, email, subject, message, the topic you chose and your browser description.",
        "If you apply for a role: your name, email, links, message and browser description.",
        "If you opt in to our newsletter: your email address and when you opted in.",
      ),
      p(
        "We do not collect information for advertising, we do not track you across other websites, and we do not sell personal information. That is the whole list.",
      ),
    ],
  },
  {
    id: "how-we-use",
    title: "How we use information",
    summary:
      "To run the album, keep the service safe, bill you, and answer you. Nothing else.",
    blocks: [
      p(
        "We use the information above for the purposes in this table, and for no other purpose without telling you first. The right-hand column names the legal basis that applies where European or United Kingdom data-protection law governs.",
      ),
      table(
        [
          { header: "Purpose" },
          { header: "What it covers" },
          { header: "Legal basis" },
        ],
        [
          [
            "Providing the Service",
            "Creating events, storing and serving media, verifying guest emails, generating previews and reels, bundling downloads, showing profiles and guest lists",
            "Performing our contract with you",
          ],
          [
            "Safety and abuse prevention",
            "Rate limits, upload records, reviewing reports, legal holds and preservation",
            "Our legitimate interest in a safe service, and legal obligation where one applies",
          ],
          [
            "Billing",
            "Processing payments through Stripe, applying plan entitlements, receipts and renewal notices",
            "Contract; legal obligation for tax and accounting records",
          ],
          [
            "Service communications",
            "One-time codes, storage and deletion warnings, replies to your messages",
            "Contract; legitimate interest in keeping you informed about your account",
          ],
          [
            "Marketing email",
            "The newsletter, only if you opted in",
            "Consent, which you can withdraw at any time",
          ],
          [
            "Improving the Service",
            "Aggregate analytics and error reports",
            "Legitimate interest in understanding and fixing the Service",
          ],
          [
            "Legal compliance",
            "Responding to valid requests, keeping required records, protecting rights",
            "Legal obligation; legitimate interest",
          ],
        ],
      ),
      p(
        "We do not use your media or your information for automated decisions that have legal or similarly significant effects on you, and we do not use your content to train artificial-intelligence models.",
      ),
    ],
  },
  {
    id: "metadata",
    title: "Photo metadata",
    summary:
      "For the common photo and video formats, location data is removed on your phone before upload. A few formats are stored exactly as sent.",
    blocks: [
      // strip-metadata.ts: lossless excision for JPEG/PNG/WebP/MP4/MOV;
      // HEIC/HEIF/AVIF/WebM fail OPEN (uploads-and-r2.md). The old draft
      // claimed the strip unconditionally; this is the corrected claim.
      p(
        "Photos and videos often carry embedded metadata, including the GPS location where they were taken. Before a JPEG, PNG or WebP image, or an MP4 or MOV video, leaves your device, our uploader removes that metadata in your browser, without re-encoding the file. The picture arrives; where it was taken does not, and our servers never see the removed data.",
      ),
      p(
        "This removal is not available for every format. HEIC, HEIF and AVIF images and WebM videos are stored exactly as your device sends them, and any metadata inside them stays with the file. If that matters to you, convert to JPEG or MP4 before uploading (many phones offer a most-compatible format setting), or ask the host to remove the item. The preview images we generate never carry location data, whatever the original format.",
      ),
    ],
  },
  {
    id: "who-can-see-what",
    title: "Who can see what",
    summary:
      "An album opens exactly as wide as its host chooses, and never to search engines.",
    blocks: [
      // ADR-0007 visibility; ADR-0004 capability links; accounts default ON.
      p(
        "Every event has a visibility setting chosen by its host. An open event can be viewed by anyone who has its link or QR code. A password-protected event shows only its name and item count until the password is entered. A private event shows a locked screen to everyone but the host. Hosts may also require a verified email before a guest can see the full album or upload, which is the default for new events.",
      ),
      p(
        "Event links are excluded from search engines by our site settings and by instructions on every event page, and media files are never served from public addresses: the album hands out short-lived signed links as you browse, and a guest's access reaches only the event they joined.",
      ),
      p(
        "Inside an album, your uploads are attributed to your display name, or to Anonymous. The host of an event can see the email address of each signed-in uploader; other guests cannot. Anyone who can see the album can download items from it, download the whole album, and watch a highlight reel the host publishes.",
      ),
      // ADR-0019: host-controlled guest list, no per-guest opt-in; the escape
      // hatches are the ones the ADR names.
      p(
        "Hosts can turn on a guest list for an event. When it is on, every signed-in uploader is listed by display name to everyone who can see the album. There is no per-guest opt-in, because uploads are already attributed by name on the same page. If you would rather not appear, upload without signing in where the host allows it, or do not upload to that event. You can also hide any event from your own public profile.",
      ),
      // profiles-social.md: public by existence, indexable, no emails, no
      // follower counts; blocks filtered server-side.
      p(
        "If you claim a public profile, it is visible to anyone at its address, may be indexed by search engines, and lists the events you host and choose to show, and the open events you have contributed to where their hosts show a guest list and you have not hidden them. Profiles never show your email address or your follower counts. Blocking a person removes each of you from the other's social surfaces.",
      ),
    ],
  },
  {
    id: "sharing",
    title: "How we share information",
    summary:
      "Only with the providers that run the service, when the law requires it, or to keep people safe. We never sell it.",
    blocks: [
      p(
        "We do not sell personal information, we do not share it with advertising networks, and we work with no data brokers. We share information only in the cases below.",
      ),
      sub("providers", "Service providers"),
      p(
        "These providers process information on our behalf, under contracts that restrict their use of it to providing their service to us.",
      ),
      // STATUS.md infrastructure + supabase/config.toml (us-east-1) + R2
      // ENAM/WNAM + PROGRAM.md shared services.
      table(
        [
          { header: "Provider" },
          { header: "What it does for us" },
          { header: "Where" },
        ],
        [
          [
            "Supabase",
            "Database, authentication, sign-in email delivery, avatar storage",
            "United States (East)",
          ],
          [
            "Cloudflare",
            "Media storage and backups, album download bundling, network security",
            "United States (North American regions)",
          ],
          [
            "Vercel",
            "Hosting, and cookieless analytics on our marketing pages",
            "United States",
          ],
          [
            "Stripe",
            "Payments, invoices and the billing portal. Stripe handles card details under its own privacy policy",
            "United States",
          ],
          ["Resend", "Delivering our email", "United States"],
          ["Sentry", "Error reports and masked replays", "United States"],
          ["Google", "Google sign-in, if you choose it", "United States"],
          [
            "GitHub",
            "Running our nightly database backup job (the backup itself is stored with Cloudflare)",
            "United States",
          ],
        ],
      ),
      sub("legal", "Legal reasons and safety"),
      p(
        "We disclose information when we believe in good faith that the law requires it, including in response to a subpoena, court order or other valid legal process from public authorities; to enforce our Terms; to investigate abuse or fraud; to protect the rights, property or safety of Partyreel, our users or others; or to meet the reporting duties United States law places on us for content that sexually exploits minors.",
      ),
      sub("transfers", "Business transfers"),
      p(
        "If Partyreel is involved in a merger, acquisition, financing or sale of all or part of its business, information may be transferred as part of that transaction. This policy will continue to apply to your information, and we will tell you before it becomes subject to a different one.",
      ),
      sub("people", "The people you share with"),
      p(
        "Hosts see the guest information described above, and everyone with access to an album sees what is in it. What a host or another guest does with an album they can download is their responsibility, not something this policy can control.",
      ),
    ],
  },
  {
    id: "cookies",
    title: "Cookies and browser storage",
    summary:
      "Two cookies, both essential. No advertising cookies, so no cookie banner.",
    blocks: [
      p(
        "We use cookies and similar browser storage only to run the Service. We set no advertising or cross-site tracking cookies, which is why you see no cookie banner.",
      ),
      // @supabase/ssr auth cookies (host-only, no .partyreel.com domain);
      // pr_unlock_<eventId>, 12h TTL (unlock-token.ts).
      table(
        [
          { header: "Cookie" },
          { header: "Purpose" },
          { header: "Lasts", numeric: true },
        ],
        [
          [
            "Sign-in session",
            "Keeps you signed in as a host or a verified guest. Set only for partyreel.com",
            "While signed in",
          ],
          [
            "Album unlock",
            "Remembers that you entered a password-protected event's password",
            "12 hours",
          ],
        ],
      ),
      // localStorage inventory: pr_session_*, pr_device_id, theme, pr_welcome_*,
      // pr_save_prompt_*, pr_pending_*, pr-no-track.
      p(
        "Your browser's local storage also holds a few values set by our pages: the session token for each event you joined as a guest, the device identifier described under upload records, your theme choice, small flags such as whether you have seen an event's welcome screen, and an analytics opt-out flag. These are not cookies and are never sent to other sites; clearing your site data for partyreel.com removes them.",
      ),
      p(
        <>
          Our marketing-page analytics use no cookies and no persistent
          identifiers. If you still prefer not to be counted, set the key{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground">
            pr-no-track
          </code>{" "}
          to any value in your browser&rsquo;s local storage for partyreel.com,
          and our pages will send nothing to the analytics provider.
        </>,
      ),
    ],
  },
  {
    id: "where-media-lives",
    title: "Where your media lives",
    summary:
      "In the United States, in two regions, with a write-once backup and a daily database backup.",
    blocks: [
      // durability-backups.md: ENAM primary, WNAM replica within seconds,
      // Bucket-Locked backup >= 35 days, daily reconcile, nightly pg_dump.
      p(
        <>
          Media is stored with Cloudflare in the eastern United States and
          copied within seconds to a second location in the western United
          States. A separate backup copy is kept in write-once storage for at
          least 35 days, a daily job reconciles storage against our database,
          and the database itself is backed up off-site every day. None of this
          is marketing garnish: it is how the storage runs, so that a
          once-in-a-lifetime album survives our bad day too. The{" "}
          <LegalLink href="/features/privacy">privacy feature page</LegalLink>{" "}
          describes it in more detail.
        </>,
      ),
      sub("international", "International transfers"),
      p(
        "Partyreel operates from the United States and its providers store information there. If you use the Service from outside the United States, including from the European Economic Area, the United Kingdom or Switzerland, your information is transferred to and processed in the United States, where privacy law may differ from that of your country. Where such law requires it, we rely on recognised safeguards for those transfers, including the standard contractual clauses in our providers' data-processing terms and, where a provider is certified, the EU-U.S. Data Privacy Framework.",
      ),
    ],
  },
  {
    id: "retention-and-deletion",
    title: "Retention and deletion",
    summary:
      "Albums stay until deleted. Deletion is real, with a 30-day safety net, and every other record has a clock.",
    blocks: [
      p(
        "There is no expiry clock on an album: events stay up until their host takes them down, or until one of the lifecycle rules below applies. We keep other information only as long as the purpose it was collected for requires. This table sets out the clocks.",
      ),
      // Sources: recently-deleted.ts (30d, budget eviction), lifecycle-
      // recovery.md (45d grace, largest-first), inactivity.ts (180d, 14d
      // warn), passes.ts (365d), upload_forensics cascade, the 24h sweeps,
      // trust-safety-forensics.md (1-year preservation), durability-backups.md
      // (prune in dry-run => backup copies persist).
      table(
        [{ header: "Information" }, { header: "Kept for" }],
        [
          [
            "Events and media",
            "Until the host deletes them, or a lifecycle rule below applies",
          ],
          [
            "Deleted media and events (the recovery bin)",
            "30 days, then permanently deleted. Items can leave the bin sooner when the bin holds more than the account's storage allowance, oldest first",
          ],
          [
            "Media on a lapsed paid plan that is over its storage cap",
            "A 45-day grace period, after which the largest items are removed, largest first, until the account is within its cap. Removed items pass through the recovery bin",
          ],
          [
            "Events on free accounts with no activity",
            "Removed after about 6 months without activity, with an email warning 14 days before, then the recovery bin",
          ],
          [
            "Event Pass events",
            "A pass covers about one year from purchase; when it lapses, the free-account rules apply",
          ],
          ["Upload records", "As long as the upload they describe"],
          ["Rate-limiting records (hashed IP addresses)", "24 hours"],
          [
            "Items under a legal hold",
            "For the duration of the hold. Preserved evidence is kept for up to one year, or longer where the law requires",
          ],
          [
            "Backups",
            "Backup copies are removed on a delayed schedule after the primary copy is deleted. Until our automated backup clean-up is fully enabled, a backup copy may persist beyond the 30-day window. Backups are never restored into an album",
          ],
          ["Account information", "Until you delete your account"],
          ["Billing records", "As long as tax and accounting law requires"],
          [
            "Support messages, job applications and newsletter signups",
            "Until you ask us to delete them, or they are no longer needed",
          ],
        ],
      ),
      p(
        "When something is permanently deleted, it is removed from primary storage first and then from our database. An upload that a signed-in guest removes from someone else's event cannot be restored by that event's host.",
      ),
    ],
  },
  {
    id: "your-choices",
    title: "Your choices",
    summary: "Download everything, delete what is yours, leave whenever.",
    blocks: [
      ul(
        <>
          <strong className="text-foreground">Download.</strong> Everything you
          uploaded comes back out at the quality it went in, one item at a time
          or the whole album at once.
        </>,
        // remove_my_upload: dashboard Uploads tab; anonymous uploaders ask the host.
        <>
          <strong className="text-foreground">Delete your uploads.</strong> If
          you signed in, you can delete your own uploads from the Uploads tab of
          your dashboard, in any event, at any time. If you uploaded without
          signing in, ask the host, who can remove the item instantly.
        </>,
        <>
          <strong className="text-foreground">Delete your events.</strong> Hosts
          can delete any item or any whole event. Deleted items sit in the
          recovery bin for 30 days, where they can be restored or purged sooner.
        </>,
        <>
          <strong className="text-foreground">Stay out of view.</strong> Hide
          any event from your public profile, and stay off an event&rsquo;s
          guest list by not uploading to it while signed in.
        </>,
        // your-data-and-deleting-your-account.mdx: support-handled; self-serve
        // deletion is a ROADMAP item.
        <>
          <strong className="text-foreground">Delete your account.</strong> For
          now, account deletion is handled through support: write to us from
          the {CONTACT_PAGE} using the email on your account, and we will delete
          it and confirm. Events you host are deleted with the account; your
          uploads to other people&rsquo;s events stay in their albums unless you
          delete them first. A self-serve deletion control is planned. Details:{" "}
          <LegalLink href="/help/your-data-and-deleting-your-account">
            your data and deleting your account
          </LegalLink>
          .
        </>,
        <>
          <strong className="text-foreground">Marketing email.</strong> The
          newsletter is opt-in. To stop receiving it, write to {PRIVACY_EMAIL}{" "}
          and we will remove you within 30 days. Service emails about your
          account (sign-in codes, storage and deletion warnings) continue while
          you have an account, because the Service cannot run safely without
          them.
        </>,
        <>
          <strong className="text-foreground">Analytics.</strong> The opt-out
          is described under <LegalLink href="#cookies">Cookies</LegalLink>.
        </>,
        <>
          <strong className="text-foreground">Google.</strong> You can remove
          Partyreel from your Google account&rsquo;s connected apps at any time;
          your Partyreel account continues with email sign-in.
        </>,
      ),
    ],
  },
  {
    id: "your-rights",
    title: "Your rights",
    summary:
      "Wherever you live, you can ask to see, correct, export or delete your information. Here is how.",
    blocks: [
      p(
        <>
          You can exercise any of the rights below by writing to {PRIVACY_EMAIL}{" "}
          or through the {CONTACT_PAGE}. We will verify that the request comes
          from you, usually by asking you to write from the email on your
          account, and respond within 30 days or tell you why we need longer.
          Exercising your rights never costs you anything and never changes how
          we treat you.
        </>,
      ),
      sub("eea", "European Economic Area, United Kingdom and Switzerland"),
      p(
        "If you are in the EEA, the UK or Switzerland, you have the right to access the personal data we hold about you, to have it corrected or deleted, to restrict or object to its processing (including any processing based on our legitimate interests), to receive it in a portable format, and to withdraw consent at any time where consent is the basis. You also have the right to lodge a complaint with your local supervisory authority. Providing your information is never a statutory requirement; it is what the Service needs in order to run.",
      ),
      sub("california", "California"),
      p(
        "If you are a California resident, the California Consumer Privacy Act gives you the right to know what personal information we collect, use and disclose (this policy is that notice), to delete it, to correct it, and to limit the use of sensitive personal information. We do not sell personal information and we do not share it for cross-context behavioural advertising, and we have not done either in the preceding 12 months, so there is nothing to opt out of.",
      ),
      p(
        "In the Act's categories, we collect: identifiers (email address, display name, IP address, device identifier); commercial information (plan and purchase history); internet activity (album views and upload records); coarse geolocation derived from IP address; and the content you upload, including any images of people in it. We use sensitive personal information (account credentials and the content of your messages to us) only to provide the Service. We disclose these categories to the service providers listed under How we share information, for the purposes listed there. We will not discriminate against you for exercising your rights, and an authorised agent may make a request on your behalf if we can verify their authority.",
      ),
      sub("other-states", "Other United States states"),
      p(
        "Residents of other states with comprehensive privacy laws (including Colorado, Connecticut, Virginia, Texas and Oregon) have similar rights to access, correct, delete and export personal information, and to opt out of targeted advertising, sale and profiling. We do none of those three. If we decline a request, you may appeal by replying to our response, and we will explain the outcome of the appeal.",
      ),
    ],
  },
  {
    id: "children",
    title: "Children",
    summary:
      "Hosts must be 18 or older. Guests must be at least 13. We do not knowingly collect information from younger children.",
    blocks: [
      p(
        <>
          Creating a host account requires you to be at least 18 years old.
          Contributing to an event as a guest requires you to be at least 13, or
          older where the law of your country sets a higher age for consenting
          to online services (16 in much of the European Union). We do not
          knowingly collect personal information from children under 13. If you
          believe a child under 13 has created an account or uploaded to an
          event, write to {PRIVACY_EMAIL} and we will delete the information
          promptly.
        </>,
      ),
      p(
        "Photos of children appear at family events. A host who collects and shares such photos is responsible for having permission to do so, and a parent or guardian who wants an image of their child removed can report it from the album or write to us.",
      ),
    ],
  },
  {
    id: "security",
    title: "Security",
    summary:
      "Encrypted in transit, served only through signed links, locked down at the database. No system is perfect, and we will tell you if something goes wrong.",
    blocks: [
      p(
        "We protect information with measures appropriate to its sensitivity: encryption in transit for every connection; media served only through short-lived signed links, never public addresses; database access enforced row by row, so a host can reach only their own events and a guest only theirs; upload and moderation actions validated on our servers rather than trusted from the browser; multi-factor authentication for operator access; and providers chosen for their own security programmes. Location metadata is removed before upload for the common formats, so it is never at risk on our side.",
      ),
      p(
        "No method of transmission or storage is completely secure, so we cannot guarantee absolute security. If a breach affects your personal information, we will notify you and the relevant authorities as applicable law requires, without undue delay.",
      ),
    ],
  },
  {
    id: "reports-and-safety",
    title: "Reports and safety",
    summary:
      "Anyone can report anything in an album. Every report is reviewed before anything comes down, and some material must, by law, be preserved and reported.",
    blocks: [
      // reports: anonymous, insert-only, never auto-hide; admin removals not
      // host-reversible (removed_by_admin).
      p(
        "Anyone who can see an album can report it, or an item in it. Reports are stored without the reporter's identity, and filing one never removes content by itself. Every report is reviewed, and content is removed when it breaches our Terms. Hosts can remove anything from their own album instantly, and removals made by our operators cannot be undone by the host.",
      ),
      // ADR-0020 legal hold + preservation prefix; REPORT Act 1-year clock.
      p(
        "When an investigation or a legal obligation requires it, we may place an item under a legal hold, which keeps it out of every deletion path, and preserve a copy of the item together with its upload record in segregated storage. We keep it for as long as the matter requires. For content that sexually exploits minors, we preserve it for as long as United States law requires and report it to the authority that law designates.",
      ),
    ],
  },
  {
    id: "changes-and-contact",
    title: "Changes and contact",
    summary:
      "Updates are posted here with a new version and date. Questions get answered.",
    blocks: [
      p(
        "We may update this policy as the Service changes. The version number and date at the top tell you which version you are reading. For material changes we will give notice before the change takes effect, in the app or by email to the address on your account, and your continued use of the Service after that date means the updated policy applies to you. Earlier versions are available on request.",
      ),
      p(
        <>
          Questions, requests and complaints about privacy go to {PRIVACY_EMAIL}{" "}
          or through the {CONTACT_PAGE}.
        </>,
      ),
      note(
        <>
          <strong>Postal address:</strong> {LEGAL_PARTY.entityName},{" "}
          {LEGAL_PARTY.address}.
        </>,
      ),
    ],
  },
];
