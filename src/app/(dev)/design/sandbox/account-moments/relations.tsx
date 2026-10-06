"use client";

import { Check } from "lucide-react";

import { MODAL_ROLES } from "@/components/ui/layer-is-up";
import { ProfileActionsMenu } from "@/components/social/profile-actions-menu";
import {
  BlockConfirm,
  RelationToggle,
} from "@/components/social/relation-toggle";

import { GuestPage, PageHead, Parties, Toast } from "./chrome";
import { INERT, JORDAN, JORDAN_PARTIES, MAYA, MAYA_PARTIES } from "./fixtures";
import { Mark } from "./scene";

/**
 * I4 ON A PUBLIC PAGE: Priya follows Maya from Maya's page, and blocks Jordan
 * from his. Every control is production's (`RelationToggle`, the menu,
 * `BlockConfirm`), handed an act that writes nothing, so a press in a frame
 * flips exactly as it does on the page; what an option adds is its one line or
 * its toast, nothing else.
 */

/** The ask, found by the roles the house's one layer home names (`layer-is-up.ts`), never spelled here. */
const ASK = MODAL_ROLES.map((r) => `[role="${r}"]`).join(", ");

export type FollowWay = "today" | "line" | "toast";
export type BlockWay = "today" | "line" | "toast";

/** The quiet line an option says under the name row, once, where the press was. */
function SaidLine({ children }: { children: string }) {
  return (
    <p
      data-am-read="the line"
      className="am-arrive mt-4 flex max-w-prose items-start gap-2 text-sm text-pretty text-muted-foreground"
    >
      <Check className="mt-0.5 size-4 shrink-0 text-foreground" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/** Maya's page, the moment after Priya pressed Follow. */
export function FollowMoment({ way }: { way: FollowWay }) {
  return (
    <GuestPage>
      <PageHead
        person={MAYA}
        joined="March 2025"
        actions={
          <div data-am-read="the button" className="flex items-center gap-2">
            <RelationToggle
              relation="follow"
              profileId={MAYA.id}
              on
              person={MAYA.name}
              act={INERT}
            />
            <ProfileActionsMenu
              profileId={MAYA.id}
              displayName={MAYA.name}
              blocked={false}
            />
          </div>
        }
        under={
          way === "line" ? (
            <SaidLine>
              Maya is in your Connections. Only you see who you follow; she sees
              a count, never your name.
            </SaidLine>
          ) : null
        }
      />
      <Parties parties={MAYA_PARTIES} />
      {way === "toast" ? (
        <Toast
          tone="success"
          title="You follow Maya."
          line="Only you see who you follow; she sees a count, never your name."
          action="See all"
        />
      ) : null}
    </GuestPage>
  );
}

/** Jordan's page with Block's ask open: production's one copy of what a block does. */
export function BlockAsk() {
  return (
    <GuestPage>
      <PageHead
        person={JORDAN}
        actions={
          <>
            <RelationToggle
              relation="follow"
              profileId={JORDAN.id}
              on={false}
              act={INERT}
            />
            <ProfileActionsMenu
              profileId={JORDAN.id}
              displayName={JORDAN.name}
              blocked={false}
            />
          </>
        }
      />
      <Parties parties={JORDAN_PARTIES} />
      <BlockConfirm
        open
        onOpenChange={() => {}}
        person={JORDAN.name}
        onConfirm={() => {}}
      />
      <Mark at={ASK} as="the ask" />
    </GuestPage>
  );
}

/** Jordan's page, the moment after Priya pressed Block in the ask. */
export function BlockedMoment({ way }: { way: BlockWay }) {
  return (
    <GuestPage>
      <PageHead
        person={JORDAN}
        actions={
          <div
            data-am-read="the row's actions"
            className="flex items-center gap-2"
          >
            <ProfileActionsMenu
              profileId={JORDAN.id}
              displayName={JORDAN.name}
              blocked
            />
          </div>
        }
        under={
          way === "line" ? (
            <div
              data-am-read="the line"
              className="am-arrive mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3"
            >
              <p className="min-w-0 flex-1 basis-56 text-sm text-pretty text-muted-foreground">
                You blocked Jordan. Neither of you can follow the other, and
                Jordan isn&rsquo;t told.
              </p>
              <RelationToggle
                relation="block"
                profileId={JORDAN.id}
                on
                person={JORDAN.name}
                size="sm"
                act={INERT}
              />
            </div>
          ) : null
        }
      />
      <Parties parties={JORDAN_PARTIES} />
      {way === "toast" ? (
        <Toast
          title="Jordan is blocked."
          line="Jordan isn't told. Unblock anytime from Account."
          action="Undo"
        />
      ) : null}
    </GuestPage>
  );
}
