---
track: crumbs-8
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "8dc0d0d9"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(guest)/e/[token]/card/
  - src/app/(guest)/e/[token]/page.tsx
  - src/components/app/event-settings/
  - supabase/migrations/20260929100000_like_private.sql
  - src/components/marketing/sections/pricing/
  - src/components/app/pricing/pro-price-list
  - src/lib/events/event-blocks
  - src/components/app/event-blocks/
  - src/app/(app)/account/page.tsx
  - src/components/app/share/event-share-sheet.tsx
  - src/components/marketing/sections/features/guests/
  - content/blog/corporate-event-photo-sharing-pricing.mdx
  - content/blog/AUTHORING.md
  - src/lib/guest/event-card
  - src/lib/db/queries/event-card
  - src/lib/supabase/anon
  - src/lib/db/migration-guards.test.ts
  - src/app/(marketing)/(cinema)/features/guests/page.tsx
  - src/lib/content/llms.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/database-security.md
  - docs/systems/host-app.md
  - supabase/migrations/20260928120000_event_blocks.sql
---

# lp/crumbs-8

**Goal.** Fix what build 17's red-team found (the share card shared across viewers by the edge, Event Settings' crushed cards, like_media's tell, the dark slider, four stale or wrong words) and the two site claims the always-on guest list made false.

## The brief

**Build 17's red-team** (2026-09-29, the alias at `1407daf6`; its ledger is `/Users/gibby/local/ai/partyreel-wt/_scratch/redteam-17/ledger.txt`) passed every journey and found these:

1. **Major: the share card is shared across viewers by the edge.** `/e/<token>/card` (`src/app/(guest)/e/[token]/card/route.tsx`) has answered per viewer since the block: a blocked viewer gets the generic card, everyone else the named one. It still sends `Cache-Control: public, max-age=3600` with no `Vary`, so Vercel's edge serves whichever answer it cached first to everyone, for an hour (`x-vercel-cache: HIT`).
   - After a blocked fetch, an open album unfurls nameless.
   - Before one, the blocked viewer gets the named card while her page says private: a tell.

   Fix: every cacheable URL answers the same for every viewer.
   - The event's card follows the event's own visibility.
   - A viewer the closed door masks is pointed, by her page's metadata, at the private album's card, never the event's named one. The red-team confirmed her HTML already carries neither the event's name nor "blocked".
   - If some answer must differ per viewer, it is never shared (`private, no-store`).

   Pin it with a test on the headers and on which card URL each viewer's metadata names.
2. **Major: Event Settings crushes its last three cards.** This has been on launch-prep since popups-wiring (`5f5e639b`, 2026-09-27); partyreel.com is unaffected.
   - Highlight reel, Profile and Danger zone shrink to 32 px with their titles cut, at 1440 (the panel) and 375 (the screen).
   - So the reel's switch and look, "Show on my profile" and Delete event (its only home) cannot be reached.
   - Cause: `PopupBody className="flex flex-col gap-6"` (`event-settings/event-settings-sheet.tsx:112`), with the Card's `overflow-hidden`, which drops the cards' automatic min-height to 0.
   - Likely fix: `shrink-0` on the cards. Look for the same shape in any other popup body and name it in your Handoff.
3. **Minor: `like_media` tells a block from a private album.** A private album's guest with a row passes the check (ok), while a blocked account gets `not_found`, so a direct RPC call with a known photo id reveals the block.
   - Recommended: nothing on a private album's lock screen can like, so a private album refuses every guest's like with the same `not_found` a block gets.
   - Write the migration from `like_media`'s newest definition (`20260928120000_event_blocks.sql`), with its drift md5s and a rolled-back proof at its foot. The proof shows a blocked account and a private album's guest answer alike, an open album's guest still likes, and the host is unaffected. The Orchestrator applies it.
4. Already fixed by `triage-wiring`: the admin confirms' "Not in the album". Leave it.
5. **Minor: /pricing's Pro size slider has no visible track in a dark system theme.** This dates from 2026-09-20. The WebKit track's gradient uses `var(--color-background)`, which resolves near-black at `:root`, where it should use the card's local `--background` (`sections/pricing/plan-cards.tsx:299`).

**Nits:**
- The plan sheet floors at "1% full": 97.9 MB of 2 TB reads 1% (`pro-price-list.tsx:319`). Under 1%, say so.
- Let back in's restore toast says "back in the album" for an upload that came back hidden (`lib/events/event-blocks.ts:236` and its tests). Say what it did.
- Two stale lines, false since the always-on list and the shift:
  - the Account page's "(the host controls that)" about the guest list (`account/page.tsx:409`);
  - `event-share-sheet.tsx:53`'s comment "THE PRO GATE ON THE SLUG IS UNTOUCHED".
- /pricing's cadence toggle wraps "Yearly, 2 months free" to two lines at 375. Set the tag beside the control, as the plan sheet does.

**Two site claims the always-on guest list made false**, to fix before milestone 30:
- /features/guests still calls the list a host switch ("One switch shows the guest list ... Until you flip it, the list is yours alone", `features/guests/guest-list-section.tsx:78`) and draws the switch (`guest-list-card.tsx:123,138`).
- The blog's FAQ says the same (`corporate-event-photo-sharing-pricing.mdx:11`, `content/blog/AUTHORING.md:209`).

**Paths:** a running lane holds the export paths, the help, the emails and the chrome this batch. Add any other path to `owns` before editing it.

**Verify:**
- Vitest for each fix.
- The rolled-back SQL proof.
- The card's headers and bytes across two viewers, under `next start`.
- Event Settings at 1440 and 375 with every card whole.
- The slider in both themes.
- `pnpm lab:smoke` whole.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The Privacy Policy and the Terms still call the guest list the host's to show**, six sentences:
  `legal-privacy.tsx:305` ("Hosts can turn on a guest list for an event. When it is on ...") and `:311`, `legal-terms.tsx:123`,
  `:414` ("Guest lists are the host's call."), `:419` and `:425`. Since `room=always` they understate who sees a guest's name.
  Legal text, so this lane left them. Recommended: a small legal-copy lane before milestone 30 says the list is always on for
  everyone who can open the album and a guest the host blocks leaves it (the help's own words,
  `content/help/reporting-and-safety.mdx`).
- **The private album's card is `/e/<token>/card?private`**: generic by its address, whatever the event, on the one card route.
  The token is the one the visitor arrived on, so a slug stays a slug. Built. The alternative is one token-free URL for every
  closed door; it needs a new top-level route, because a static sibling of `/e/[token]` would shadow a custom slug. Recommended: keep.

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`: the closed door's list (the card left it; the page's metadata names the private album's card)
  and "The link's image" (one answer per address, whoever asks: the event's own visibility read with no caller, `?private`).
- `docs/systems/database-security.md`: a new ★ under the anon capability reads (a response the edge shares asks with no
  caller, `createAnonClient`; one that must differ per viewer is `private, no-store`), and "A like is only as visible as its
  media" (on a private album only its host's like).

## Deferred (ROADMAP one-liners, bucket named)

- Host: her Uploads feed (`my-uploads-gallery.tsx`, mode `keep`) shows a heart on a private album's photo that now always
  refuses ("Couldn't save that like."), as it already did on a blocked account's; hide the heart where the event reads private.
- Host: the Deleted view's Restore says "Restored. It's back in the album." (`recently-deleted-grid.tsx:95`) for an item
  `restore_media` returns hidden (it answers `status`); say what it did, as Let back in now does.
- Design system: `PopupBody` could keep its children whole itself (`*:shrink-0`), so no flex-column body can crush a clipping
  Card again; `event-share-sheet.tsx:123` and `claims-review.tsx:269` are flex columns today, safe only because no child clips.
- Marketing: `llms.ts:114` says "Albums can be open, link-only, or password locked", naming no private album and calling an
  open one link-only.
- Legal: the guest-list sentences above, if the question is not answered before milestone 30.

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/crumbs-8`:** work `9697006e`; sync `beaed970` (merge of `f6bacfda`: help-wiring and
  emails-wiring merged, crumbs-9 cut; `database-security.md`, one of this lane's reads, auto-merged with both sides' lines);
  owns grew in `3beb0b75` and `c17f815f`; this handoff is the head. launch-prep then moved to `3c37607e` (demo-framing's board
  and records only, disjoint from this lane's paths and reads; `git merge-tree` clean), so no second sync.
- **Gates on the synced tree `beaed970`, each on its own exit code:** `pnpm typecheck` 0; `pnpm lint` 0 (0 errors; the 4
  warnings are in `review-session.tsx`, `contact-form.tsx` and `album-fill-grid.tsx`, none touched here); `pnpm test` 0 (556
  files, 6,297 tests); `zsh scripts/build-lock.sh pnpm build` 0 (`/e/[token]/card` stays `ƒ`); `pnpm lab:smoke --base
  http://localhost:3131` 0 (193 checks, 0 failing). No board, so no `lab:demo`. Logs:
  `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-8/{typecheck,lint,test,build,lab-smoke}-sync.log`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file + the two System-doc edits
  above. No exceptions.
- **1. The share card, one answer per address** (`card/route.tsx`, `page.tsx`, `lib/guest/event-card.ts`,
  `db/queries/event-card.ts`, `lib/supabase/anon.ts`):
  - The card reads the event with no caller and drops the closed door: named for an open or password event, generic for a
    private or unknown one, `?private` generic without a read; still `public, max-age=3600`.
  - Every closed door's metadata names `?private`.
  - Pinned: `card/card.test.tsx` covers headers, two viewers' identical bytes, nothing reading the request, and which card each
    viewer's metadata names (a blocked ticket, a blocked account and a private album deep-equal). `event-card.test.ts` and
    `anon.test.ts` cover the read. 7 of card.test's 10 fail on the old code.
  - Under `next start` (the synced build): two viewers, one bare and one with a ticket-shaped `pr_guest_` cookie and an `sb-`
    auth cookie, got the same bytes (sha256 `d92a823b...`, 40,991 B) and `public, max-age=3600`. `?private` and an unknown
    event got the same generic card (`9ca9090f...`). The open page names `/e/<qr>/card`.
  - A closed page's og:image was NOT exercised end to end: no private event exists, and making a disposable one private was
    refused by the permission layer. So `?private` in a real private page's HTML is the alias red-team's to read once.
- **2. Event Settings:** the body is block flow (`space-y-6`), the form's own layout; pinned by `event-settings-sheet.test.tsx`
  (never a shrinking flex column, the Danger zone last). Measured on a local harness (the real sheet over the Scale probe row,
  since deleted):
  - At 1440 (panel) the reel, Profile and Danger zone cards are 578 / 157 / 146 px.
  - At 375 (screen) they are 617 / 157 / 146 px.
  - Scrolled to its foot, Delete event is in the viewport and hit-tested at both widths.
  - The old `flex flex-col gap-6` reproduces 32 / 32 / 32.
  - Shots: `_scratch/crumbs-8/shots/settings-*.png`.
- **Same shape elsewhere:** `event-share-sheet.tsx:123` and `claims-review.tsx:269` are flex-column popup bodies. In both, no
  child clips. The share sheet was measured at 375x600 and 1440x700: it overflows and scrolls, and every child keeps its
  content height. The claims review was read statically: no child sets overflow. Both are left as they are (Deferred).
- **3. `like_media`:** `supabase/migrations/20260929100000_like_private.sql` refuses every guest of a private album with the
  block's `not_found`; the host still likes, and like_many follows. Pinned in `migration-guards.test.ts` ("a private album
  likes nothing but its host").
  - The rolled-back proof held on live (2026-09-29, the Scale probe): grants; the open album; the private album (G, B and O
    answer one identical `not_found`, like_many refuses G, the host likes); the password album.
  - The control run on the live body is the tell itself: G `{"ok": true}`, B `not_found`.
  - Afterwards live read unchanged: like_media md5 `9b448cf6...`, same ACL, 0 blocks, 1,145 approved, 6 likes, no probe rows.
- **4. (the admin confirms' "Not in the album")** left, as briefed.
- **5. The Pro slider's track** paints with the local `--background`; pinned in `plan-cards-contract.test.tsx`.
  - partyreel.com in a dark system theme shows no track (`shots/prod/slider-mid-1440-dark.png`).
  - This build shows the fill and the track in dark and light (`shots/slider-mid-1440-{dark,light}.png`).
- **Nits:**
  - The fit bar says "under 1% full" under one percent (`fitBarLine`, `pro-price-list.test.tsx`).
  - Let back in says "1 upload is back where it was." / "N uploads are back where they were." (`event-blocks.ts` and its two
    tests).
  - The Account page line now reads "which is everyone with a photo in the album".
  - The share sheet's comment names the server's `isSettingLocked` rather than a Pro gate.
  - /pricing's toggle reads Monthly | Yearly with `yearlySavingTag()` beside it, which Yearly names by `aria-describedby`. At
    375, Yearly is 32 px tall, down from 52 on partyreel.com, the group 40 px, no horizontal scroll (`shots/pricing-375-*.png`).
- **The two site claims:**
  - /features/guests: the copy (its block line), the card (no switch; "Shown on the album", `shots/guests-*.png`) and the
    page's own FAQ, which said the same.
  - The corporate post's FAQ, now with `updated`.
  - `content/blog/AUTHORING.md`'s guest-list line, plus its Privacy and Plans lines the free/pro shift had made false
    (password "(paid)", custom links as Pro's, "short" and "longer" clips).
  - `llms.ts`'s "The host controls whether a guest list is shown".
  - All rendered checked on the dev server, JSON-LD included. ROADMAP's "Marketing: /features/guests still calls the guest
    list a host switch ..." line is done.
- **Assets requested from Will:** none.
- **Board ideas:** the guest-list card lost its one live control; a board could draw what governs the list now (a guest
  who added a photo is on it; the host's Block takes them off) on the card, where the switch taught by being flipped.
- **Proposed migrations:** `20260929100000_like_private.sql`, for the Orchestrator to apply per its header: drift
  `9b448cf60af2e4e115921b5ee2bbd627`, after `3ec0ef855484b21d68b9bfcafc4ecf76`, advisors no delta, no types to regenerate. The
  code does not depend on it, so apply and push in either order. No Worker, Vercel, Stripe or env change.
- **Calls his to overrule:**
  - A private album refuses every guest's like (the brief's recommendation).
  - "back where it was" as the restore's words.
  - The card's `?private` address.
  - The card reads through a new identity-free client (`createAnonClient`) rather than the service role, so it holds anon's
    grants and nothing more.
  - The card footer "Shown on the album" and the block line on /features/guests.
  - The `updated` date on the corporate post.
- **Look at first:**
  - `src/app/(guest)/e/[token]/card/card.test.tsx` and the alias red-team's read of a private page's og:image.
  - The legal-copy question above.
