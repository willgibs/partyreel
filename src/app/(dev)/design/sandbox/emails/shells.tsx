"use client";

import type { ReactNode } from "react";

import { WORDMARK_PATH, WORDMARK_VIEWBOX } from "@/lib/brand/wordmark";
import { BRAND_HEX } from "@/lib/constants/site";

import type { LayoutParts } from "./extract";
import { DesktopChrome, PhoneChrome, SCREENS, type ScreenId } from "./mock";

/**
 * THE SHELL AND THE BRAND, drawn on the REAL heading, body, button and footer
 * `extract.splitLayout` pulled out of a real template's own HTML — this file
 * never writes mail copy of its own. Three decisions read it: `shell` (does
 * every mail share one wrapper), `brand` (what that wrapper wears) and `dark`
 * (how it reads in a dark inbox), each holding everything ELSE at today's
 * shipped value while it is the one being asked (the ground rule every board
 * in this shape follows).
 */

export type BrandId = "bare" | "ink" | "wordmark" | "aurora";

const CTA_COLOR: Record<BrandId, string> = {
  bare: "#e11d48",
  ink: BRAND_HEX,
  wordmark: BRAND_HEX,
  aurora: BRAND_HEX,
};

function Wordmark({ aurora }: { aurora?: boolean }) {
  return (
    <div data-inbox-logo style={{ position: "relative", marginBottom: 18 }}>
      {aurora ? (
        <div
          data-inbox-aurora
          aria-hidden
          style={{
            position: "absolute",
            inset: "-28px -28px auto -28px",
            height: 110,
            background:
              "radial-gradient(55% 100% at 25% 0%, rgba(99,102,241,0.32), transparent 70%), radial-gradient(55% 100% at 80% 10%, rgba(236,72,153,0.25), transparent 70%)",
            zIndex: 0,
          }}
        />
      ) : null}
      <svg
        role="img"
        aria-label="Partyreel"
        viewBox={WORDMARK_VIEWBOX}
        fill={BRAND_HEX}
        style={{ position: "relative", height: 20, width: "auto", zIndex: 1 }}
      >
        <path d={WORDMARK_PATH} />
      </svg>
    </div>
  );
}

/**
 * The host card's real content, at one of the brand ladder's four rungs. `bare`
 * is today's shipped output, byte for byte; each rung after it changes exactly
 * one thing (bible 22, incrementally): the button's colour, then a wordmark,
 * then the marketing site's aurora band.
 */
export function HostCard({
  parts,
  brand,
  width = 480,
}: {
  parts: LayoutParts;
  brand: BrandId;
  width?: number;
}) {
  return (
    <div
      data-inbox-brand={brand}
      style={{
        maxWidth: width,
        margin: "0 auto",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        color: "#111",
      }}
    >
      {brand === "wordmark" || brand === "aurora" ? (
        <Wordmark aurora={brand === "aurora"} />
      ) : null}
      <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
        {parts.heading}
      </h1>
      <div dangerouslySetInnerHTML={{ __html: parts.bodyHtml }} />
      {parts.cta ? (
        <p style={{ margin: "24px 0" }}>
          <a
            data-inbox-cta
            href={parts.cta.href}
            style={{
              background: CTA_COLOR[brand],
              color: "#fff",
              padding: "10px 18px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 600,
              display: "inline-block",
            }}
          >
            {parts.cta.label}
          </a>
        </p>
      ) : null}
      <p
        data-inbox-footer
        style={{ color: "#888", fontSize: 12, marginTop: 32 }}
        dangerouslySetInnerHTML={{ __html: parts.footerHtml }}
      />
    </div>
  );
}

/** Today's operator wrapper, hand-rolled at 560px — read straight off
 * `contactFormEmail`/`orphanBreakerEmail`/etc.'s own inline div, never a
 * second implementation of it. */
export function OperatorHandRolled({ parts }: { parts: LayoutParts }) {
  return (
    <div
      style={{
        maxWidth: 560,
        margin: "0 auto",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        color: "#111",
      }}
    >
      <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
        {parts.heading}
      </h1>
      <div dangerouslySetInnerHTML={{ __html: parts.bodyHtml }} />
      <p
        data-inbox-footer
        style={{ color: "#888", fontSize: 12, marginTop: 24 }}
        dangerouslySetInnerHTML={{ __html: parts.footerHtml }}
      />
    </div>
  );
}

/** The `shell=unified` option's operator mail: the SAME card the host mail
 * wears, at the same width, with no CTA (an operator alert has nowhere to
 * click through to) and its own real footer line. */
export function UnifiedOperatorCard({
  parts,
  width = 480,
}: {
  parts: LayoutParts;
  width?: number;
}) {
  return <HostCard parts={parts} brand="bare" width={width} />;
}

/** The `shell=plain` option's operator mail: no card, no colour, no radius —
 * a heading line and the same real paragraphs as plain text. */
export function OperatorPlainText({ parts }: { parts: LayoutParts }) {
  return (
    <div
      style={{
        maxWidth: 560,
        margin: "0 auto",
        fontFamily: "ui-monospace, monospace",
        fontSize: 13,
        lineHeight: 1.6,
        color: "#111",
        whiteSpace: "pre-wrap",
      }}
    >
      <p style={{ fontWeight: 700, margin: "0 0 12px" }}>{parts.heading}</p>
      <div dangerouslySetInnerHTML={{ __html: parts.bodyHtml }} />
      <p
        data-inbox-footer
        style={{ color: "#666", marginTop: 20 }}
        dangerouslySetInnerHTML={{ __html: parts.footerHtml }}
      />
    </div>
  );
}

export type DarkId = "today" | "light" | "both";

/**
 * ONE SHELL, judged against a light AND a dark reading pane at once — the
 * comparison the `dark` decision is about. `today`'s dark pane renders the
 * card with NO explicit background (exactly what `layout()` ships: a `color`
 * declared, no `background`), so it inherits the dark pane's own ground,
 * which is the real failure this decision names. `light` forces an explicit
 * white island; `both` draws a considered dark rendition of the same card.
 */
export function DarkComparison({
  parts,
  mode,
}: {
  parts: LayoutParts;
  mode: DarkId;
}) {
  const darkCard =
    mode === "both"
      ? {
          background: "#1c1c1e",
          color: "#f2f2f2",
          padding: 20,
          borderRadius: 12,
        }
      : mode === "light"
        ? {
            background: "#fff",
            color: "#111",
            padding: 20,
            borderRadius: 12,
            boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
          }
        : { color: "#111", padding: 20 }; // today: no background declared

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl bg-white p-5">
        <p className="mb-2 text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
          A light inbox
        </p>
        <div style={{ maxWidth: 420, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
          <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#111" }}>
            {parts.heading}
          </h1>
          <div
            style={{ color: "#111" }}
            dangerouslySetInnerHTML={{ __html: parts.bodyHtml }}
          />
        </div>
      </div>
      <div data-inbox-dark-pane style={{ background: "#202124", borderRadius: 12, padding: 20 }}>
        <p className="mb-2 text-[11px] font-medium tracking-wide text-neutral-400 uppercase">
          A dark inbox
        </p>
        <div
          data-inbox-dark-card
          style={{
            maxWidth: 420,
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
            ...darkCard,
          }}
        >
          <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
            {parts.heading}
          </h1>
          <div dangerouslySetInnerHTML={{ __html: parts.bodyHtml }} />
        </div>
      </div>
    </div>
  );
}

/**
 * THE `shell` DECISION'S OWN STAGE: a host specimen over an operator one, so
 * the reviewer compares the two idioms (or their unification) in one place
 * rather than across two boards.
 *
 * ★ THE ENVELOPE ITSELF IS THE EVIDENCE, so `operatorStyle` varies it in
 * three real states rather than one boolean: `none` (today) leaves the
 * operator specimen flush on the page, unenveloped, exactly as unstyled as
 * its own hand-rolled div; `card` (unified) wraps it in the SAME rounded
 * card the host wears; `plain` drops it to bare monospace text, no envelope
 * and no card face at all. A single "styled or not" flag once made `today`
 * and `unified` measure as the same picture (both specimens sat inside an
 * identical envelope regardless of shape) — the three-state version is what
 * the decision is actually about.
 */
export function ShellStage({
  screen,
  host,
  operator,
  operatorStyle,
}: {
  screen: ScreenId;
  host: ReactNode;
  operator: ReactNode;
  operatorStyle: "none" | "card" | "plain";
}) {
  const max = screen === "1440" ? 640 : SCREENS[screen].w - 32;
  return (
    <div data-inbox-screen={screen} className="flex h-full flex-col bg-neutral-100">
      {screen === "1440" ? <DesktopChrome /> : <PhoneChrome />}
      <div
        className="flex flex-1 flex-col items-center gap-5 overflow-auto px-4 py-4"
      >
        <div style={{ width: "100%", maxWidth: max }}>
          <p className="mb-1.5 text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
            Host mail
          </p>
          <div
            data-inbox-card="host"
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            {host}
          </div>
        </div>
        <div style={{ width: "100%", maxWidth: max }}>
          <p className="mb-1.5 text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
            Operator mail
          </p>
          {operatorStyle === "card" ? (
            <div
              data-inbox-card="operator"
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              {operator}
            </div>
          ) : operatorStyle === "plain" ? (
            <div data-inbox-card="operator-plain" className="p-1">
              {operator}
            </div>
          ) : (
            <div data-inbox-card="operator-flush" className="p-1">
              {operator}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
