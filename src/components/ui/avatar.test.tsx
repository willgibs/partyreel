// @contract-for: src/components/ui/avatar.tsx
import { render, screen } from "@testing-library/react"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { Avatar, AvatarFallback, AvatarImage } from "./avatar"

/**
 * THE AVATAR'S CONTRACT: the disc clips exactly once, on the root, and
 * nothing inside it draws a radius of its own.
 *
 * ★ THE BUG THIS GUARDS (Will, rulings.md, the sixth batch, `seed-avatar` r1):
 * "the avatar doesn't fully fill its container, and you can see horizontal
 * edges within" and, separately, "reveals the color underneath the
 * photograph on the edges" — both were the SAME cause. The root carried
 * `rounded-full` with no `overflow-hidden`, so it never clipped anything,
 * while `AvatarImage` and `AvatarFallback` each drew their OWN `rounded-full`
 * over whatever the root painted. Two independently anti-aliased circles
 * composited on top of each other, at a fractional pixel size, is a visible
 * seam; a contract test can't see a rendered seam, but it CAN pin the
 * structural fact that causes one: one clip, on the root, children with no
 * radius of their own. Round two changes `look`, never this.
 *
 * radix's `Avatar.Image` gates on a real `<img>` load event, which jsdom
 * never fires (no network layer): a synchronous stub keeps the "loaded"
 * branch reachable so the image contract below is actually exercised rather
 * than silently skipped.
 */
class InstantImage {
  complete = true
  naturalWidth = 1
  src = ""
  addEventListener() {}
  removeEventListener() {}
}

let realImage: typeof Image
beforeAll(() => {
  realImage = globalThis.Image
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- a minimal test double, not a real HTMLImageElement
  ;(globalThis as any).Image = InstantImage
})
afterAll(() => {
  globalThis.Image = realImage
})

const SIZES = ["sm", "default", "lg", "xl"] as const

describe("the disc clips once, on the root", () => {
  it.each(SIZES)("carries rounded-full and overflow-hidden at size=%s", (size) => {
    render(
      <Avatar size={size} data-testid="root">
        <AvatarFallback>A</AvatarFallback>
      </Avatar>,
    )
    const root = screen.getByTestId("root")
    expect(root.className).toContain("rounded-full")
    expect(root.className).toContain("overflow-hidden")
  })

  it("the xl size is 80px (size-20), the fourth size on the contract", () => {
    render(
      <Avatar size="xl" data-testid="root">
        <AvatarFallback>A</AvatarFallback>
      </Avatar>,
    )
    expect(screen.getByTestId("root").className).toContain("data-[size=xl]:size-20")
  })
})

describe("the children carry no rounding of their own", () => {
  it("AvatarFallback never sets its own rounded-full", () => {
    render(
      <Avatar>
        <AvatarFallback data-testid="fallback">A</AvatarFallback>
      </Avatar>,
    )
    const fallback = screen.getByTestId("fallback")
    expect(fallback.className).not.toContain("rounded-full")
    // Still fills its own box — the root is what clips it into a circle.
    expect(fallback.className).toContain("size-full")
  })

  it("AvatarImage never sets its own rounded-full, and covers the disc with no gap", async () => {
    render(
      <Avatar>
        <AvatarImage src="https://example.test/a.jpg" alt="" data-testid="image" />
        <AvatarFallback>A</AvatarFallback>
      </Avatar>,
    )
    const img = await screen.findByTestId("image")
    expect(img.className).not.toContain("rounded-full")
    // size-full, no inset: the image is exactly the box the root clips.
    expect(img.className).toContain("size-full")
    expect(img.style.top).toBe("")
    expect(img.style.left).toBe("")
  })
})

describe("a seed paints the root and threads through to the fallback", () => {
  /**
   * ★ jsdom/cssstyle CANNOT STORE `mesh`'s backgroundImage (found wiring
   * `seed-avatar` r2, `avatar-mesh-wiring`, 2026-09-20): `radial-gradient(in
   * oklab 122% 118% at 22% 14%, ...)` — a percentage-pair ending shape with
   * a `<color-interpolation-method>` prefix and no explicit shape keyword —
   * is valid CSS every real browser paints correctly (`linear-gradient(in
   * oklab ...)`, `diagonal`'s own shape, parses fine in the SAME engine;
   * dropping "in oklab" or adding an explicit `circle`/`ellipse` keyword
   * also parses fine), but jsdom's `cssstyle` rejects the combination and
   * silently drops the WHOLE property to `""` rather than the one layer.
   * `gradient.test.ts` already holds the string itself to
   * `/gradient\(in oklab/` and to being parseable CSS-shaped output; what is
   * left to prove here is only that `Avatar` WIRES a seed through to the
   * DOM at all, so these three tests read `backgroundBlendMode` (a plain
   * value list jsdom parses fine, and one only the `mesh` branch ever sets)
   * and the fallback's `ink`, never the gradient string itself.
   */
  it("sets mesh's own backgroundBlendMode on the root", () => {
    render(
      <Avatar seed="account-1" data-testid="root">
        <AvatarFallback>A</AvatarFallback>
      </Avatar>,
    )
    expect(screen.getByTestId("root").style.backgroundBlendMode).toBe(
      "overlay, soft-light, normal, normal",
    )
  })

  it("drops bg-muted for a transparent ground, and colours the initial", () => {
    render(
      <Avatar seed="account-1">
        <AvatarFallback data-testid="fallback">A</AvatarFallback>
      </Avatar>,
    )
    const fallback = screen.getByTestId("fallback")
    expect(fallback.className).not.toContain("bg-muted")
    expect(fallback.className).toContain("bg-transparent")
    expect(fallback.style.color).toMatch(/oklch/)
  })

  it("the SAME seed paints the fallback the SAME ink on two different avatars", () => {
    render(
      <>
        <Avatar seed="account-1">
          <AvatarFallback data-testid="a">A</AvatarFallback>
        </Avatar>
        <Avatar seed="account-1">
          <AvatarFallback data-testid="b">A</AvatarFallback>
        </Avatar>
      </>,
    )
    expect(screen.getByTestId("a").style.color).toBe(
      screen.getByTestId("b").style.color,
    )
  })

  it("a DIFFERENT seed paints the fallback a different ink", () => {
    render(
      <>
        <Avatar seed="account-1">
          <AvatarFallback data-testid="a">A</AvatarFallback>
        </Avatar>
        <Avatar seed="account-2">
          <AvatarFallback data-testid="b">A</AvatarFallback>
        </Avatar>
      </>,
    )
    expect(screen.getByTestId("a").style.color).not.toBe(
      screen.getByTestId("b").style.color,
    )
  })

  it("with no seed, the root paints nothing and the fallback stays today's grey", () => {
    render(
      <Avatar data-testid="root">
        <AvatarFallback data-testid="fallback">A</AvatarFallback>
      </Avatar>,
    )
    expect(screen.getByTestId("root").style.backgroundImage).toBe("")
    const fallback = screen.getByTestId("fallback")
    expect(fallback.className).toContain("bg-muted")
    expect(fallback.className).toContain("text-muted-foreground")
    expect(fallback.style.color).toBe("")
  })
})
