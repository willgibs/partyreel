# Systems index

> One line per system doc: open the one your task touches before you touch it. Each opens with the questions it
> answers and keeps what the code cannot tell you: the invariants, the ★ landmines, the project's own facts. How we
> work is [`../CLAUDE.md`](../CLAUDE.md); where things stand, [`STATUS.md`](STATUS.md).

| Open | when you are about to |
| --- | --- |
| [architecture.md](systems/architecture.md) | work across systems (the route groups, the two stores of truth, the data flows, the scheduled jobs), revalidate a path, or chase a host page that renders but never hydrates |
| [auth-accounts.md](systems/auth-accounts.md) | change sign-in (the one account door, codes, passwords, Google, passkeys) or a Supabase Auth dashboard setting, a display name, an avatar, the `/welcome` gate or account deletion |
| [guest-flow.md](systems/guest-flow.md) | change the event link `/e/[token]`: who counts as a guest, visibility and the password gate, the door and the confirm doors, the live gallery, demo mode, the guest's reel |
| [host-app.md](systems/host-app.md) | change a host surface: the dashboard, creating an event, the QR designer and print, the custom link, the welcome, the event page and its settings, moderation, the reel and its export |
| [uploads-and-r2.md](systems/uploads-and-r2.md) | touch the upload pipeline, an R2 key, client or presign, the EXIF strip, or how media renders (tiles, previews, posters, the viewer) and downloads (Save, Download all) |
| [billing-caps.md](systems/billing-caps.md) | change a price or a limit, anything that decides whether an upload, a restore or a plan change fits, Stripe checkout, change-plan or the webhook, or the in-app pricing surface and the Plan card |
| [lifecycle-recovery.md](systems/lifecycle-recovery.md) | add or change a purge-cron sweep, touch deleting and restoring (the 30-day window, the standby budget, the Deleted filters) or the over-cap, lapsed-pass and inactivity sweeps, or send an email |
| [durability-backups.md](systems/durability-backups.md) | touch anything that deletes R2 objects, the backup Worker and its prune, or the DB backup; restore from backup; reason about R2 cost and scale |
| [admin-observability.md](systems/admin-observability.md) | change the admin portal (its seam, MFA, the two-deployment perimeter, a surface), add a backend job or a kill switch that must report its health, or add a Sentry capture |
| [trust-safety-forensics.md](systems/trust-safety-forensics.md) | touch a hard-delete path (legal holds) or the forensic capture, or handle a report, a hold or a CSAM incident |
| [database-security.md](systems/database-security.md) | add or change an RPC, a column, a table or a grant, read more than 1,000 rows, rate-limit a route, or write a migration |
| [profiles-social.md](systems/profiles-social.md) | change who is listed or counted as a guest, `/u/[slug]`, follows, blocks, reporting a person, handles, bios or email preferences |
| [notifications-analytics-growth.md](systems/notifications-analytics-growth.md) | feed the host's bell, touch the QR-scan counts, instrument the marketing site, or touch the newsletter opt-in |
| [marketing-content.md](systems/marketing-content.md) | change the marketing site and its nav, the help and blog pipeline, SEO and OG images, the 404 pages or the demo's wiring |
| [design-system.md](systems/design-system.md) | change the look: tokens, type, rounding, elevation, light and glass, motion, the error taxonomy, the `/design` lab (how design guidance is levelled: [design/README.md](design/README.md)) |
| [testing-verification.md](systems/testing-verification.md) | verify anything: a browser check that disagrees with you, the test accounts and fixtures, the gate, CI and deploys, stale dev CSS |
