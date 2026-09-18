"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { marketingImage } from "@/lib/constants/marketing-media";
import { SITE_SUBHEAD, SITE_THESIS } from "@/lib/constants/marketing-voice";
import { Button } from "@/components/ui/button";

import { type HeroTabletOption, tableForOption } from "./hero-tablet-engine";

/**
 * DECISION 3: THE HOME HERO BETWEEN 768 AND 1023, drawn STATIC (the rest
 * state every table already carries: a reduced-motion reader, a crawler and
 * the cold paint all see exactly this) rather than looped. The question is
 * spatial (a card's size, a measure's width), not paced, so a still frame is
 * the honest evidence and the board never has to reason about an
 * IntersectionObserver or a rAF loop firing correctly across an iframe
 * boundary. `--hhs-half` is set to a flat 450px (900 / 2) once, and every
 * option's `transform` string (either the real `frameAt`'s or this board's own
 * `frameAtTablet`-equivalent) resolves through it identically.
 *
 * Buttons are inert (no `href`, no `onClick`): this composition portals into
 * the SAME document as the lab page, and a real `<Link>` here would navigate
 * the reviewer away from the board on a stray click.
 */
export function TabletHero({ option }: { option: HeroTabletOption }) {
  const table = tableForOption(option);
  const { geo, axisMin, low, below } = table;
  const heroH = axisMin + below;
  const bandTop = axisMin - heroH / 2;

  return (
    // The home page's route group forces `dark` on every reader regardless of
    // theme ((marketing)/(cinema)/layout.tsx: "product is cinema, docs are
    // paper"), so this wrapper does the same rather than inheriting the lab's
    // own light/dark preference: the hero's `text-white` is a real design
    // choice against a room this dark always is, not a token that happens to
    // resolve that way today.
    <div
      className="dark"
      data-mkt=""
      data-mkt-skin="cinema"
      style={{
        position: "relative",
        width: 900,
        height: heroH,
        overflow: "clip",
        background: "var(--color-background)",
        color: "var(--color-foreground)",
      }}
    >
      <div
        aria-hidden
        style={
          {
            position: "absolute",
            insetInline: 0,
            top: bandTop,
            height: heroH,
            WebkitMaskImage: `linear-gradient(to right, transparent 0%, #000 ${geo.fade}, #000 calc(100% - ${geo.fade}), transparent 100%)`,
            maskImage: `linear-gradient(to right, transparent 0%, #000 ${geo.fade}, #000 calc(100% - ${geo.fade}), transparent 100%)`,
          } as CSSProperties
        }
      >
        <div
          style={
            {
              position: "absolute",
              inset: 0,
              perspective: geo.perspective,
              "--hhs-half": "450px",
            } as CSSProperties
          }
        >
          {table.frames.map((f) => (
            <div
              key={f.key}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: f.w,
                height: f.h,
                marginLeft: -f.w / 2,
                marginTop: -f.h / 2,
                zIndex: f.z,
                transform: f.transform,
                opacity: f.opacity,
                borderRadius: "var(--radius-tile)",
                overflow: "hidden",
                background: "rgb(255 255 255 / 5%)",
                boxShadow: "0 18px 46px -16px rgb(0 0 0 / 0.66)",
              }}
            >
              <Image
                src={marketingImage(f.src).src}
                alt=""
                fill
                sizes="300px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: axisMin,
          transform: "translate(-50%, -50%)",
          zIndex: 10,
        }}
      >
        <FooterQr value="https://partyreel.com" size={geo.qr} />
      </div>

      <div
        style={{
          position: "absolute",
          insetInline: 0,
          top: axisMin + low,
          textAlign: "center",
          padding: "0 16px",
        }}
      >
        <h1
          className="mx-auto font-heading text-hero text-balance text-white"
          style={{ maxWidth: geo.h1Max }}
        >
          {SITE_THESIS}
        </h1>
        <p
          className="mx-auto mt-4 text-[15px] leading-relaxed text-pretty text-white/80"
          style={{ maxWidth: geo.lowMax }}
        >
          {SITE_SUBHEAD}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Button type="button" size="cta">
            Start free
          </Button>
          <Button
            type="button"
            size="cta"
            variant="outline"
            className="gap-2 border-white/35 bg-white/5 text-white hover:border-white/50 hover:bg-white/15 hover:text-white"
          >
            <Play className="size-4 fill-current" />
            Watch a sample reel
          </Button>
        </div>
      </div>
    </div>
  );
}
