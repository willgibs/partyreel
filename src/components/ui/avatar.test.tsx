import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Avatar, AvatarFallback } from "./avatar"

/**
 * THE AVATAR'S SEED: an account's seed paints its disc, the same seed paints
 * the same ink on every avatar that person wears (so a face is recognisable
 * across the guest list, the header and the album), and no seed paints
 * nothing. How the disc looks is the Library's to show; `gradient.test.ts`
 * and `measure.test.ts` hold the generator's determinism and contrast.
 *
 * ★ jsdom/cssstyle CANNOT STORE `mesh`'s backgroundImage: `radial-gradient(in
 * oklab 122% 118% at 22% 14%, ...)` is valid CSS every real browser paints,
 * but jsdom's `cssstyle` rejects the combination and silently drops the WHOLE
 * property to `""`. So the wiring is read off `backgroundBlendMode` (a plain
 * value list jsdom parses fine, and one only a seeded root ever sets) and the
 * fallback's ink, never the gradient string itself.
 */
describe("a seed paints the root and threads through to the fallback", () => {
  it("paints the root when a seed is given", () => {
    render(
      <Avatar seed="account-1" data-testid="root">
        <AvatarFallback>A</AvatarFallback>
      </Avatar>,
    )
    expect(screen.getByTestId("root").style.backgroundBlendMode).not.toBe("")
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
    expect(screen.getByTestId("a").style.color).not.toBe("")
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

  it("with no seed, the root paints nothing and the fallback carries no ink of its own", () => {
    render(
      <Avatar data-testid="root">
        <AvatarFallback data-testid="fallback">A</AvatarFallback>
      </Avatar>,
    )
    expect(screen.getByTestId("root").style.backgroundImage).toBe("")
    expect(screen.getByTestId("root").style.backgroundBlendMode).toBe("")
    expect(screen.getByTestId("fallback").style.color).toBe("")
  })
})
