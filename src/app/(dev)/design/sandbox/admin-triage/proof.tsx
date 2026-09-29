"use client";

import { ChevronLeft, MailQuestion, Paperclip, Reply } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { marketingImage } from "@/lib/constants/marketing-media";

import {
  ANSWERED,
  ASKED,
  DAUGHTER,
  type Entry,
  MOTHER,
  type ProofShape,
} from "./fixtures";

/**
 * ASKING A REPORTER FOR PROOF, BEFORE A VERDICT (the `proof` ask).
 *
 * Will's note on round one: "while these reports warrant action if true, we
 * may need some way to collect that proof (like email the reporter if
 * needed). Otherwise, we risk taking down real media because of fake reports."
 * So each answer is drawn over the one report where it matters most (the
 * mother who says the girl in the background is her twelve-year-old), as
 * three moments: her form (form.tsx), what reaches her, and what the report
 * holds once she has answered.
 *
 * ★ THE MAIL IS THE EMAILS BOARD'S FAMILY, AND ASKS NOTHING IT ASKS. Its
 * wrapper is drawn as `templates.ts`' `layout()` ships (the heading, the body,
 * the one rose button, the grey foot), because the shell, the brand and the
 * foot are that board's; what is asked here is who this mail can reach and
 * where her answer lands. It rides the one address his emails pick lets a
 * report keep (`reporter=note`: confirmed only, until it closes), and the
 * closing note it keeps it for is that board's and is not drawn here.
 *
 * ★ SENT BY HAND, SPARINGLY, NEVER BY A RULE. His emails note holds every new
 * automatic mail for a later exploration ("be good about our email policy
 * from the start so we never hit spam"), so this is an operator's act on one
 * report, with the question typed by the person reviewing it: nothing sends
 * it on a timer, a kind or a count.
 *
 * ★ HER ANSWER LANDS ON THE REPORT, NOT IN AN INBOX. The link opens a page
 * that adds her words (and a photo, if she has one) to the report itself, so
 * the operator reads the claim and its proof in one place; a plain "reply to
 * this email" would land in whichever mailbox EMAIL_FROM answers to, outside
 * the portal, which is a second place to look and a service to own.
 */

/* ── What reaches her ───────────────────────────────────────────────────── */

/** Her phone's inbox, as the emails board's mocks draw one, opened on the mail. */
export function ProofInbox({ proof }: { proof: ProofShape }) {
  const empty =
    proof === "none"
      ? "Nothing arrives: the report kept no way to reach her."
      : proof === "account"
        ? "Nothing arrives: she reported signed out, so there is no confirmed address to send to."
        : null;
  return (
    <div className="flex min-h-screen flex-col bg-neutral-100 text-neutral-900">
      <div className="flex h-11 items-center gap-2 border-b border-neutral-200 bg-white px-3 text-[13px]">
        <ChevronLeft className="size-4 text-neutral-500" aria-hidden />
        <span className="font-medium">Inbox</span>
        <span className="ml-auto text-neutral-500">{MOTHER.address}</span>
      </div>
      {empty ? (
        <div
          data-tri-inbox="empty"
          className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center"
        >
          <MailQuestion className="size-6 text-neutral-400" aria-hidden />
          <p className="text-[14px] font-medium">Nothing from Partyreel</p>
          <p className="text-[12px] text-neutral-500">{empty}</p>
        </div>
      ) : (
        <ProofMail />
      )}
    </div>
  );
}

/**
 * The mail itself, in `layout()`'s own shape: 480 max, the system face, an
 * 18px bold heading, the body, the rose button, the grey foot.
 */
function ProofMail() {
  const album = DAUGHTER.album?.name ?? "the album";
  return (
    <article data-tri-mail className="bg-white px-4 pt-4 pb-6">
      <p className="text-[13px] text-neutral-500">Partyreel · {ASKED.when}</p>
      <p className="mt-0.5 text-[15px] font-semibold">
        About your report on {album}
      </p>
      <div
        className="mt-4 border-t border-neutral-200 pt-4"
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>
          We need a little more to act on your report
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed">
          You reported a photo in {album} tonight. Before anything comes down,
          the person reviewing it asks:
        </p>
        <blockquote className="mt-3 border-l-2 border-neutral-300 pl-3 text-[14px] leading-relaxed">
          {ASKED.question}
        </blockquote>
        <p style={{ margin: "24px 0" }}>
          <span
            style={{
              background: "#e11d48",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Add to your report
          </span>
        </p>
        <p style={{ color: "#888", fontSize: 12, marginTop: 32 }}>
          Partyreel · you&rsquo;re receiving this because you confirmed this
          address with a report. It&rsquo;s deleted when the report closes, and
          the host is never told who reported.
        </p>
      </div>
    </article>
  );
}

/* ── What the report holds ──────────────────────────────────────────────── */

/**
 * THE THREAD ON THE REPORT: what was asked, and what came back, under the
 * report's own facts. Under `none` and `account` the daughter's report has no
 * one to ask, so its slot says so in one line, where the ask would have been.
 */
export function ProofThread({
  entry,
  proof,
}: {
  entry: Entry;
  proof: ProofShape;
}) {
  if (entry.id !== DAUGHTER.id) return null;
  if (proof !== "confirm")
    return (
      <p
        data-tri-thread="none"
        className="rounded-md border border-dashed px-3 py-2 text-caption text-muted-foreground"
      >
        {proof === "none"
          ? "No one to ask: the report kept no way to reach her, so her claim stands on its words."
          : "No one to ask: she reported signed out, and only a signed-in guest can be asked."}
      </p>
    );
  const shot = marketingImage("wedding-golden");
  return (
    <div
      data-tri-thread="asked"
      className="space-y-2 rounded-lg border bg-muted/30 p-3"
    >
      <div className="space-y-0.5">
        <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
          <MailQuestion className="size-3.5" aria-hidden />
          You asked, {ASKED.when}
        </p>
        <p className="line-clamp-2 text-working">{ASKED.question}</p>
      </div>
      <div className="space-y-1 border-t pt-2">
        <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
          <Reply className="size-3.5" aria-hidden />
          She answered, {ANSWERED.when}
          <Badge variant="success" className="ml-1 font-normal">
            Proof added
          </Badge>
        </p>
        <p className="text-working">{ANSWERED.text}</p>
        <div className="flex items-center gap-2 pt-1">
          {/* eslint-disable-next-line @next/next/no-img-element -- a local still standing in for her own photo */}
          <img
            src={shot.src}
            alt=""
            className="size-12 rounded-md object-cover"
            draggable={false}
          />
          <span className="flex items-center gap-1 text-caption text-muted-foreground">
            <Paperclip className="size-3" aria-hidden />
            {ANSWERED.attached} photo she added, seen only here
          </span>
        </div>
      </div>
    </div>
  );
}
