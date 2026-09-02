import { LegalLink } from "@/components/marketing/legal/legal-link";

import { LEGAL_PARTY, note, ol, p, sub, ul, type LegalSection } from "./legal";

/**
 * THE TERMS OF SERVICE (version 1.0, the legal round, 2026-09-01). Formal but
 * readable by ruling. Will's rulings baked in (2026-09-01): hosts 18+ and
 * guests 13+; Pro non-refundable with cancel-anytime, Event Pass refundable
 * within 14 days if unused; informal resolution then the courts of [STATE]
 * with a class-action waiver and NO arbitration; the full DMCA procedure with
 * a designated agent; suspension and termination as a RESERVED right (there is
 * no suspension feature, so the text never claims one runs).
 *
 * ★ NO PRICES AND NO CAP NUMBERS HERE. Prices live in Stripe and change
 * without a deploy; caps live in tiers.ts and are marketed on /pricing. The
 * Terms point at the pricing page so a price change never makes a contract
 * false. The CI-fenced vocabulary note in legal-privacy.tsx applies here too.
 *
 * Section ids are the anchor contract. The ten R5 ids survive; the new ones
 * sit around them.
 */
const PRIVACY_EMAIL = (
  <LegalLink href={`mailto:${LEGAL_PARTY.privacyEmail}`}>
    {LEGAL_PARTY.privacyEmail}
  </LegalLink>
);
const CONTACT_PAGE = <LegalLink href="/contact">contact page</LegalLink>;
const PRICING_PAGE = <LegalLink href="/pricing">pricing page</LegalLink>;
const PRIVACY_POLICY = <LegalLink href="/privacy">Privacy Policy</LegalLink>;

export const TERMS_SECTIONS: LegalSection[] = [
  {
    id: "agreement",
    title: "The agreement",
    summary:
      "Using Partyreel means agreeing to these terms. Hosts must be adults; guests must be at least 13.",
    blocks: [
      p(
        <>
          These Terms of Service (the &ldquo;Terms&rdquo;) are a binding
          agreement between you and {LEGAL_PARTY.entityName}, doing business as
          Partyreel (&ldquo;Partyreel&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;). They govern your use of partyreel.com, the
          Partyreel host application, event links and QR codes, and the related
          services (together, the &ldquo;Service&rdquo;). By creating an
          account, joining an event, uploading, or otherwise using the Service,
          you accept these Terms and our {PRIVACY_POLICY}, which is part of
          them. If you do not agree, do not use the Service.
        </>,
      ),
      p(
        'You must be at least 18 years old to create a host account or buy a plan. You must be at least 13 years old, or older where the law of your country requires it, to join an event as a guest. If you use the Service on behalf of an organisation, you confirm that you are authorised to bind it, and "you" includes that organisation.',
      ),
      sub("definitions", "Definitions"),
      ul(
        <>
          <strong className="text-foreground">Host</strong>: a person with a
          Partyreel account who creates an event.
        </>,
        <>
          <strong className="text-foreground">Guest</strong>: anyone who views
          or contributes to an event through its link or QR code, with or
          without an account.
        </>,
        <>
          <strong className="text-foreground">Event</strong> and{" "}
          <strong className="text-foreground">Album</strong>: an event is what a
          host creates; its album is the collection of media gathered under that
          event&rsquo;s link.
        </>,
        <>
          <strong className="text-foreground">Content</strong>: photos, videos,
          names, descriptions, captions and anything else you submit to the
          Service.
        </>,
        <>
          <strong className="text-foreground">Plan</strong>: the free tier, a
          Pro subscription or an Event Pass, as described on the {PRICING_PAGE}.
        </>,
      ),
      p(
        "Each section opens with a plain-language summary to help you read it. If a summary and the full text ever seem to differ, the full text governs.",
      ),
    ],
  },
  {
    id: "the-service",
    title: "The service",
    summary: "One QR code collects an event's photos into one album.",
    blocks: [
      p(
        "Partyreel lets a host create an event and share one link, usually as a QR code. Guests open it and add photos and videos from their phones, without installing an app. Everything lands in one album that the host curates and that everyone with access can browse and download, and the album can be rendered into a short highlight reel.",
      ),
      p(
        "We may change, add or remove features of the Service as it develops. Where a change materially reduces what a paid plan includes during a period you have paid for, we will tell you in advance and you may cancel under the refund section below.",
      ),
    ],
  },
  {
    id: "your-account",
    title: "Your account",
    summary:
      "A verified email is the whole account, and it is yours to guard. Your display name is public.",
    blocks: [
      p(
        "A host account is a verified email address, a display name, and whichever sign-in method you choose: a password, one-time codes sent to that email, or Google. You are responsible for everything that happens under your account, so keep access to that inbox and to any password secure, use the account for yourself only, and tell us promptly if you believe it has been compromised.",
      ),
      p(
        "Your display name is required and is shown publicly wherever you appear: on your events, beside your uploads, in guest lists and on your profile. Choose one you are comfortable showing to the people at your events. Names that impersonate others, contain profanity, or use reserved words are not permitted, and we may change a name that breaks this rule. Keep the information on your account accurate.",
      ),
    ],
  },
  {
    id: "guests",
    title: "Guests",
    summary:
      "Guests join through the event link, usually with a verified email, and keep control of what they upload.",
    blocks: [
      p(
        "An event's link or QR code is the key to that event. Anyone who holds it can reach the event, subject to the visibility and password settings its host chooses, so treat a link you receive as the host's to share, not yours to publish. By default, a host requires a verified email before a guest can see the full album or upload; where the host allows it, guests may also upload without signing in, and those uploads are shown as Anonymous.",
      ),
      p(
        "Uploads made while signed in are attributed to your display name and, if the host shows a guest list, listed there by name. If you sign in later, uploads you made anonymously from the same browser can be claimed to your account. A signed-in guest can delete their own uploads from their dashboard at any time, in any event; that deletion is final and the host cannot restore it. A guest who uploaded without signing in can ask the host to remove an item.",
      ),
      p(
        "Guests pay nothing to join, view, upload or download. These Terms apply to guests in full, including the sections on your content, acceptable use and copyright.",
      ),
    ],
  },
  {
    id: "your-content",
    title: "Your content",
    summary:
      "The photos are yours. We get only the license needed to run the album, and the host gets the license needed to run the event.",
    blocks: [
      sub("ownership", "Ownership"),
      p(
        "You keep every right you have in the content you upload. Nothing in these Terms transfers ownership of your content to Partyreel, to a host, or to anyone else.",
      ),
      sub("license-to-partyreel", "The license you give Partyreel"),
      p(
        "So that we can operate the Service, you grant Partyreel a non-exclusive, worldwide, royalty-free license to host, store, copy, transmit, display, resize and generate previews of your content, to bundle it into downloads, to render it into reels, and to make backups of it, in each case only to provide, secure, maintain and improve the Service and to comply with law. This license ends when the content is deleted from the Service, except that copies may persist in backups and under legal holds for the periods described in the Privacy Policy. We do not sell your content, we do not use it for advertising, and we do not use it to train artificial-intelligence models.",
      ),
      sub("license-to-hosts", "The license you give the host and the room"),
      p(
        "When you upload to an event, you grant its host a non-exclusive, worldwide, royalty-free license to view, download, curate, hide, remove, and include your content in that event's album, guest list, downloads and highlight reels, and to share the album through the event's link, for as long as the content remains in the album. You also grant everyone the host allows into the album a license to view and download your content for their personal, non-commercial use. A host who wants to use guest content beyond the event (for example commercially) needs the uploader's separate permission.",
      ),
      sub("your-promises", "What you promise about your content"),
      ul(
        "You own the content or have the rights needed to upload it and grant the licenses above.",
        "Where the law requires it, you have the consent of the people who appear in it, and you are not uploading intimate images of anyone without their consent.",
        "It does not infringe anyone's copyright, trademark, privacy, publicity or other rights, and it does not break the acceptable-use rules below.",
      ),
      sub("feedback", "Feedback"),
      p(
        "If you send us ideas or suggestions, we may use them without obligation to you.",
      ),
    ],
  },
  {
    id: "host-responsibilities",
    title: "Host responsibilities",
    summary:
      "Hosts run their own rooms: lawful gatherings, guests told that photos are being collected, and guest emails used only for the event.",
    blocks: [
      p("As a host you are responsible for your event. In particular:"),
      ul(
        "You use the Service for a lawful gathering and you comply with the laws that apply to collecting and sharing photographs and personal information where your event takes place.",
        "You tell your guests that photos and videos they add will be collected into an album visible to the people you allow in, and you make your own judgement about who those people are through the event's visibility and password settings.",
        "You use the email addresses and names of your guests only to run that event, never for marketing or any other purpose, and you do not export or share them.",
        "You review what your guests add. You may hide or remove any item at any time, and you are the first line of response when a guest asks for one of their images to be taken down.",
        "You do not use the Service to store material that has nothing to do with an event, or to provide storage to other people.",
      ),
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    summary: "Lawful events, and nothing that harms anyone.",
    blocks: [
      p("You may not use the Service to do any of the following:"),
      ul(
        "Upload, share or store content that is illegal, or that sexually exploits or endangers a minor in any way.",
        "Upload intimate images of a person without their consent, or harass, threaten, stalk or intimidate anyone.",
        "Upload content that infringes copyright, trademark or other intellectual-property rights, or that you have no right to share.",
        "Upload malware, or try to probe, breach or disrupt the Service, its infrastructure or other users' accounts.",
        "Scrape, crawl or bulk-download albums you do not have access to, guess or brute-force event links or passwords, or share a capability link so as to circumvent a host's access choices.",
        "Circumvent plan limits, storage caps or rate limits, or resell, sublicense or provide the Service to third parties as a storage or hosting product.",
        "Impersonate any person or organisation, or misrepresent your affiliation with anyone.",
        "Use the Service in breach of any law that applies to you.",
      ),
      p(
        "We may apply reasonable limits on upload volume, download bundling and other activity to keep the Service healthy and to prevent abuse.",
      ),
    ],
  },
  {
    id: "copyright",
    title: "Copyright complaints",
    summary:
      "If someone uploaded your work without permission, send us a notice and we will act on it. Repeat infringers lose access.",
    blocks: [
      p(
        "We respect the intellectual property of others and comply with the Digital Millennium Copyright Act (DMCA). If you believe content on the Service infringes your copyright, send a notice to our designated agent below. When we receive a valid notice we will remove or disable access to the content promptly and notify the person who uploaded it.",
      ),
      sub("notice", "What a notice must contain"),
      ol(
        "Your physical or electronic signature, or that of a person authorised to act for you.",
        "Identification of the copyrighted work you claim has been infringed.",
        "Identification of the content you claim is infringing, with enough detail for us to find it (the event link and a description of the item, or a screenshot).",
        "Your name, address, telephone number and email address.",
        "A statement that you have a good-faith belief that the use is not authorised by the copyright owner, its agent or the law.",
        "A statement, under penalty of perjury, that the information in the notice is accurate and that you are the copyright owner or authorised to act on the owner's behalf.",
      ),
      note(
        <>
          <strong>Designated agent:</strong> {LEGAL_PARTY.dmcaAgent},{" "}
          {LEGAL_PARTY.entityName}, {LEGAL_PARTY.address}. Email:{" "}
          {PRIVACY_EMAIL}.
        </>,
      ),
      sub("counter-notice", "Counter-notices"),
      p(
        "If your content was removed and you believe the removal was a mistake or a misidentification, you may send us a counter-notice containing: your physical or electronic signature; identification of the content that was removed and where it appeared; a statement under penalty of perjury that you have a good-faith belief the content was removed by mistake or misidentification; your name, address and telephone number; and a statement that you consent to the jurisdiction of the federal court for your address (or, if outside the United States, for our address) and that you will accept service of process from the person who filed the original notice.",
      ),
      // "working days", not the statute's phrasing: the neutralization fence
      // bans the two-word form sitewide (it was a reply-time promise pattern).
      p(
        "When we receive a valid counter-notice we will forward it to the person who sent the original notice. Unless they tell us within 10 working days that they have filed a court action to restrain the alleged infringement, we may restore the content between 10 and 14 working days after receiving the counter-notice.",
      ),
      sub("repeat-infringers", "Repeat infringers and misrepresentation"),
      p(
        "We terminate the accounts of users who are repeat infringers. Anyone who knowingly misrepresents that content is infringing, or that it was removed by mistake, may be liable for damages under the DMCA.",
      ),
    ],
  },
  {
    id: "plans-and-billing",
    title: "Plans and billing",
    summary:
      "Free to start. Paid plans are sized by storage, priced on the pricing page, and billed by Stripe.",
    blocks: [
      // tiers.ts: free = 1 event, photos only; pro = subscription (month or
      // year), unlimited events; event_pass = one-time, 1 event, ~1 year,
      // stacks (ADR-0025); pass→pro = prorated credit; one Pro at a time
      // (ADR-0023); renewal extends never resets.
      sub("plans", "The plans"),
      ul(
        <>
          <strong className="text-foreground">Free</strong> covers one event
          with photo uploads, within the storage cap shown on the {PRICING_PAGE}
          .
        </>,
        <>
          <strong className="text-foreground">Pro</strong> is a subscription,
          billed monthly or yearly, that adds video, more storage and more
          events. It renews automatically at the end of each billing period
          until you cancel. You can hold one Pro subscription at a time and
          change its size through the billing portal.
        </>,
        <>
          <strong className="text-foreground">Event Pass</strong> is a one-time
          purchase that covers one event with video and its own storage for
          about one year from purchase. Passes stack: each pass adds one event
          and its storage for its own term. A pass can be renewed for a further
          term at the renewal price shown on the pricing page; renewal extends
          the current term and never resets it.
        </>,
      ),
      p(
        "If you hold an active Event Pass and move to Pro, the unused portion of what you paid for the pass is credited to your Stripe balance and applied to your next Pro invoices. What each plan includes, and its price, is set out on the pricing page at the time of purchase.",
      ),
      sub("payment", "Payment"),
      p(
        "Payments are processed by Stripe under its own terms; we never receive your full card number. You authorise us and Stripe to charge your payment method for the plan you choose, and for renewals, until you cancel. Prices are in United States dollars. Where we are required to collect sales tax, VAT or a similar tax, it is added at checkout or shown on your invoice. Plan entitlements are applied when Stripe confirms payment, which is normally immediate.",
      ),
      sub("changes", "Price and plan changes"),
      p(
        "We may change prices and what plans include. A price change applies to an existing subscription only from its next renewal after we have given you at least 30 days' notice by email, and you may cancel before then. A one-time Event Pass is never repriced during its term.",
      ),
      sub("limits", "Storage and limits"),
      p(
        <>
          Each plan is a total storage cap, with a small buffer above it so an
          upload in progress is not cut off at the line. When an account reaches
          its cap, new uploads pause until space is freed or the plan grows;
          existing media is untouched. Video uploads and highlight reels above
          the free length are available on paid plans only. Per-file size limits
          are shown in the uploader, and hosts may set a lower limit for their
          event. Some event settings (a password, a custom link) are available
          on paid plans only; if your plan lapses you keep any such setting you
          already made but cannot create a new one. The current numbers live on
          the {PRICING_PAGE} and in{" "}
          <LegalLink href="/help/storage-plans-and-limits">
            storage, plans and limits
          </LegalLink>
          .
        </>,
      ),
    ],
  },
  {
    id: "refunds-and-cancellation",
    title: "Refunds and cancellation",
    summary:
      "Cancel Pro any time and keep it to the end of the period; no refunds. An unused Event Pass is refundable within 14 days.",
    blocks: [
      // Will's ruling (2026-09-01): Pro no refunds + cancel anytime; Event
      // Pass refundable within 14 days if unused (no event created on the
      // slot); statutory rights preserved.
      ul(
        <>
          <strong className="text-foreground">Pro.</strong> You can cancel at
          any time through the billing portal. Cancellation stops future
          charges; your plan continues until the end of the period you have paid
          for, and then your account returns to the free tier. Deleting your
          account instead cancels the plan at that moment rather than at the end
          of the period, because there is no account left to keep on it. Pro
          payments, monthly or yearly, are not refundable, in whole or in part,
          except where the law requires otherwise.
        </>,
        <>
          <strong className="text-foreground">Event Pass.</strong> A pass is
          refundable in full if you ask within 14 days of purchase and the pass
          is unused, meaning no event has been created on it. After 14 days, or
          once an event has been created on it, a pass is not refundable.
          Renewals are not refundable.
        </>,
        <>
          <strong className="text-foreground">Your statutory rights.</strong> If
          you live in a place whose consumer law gives you a right to withdraw
          from a purchase or to a refund that these Terms do not, that right is
          unaffected. In the European Union and the United Kingdom, by asking us
          to make a plan available immediately you agree that the withdrawal
          period ends when the plan is activated, and an Event Pass remains
          refundable under the 14-day rule above.
        </>,
      ),
      p(
        <>
          To request a refund, write to us through the {CONTACT_PAGE} from the
          email on your account. Refunds are returned to the original payment
          method.
        </>,
      ),
    ],
  },
  {
    id: "storage-and-retention",
    title: "Storage and retention",
    summary:
      "Albums do not expire. Deleted items get a 30-day safety net, over-cap accounts get a 45-day grace period, and idle free events get a warning and about six months.",
    blocks: [
      p(
        "Albums do not expire: events stay up until their host deletes them, subject only to the rules below. Deleted media and events sit in a recovery bin for 30 days before being permanently removed; a host can restore or purge them sooner. The bin holds at most as much as the account's storage allowance, so when it is over that budget the oldest deleted items are removed early.",
      ),
      // Sources: OVER_CAP_GRACE_DAYS 45 + largest-first (lifecycle-recovery.md);
      // INACTIVE_DAYS 180 + WARN_BEFORE_DAYS 14 (inactivity.ts); passes.ts 365.
      p(
        <>
          <strong className="text-foreground">Over-capacity accounts.</strong>{" "}
          If a paid plan lapses and the account holds more than its new cap, you
          have a 45-day grace period, with email reminders, to reduce storage or
          restore a plan. After that we remove items, largest first, until the
          account is within its cap, passing each through the recovery bin.
        </>,
      ),
      p(
        <>
          <strong className="text-foreground">Inactive free events.</strong> To
          keep free accounts tidy, an event on a free account may be removed
          after about six months with no activity. Signing in and opening the
          event both count as activity. We email you a warning 14 days before
          removal, and a removed event stays in the recovery bin for its 30-day
          window. Keeping a paid plan, or simply using your event, prevents
          removal.
        </>,
      ),
      p(
        <>
          <strong className="text-foreground">Event Pass events.</strong> A pass
          covers its event for about one year from purchase. When a pass lapses,
          the event is treated as a free-account event and the rules above
          apply; renewing, or moving to Pro, keeps it longer.
        </>,
      ),
      p(
        <>
          Download anything you want to keep before deleting it: permanent
          deletion is real. The full schedule, including backups and legal
          holds, is in the {PRIVACY_POLICY} and in{" "}
          <LegalLink href="/help/how-long-media-is-kept">
            how long media is kept
          </LegalLink>
          .
        </>,
      ),
    ],
  },
  {
    id: "the-reel",
    title: "The highlight reel",
    summary: "Free reels carry a small mark. Photos and albums never do.",
    blocks: [
      p(
        "A host can render an event's album into a short highlight reel and share it. Reels rendered on the free tier carry a small partyreel.com mark; a paid plan removes it from the next render. Photos, videos and the album itself are never watermarked, on any plan. Reels are made from guest content under the licenses in the Your content section, and a guest who deletes an upload should expect it to leave the album immediately and any already-rendered reel at the next render.",
      ),
    ],
  },
  {
    id: "profiles-and-social",
    title: "Profiles and social features",
    summary:
      "A public profile is public by choice. Guest lists are the host's call. Blocks are honoured everywhere.",
    blocks: [
      // ADR-0019 + profiles-social.md.
      p(
        "Claiming a public profile makes it visible to anyone at its address, including search engines. Your profile shows the events you host and choose to display, and the open events you have contributed to where the host shows a guest list and you have not hidden them. You can hide any event from your profile at any time. Profiles never show email addresses or follower counts.",
      ),
      p(
        "Hosts may show a guest list on an event, which names every signed-in uploader to everyone who can see the album; the ways to stay off a guest list are described in the Privacy Policy. Following someone is visible only to you and them. Blocking someone removes each of you from the other's social surfaces across the Service. Do not use profiles or social features to harass anyone or to gather personal information about other users.",
      ),
    ],
  },
  {
    id: "moderation-and-enforcement",
    title: "Moderation and enforcement",
    summary:
      "Hosts moderate their own albums. Anyone can report. We review reports and can remove content, hold it, or close accounts that break these terms.",
    blocks: [
      p(
        "Hosts moderate their own albums and can hide or remove anything in them instantly. Anyone who can see an album can report it or an item in it; reports are anonymous and are reviewed before anything is removed. We have no obligation to monitor content, but we may review any content at any time to enforce these Terms or comply with law.",
      ),
      p(
        "If content breaks these Terms or the law, we may remove it, and a removal made by us cannot be undone by the host. Where an investigation or a legal obligation requires it, we may place content under a legal hold and preserve a copy, as described in the Privacy Policy, and we may disclose it to public authorities in response to valid legal process.",
      ),
      p(
        "We reserve the right to suspend or terminate an account, or restrict its access to any part of the Service, if we reasonably believe it has been used in breach of these Terms, creates legal risk for us or for others, or has been used to harm someone. Where practical we will tell you why and give you a chance to respond; we may act first and notify you afterwards where delay would cause harm or is prohibited by law.",
      ),
    ],
  },
  {
    id: "privacy",
    title: "Privacy",
    summary: "The Privacy Policy is part of this agreement.",
    blocks: [
      p(
        <>
          Our {PRIVACY_POLICY} explains what we collect, how we use it, who can
          see it, how long we keep it, and the rights and choices you have. It
          is part of these Terms. By using the Service you agree to the
          processing it describes, and as a host you agree to use the
          information you receive about your guests only as the Host
          responsibilities section allows.
        </>,
      ),
    ],
  },
  {
    id: "ending-things",
    title: "Ending things",
    summary:
      "Close your account yourself, any time, in a couple of taps. We can close accounts that break the rules. Either way, download first, because deletion is real.",
    blocks: [
      // Self-serve since 2026-09-02, and the plan now goes WITH the account
      // (Will's ruling: an active plan is auto-cancelled at the request), so
      // the old "cancelling is separate" sentence would have been wrong.
      p(
        <>
          <strong className="text-foreground">By you.</strong> You can delete
          any event at any time, and you can delete your account yourself from
          your account settings, confirming with your password or a code we
          email you (see{" "}
          <LegalLink href="/help/your-data-and-deleting-your-account">
            your data and deleting your account
          </LegalLink>
          ). Deleting an account cancels any paid plan as part of the same step
          and deletes the events you host, with their media; your uploads to
          other people&rsquo;s events stay in their albums unless you delete
          them first. Deletion is immediate and permanent, and an account cannot
          be restored. Cancelling a plan without closing your account is
          separate and is described under Refunds and cancellation. If you
          cannot sign in, write to us through the {CONTACT_PAGE}.
        </>,
      ),
      p(
        <>
          <strong className="text-foreground">By us.</strong> We may terminate
          or suspend your account as described under Moderation and enforcement,
          or if a paid plan lapses and the account remains over its cap beyond
          the periods described under Storage and retention. We may also
          discontinue the Service as a whole, in which case we will give at
          least 60 days&rsquo; notice by email and a way to download your albums
          before they are deleted.
        </>,
      ),
      p(
        "When an account ends, the licenses you granted end with the content they cover, subject to the backup and legal-hold periods in the Privacy Policy. Sections of these Terms that by their nature should survive (including Your content, the disclaimers, the limitation of liability, indemnity and disputes) survive termination.",
      ),
    ],
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    summary:
      "We take care of your media like it matters, and the Privacy Policy describes exactly how. The law still requires us to say the Service comes as is.",
    blocks: [
      note(
        <>
          <strong>
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as
            available&rdquo;.
          </strong>{" "}
          To the fullest extent permitted by law, Partyreel disclaims all
          warranties, express or implied, including implied warranties of
          merchantability, fitness for a particular purpose, title and
          non-infringement. We do not warrant that the Service will be
          uninterrupted, error-free or secure, that content will never be lost,
          or that it will meet your requirements. You are responsible for
          keeping your own copies of anything you cannot afford to lose. Some
          jurisdictions do not allow the exclusion of implied warranties, so
          some of these exclusions may not apply to you.
        </>,
      ),
      p(
        "Content in an album comes from hosts and guests, not from us. We do not endorse it, and we are not responsible for it or for what anyone with access to an album does with it.",
      ),
    ],
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of liability",
    summary:
      "Our liability is capped at what you paid us in the past year, or $100 if you paid nothing. Some losses are excluded.",
    blocks: [
      note(
        <>
          To the fullest extent permitted by law, Partyreel and its owners,
          employees and providers will not be liable for any indirect,
          incidental, special, consequential or punitive damages, or for any
          loss of profits, revenue, data, goodwill or content, arising out of or
          relating to the Service or these Terms, however caused and under any
          theory of liability, even if we have been advised of the possibility
          of such damages. <strong>Our total liability</strong> for all claims
          arising out of or relating to the Service or these Terms will not
          exceed the greater of the amount you paid us in the twelve months
          before the claim arose and one hundred United States dollars ($100).
        </>,
      ),
      p(
        "These limits do not apply to liability that cannot be limited by law, including liability for death or personal injury caused by negligence, for fraud, or for gross negligence or wilful misconduct. Some jurisdictions do not allow the limitation of certain damages, so some of these limits may not apply to you.",
      ),
    ],
  },
  {
    id: "indemnity",
    title: "Indemnity",
    summary:
      "If your content or your use of the service gets us sued, you cover the cost.",
    blocks: [
      p(
        "You will defend, indemnify and hold harmless Partyreel and its owners, employees and providers from any claim, demand, loss or expense (including reasonable legal fees) arising out of or relating to your content, your use of the Service, your breach of these Terms, or your violation of any law or of anyone's rights. We may take over the defence of any matter subject to indemnification, in which case you will cooperate with us.",
      ),
    ],
  },
  {
    id: "disputes",
    title: "Disputes",
    summary:
      "Talk to us first. If that fails, the courts of our home state decide, one person at a time.",
    blocks: [
      // Will's ruling (2026-09-01): informal resolution first, then the courts
      // of [STATE], class-action waiver; deliberately NO arbitration.
      sub("informal", "Talk to us first"),
      p(
        <>
          Before starting a formal dispute, write to us at {PRIVACY_EMAIL} or
          through the {CONTACT_PAGE} with a description of the problem and what
          you would like us to do. We will do the same before starting one
          against you. Both of us agree to try in good faith to resolve the
          matter for 30 days from that notice before filing a claim.
        </>,
      ),
      sub("law-and-venue", "Governing law and venue"),
      p(
        <>
          These Terms and any dispute arising out of or relating to them or the
          Service are governed by the laws of the State of {LEGAL_PARTY.state}{" "}
          and the federal law of the United States, without regard to conflict
          of law rules. Any claim that is not resolved informally will be
          brought exclusively in the state or federal courts located in{" "}
          {LEGAL_PARTY.state}, and you and we consent to their personal
          jurisdiction. If you are a consumer in a country whose law entitles
          you to bring a claim in your home courts, or to the protection of its
          mandatory consumer law, nothing in this section takes that away.
        </>,
      ),
      sub("class-waiver", "Individual claims only"),
      note(
        <>
          <strong>
            You and Partyreel agree that each may bring claims against the other
            only in an individual capacity
          </strong>
          , and not as a plaintiff or class member in any purported class,
          collective or representative proceeding. If this waiver is found
          unenforceable for a particular claim, it is severed for that claim
          only and the rest of this section remains in force.
        </>,
      ),
    ],
  },
  {
    id: "general",
    title: "General terms",
    summary:
      "The usual housekeeping: the whole agreement, and how notices work.",
    blocks: [
      ul(
        <>
          <strong className="text-foreground">Entire agreement.</strong> These
          Terms and the Privacy Policy are the whole agreement between you and
          Partyreel about the Service and replace any earlier agreement.
        </>,
        <>
          <strong className="text-foreground">Severability.</strong> If any
          provision is found unenforceable, it will be enforced to the maximum
          extent permitted and the rest of the Terms remain in force.
        </>,
        <>
          <strong className="text-foreground">No waiver.</strong> If we do not
          enforce a provision, that is not a waiver of our right to enforce it
          later.
        </>,
        <>
          <strong className="text-foreground">Assignment.</strong> You may not
          assign these Terms without our written consent. We may assign them to
          a successor in connection with a merger, acquisition or sale of
          assets, and will tell you if we do.
        </>,
        <>
          <strong className="text-foreground">Force majeure.</strong> Neither of
          us is liable for delay or failure caused by events beyond our
          reasonable control, including outages at our providers, except for
          payment obligations.
        </>,
        <>
          <strong className="text-foreground">Export and sanctions.</strong> You
          may not use the Service if you are located in a country subject to
          comprehensive United States sanctions or are on a United States
          restricted-parties list.
        </>,
        <>
          <strong className="text-foreground">Notices.</strong> We send notices
          to the email address on your account, and they take effect when sent.
          You can send us notices at {PRIVACY_EMAIL} or by post to{" "}
          {LEGAL_PARTY.entityName}, {LEGAL_PARTY.address}.
        </>,
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
        "We may update these Terms as the Service changes. The version number and date at the top tell you which version you are reading. For material changes we will give notice before the change takes effect, in the app or by email to the address on your account, and your continued use of the Service after that date means the updated Terms apply to you. If you do not agree to a change, stop using the Service before it takes effect; a paid plan can be cancelled as described above. Earlier versions are available on request.",
      ),
      p(
        <>
          Questions about these Terms go to {PRIVACY_EMAIL} or through the{" "}
          {CONTACT_PAGE}.
        </>,
      ),
    ],
  },
];
