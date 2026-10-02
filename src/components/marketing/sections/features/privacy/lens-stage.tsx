import "./privacy-lens.css";

import Image from "next/image";

import { marketingImage } from "@/lib/constants/marketing-media";

import {
  LENS_KEYFRAMES,
  PANE_SIZES,
  PRIVACY_STILL,
  VEIL_SIZES,
} from "./privacy-lens";

/**
 * THE PRIVACY HERO'S BACKDROP: the lens (privacy-hero r4, his pick `veil=lens`).
 * One photograph under the page's words, veiled in the lightbox's own ground, and
 * one clear round pane gliding round the words, resting 2.4 seconds on one thing
 * at a time. Everything it runs on is `privacy-lens.ts`, its structure is
 * `privacy-lens.css`, and the page's hero carries the sizes (`lensVars`) and the
 * `pvl-hero` class, whose padding is the bands the pane rests in.
 *
 * ★ A SERVER COMPONENT WITH NO SCRIPT OF ITS OWN. CSS drives every picture, so
 * the route stays prerendered and the hero adds no client JavaScript (the images
 * are `next/image`, already in the page's bundle): a `@keyframes` animation
 * already yields to a hidden tab at the compositor, and reduced motion is the
 * sheet's own media query, so nothing here reads either, and the main thread is
 * idle while the pane moves (transforms only: no layout, style or script).
 *
 * ★ THE PHOTOGRAPH COMES THROUGH THE MEDIA MANIFEST BY ID (bible 9), twice: the
 * veil's copy and the pane's own, the same box cover-fit the same way, the pane's
 * offset the opposite way to its own place, so the clarity is always exactly the
 * part of the photograph it sits over. The veil's is blurred past recognising
 * anything, so it asks for a small file (`VEIL_SIZES`); the pane's is sharp, so it
 * asks for the screen's width. Both are decorative: the words are the page's, so
 * the picture is hidden from assistive technology.
 */
function Still({ id, sizes }: { id: string; sizes: string }) {
  const photo = marketingImage(id);
  return (
    <Image
      src={photo.src}
      alt=""
      fill
      sizes={sizes}
      className="object-cover"
      // The hero's whole ground: both are there with the first paint, not after the words.
      priority
    />
  );
}

export function PrivacyLens({ still = PRIVACY_STILL }: { still?: string }) {
  return (
    <div className="pvl-stage" aria-hidden="true">
      <style>{LENS_KEYFRAMES}</style>
      {/* The veil: the photograph under the lightbox's own numbers, then its tint. */}
      <div className="pvl-photo">
        <Still id={still} sizes={VEIL_SIZES} />
      </div>
      <div className="pvl-tint" />
      <div className="pvl-track">
        <div className="pvl-lens">
          <div className="pvl-view">
            <Still id={still} sizes={PANE_SIZES} />
          </div>
          <span className="pvl-rim" />
        </div>
      </div>
      <div className="pvl-falls" />
    </div>
  );
}

/**
 * THE POOLS BEHIND THE WORDS, handed to `PageHero` as its `children` (rendered
 * inside the lockup's own Container, which is `relative` under a backdrop, so
 * they follow the lockup's box whatever the copy becomes). Negative z-index inside
 * the hero's own stacking context (`pvl-hero` isolates it): above the stage,
 * below the words.
 */
export function PrivacyLensPools() {
  return (
    <>
      <div className="pvl-pool" aria-hidden="true" />
      <div className="pvl-eyebrow-pool" aria-hidden="true" />
    </>
  );
}
