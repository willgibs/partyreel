---
track: chrome-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "b30445d9"          # the launch-prep SHA the branch was cut from
board: none             # a wiring round: the marketing chrome on site-chrome r1's picks; the board stays for round two (footer-close)
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/marketing/chrome/
  - src/lib/shared/use-scroll-direction.ts
  - src/lib/shared/use-scroll-direction.test.ts
  - src/lib/supabase/middleware.ts
  - src/lib/content/help-slug-pins.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/reviews/site-chrome.json
  - docs/systems/marketing-content.md
  - src/lib/constants/marketing-nav.ts
  - src/lib/constants/marketing-nav.test.ts
  - src/app/(marketing)/marketing.css
  - src/components/marketing/system/section-shell.tsx
  - src/lib/demo.ts
  - src/lib/shared/use-in-view-sentinel.ts
  - src/lib/shared/use-prefers-reduced-motion.ts
  - src/app/(app)/layout.tsx
  - src/app/(auth)/login/page.tsx
  - src/proxy.ts
  - src/app/(dev)/design/sandbox/site-chrome/spec.ts
  - src/app/(dev)/design/sandbox/site-chrome/chrome.tsx
  - src/app/(dev)/design/sandbox/site-chrome/foot.tsx
---

# lp/chrome-wiring

**Goal.** Land Will's eight verdicts on `site-chrome` r1 (his notes verbatim in `docs/design/rulings.md`, the fourth
batch) as production, judged on the alias. Four change bytes: `on-scroll=hide` ("Hides going down, returns coming up"),
`returning=dashboard` ("Dashboard in the CTA's place... A hint, never authorization: the route still checks"),
`foot-door=always` ("Start free always, the demo when it is set"; his note "we should always have a demo event set and
ready"), `two-doors=one` with his reading confirmed in plan mode ("Yes, both doors open the page": the Resources card is
the PRIMARY door to `/how-it-works`, the Features panel's line the quieter second, the help article linked from nowhere in
the chrome). Four are today's chrome and stay, stated in the Handoff as no-ops: `shape=panels` ("far more full,
established, and trustworthy"), `holds=four` ("Resources adds a ton of additional content and trust value"),
`phone=sheet`, `foot-job=three` (the footer's registers stay as today; `footer-close`, round two of the board, explores the
foot against the closing CTA). NOT in this lane: the board `src/app/(dev)/design/sandbox/site-chrome/` and its
registration lines (round two's, another lane); the footer's shape beyond the action's decoupling; the header's material
(`glass` round two); `marketing-nav.ts` (read only: every pin in `marketing-nav.test.ts` stays green, the Product column's
four hrefs included).

**`on-scroll=hide`.** In `chrome/header-shell.tsx` (already `"use client"`; the crossfade keeps its IntersectionObserver
sentinel and its `useSyncExternalStore` pre-paint read): a new scroll-direction store `src/lib/shared/use-scroll-direction.ts`
beside `use-in-view-sentinel.ts` (a passive scroll listener is the one honest way to read direction; rewrite the WHY of
the "never a scroll listener" comment in `header-shell.tsx`, do not delete it: the crossfade never needed one, direction
does). The bar translates off (`-translate-y-full`, about 220 ms, `ease-in-out-strong`, `motion-reduce:transition-none`)
once `stuck` AND the scroll has moved down past a small hysteresis (about 8 px), and returns on ANY upward movement, at
the top, on `focus-within` (a keyboard user tabbing into it), and never hides while a nav trigger is open or the phone
sheet is open. The same on `overlay=false` pages (paper, the root 404). ★ `--mkt-header-h` stays `4rem` in
`marketing.css`: every anchor's `scroll-mt`, the sticky rails, the negative-pull heroes and the sheet's mirrored row read
it (about fourteen consumers); the `z-40` sticky box stays and only the transform moves.

**`returning=dashboard`.** A presence HINT, never authorization: a new `chrome/session-hint.tsx` (`"use client"`,
`useSyncExternalStore` with the server snapshot `false`, so the ~50 prerendered marketing routes hydrate identically and
correct before paint) that swaps the header's Log in + Start free pair (`marketing-header.tsx`) for ONE primary
`Dashboard` button to `/dashboard` (`trackAttrs` with `cta: "dashboard"`), and the phone sheet's foot (`mobile-menu.tsx`)
the same; the footer's Start free stays as it is (it goes to `/login`, which already redirects a signed-in host). The
signal: check locally, signed in, whether `@supabase/ssr`'s `sb-<ref>-auth-token` cookies are readable from
`document.cookie`; if they are, read the prefix; if they are HttpOnly, set and clear a tiny non-HttpOnly presence
cookie in `updateSession` (`src/lib/supabase/middleware.ts`, which the proxy runs on every route), a boolean and nothing
else, with a WHY comment that `getUser()` in `(app)/layout.tsx` stays the boundary. Say which in the Handoff.

**`foot-door=always`.** `marketing-footer.tsx`: Start free moves ABOVE the `if (!DEMO_EVENT_URL)` early return, so no demo
means the thesis and the action; with a demo set, the sign-off as today. Decide the `hidden lg:inline-flex` gate
consistently (the board draws Start free at every width when no demo and `lg`-only when there is one; pick one rule and
say so); the mobile "Open the demo album" link stays with the demo. `footer-contract.test.ts` gains the pin (a render of
`SignOff` with `@/lib/demo` mocked both ways: Start free present in both, the code only with the URL); keep
`cn("surface-ink"` as the first argument and no literal `dark` token in the file. His "always have a demo event set" is a
ROADMAP launch line already (no guard exists on `NEXT_PUBLIC_DEMO_QR_TOKEN`, inlined at build).

**`two-doors=one`.** `mega-panel.tsx`: the Resources card's `href` from the help article to `/how-it-works`, its title
and blurb naming the page (the loop, host and guest, six steps a side; no "help center"); the Features panel's "New here?
See how it works" line stays as the quieter second door; the article is linked from nowhere in the chrome (the page's own
foot and the help hub keep theirs; `src/lib/content/help-slug-pins.test.ts`'s referrer comment for `how-partyreel-works`
updated). Optional, if cheap (a ROADMAP line): the footer Product column's `/#faq` leaving `/pricing`, which has its own
`#faq`; leave it and say so otherwise.

**Binds.** The bible; `footer-contract.test.ts` (source pins: `surface-ink` first, no `dark`, `footer-qr.tsx` server-only,
the glow on `<Glow>`); `marketing-nav.test.ts` whole (`PRIMARY_NAV` labels, the header-to-footer mirror, the Product
column exactly `["/how-it-works","/pricing","/reel","/#faq"]`); `keyframe-uniqueness`, `content-policy`, `marketing-h1-policy`;
the portal rule in `mobile-menu.tsx` (`portalSkinProps`); the voice rulings for any new line; no em-dashes. A contract
test guards function, never look. Calls that stay Will's, stated in the Handoff: the hysteresis and the return on any
upward scroll; the bar never hiding with a panel open; Dashboard as one button replacing both; Start free's width rule
with the demo unset; the card's new label with the Features line kept.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8 known
  warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3132`; `DESIGN_PREVIEW_KEY` in the
  environment, never on a command line.
- Tests, function never look: `// @contract-for:` tests beside `header-shell.tsx` (the bar hides only when stuck and
  moving down; returns on up, at top, on focus-within; never with a trigger open; reduced motion honoured; a source pin
  that `marketing.css` still declares `--mkt-header-h: 4rem`), beside `session-hint.tsx` (the server snapshot is
  `false`; the label swaps on the signal), and the footer pin above.
- Locally at 1440 and 375: the home, `/privacy` and `/nope`: scroll down (the bar leaves), up (it returns), a panel open
  while scrolling (it stays), Tab into the hidden bar, reduced motion; signed out Log in + Start free, signed in
  Dashboard in their place in the header and the sheet's foot; the footer with the demo set (the code and Start free) and
  with the token unset (the thesis and Start free); the Resources card and the Features line both open `/how-it-works`;
  captures read against the pick each lands. The Orchestrator repeats the list on the alias.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/marketing-content.md`: the chrome facts refined in place (the hiding bar, the presence hint, the footer's action decoupled from the demo, the Resources card pointing at the page); list the lines here.

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: design:rules ok, specimens ok, typecheck ok, lint ok (8 known), test ok (N), build ok (M pages); `pnpm lab:smoke` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The picks landed, one line each (the four that changed bytes, the four no-ops named), which presence signal was taken and why, and the calls his to overrule
- Assets requested from Will: none, or one per line
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (a presence cookie is not an env change)
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
