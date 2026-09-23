"use client";

import Link from "next/link";

import { FooterDemo } from "@/components/marketing/chrome/footer-demo";
import { FooterGlow } from "@/components/marketing/chrome/footer-glow";
import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { LearnChevron } from "@/components/marketing/sections/shared/learn-chevron";
import { Container } from "@/components/shared/container";
import { Logo } from "@/components/shared/logo";
import { ctaCorner } from "@/components/ui/button";
import { ASK_AI_TARGETS, LLMS_TXT_HREF } from "@/lib/constants/ask-ai";
import {
  FOOTER_LEGAL,
  FOOTER_NAV,
  MARKETING_CTA,
  type FooterColumn,
} from "@/lib/constants/marketing-nav";
import { DEMO_CTA_LABEL, SITE_THESIS } from "@/lib/constants/marketing-voice";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { cn } from "@/lib/utils";

import type { FootAfter, FootPhone } from "./fixtures";

/**
 * THE INK SLAB, ROUND TWO: register one re-forked on `FootAfter`.
 *
 * ★ THE SLAB IS `.surface-ink`, NOT A DARK BACKGROUND (unchanged from round
 * one; see the star below on `BoardFooter` for why the class is redeclared
 * rather than inherited).
 *
 * ★ FOOT-JOB AND FOOT-DOOR ARE RULED, NOT REOPENED. Round one's `job=three`
 * (this is the sign-off register, never the sitemap-alone or the closing-hero
 * shapes) and `door=always` (the code beside the CTA, never gated on
 * `DEMO_EVENT_URL`) are both decided and landing on the real footer via
 * `chrome-wiring` at the same time as this round. So every option below draws
 * a STAND-IN demo URL unconditionally (never a `demoSet` branch) and the CTA
 * is never hidden for want of one: that coupling is gone, not in question.
 *
 * ★ `text-section`, NOT `text-chapter` (Will, 2026-09-19, ruling the
 * walkthrough's close, fourth batch): "the footer
 * 'Explore a demo event.' should be a heading size down from these closing
 * section H2s to create hierarchy". `marketing-footer.tsx` carries the fix;
 * this fork did not until now.
 */

const FOOTER_LINK =
  "block py-1 text-[15px] text-muted-foreground transition-colors duration-150 hover:text-foreground";
const INLINE_LINK =
  "text-foreground underline decoration-current/30 underline-offset-4 transition-colors duration-150 hover:decoration-current";
const LEGAL_LINK =
  "block py-1 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground";

/** A stand-in URL so the frame and its code draw when the env has no demo. */
const DEMO_URL = DEMO_EVENT_URL ?? "https://partyreel.com/e/demo";

function StartFree({ className }: { className?: string }) {
  return (
    <Link
      href={MARKETING_CTA.href}
      className={cn(
        "mkt-learn inline-flex items-center gap-2 border px-6 py-3 text-[15px] font-medium text-foreground transition-[color,border-color,transform,scale] duration-150 ease-emphasis hover:border-foreground/40 active:scale-[0.97]",
        ctaCorner,
        className,
      )}
    >
      {MARKETING_CTA.label}
      <LearnChevron />
    </Link>
  );
}

/* ── Register one, four ways ─────────────────────────────────────────────── */

/**
 * "TODAY": the shipped register, unchanged, at any width — one framed
 * photograph with its code tucked into the corner (`FooterDemo`, demo-event
 * r2). The one register a phone can further narrow (`frameMode`), because it
 * is the only one that carries the frame to begin with.
 */
function RegisterToday({
  phone,
  frameMode = "hidden",
}: {
  phone: boolean;
  /** Phone only: how the frame travels to a screen nobody can scan. */
  frameMode?: FootPhone;
}) {
  if (phone && frameMode === "none") return null;
  return (
    <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
      <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:gap-10">
        {!phone ? (
          <div data-mkt-cut>
            <FooterDemo href={DEMO_URL} value={DEMO_URL} />
          </div>
        ) : frameMode === "small" ? (
          <FooterQr value={DEMO_URL} size={56} />
        ) : null}
        <div className="flex flex-col items-start gap-4">
          <h2 className="font-heading text-section">Explore a demo event.</h2>
          <p className="max-w-sm text-[17px] text-pretty text-muted-foreground">
            {phone
              ? "A real event album, exactly the way a guest arrives. No app, no account."
              : "Scan the code for a real event album on your phone, exactly the way a guest arrives. No app, no account."}
          </p>
          {phone && frameMode === "hidden" ? (
            <Link
              href={DEMO_URL}
              className="mkt-learn -my-1 inline-flex items-center gap-1 py-2 text-[15px] font-medium text-foreground"
            >
              Open the demo album
              <LearnChevron />
            </Link>
          ) : null}
        </div>
      </div>
      <StartFree className="hidden lg:inline-flex" />
    </div>
  );
}

/**
 * "QUIET": one slim row, a small code and a single line, standing where the
 * old register's air used to be. No framed photograph, no separate heading:
 * the strip reads as a footnote to the index below it rather than a section
 * of its own.
 */
function RegisterQuiet() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="max-w-md text-[15px] text-pretty text-muted-foreground">
        {SITE_THESIS}
      </p>
      <Link
        href={DEMO_URL}
        className="mkt-learn inline-flex shrink-0 items-center gap-3 text-[15px] font-medium text-foreground"
      >
        <FooterQr value={DEMO_URL} size={40} />
        {DEMO_CTA_LABEL}
        <LearnChevron />
      </Link>
    </div>
  );
}

/* ── Register two: the index ─────────────────────────────────────────────── */

function NavColumn({ column }: { column: FooterColumn }) {
  return (
    <nav>
      {column.href ? (
        <Link
          href={column.href}
          className="inline-block font-heading text-subsection text-foreground underline decoration-current/25 underline-offset-[6px] transition-[text-decoration-color] duration-150 hover:decoration-current"
        >
          {column.title}
        </Link>
      ) : (
        <p className="font-heading text-subsection text-foreground">
          {column.title}
        </p>
      )}
      <ul className="mt-6 flex flex-col gap-y-3">
        {column.links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={FOOTER_LINK}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      {column.tail ? (
        <ul className="mt-6 flex flex-col gap-y-3 border-t pt-6">
          {column.tail.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={FOOTER_LINK}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </nav>
  );
}

function BrandBlock() {
  return (
    <div className="col-span-2 flex flex-col items-start gap-4 lg:col-span-1 lg:pr-12">
      <Logo />
      <p className="max-w-[26ch] text-[15px] text-pretty text-muted-foreground">
        {SITE_THESIS}
      </p>
      <p className="max-w-[30ch] pt-2 text-[13px] text-pretty text-muted-foreground">
        Using an assistant? Ask{" "}
        {ASK_AI_TARGETS.map((target, i) => (
          <span key={target.label}>
            {i > 0 ? (i === ASK_AI_TARGETS.length - 1 ? " or " : ", ") : null}
            <a
              href={target.href}
              target="_blank"
              rel="noopener noreferrer"
              className={INLINE_LINK}
            >
              {target.label}
            </a>
          </span>
        ))}{" "}
        about Partyreel.
      </p>
    </div>
  );
}

/**
 * `lead`: true when register one drew nothing above it ("merged", "tucked"),
 * so the index opens the slab cold with no gap, no hairline and no top
 * padding of its own to answer.
 */
function Index({ lead }: { lead: boolean }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-8 gap-y-12 border-t pt-14 lg:grid-cols-[minmax(0,1.45fr)_repeat(4,minmax(0,1fr))] lg:gap-x-10",
        lead ? "mt-0 border-t-0 pt-0" : "mt-14 sm:mt-16 sm:pt-16",
      )}
    >
      <BrandBlock />
      {FOOTER_NAV.map((column) => (
        <NavColumn key={column.title} column={column} />
      ))}
    </div>
  );
}

/**
 * `demoLink`: "tucked" alone. When register one carries no demo mention at
 * all, one small line rides the legal bar instead, so the invitation survives
 * somewhere on every page rather than vanishing outright.
 */
function LegalBar({ demoLink = false }: { demoLink?: boolean }) {
  return (
    <div className="mt-16 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground">
        <span aria-hidden>&copy;</span>{" "}
        <span className="tabular-nums">2026</span> Partyreel
      </p>
      <ul className="flex flex-wrap items-center gap-x-6">
        {FOOTER_LEGAL.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={LEGAL_LINK}>
              {link.label}
            </Link>
          </li>
        ))}
        <li>
          <Link href={LLMS_TXT_HREF} className={LEGAL_LINK}>
            llms.txt
          </Link>
        </li>
        {demoLink ? (
          <li>
            <Link href={DEMO_URL} className={LEGAL_LINK}>
              {DEMO_CTA_LABEL}
            </Link>
          </li>
        ) : null}
      </ul>
    </div>
  );
}

/* ── The slab ────────────────────────────────────────────────────────────── */

export function BoardFooter({
  register,
  phone = false,
  frameMode = "hidden",
}: {
  /** `foot-after`'s answer: what register one is, this round's whole subject. */
  register: FootAfter;
  phone?: boolean;
  /** `foot-phone`'s answer; only ever changes anything under `register="today"`. */
  frameMode?: FootPhone;
}) {
  // Nothing draws above the index for "merged" and "tucked" (the invitation
  // lives in the close above or the legal bar below), and for "today" on a
  // phone whose frame mode is "none" (RegisterToday itself returns null then):
  // the index opens cold in every one of those, so it gets the same `lead`.
  const noRegisterOne =
    register === "merged" ||
    register === "tucked" ||
    (register === "today" && phone && frameMode === "none");
  return (
    <footer
      data-sc-foot
      className="surface-ink relative isolate bg-background text-foreground"
    >
      <FooterGlow />
      <Container className="relative pt-20 pb-8 sm:pt-24 sm:pb-10">
        {register === "today" ? (
          <RegisterToday phone={phone} frameMode={frameMode} />
        ) : null}
        {register === "quiet" ? <RegisterQuiet /> : null}
        <Index lead={noRegisterOne} />
        <LegalBar demoLink={register === "tucked"} />
      </Container>
    </footer>
  );
}
