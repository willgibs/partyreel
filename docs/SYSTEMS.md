# Systems index

> One line per system doc: open the one your task touches before you touch it. Each opens with the questions it
> answers and keeps what the code cannot tell you: the invariants, the ★ landmines, the project's own facts. How we
> work is [`../CLAUDE.md`](../CLAUDE.md); where things stand, [`STATUS.md`](STATUS.md).

| Open | when you are about to |
| --- | --- |
| [architecture.md](systems/architecture.md) | work across systems (the route groups, the two stores of truth, the data flows, the scheduled jobs), revalidate a path, or chase a host page that renders but never hydrates |
| [auth-accounts.md](systems/auth-accounts.md) | change sign-in (the one account door, codes, passwords, Google, passkeys) or a Supabase Auth dashboard setting, a display name, an avatar, the `/welcome` gate or account deletion |
| [guest-flow.md](systems/guest-flow.md) | change the event link `/e/[token]`: who counts as a guest, visibility and the password gate, the door and the confirm doors, the live gallery, demo mode |
| [dashboard.md](systems/dashboard.md) | change the host dashboard: its stage and week, the events list, the storage ring, the claims review |
| [host-app.md](systems/host-app.md) | change a host surface: creating an event, the QR designer and print, the custom link, the welcome, the event page and its settings, moderation, the Guest cards |
| [reel.md](systems/reel.md) | change the highlight reel (when it exists, its take, the tile, the view that is also the screen, the host's card and defaults, the platform lever) or the clip (the creator, Add to event), or a word either says |
| [disposable-mode.md](systems/disposable-mode.md) | touch the develop or the camera: `develops_at`, `capture` and the roll, a row's seal (`sealed_until`) and its one predicate in any guest read, what waits on the guest's sync, the develop and its sweep, a guest's withdrawn shot |
| [uploads-and-r2.md](systems/uploads-and-r2.md) | touch the upload pipeline, an R2 key, client or presign, the EXIF strip, or how media renders (tiles, previews, posters, the viewer) and downloads (Save, Download all) |
| [drive-export.md](systems/drive-export.md) | touch Send to Google Drive: connecting a Google account and its tokens, a send (the press, its snapshot, the names, the lanes, its words and mails), the `partyreel-drive` Worker and its protocol, or its operator controls and the leak runbook |
| [billing-caps.md](systems/billing-caps.md) | change a price or a limit, anything that decides whether an upload, a restore or a plan change fits, Stripe checkout, change-plan or the webhook, or the in-app pricing surface and the Plan card |
| [lifecycle-recovery.md](systems/lifecycle-recovery.md) | add or change a purge-cron sweep, touch deleting and restoring (the 30-day window, Deleted in storage and making room from it, the Deleted filters) or the over-cap, lapsed-pass and inactivity sweeps, or send an email |
| [durability-backups.md](systems/durability-backups.md) | touch anything that deletes R2 objects, the backup Worker and its prune, or the DB backup; restore from backup; reason about R2 cost and scale |
| [admin-observability.md](systems/admin-observability.md) | change the admin portal (its seam, MFA, the two-deployment perimeter, a surface), add a backend job or a kill switch that must report its health, or add a Sentry capture |
| [trust-safety-forensics.md](systems/trust-safety-forensics.md) | touch a hard-delete path (legal holds) or the forensic capture, or handle a report, a hold or a CSAM incident |
| [database-security.md](systems/database-security.md) | add or change an RPC, a column, a table or a grant, read more than 1,000 rows, rate-limit a route, or write a migration |
| [profiles-social.md](systems/profiles-social.md) | change who is listed or counted as a guest, `/u/[slug]`, follows, blocks, reporting a person, handles, bios or email preferences |
| [notifications-analytics-growth.md](systems/notifications-analytics-growth.md) | feed the host's bell, touch the QR-scan counts, instrument the marketing site, or touch the newsletter opt-in |
| [marketing-content.md](systems/marketing-content.md) | change the marketing site and its nav, the help and blog pipeline, a public form, SEO and OG images, the 404 pages or the demo's wiring |
| [design-system.md](systems/design-system.md) | change the look: colour and the theme sets, light, type, corners, shadows and glass, motion, a floating panel or a toast, the album tile, a marketing page's chapters, the error taxonomy, the `/design` lab |
| [testing-verification.md](systems/testing-verification.md) | verify anything: a browser check that disagrees with you, the test accounts and fixtures, the gate, CI and deploys, stale dev CSS |
