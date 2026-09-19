---
track: chrome-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- none. Nothing blocked the build; the four calls the goal named as his to overrule are answered in the
  Handoff with what was built and why, and one new call (the footer action's width rule) joins them there.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/marketing-content.md`, three edits in place, all inside this lane's paths:
  - **The nav**, after the glass sentence: two new starred paragraphs. THE BAR LEAVES GOING DOWN AND RETURNS
    COMING UP (both postures, transform alone, `--mkt-header-h` stays `4rem` and ~14 consumers never move;
    the 8px commit past a one-header-height reveal zone; the three escapes as ONE compound selector;
    `transition-[translate]` never `transition-transform`; the one passive rAF-coalesced listener in
    `use-scroll-direction.ts`, and the glass's own signal staying on its observer). THE RIGHT CLUSTER IS THE
    ONE PERSONAL THING IN THE CHROME (the island, the `false` server snapshot, the sheet's foot swapping with
    it, the cookie-prefix signal and why no presence cookie is needed, and A HINT NEVER AUTHORIZATION).
  - **Pages + their single-sources**, the `/pricing`, legal bullet: ONE IDEA, ONE PAGE, TWO DOORS TO IT (the
    Resources card primary, the Features footnote quieter, the help article linked from nowhere in the chrome
    and where it still lives).
  - **THE FOOTER (the ink slab)**, the three-registers sentence: THE ACTION IS NOT PART OF THE INVITATION
    (above the `DEMO_EVENT_URL` early return, every width, both states, and the paper routes that used to end
    with nothing to do).

## Deferred (ROADMAP one-liners, bucket named)

- **Now / marketing:** tabbing into the hidden bar costs the reader 482 px of scroll position (measured at
  1440 on the home and `/privacy`). The bar returns and focus is visible, so nothing is trapped; the jump is
  Chrome's scroll-into-view iterating ~7 times at 64 px against a sticky element it can never reveal, then
  giving up. Rare in practice (Shift+Tab scrolls UP first, which returns the bar before focus arrives), so it
  is a polish line, not a blocker. A keydown-on-Tab return would pre-empt it if it is judged worth a listener.
- **Now / marketing:** the footer Product column's `/#faq` still points at the home page's FAQ from every
  page, while `/pricing` carries its own `#faq`. Left alone deliberately: `marketing-nav.ts` is read-only in
  this lane and every pin in `marketing-nav.test.ts` had to stay green.
- **Now / analytics:** the phone sheet's foot actions (Log in, Start free and now Dashboard) carry no
  `trackAttrs`, so a conversion click from the phone menu is invisible while the header's is counted. Left as
  today rather than instrumented inside a wiring lane.
- **Now / docs:** `features/page.tsx` had already stopped referring to the `how-partyreel-works` help slug and
  was never swept out of `help-slug-pins.test.ts`; corrected here while the chrome's own referrer left.

## Handoff (replaces the chat report)

- Head `37035616` with this manifest commit on top, pushed. `origin/launch-prep` HAD moved (one commit,
  `304a813b`, docs only); merged, never rebased, and the whole gate re-run on the merged tree.
- **Gates on the synced tree, each on its own exit code:** `pnpm design:rules` ok · specimen collector ok ·
  `pnpm typecheck` ok · `pnpm lint` ok (the 8 known warnings, 0 errors) · `pnpm test` ok (2,609 on 247 files) ·
  `pnpm build` ok (254 pages) · `pnpm lab:smoke --base http://localhost:3132` ok (447 checks, 0 failing).
  The dev server ran on 3132 only and was killed by port before every build, test run and the handoff.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`), 17 files plus this manifest:
  `src/components/marketing/chrome/{header-shell,marketing-header,marketing-footer,mega-panel,mobile-menu,session-hint}.tsx`,
  `src/components/marketing/chrome/{footer-contract.test.ts,footer-door-contract.test.tsx,header-shell-contract.test.tsx,session-hint-contract.test.tsx}`,
  `src/lib/shared/use-scroll-direction{,.test}.ts`, `src/lib/content/help-slug-pins.test.ts`,
  `docs/systems/marketing-content.md`. THREE outside `owns`, all mechanical consequences of adding contract
  tests, none of them a design or product change: `docs/design/library.md` and
  `src/app/(dev)/design/rules/rules.generated.json` are what `pnpm design:rules` writes (a named gate step), and
  `src/app/(dev)/design/rules/component-notes.ts` gains three `for` lines because `gallery.test.ts` FAILS on a
  contracted file without one; they went at the head of the map, where that file's own note asks this round's
  wiring lanes to put them so three merges do not land on each other. `src/lib/supabase/middleware.ts` is
  untouched (see the presence signal below), and `marketing-nav.ts`, `marketing.css`, `section-shell.tsx`,
  `src/proxy.ts`, `src/lib/demo.ts` and the board's four files were never opened for writing.
- **The picks, one line each.**
  - `on-scroll=hide` (changed bytes): a new store `src/lib/shared/use-scroll-direction.ts` (the site's one
    passive, rAF-coalesced scroll listener, attached only while something reads it, its machine exported pure
    so the rules are tested as arithmetic) drives both header postures; the bar translates off once the reader
    commits 8 px past a one-header-height reveal zone and returns on ANY upward movement, at the top and on
    `:focus-within`, never with a nav panel or the phone sheet open, honouring reduced motion by keeping the
    function and dropping the slide. `--mkt-header-h` stays `4rem` and the sticky `z-40` box is untouched.
  - `returning=dashboard` (changed bytes): `chrome/session-hint.tsx`, a client island on
    `useSyncExternalStore` with the server snapshot `false`; the header's Log in + Start free pair and the
    phone sheet's foot both become one primary `Dashboard` to `/dashboard` (`trackAttrs` `cta: "dashboard"` in
    the header). The footer's Start free stays as it is.
  - `foot-door=always` (changed bytes): Start free is now a `StartFree` component rendered ABOVE the
    `if (!DEMO_EVENT_URL)` early return, in both branches, at every width.
  - `two-doors=one` (changed bytes): the Resources card goes from `/help/how-partyreel-works` to
    `/how-it-works`, titled "How it works" with "The whole loop on one page, the host's side and the guest's.";
    the Features panel's "New here? See how it works" stays as the quieter second door; the help article is
    linked from NOWHERE in the chrome (verified in the browser: zero `header a[href*=how-partyreel-works]`).
  - **The four no-ops, named:** `shape=panels`, `holds=four`, `phone=sheet` and `foot-job=three` are today's
    chrome and changed nothing. `PRIMARY_NAV` still holds three contiguous panel groups and a flat Pricing;
    the phone still gets the single-open accordion sheet; the slab still runs sign-off, sitemap, legal bar.
- **Which presence signal was taken, and why.** The COOKIE PREFIX, read from `document.cookie`; no presence
  cookie was added and `src/lib/supabase/middleware.ts` is untouched. `@supabase/ssr`'s
  `DEFAULT_COOKIE_OPTIONS` set `httpOnly: false`, and `createBrowserClient` uses `document.cookie` AS its
  session storage, so the auth cookies are JS-readable BY CONSTRUCTION: if they were not, every client
  component holding a Supabase session would be broken. The name is matched by SHAPE
  (`sb-<anything>-auth-token`, optionally `.0` / `.1`) rather than derived from the project ref, so a ref
  change or a chunk-suffix rename cannot silently take the hint down; the exact shape was read out of
  `@supabase/supabase-js` (`sb-${hostname.split(".")[0]}-auth-token`) and `@supabase/ssr`'s chunker
  (`/^(.*)[.](0|[1-9][0-9]*)$/`), and the name must END at the token so a SIGNED-OUT visitor's mid-OAuth
  `-auth-token-code-verifier` cookie can never read as a session (a contract test holds that case).
- **The calls that stay his to overrule.**
  1. THE HYSTERESIS AND THE EAGER RETURN: 8 px of committed downward movement to leave, and any upward
     movement at all to come back. Asymmetric on purpose (a bar that leaves was not asked for, a bar that
     comes back was), and the clocks match it: 220 ms out on `--ease-in-out-strong`, 150 ms back on
     `--ease-emphasis`.
  2. THE REVEAL ZONE: the bar cannot hide inside the first 64 px (one `--mkt-header-h`), so the head of every
     page always carries the bar and an elastic overscroll can never flicker it.
  3. THE BAR NEVER HIDES WITH A PANEL OR THE SHEET OPEN, and never while focus is inside it.
  4. DASHBOARD AS ONE BUTTON REPLACING BOTH, plain, in the CTA's place, matching the board's drawing. The
     sheet's foot does the same, so a signed-in host never meets two doors to a login they do not need.
  5. START FREE'S WIDTH RULE, which the goal left open: ONE rule, visible at EVERY width in BOTH states,
     rather than the board's split (every width with no demo, `lg`-only with one). The `lg`-only half fails
     the pick's own reason on a phone, where /about and the 404 would still end with nothing to do; at 375
     with a demo set it reads as a ladder (a quiet "Open the demo album" link to look, a bordered "Start
     free" to act), not as two competing offers. Capture 14 is that state.
  6. THE CARD'S NEW LABEL: "How it works" and "The whole loop on one page, the host's side and the guest's.",
     with the Features footnote kept verbatim. The title is the page's own name, deliberately flat, because a
     primary door should not be clever about where it goes; the blurb still refuses to COUNT steps, which is
     this file's standing rule (the card once said four, the article writes five, the page walks six).
  7. Observed, worth his eye: a same-page anchor jump downward (a help TOC entry, an in-page link) reads as
     scrolling away and takes the bar with it. Left as is: the reader who jumped to a heading is about to
     read, which is exactly when the pick wants the bar gone, and the anchor's own `scroll-mt` still reserves
     the 64 px so nothing lands under a bar that might come back.
- **Assets requested from Will:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none. No presence cookie was needed, so
  nothing was added to `updateSession` either.
- **Not run, stated rather than skipped:** the signed-in check on a REAL session. The browser pane carries no
  Google session, so "Continue with Google" landed on Google's email-and-password form rather than the
  account CHOOSER, and a password is never typed; the tab was taken straight back to localhost. What WAS
  verified instead: the swap at 1440 and 375, in the header and in the sheet's foot, against the exact cookie
  name the shipped `@supabase/supabase-js` derives, plus the chunked and the mid-OAuth-verifier cases as
  contract tests. The real-session pass belongs to the Orchestrator's alias walk in Will's own Chrome.
- **Verified locally at 1440 and 375** on the home, `/privacy` and `/nope`, on a real wheel gesture and by
  probe: the bar leaves going down and returns coming up and at the top; it stays with the Features panel
  open while the page scrolls (capture 04 against capture 02 at the same scroll); Tab lands focus on the logo
  INSIDE the bar and brings it back; under emulated `prefers-reduced-motion: reduce` the bar still gets out of
  the way with the transition off; signed out shows Log in + Start free and signed in shows Dashboard, header
  and sheet; the footer carries the code AND Start free with the demo set, and the thesis AND Start free with
  `NEXT_PUBLIC_DEMO_QR_TOKEN` unset (the dev server was restarted with it commented out, then restored); both
  nav doors resolve to `/how-it-works` and no chrome link reaches the help article.
- **Captures** (20 PNGs, true viewport widths at DPR 2, one per state, named for the pick each lands):
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/924675e3-0148-4e81-9dca-d9c2f1952d0a/scratchpad/chrome-wiring/captures/`
- **Look at first:** capture 02 against 03 (the bar leaving and coming back at the same place on the home),
  capture 14 (Start free under the demo invitation at 375, the width call above), captures 19 and 20 (the
  footer with the demo token unset, which is the case the pick exists for), and capture 09 (the Resources
  card as the primary door).

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-19). The marketing chrome took Will's four byte-changing
verdicts on `site-chrome` round one. The bar now leaves going down and returns coming up, on both postures
and by transform alone, so `--mkt-header-h` stayed `4rem` and its fourteen consumers never moved; direction
came from a new shared store holding the site's one passive, rAF-coalesced scroll listener, and the "never a
scroll listener" rule was rewritten rather than deleted, narrowed to the boolean an observer can answer. A
returning host is offered one Dashboard button in the CTA's place, in the bar and in the phone sheet, from a
client island whose server snapshot is `false` and whose signal is the Supabase cookie prefix, which
`@supabase/ssr` leaves JS-readable by construction, so no presence cookie was needed. Start free moved above
the footer's demo check and out of its `lg` gate, so no paper route ends with nothing to do. The Resources
card became the primary door to `/how-it-works` with the Features footnote as the quieter second, and the
help article left the chrome entirely.
