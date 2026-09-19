"use client";

import Link from "next/link";

import { FooterDemo } from "@/components/marketing/chrome/footer-demo";
import { FooterGlow } from "@/components/marketing/chrome/footer-glow";
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
import { SITE_THESIS } from "@/lib/constants/marketing-voice";
import { DEMO_EVENT_URL } from "@/lib/demo";
import { cn } from "@/lib/utils";

import type { FootDoor, FootJob } from "./fixtures";

/**
 * THE INK SLAB, FORKED SO ITS THREE REGISTERS TAKE PROPS.
 *
 * ★ THE SLAB IS `.surface-ink`, NOT A DARK BACKGROUND, and that is the one
 * thing a fork must not lose. `--ring`, `--border`, `--muted-foreground` and
 * `--brand` are not surfaces, so on a paper route they keep their LIGHT values
 * and a bare `border-t` paints a near-white hairline while focus rings land at
 * 1.41:1. The class redeclares the set; every utility inside is then correct by
 * construction. `footer-contract.test.ts` pins that on the shipped file and
 * this fork wears the same class for the same reason.
 *
 * ★ AND THE DEMO OBJECT IS THE REAL ONE. `FooterDemo` (the photo pile with the
 * server-rendered `FooterQr` on its plate) and `FooterGlow` (the seam) are
 * imported, never redrawn: the question on this board is what the foot's JOB
 * is and what it offers when the demo is unset, never what the pile looks like.
 *
 * ★ THE DEMO IS A PROP HERE, NOT THE ENV. In production the whole invitation
 * stands down when `DEMO_EVENT_URL` is unset, and the footer's only conversion
 * action goes with it. That coupling IS the `foot-door` question, so the board
 * draws both states side by side rather than whatever this checkout happens to
 * have configured.
 */

const FOOTER_LINK =
  "block py-1 text-[15px] text-muted-foreground transition-colors duration-150 hover:text-foreground";
const INLINE_LINK =
  "text-foreground underline decoration-current/30 underline-offset-4 transition-colors duration-150 hover:decoration-current";
const LEGAL_LINK =
  "block py-1 text-xs text-muted-foreground transition-colors duration-150 hover:text-foreground";

/** A stand-in URL so the pile and its code draw when the env has no demo. */
const DEMO_URL = DEMO_EVENT_URL ?? "https://partyreel.com/e/demo";

/* ── Register one, three jobs ────────────────────────────────────────────── */

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

/** Today's sign-off: the pile and the code, the copy, the secondary action. */
function SignOff({
  demoSet,
  door,
  phone,
}: {
  demoSet: boolean;
  door: FootDoor;
  phone: boolean;
}) {
  // The shipped coupling: no demo means no invitation AND no action.
  if (!demoSet) {
    const keepsCta = door === "always";
    return (
      <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
        <p className="max-w-xl font-heading text-chapter">{SITE_THESIS}</p>
        {keepsCta ? <StartFree /> : null}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
      <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:gap-10">
        {phone ? null : (
          <div data-mkt-cut>
            <FooterDemo href={DEMO_URL} value={DEMO_URL} />
          </div>
        )}
        <div className="flex flex-col items-start gap-4">
          <h2 className="font-heading text-chapter">Explore a demo event.</h2>
          <p className="max-w-sm text-[17px] text-pretty text-muted-foreground">
            {phone
              ? "A real event album, exactly the way a guest arrives. No app, no account."
              : "Scan the code for a real event album on your phone, exactly the way a guest arrives. No app, no account."}
          </p>
          {phone ? (
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
      {door === "demo" ? null : <StartFree className="hidden lg:inline-flex" />}
    </div>
  );
}

/** The close: the same invitation at the page's last-word scale. */
function Close({
  demoSet,
  door,
  phone,
}: {
  demoSet: boolean;
  door: FootDoor;
  phone: boolean;
}) {
  const keepsCta = demoSet ? door !== "demo" : door === "always";
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-8 text-center",
        phone ? "pt-2 pb-6" : "pt-6 pb-10",
      )}
    >
      {demoSet && !phone ? (
        <div data-mkt-cut>
          <FooterDemo href={DEMO_URL} value={DEMO_URL} />
        </div>
      ) : null}
      <h2
        className={cn(
          "max-w-[18ch] font-heading text-balance",
          phone ? "text-4xl" : "text-6xl",
        )}
      >
        {demoSet ? "See it before you host it." : SITE_THESIS}
      </h2>
      <p className="max-w-[44ch] text-[17px] text-pretty text-muted-foreground">
        {demoSet
          ? "A real event album, exactly the way a guest arrives. No app, no account, nothing to install."
          : "One code on the table, and everything your guests shoot lands in one place."}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {demoSet ? (
          <Link
            href={DEMO_URL}
            className={cn(
              "mkt-learn inline-flex items-center gap-2 border border-foreground bg-foreground px-6 py-3 text-[15px] font-medium text-background transition-transform duration-150 active:scale-[0.97]",
              ctaCorner,
            )}
          >
            Open the demo album
            <LearnChevron />
          </Link>
        ) : null}
        {keepsCta ? <StartFree /> : null}
      </div>
    </div>
  );
}

/* ── Register two: the index ─────────────────────────────────────────────── */

function NavColumn({
  column,
  dense,
}: {
  column: FooterColumn;
  dense: boolean;
}) {
  return (
    <nav>
      {column.href ? (
        <Link
          href={column.href}
          className={cn(
            "inline-block font-heading text-foreground underline decoration-current/25 underline-offset-[6px] transition-[text-decoration-color] duration-150 hover:decoration-current",
            dense ? "text-[15px]" : "text-subsection",
          )}
        >
          {column.title}
        </Link>
      ) : (
        <p
          className={cn(
            "font-heading text-foreground",
            dense ? "text-[15px]" : "text-subsection",
          )}
        >
          {column.title}
        </p>
      )}
      <ul
        className={cn("flex flex-col", dense ? "mt-3 gap-y-1" : "mt-6 gap-y-3")}
      >
        {column.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={cn(FOOTER_LINK, dense && "text-[13px]")}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      {column.tail ? (
        <ul
          className={cn(
            "flex flex-col border-t",
            dense ? "mt-3 gap-y-1 pt-3" : "mt-6 gap-y-3 pt-6",
          )}
        >
          {column.tail.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(FOOTER_LINK, dense && "text-[13px]")}
              >
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

function Index({ dense, lead }: { dense: boolean; lead: boolean }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-8 border-t lg:grid-cols-[minmax(0,1.45fr)_repeat(4,minmax(0,1fr))] lg:gap-x-10",
        dense
          ? "mt-10 gap-y-8 pt-10"
          : "mt-14 gap-y-12 pt-14 sm:mt-16 sm:pt-16",
        lead && "mt-0 border-t-0 pt-0",
      )}
    >
      <BrandBlock />
      {FOOTER_NAV.map((column) => (
        <NavColumn key={column.title} column={column} dense={dense} />
      ))}
    </div>
  );
}

function LegalBar() {
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
      </ul>
    </div>
  );
}

/* ── The slab ────────────────────────────────────────────────────────────── */

export function BoardFooter({
  job,
  door = "always",
  demoSet = true,
  phone = false,
  registerOnly = false,
}: {
  job: FootJob;
  door?: FootDoor;
  /** Whether NEXT_PUBLIC_DEMO_QR_TOKEN is set, which is the `foot-door` axis. */
  demoSet?: boolean;
  phone?: boolean;
  /** The first register alone: the door decision changes nothing below it, and
   *  two whole slabs in one frame is eight screens of scrolling for one pick. */
  registerOnly?: boolean;
}) {
  return (
    <footer
      data-sc-foot
      className="surface-ink relative isolate bg-background text-foreground"
    >
      <FooterGlow />
      <Container className="relative pt-20 pb-8 sm:pt-24 sm:pb-10">
        {job === "three" ? (
          <SignOff demoSet={demoSet} door={door} phone={phone} />
        ) : null}
        {job === "close" ? (
          <Close demoSet={demoSet} door={door} phone={phone} />
        ) : null}
        {registerOnly && job === "sitemap" ? (
          <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            <BrandBlock />
            {door === "always" ? <StartFree /> : null}
          </div>
        ) : null}
        {registerOnly ? null : (
          <>
            <Index dense={job === "close"} lead={job === "sitemap"} />
            <LegalBar />
          </>
        )}
      </Container>
    </footer>
  );
}
