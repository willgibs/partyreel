import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { marketingImage } from "@/lib/constants/marketing-media";

import { FooterQr } from "./footer-qr";

/**
 * THE DEMO INVITATION: a scannable QR sitting on a pile of event photos that
 * fans out when you reach for it.
 *
 * The QR alone was a lone white square on black, which read as a widget rather
 * than as an invitation. The pile says what is on the other side of the code
 * before anyone scans it, and the fan is the one moment of delight in an
 * otherwise still surface. Rides the ratified pro/card-stack-hover recipe
 * (.mkt-stack / .mkt-stack-card, marketing.css chapter 2), whose own convention
 * is that slot geometry is written INLINE per card, which is why the sizes ride
 * inline style too: the recipe's `[data-mkt] .mkt-stack` rule is (0,2,0) and
 * would outrank a Tailwind size utility.
 *
 * Photos come from the license-audited marketing manifest, the only sanctioned
 * way to reference anything under public/marketing. They are decorative (the
 * link carries the name), hence alt="".
 *
 * Hover only fans on real pointers: the recipe is gated behind
 * @media (hover: hover) so a touch tap never leaves the pile stuck open.
 *
 * ★ POSITIONING IS SELF-SUFFICIENT, not inherited from the recipe. The root 404
 * renders this outside (marketing), where marketing.css never loads, so
 * `.mkt-stack-card` contributes nothing: the cards fell back to inline spans and
 * the 900px source images blew out of the layout, giving the 404 a horizontal
 * scrollbar. absolute/top/left/size/radius therefore ride utilities and inline
 * style, and the recipe is left owning only the rest pose, the transitions and
 * the fan. Do NOT move translate/rotate inline to "match": inline style outranks
 * the recipe's :hover rule and the fan would stop working everywhere.
 */

const QR_PX = 128;
/** Rest pose + fan delta per card. Tuned so each corner peeks from behind the
 *  plate at rest and clears it entirely when fanned. */
const CARDS = [
  {
    id: "wedding-arch",
    cx: "26px",
    cy: "12px",
    rot: "-8deg",
    dx: "-30px",
    dy: "-30px",
    drot: "-15deg",
  },
  {
    id: "concert-confetti",
    cx: "88px",
    cy: "10px",
    rot: "7deg",
    dx: "58px",
    dy: "-26px",
    drot: "14deg",
  },
  {
    id: "reception-table",
    cx: "28px",
    cy: "76px",
    rot: "-5deg",
    dx: "-34px",
    dy: "36px",
    drot: "-12deg",
  },
  {
    id: "festival-lights",
    cx: "86px",
    cy: "80px",
    rot: "6deg",
    dx: "62px",
    dy: "32px",
    drot: "13deg",
  },
] as const;

export function FooterDemo({ href, value }: { href: string; value: string }) {
  return (
    <Link
      href={href}
      aria-label="Explore a demo event"
      className="mkt-stack relative block shrink-0"
      style={{ width: 268, height: 208 }}
    >
      {CARDS.map((card, i) => {
        const img = marketingImage(card.id);
        return (
          <span
            key={card.id}
            className="mkt-stack-card absolute top-0 left-0 overflow-hidden rounded-[var(--radius-tile)]"
            style={
              {
                width: 96,
                height: 96,
                zIndex: i,
                "--cx": card.cx,
                "--cy": card.cy,
                "--rot": card.rot,
                "--dx": card.dx,
                "--dy": card.dy,
                "--drot": card.drot,
              } as CSSProperties
            }
          >
            <Image
              src={img.src}
              alt=""
              width={img.width}
              height={img.height}
              sizes="96px"
              className="size-full object-cover"
            />
          </span>
        );
      })}
      {/* The plate is the top of the pile: same rest/fan grammar, zero delta, so
          it stays put while the photos spread out from under it. */}
      <span
        className="mkt-stack-card absolute top-0 left-0 grid place-items-center bg-transparent shadow-none"
        style={
          {
            width: QR_PX + 16,
            height: QR_PX + 16,
            zIndex: 20,
            "--cx": "50px",
            "--cy": "26px",
            "--rot": "0deg",
            "--dx": "0px",
            "--dy": "0px",
            "--drot": "0deg",
          } as CSSProperties
        }
      >
        <FooterQr value={value} size={QR_PX} />
      </span>
    </Link>
  );
}
