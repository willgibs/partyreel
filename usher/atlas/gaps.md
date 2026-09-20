# The gaps: explorations no board has asked (the queue for a free seat)

Surveyed 2026-09-20 against the 28 standing boards and the ten lanes of the fifth batch. A candidate is cut only if it re-asks no open ask; the desk's open asks are listed per board in the survey. Clean candidates first, by leverage; then the ones that need a narrowing clause.

| id | surface | the question | draws on | must not overlap | model |
|---|---|---|---|---|---|
| `notifications` | the bell, its panel, the prefs, announcements | What should the product tell a host about in-app, and how does a signal that is state differ from one that clears? | notification-bell.tsx, lib/notifications/build.ts, notification-prefs-form.tsx, admin/announcements | not emails.moments (the mail channel), not toasts (transient), not app-shape.nav | Opus |
| `album-find` | the guest album and the host gallery | How does anyone find one photograph in a thousand: sort, date, person, media kind? | live-gallery.tsx, guest-masonry.tsx, masonry.tsx, event-filter-pills.tsx, guest-list.tsx | not app-vocabulary.gallery-controls-* (tile size), not guest-shape.chrome, not the hub's Deleted filter | Opus |
| `dark-surfaces` | every surface | Which surfaces have a dark mode at all, who can switch, and what does a guest get? | providers.tsx, user-menu ThemeSubmenu, globals.css, theme.css | not emails (the dark inbox), not loose-ends.chart-dark, not glass | Sonnet |
| `album-afterlife` | host and guest, weeks later | What does an album become after the party: a keepsake, a countdown to deletion, an anniversary? | email templates (inactivity, renewal), the purge cron, save-event-button, export-dialog | not emails.moments, not export-flow.object | Opus |
| `host-insights` | the host app | What should a host learn about their own event: views, contributors, the photograph everyone liked? | queries/metrics.ts, metrics-charts.tsx (admin), analytics/events.ts, like-button counts | not admin.home/density, not app-shape.home | Sonnet |
| `a11y-paths` | every surface | What does this product feel like with a keyboard and a screen reader, end to end? | media-lightbox.tsx, kbd.tsx, masonry.tsx, entry-modal.tsx, guest-bar.tsx, floating-layer.ts | not host-curation.keys, not media-viewer.next | Opus |
| `og-cards` | every shared link | Should thirteen OG routes be one card family, and what does a shared album's card show? | og/marketing-og-card.tsx, the per-page opengraph-image.tsx routes, e/[token]/opengraph-image.tsx | not press-page.the-sheet, not voice-wiring (owns the OG words) | Sonnet |
| `feature-anatomy` | marketing | What is a feature page's shape, and what does /features do as an index over six? | feature-pages.ts, features-layout.ts, features/page.tsx, the six section dirs, cta-band.tsx | not album-motion, not privacy-hero, not voice.feature-h1 | Sonnet |
| `blog-reading` | marketing | What is reading a post here: the index, the article body, the FAQ block, the way out? | blog/page.tsx, blog-list.tsx, [slug]/page.tsx, marketing/blog, reading/, mdx/ | not help-center.article, not body-type.reading | Sonnet |
| `venue-screen` | guest and venue, new | Should an album have a big-screen mode for the room it is happening in? | live-gallery.tsx, guest-masonry.tsx, album-stream/stream-engine.ts, styled-qr.tsx | not media-viewer, not demo-event | Opus |
| `likes-system` | guest and host | What is a like here: who sees it, who is told, why are counts host-only? | like-button.tsx, likes-provider.tsx, my-likes-gallery.tsx | not app-vocabulary.empty-states, not media-viewer.holds | Sonnet |
| `pwa-install` | guest and host | Should an album install to a phone, and who is ever asked to? | manifest.ts, layout.tsx, public/icons, e/[token]/page.tsx, home/no-app.tsx | not guest-shape.door, not voice | Sonnet |
| `billing-recovery` | host | What happens when a card fails, a pass lapses, or a subscription is cancelled? | stripe/webhook/route.ts, portal/route.ts, manage-billing-button.tsx, tiers.ts | not app-pricing.back, not emails.moments | Opus |
| `reel-marketing` | marketing /reel | What does the reel page have to prove before a host believes it? | sections/reel (13 files), style-switcher-island.tsx, inline-reel-player.tsx | not reel-studio, not pricing-page.pair | Sonnet |
| `legal-reading` | marketing | Are Privacy and Terms reading surfaces or documents of record, and can they be scanned? | legal-document.tsx, legal-blocks.tsx, legal-privacy.tsx, legal-terms.tsx, article-toc.tsx | not privacy-hero, not help-center.article | Sonnet |
| `about-page` | marketing | Who is /about for, and what does the company owe a host there? | about/page.tsx, gather.tsx, constants/about.ts, paper-chapter.tsx | not press-page.who-for/a-human, not site-chrome | Sonnet |
| `careers-apply` | marketing and admin | What is applying here, from the role page to the operator's inbox? | careers/[slug]/page.tsx, sections/careers, applicationReceivedEmail, admin/applicants | not contact-page.reach/receipt, not emails.shell, not admin.density | Sonnet |
| `social-graph` | guest and host | Is a follow worth the graph, and what does it change for anyone? | follow-button.tsx, connection-buttons.tsx, profile-actions-menu.tsx, following-section.tsx | not profile-page.*, not home-wiring's owner mode | Sonnet |
| `llms-surface` | marketing and machines | What does the product hand an AI reader, and is it the same story? | llms.txt/route.ts, llms-full.txt/route.ts, sitemap.ts, robots.ts, jsonld.tsx | not voice (retires; owns the words), not the ROADMAP's AI-SEO arc | Sonnet |

## Cut only with a narrowing clause

- `video-lifecycle`: a video's whole life: the pick, the cap, the tier gate, the thumbnail, the reel's refusal (narrow away from media-viewer.video and guest-upload.warning)
- `storage-caps`: the cap as a surface: the meter, the warning, the refusal, the recovery (narrow away from app-pricing.words and the pulse's meter)
- `print-artifact`: the physical piece: sizes, bleed, a poster, the print-shop promise (narrow away from first-event.venue/hand and the share sheet)
- `host-capture`: the host's own camera moment at the event (narrow away from guest-upload and the hub's Add move)
- `account-page`: /account as a page once its Plan card lands (narrow away from app-shape.you and home-wiring)
- `guest-report`: what a guest reporting a photograph asks for and hears back (narrow away from admin-triage.notice and guest-shape.dialogs)
- `returning-guest`: a guest with an account arriving at a new event (narrow away from guest-shape.account and guest-verify)
- `marketing-header`: the header at a phone: the mega panel, the indicator, the hint (only what site-chrome r1 did not ask)
- `welcome-tour`: the three-step tour's own content (only if app-door.welcome leaves it open)
- `avatar-upload`: the cropper and the cost of a face (narrow away from seed-avatar.after-upload)

## Out on inspection (an open ask already covers them)

the guest reel overlay (reel-studio.guests), the checkout return (app-pricing.back), the password gate (guest-shape.door), the live-filling album (guest-shape.live), the faces row and the full list (profile-page.view-all), the QR at the door (first-event.venue/hand), and everything tonight's lanes carry.

