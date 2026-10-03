---
track: take-home
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "192884f1"            # the launch-prep SHA the branch was cut from
board: take-home
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/take-home/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/uploads-and-r2.md
  - docs/systems/guest-flow.md
  - src/components/shared/media-lightbox-parts/actions.tsx
  - src/components/guest/event-experience.tsx
  - src/lib/media/share-save.ts
---

# lp/take-home

**Goal.** A new board: how guests and hosts take photographs home, from Will's note: a guest's one-press Download all against Select, Select all, Save; a host's originals beside an optimized download for quick posts; and what a guest's Save gives.

## The brief

**Why.** Will's note from his live walk on 2026-10-02, verbatim: "I was also thinking that 'download all' being such an easy clickable button for guests may shoot us in the foot. for the guest event page, may be easier to drop the direct 'download all' in favor of hitting select then selecting all, then save (the slight friction could reduce our resource expenditure massively if less guests grab everything just because it's an easy 1-click, once they're selecting they may as well get exactly what they want). host benefits massively from everything at full quality, could also include an optimized download option (like to grab everything on a phone for quick social posts, not the version that gets saved to a backup hard drive to keep forever later)."

**Facts for the board** (state them in its context layer, plainly): Cloudflare R2 charges nothing for downloads (egress); what a guest's Download all costs is the export Worker's run time and R2's read operations, both small, so the question is mostly what serves guests and hosts best. A guest's Save on a phone opens the share sheet with the file (`src/lib/media/share-save.ts`); its speed is the `save-speed` lane's (running now: Save is to feel immediate). Downloads end and say how (`export-ends`).

**The board** (`take-home`, new; desk 70, independent of the others; surface `shared`): every option drawn on production's album (the cover and the shutter as built) and its viewer, at 375 and 1440, guest and host. Asks yours to shape, for instance:
- `guest`: how a guest takes photographs home (one-press Download all as today; Select, Select all, Save; Save one at a time from the viewer; or your better answer), with what each costs her in taps and what it costs the platform.
- `host`: how a host takes everything home (originals for the archive beside an optimized set for quick posts; how each is named and offered).

**Who asks what this round:** identity owns the atoms (draw in production's); the hub's head and its rooms are `event-header` r2's; a delayed album's wait is `the-wait`'s.

**The direction** (Will's notes, 2026-10-02): bespoke and experiential, sleek and modern, sophisticated (never tilted or playful-messy), minimal yet high-information with far less text, media as the colour. Who it is for, his words: "remaining a modern consumer app usable for anyone at any event ... would rather frame this as cool to a younger expected host/guest crowd, probably 18 [parties] to 50ish [event guests, conference attendees). Don't want to build a boring app just for the least tech-friendly guests." And: "Everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility." His role: "I'm just the tastemaker ... drive your best ideas ... as the world's leading design engineer." Draw your boldest real answers; he picks and steers. Atoms are identity's board (draw in production's).

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/take-home/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `take-home`, its title, `surface`, `desk: 70` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and drawn on the board as a carried call (`spec.ts` `carried`), Will's to overrule; none is a
one-way door (every answer is a lab pick or a reversible pipeline line).

- `size`: How big is phone size? **2048 px on its long side, a JPEG**: sharp in any post and on any phone, about a fifth of
  an original's bytes (an iPhone camera photo is 2.9 MB at 12.2 MP, Will's own 2026-10-02 measure; phone size about
  0.55 MB). Overrule: 1080 px (a post's own width) or 3072 px (nearer a print's).
- `made`: Where is a phone-size copy made? **In the uploader's browser beside the tile's preview** (`src/lib/upload/preview.ts`,
  the precedent uploads-and-r2.md gives previews: no transform fee, no new service), about 20% more storage, its PUT
  size-bound and capped like the preview's (an unmetered variant at a server-built key is the preview's own cap-evasion
  risk; metering it is the wiring's call). Overrule: on the way out, Cloudflare's image transforms through an Images
  binding in the export Worker ($0.50 per 1,000 unique photos a month past 5,000 free; an Images Paid plan, a new paid
  service to surface before adopting, CLAUDE.md's "no recurring SaaS before revenue").
- `clips`: What does phone size do to a clip? **Leaves it as taken** (a phone's clip is already a post's size). Overrule:
  1080p copies by Media Transformations ($0.50 per 1,000 output seconds a month; input under 100 MB, output a minute at
  most, so a longer clip would still come as taken).
- `sheet`: How much does one share sheet carry? **Up to 100 MB** (`SHARE_FILE_MAX_BYTES`, the product's line for a big file);
  past it a Save goes in parts, a tap each, as a big zip already does. Unmeasured on a device (Deferred below).
- `desk`: What does a guest's Save give at a desk? **One zip of the originals through today's walk**; the guest mint already
  narrows a zip by `ids` (uploads-and-r2.md "Download all"); a single photo downloads as itself.
- `yours`: Where does Yours go once Download all leaves? **Into select mode, beside All**: one press picks every photo of hers
  (the set View's Yours already filters, `src/lib/guest/yours-filter.ts`; a zip of them is the server's Yours read).
- The three picks the board recommends, each with its reason on the board: `guest=select`, `save=light` (after `guest`),
  `host=two`.

## System-doc edits (in place, owned facts only)

- none: lab only, and no gotcha found that a system doc owns.

## Deferred (ROADMAP one-liners, bucket named)

- A real-device pass: how many files and bytes one share sheet takes on an iPhone and on Android before it fails or
  stalls, measured before a bulk Save picks its 100 MB line (from `take-home`).

## Handoff (replaces the chat report)

- Work commit `297013a0` (the board, eleven files), pushed to `origin/lp/take-home`. Launch-prep moved since the cut
  (`192884f1` to `642c04d6`: event-header-r2's merge `50e7a359` in its own board folder, and records), touching none of
  this lane's `reads` and no file of its folder, so no sync (PROGRAM.md "Sync").
- Gates on `297013a0`, each its own exit code (logs in `../partyreel-wt/_scratch/take-home/gate-*.log`): `pnpm typecheck`
  0; `pnpm lint` 0; `pnpm test` 0 (785 files, 9,269 tests, the board's own `model.test.ts` among them); `zsh
  scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3136` 0 (5 checks, the board 887 words
  of 1,200); `pnpm lab:demo --board take-home --base http://localhost:3136` 0 (3 steps, every option drawn, every
  stage whole above the dock at 1440 and 375), again 0 with `--width 375`, and 0 wearing `--state guest-screen=1440
  --state guest=select`.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/take-home/` (eleven
  files) + this manifest.
- Items:
  - `guest` (a Screen knob, her phone first): Download all as today; Select, then Save (recommended: Select in the count
    row; select mode's bar sticky with Cancel, her latest picks and the count, Yours and All; production's own select
    marks; the shutter turned to Save, her count on its shoulder); Gather as she looks (the lane's own: a + in the
    viewer's capsule, a tray round beside the shutter, a card that saves the tray whole); One at a time.
  - `save` (after `guest`, drawn on the selection her way leads to: Everything, her 24, the tray's 9, one photo): One zip
    as today (into Files); Into Photos at full quality (the share sheet, in parts past 100 MB); Into Photos at phone size
    (recommended). Every wait is drawn at one stated moment (3 s at a party's 10 Mbps, `model.ts`), so two rings differ
    by their bytes alone, and Photos' info line shows what each Save gave (4,032 by 3,024 at 2.9 MB, or 2,048 by 1,536
    at 563 KB).
  - `host` (her desk and her phone side by side, the hub scrolled to its album as built): One Download, the originals;
    One menu, two sizes (production's tabs atom at the menu's head); Keep and post, named for use (recommended: a panel
    of Originals and Phone size, each pictured by the album, the desk leading with Originals and a phone with Phone
    size); Each screen its own.
  - The opening states the cost plainly: R2 egress free, a whole-album zip under a tenth of a cent (its Class B reads and
    the Worker's CRC; verified against Cloudflare's R2 and Workers pricing on 2026-10-02 and `workers/export/wrangler.jsonc`).
  - Every frame is production's own composition: `AlbumCover` over `HeadStills`, `GuestActionDock`, `Shutter`, `Button`,
    `FaceCredit`, `ProgressGlyph`, `LIGHTBOX_ACTION`, `downloadMenuNote`, `Tabs`, `Switch`; the responsive menu and the
    walk's toast quoted string for string (the menu cannot be drawn in a frame, ROADMAP "The lab and the kit"); the
    phone's share sheet, Files and Photos drawn as plain diagrams, never as ours.
- Assets requested from Will: none (the bootstrap stills stand in; the wiring draws production's own photographs).
- Board ideas:
  - If phone size is made, the viewer on a phone could draw it in place of the original (a fifth of the bytes, every
    photograph sharp sooner on a party's network) and keep the original for a desk and for Save.
  - A host's own word over how guests take photos home (every photo, picks, or one at a time) for an event that wants
    its album kept close; none today, and Download all reaches every guest who can see the album.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none for the board. Its picks as recommended would add,
  in their wiring, a phone-size variant (a key in `src/lib/r2/keys.ts`, its making in `preview.ts`, its bound and cap at
  presign and complete) and a size on the export mint; no migration.
- Calls his to overrule: the six carried calls above, and the three recommendations (`guest=select`, `save=light`,
  `host=two`).
- Look at first: `take-home.guest` at 375, Select's second frame (the shutter turned to Save); then `take-home.save` worn
  on Select (`?guest=select`), the two Photos rings side by side; then `take-home.host`'s panel of two at the desk and
  on the phone.
