"use client";

import type { ReactNode } from "react";
import { Bell, CheckCircle2, Mail, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { OPEN_REPORTS } from "./fixtures";
import { StateChip } from "./shell";

/**
 * WHO IS TOLD, WHICH IS A POLICY CALL BEFORE IT IS A DESIGN.
 *
 * Today nobody is told anything. The reporter gets "Thanks. Your report has
 * been sent for review." and never hears again; the host learns when the
 * photograph is missing, and if they try to restore it they meet the same
 * deliberately vague line a missing row produces ("That item is no longer
 * available.", `invalid_media`). That vagueness is not laziness: the CSAM
 * runbook's step 5 is "do not tip off", and the grant and trigger work behind
 * it exists so a held item can never be told apart from a deleted one.
 *
 * ★ SO EVERY OPTION HERE IS DRAWN AGAINST A CONSTRAINT, NOT A PREFERENCE. A
 * notice that fires on an ordinary takedown and stays silent on a held one is
 * itself a hold oracle. And a reporter is anonymous BY CONSTRUCTION: the
 * capability is the event's `qr_token` and the row stores no identity, so
 * telling them anything means asking for an address the dialog deliberately
 * does not ask for. The third option draws that cost rather than hiding it.
 */

export type NoticeShape = "silence" | "host" | "both";

export const noticeOf = (v: string | undefined): NoticeShape =>
  v === "silence" || v === "host" || v === "both" ? v : "silence";

function Column({
  title,
  who,
  children,
}: {
  title: string;
  who: string;
  children: ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{who}</p>
      </div>
      <div className="flex flex-1 flex-col gap-2 rounded-xl border bg-muted/20 p-3">
        {children}
      </div>
    </section>
  );
}

function Note({
  icon,
  children,
  muted,
}: {
  icon: ReactNode;
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-lg border bg-card px-3 py-2.5 text-sm",
        muted && "text-muted-foreground",
      )}
    >
      <span className="mt-0.5 shrink-0 opacity-70">{icon}</span>
      <div className="min-w-0 space-y-1">{children}</div>
    </div>
  );
}

function Silence({ what }: { what: string }) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
      {what}
    </div>
  );
}

export function WhoIsTold({ shape }: { shape: NoticeShape }) {
  const row = OPEN_REPORTS[0];
  return (
    <div className="grid grid-cols-3 gap-4">
      <Column title="The person who reported it" who="Anonymous, on their phone">
        <Note icon={<CheckCircle2 className="size-4" />}>
          <p>Thanks. Your report has been sent for review.</p>
          <p className="text-xs text-muted-foreground">
            At the moment they send it, as today.
          </p>
        </Note>
        {shape === "both" ? (
          <Note icon={<Mail className="size-4" />}>
            <p>Your report on {row.event} has been closed.</p>
            <p className="text-xs text-muted-foreground">
              Needs an address. The dialog asks for none, so it becomes one more
              optional field on the most sensitive form in the product.
            </p>
          </Note>
        ) : (
          <Silence what="Nothing after the thank you. They never learn what happened." />
        )}
      </Column>

      <Column title="The host" who="Maya, whose album it is">
        {shape === "silence" ? (
          <Silence what="Nothing is sent. The photograph is simply gone from the album." />
        ) : (
          <Note icon={<Bell className="size-4" />}>
            <p>An operator removed an item from {row.event}.</p>
            <p className="text-xs text-muted-foreground">
              No reason, no reporter, no appeal. The same line whatever the
              reason was, because anything more precise tells a held item apart
              from an ordinary one.
            </p>
          </Note>
        )}
        <Note icon={<Trash2 className="size-4" />} muted>
          <p>Recently deleted</p>
          <p className="text-xs">
            Restore answers &ldquo;That item is no longer available.&rdquo;, the
            same line a missing row gives. As today, under every option.
          </p>
        </Note>
      </Column>

      <Column title="The record" who="What survives the night">
        <Note icon={<StateChip level="actioned">Actioned</StateChip>}>
          <p className="text-xs text-muted-foreground">
            {row.when} · {row.host}
          </p>
          <p>Child in frame, reporter is the parent. Host not contacted.</p>
        </Note>
        <p className="mt-auto text-xs leading-relaxed text-muted-foreground">
          The record does not move between these three answers. What moves is
          how many people outside this portal know a decision was taken, and
          every one of them is someone the removal might have been about.
        </p>
      </Column>
    </div>
  );
}
