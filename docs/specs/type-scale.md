# The type scale: the ladders, as proposed

> **ROLE:** the type-scale exploration's proposal (the review wave, 2026-09-14; `lp/type-scale`,
> integrated `838a5f6`), kept here so it outlives the track manifest: the four ladders as token
> tables, and what the wiring round inherits when Will rules. **NOT LAW** until ruled; bible 5
> inherits the ruled ladder and the tracking law. The board is `/design/c/type-scale` while it stands;
> the ladder data is `src/app/(dev)/design/sandbox/type-scale/ladders.ts` (`tokenTable()` generates
> every table below) with `ladders.test.ts` pinning its laws.

**The asks on the board:** the marketing ladder (today, A tuned, B rungs or C registers); the app
ladder (the same four); the tracking law (leading and tracking named per step, running inverse to
size: adopt, or keep the flat -0.03em); the face pairing (keep Inter with Urbanist, or open a face
round; the board's own verdict is that the pairing holds).

**The three faults today's ladder carries** (what the candidates answer): at 375 three distinct
sizes do the work of six (`title` and `chapter` both 36px, the masthead four pixels above the home
hero); line-height arrives with whichever Tailwind size class a ramp lands on, so the one hero that
needed a real value invented `leading-[1.02]` locally; and `font-heading` tracks a 160px masthead
and a 16px card title at the same -0.03em, against the design system's own written rule that
letter-spacing and line-height run inverse to size.

**The departures flagged:** C collapses marketing's six heading steps to five and folds the 24/30
prose tier into the section step (against the documented three-tier h2 ladder; its argument, not an
oversight); C drops the app page title from 24 to 20 and the card title from 16 to 14 (the loudest
claim, the first to reject if it reads cheap); B states bible 2 as arithmetic (marketing travels
four rungs between 375 and 1440, the app one), a bible finding if B is adopted.

### The token table the wiring round bakes

One clamp per step, the line through (375, phone) and (1440, desktop), so the ladder is continuous
and there is no breakpoint left to jump at. Leading is emitted as a rem LENGTH, because a unitless
line-height cannot sit inside a clamp and a step whose leading tightens as it grows needs one;
tracking stays in em, which already rides the fluid size. The board prints whichever table is
selected, and `tokenTable()` in `ladders.ts` generates all four, so nothing here is retyped by hand.

**Today, resolved (the reference, not a proposal)**

```
--text-display     clamp(3.25rem, 0.873rem + 10.14vw, 10rem)   lh clamp(2.763rem, 0.743rem + 8.62vw, 8.5rem)   ls -0.03em
--text-hero        clamp(3rem, 1.944rem + 4.51vw, 6rem)        lh clamp(3rem, 1.944rem + 4.51vw, 6rem)         ls -0.03em
--text-title       clamp(2.25rem, 1.458rem + 3.38vw, 4.5rem)   lh clamp(2.5rem, 1.796rem + 3vw, 4.5rem)        ls -0.03em
--text-chapter     clamp(2.25rem, 1.722rem + 2.25vw, 3.75rem)  lh clamp(2.5rem, 2.06rem + 1.88vw, 3.75rem)     ls -0.03em
--text-section     clamp(1.875rem, 1.479rem + 1.69vw, 3rem)    lh clamp(2.25rem, 1.986rem + 1.13vw, 3rem)      ls -0.03em
--text-prose       clamp(1.5rem, 1.368rem + 0.56vw, 1.875rem)  lh clamp(1.999rem, 1.911rem + 0.38vw, 2.25rem)  ls -0.03em
--text-page        1.5rem                                      lh 1.999rem                                     ls -0.03em
--text-subsection  (none)
--text-card        1rem                                        lh 1.375rem                                     ls -0.03em
```

**A. Tuned** (every desktop number kept; the phone end unpacked, the leading named, the tracking
inverse to size; the app deliberately untouched, which is its cost)

```
--text-display     clamp(4rem, 1.887rem + 9.01vw, 10rem)       lh clamp(3.52rem, 1.731rem + 7.63vw, 8.6rem)    ls -0.045em
--text-hero        clamp(2.75rem, 1.606rem + 4.88vw, 6rem)     lh clamp(2.75rem, 1.732rem + 4.34vw, 5.64rem)   ls -0.04em
--text-title       clamp(2.25rem, 1.458rem + 3.38vw, 4.5rem)   lh clamp(2.362rem, 1.641rem + 3.08vw, 4.41rem)  ls -0.035em
--text-chapter     clamp(1.875rem, 1.215rem + 2.82vw, 3.75rem) lh clamp(2.1rem, 1.466rem + 2.7vw, 3.9rem)      ls -0.032em
--text-section     clamp(1.625rem, 1.141rem + 2.07vw, 3rem)    lh clamp(1.95rem, 1.496rem + 1.94vw, 3.24rem)   ls -0.03em
--text-prose       clamp(1.313rem, 1.114rem + 0.85vw, 1.875rem) lh clamp(1.706rem, 1.515rem + 0.82vw, 2.25rem) ls -0.024em
--text-page        1.5rem                                      lh 1.875rem                                     ls -0.02em
--text-subsection  (none)
--text-card        1rem                                        lh 1.35rem                                      ls -0.012em
```

**B. Rungs** (one rung set, 12 14 16 18 20 24 28 34 42 52 64 80 100 128 160, the ratio widening as
it climbs; every step sits on a rung at both ends and reads its leading and tracking off the rung,
never off the step. Marketing travels four rungs between 375 and 1440, the app travels one, the card
step travels none)

```
--text-display     clamp(4rem, 1.887rem + 9.01vw, 10rem)       lh clamp(3.92rem, 2.272rem + 7.03vw, 8.6rem)    ls -0.045em
--text-hero        clamp(2.625rem, 1.349rem + 5.45vw, 6.25rem) lh clamp(2.888rem, 1.924rem + 4.11vw, 5.625rem) ls -0.042em
--text-title       clamp(2.125rem, 1.113rem + 4.32vw, 5rem)    lh clamp(2.465rem, 1.678rem + 3.36vw, 4.7rem)   ls -0.038em
--text-chapter     clamp(1.75rem, 0.958rem + 3.38vw, 4rem)     lh clamp(2.135rem, 1.506rem + 2.68vw, 3.92rem)  ls -0.035em
--text-section     clamp(1.5rem, 0.884rem + 2.63vw, 3.25rem)   lh clamp(1.89rem, 1.366rem + 2.24vw, 3.38rem)   ls -0.032em
--text-prose       clamp(1.125rem, 0.773rem + 1.5vw, 2.125rem) lh clamp(1.53rem, 1.201rem + 1.4vw, 2.465rem)   ls -0.024em
--text-page        clamp(1.5rem, 1.412rem + 0.38vw, 1.75rem)   lh clamp(1.89rem, 1.804rem + 0.37vw, 2.135rem)  ls -0.02em
--text-subsection  clamp(1.125rem, 1.081rem + 0.19vw, 1.25rem) lh clamp(1.53rem, 1.488rem + 0.18vw, 1.65rem)   ls -0.014em
--text-card        1rem                                        lh 1.4rem                                       ls -0.006em
```

**C. Registers** (two registers: marketing editorial and much louder at the top, the app an
instrument that goes quieter and carries its hierarchy on weight. `--text-prose` is `--text-section`
by design)

```
--text-display     clamp(5rem, 2.359rem + 11.27vw, 12.5rem)    lh clamp(4.2rem, 2.07rem + 9.09vw, 10.25rem)    ls -0.05em
--text-hero        clamp(3.25rem, 1.754rem + 6.38vw, 7.5rem)   lh clamp(3.185rem, 1.982rem + 5.13vw, 6.6rem)   ls -0.045em
--text-title       clamp(2.5rem, 1.62rem + 3.76vw, 5rem)       lh clamp(2.625rem, 1.877rem + 3.19vw, 4.75rem)  ls -0.04em
--text-chapter     clamp(2rem, 1.472rem + 2.25vw, 3.5rem)      lh clamp(2.24rem, 1.747rem + 2.1vw, 3.64rem)    ls -0.034em
--text-section     clamp(1.625rem, 1.317rem + 1.31vw, 2.5rem)  lh clamp(1.95rem, 1.668rem + 1.2vw, 2.75rem)    ls -0.03em
--text-prose       (folded into --text-section)
--text-page        1.25rem                                     lh 1.625rem                                     ls -0.014em
--text-subsection  1rem                                        lh 1.4rem                                       ls -0.006em
--text-card        0.875rem                                    lh 1.269rem                                     ls -0.002em
```

**Shared by every candidate**

```
--text-body        1rem / 1.55 / 0em      Inter, unchanged by every candidate.
--text-caption     0.75rem / 1.45 / 0.01em  the Caption atom; the uppercase Eyebrow keeps its 0.14em.
```

### What the wiring round inherits

- Three consumers take the tokens: `page-hero.tsx`'s `HERO_SCALE` (display, hero, title),
  `section-shell.tsx`'s `HEADING_SCALE` (chapter, section) and `page-heading.tsx` (page). Each
  becomes one custom property per step instead of a four-breakpoint ramp, and
  `page-hero-contract.test.ts` assertions 6, 7 and 11 (the clamp idiom, the three step names,
  `mkt-name` first) need rewriting with them: assertion 6 pins the clamp shape that these tokens
  replace.
- The display step's optical corrections survive a size change untouched, which the board proved by
  driving `PageHero` at 160px and at 200px: `-mt-[0.12em]`, `py-[0.08em]` and `leadIn` are all in em.
- Two size overrides disappear once the ladder is named: `PageHeading className="text-3xl"` on the
  event name and on `/admin/albums/[eventId]`, and `className="text-lg"` in `admin/layout.tsx`.
- The two app h2 idioms that are labels in a heading tag (`text-sm` in `admin/metrics` and
  `admin/announcements`, `text-[11px] uppercase` in the dashboard sections) become either the
  `subsection` step or the `Caption` atom, depending on which app ladder wins: A and today have no
  step for them, B and C do.
- `--tracking-tight: 0em` (theme.css:23) and its 90-plus legacy `tracking-tight` no-ops are the
  tracking law's business: once tracking is a token per step, the parked pass is a deletion.
