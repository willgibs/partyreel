"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { floatingPanel } from "@/components/ui/floating-layer";
import { cn } from "@/lib/utils";

import { still, type Tapped, TAPPED } from "./fixtures";
import { Face, GuestAlbum, GuestNames, Mark, PersonPage } from "./grounds";
import { type PhoneScene, Scenes } from "./scene";
import {
  BottomSheet,
  CentredDialog,
  type Parts,
  SidePanel,
  type Size,
} from "./surfaces";

/**
 * A QUICK LOOK: `profile-page.quick-look`, moved here with its three options
 * by id and one added (`card`, a card at the name at a desk). The guest list
 * is open in place, as it opens today, and a tap lands on one of its three
 * kinds of name: Nina typed hers (Unverified, no page), Jay confirmed and
 * never claimed a handle (no page), Priya has a page showing two events.
 *
 * ★ THE LOOK SHOWS NOTHING THE ALBUM DID NOT (profile-page's own rule): the
 * face, the mark where it is Unverified, and what they added to this album,
 * already public on it by name; only a page adds its events and the door to
 * it. The privacy doctrine (profiles-social.md) is unchanged by every option.
 */

export type PeekOption = "sheet" | "card" | "mini-modal" | "none";

const OPTION_TITLE: Record<PeekOption, string> = {
  sheet: "A look in the one Sheet",
  card: "A card at the name, a sheet in a hand",
  "mini-modal": "The same look, in the mini-modal",
  none: "Straight to the page, as shipped",
};

const GUEST_ID: Record<Tapped["id"], string> = {
  nina: "g-nina",
  jay: "g-jay",
  priya: "g-priya",
};

function kindLine(t: Tapped): ReactNode {
  if (t.kind === "unverified")
    return (
      <span className="flex items-center gap-1.5">
        <Mark /> Unverified: anyone can type a name
      </span>
    );
  if (t.kind === "confirmed") return "Confirmed their email";
  return `${t.handle} · ${t.line}`;
}

/** The look itself: who, what they added here, and a page's events. */
function lookParts(t: Tapped): Parts {
  return {
    title: (
      <span className="flex items-center gap-3">
        <Face name={t.name} seed={t.seed} avatar={t.avatar} size="lg" />
        {t.name}
      </span>
    ),
    description: kindLine(t),
    body: (
      <div className="space-y-5 pb-2">
        <div className="space-y-2">
          <p className="text-label font-semibold text-muted-foreground uppercase">
            {`${t.added} photos in this album`}
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="block aspect-square overflow-hidden bg-black/10"
                style={{ borderRadius: "var(--radius-tile)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- a fixture still standing in for a presigned photograph */}
                <img
                  src={still(i + t.added)}
                  alt=""
                  className="size-full object-cover"
                />
              </span>
            ))}
          </div>
        </div>
        {t.events && (
          <div className="space-y-2">
            <p className="text-label font-semibold text-muted-foreground uppercase">
              Events
            </p>
            <div className="grid grid-cols-2 gap-2">
              {t.events.map((e) => (
                <span
                  key={e.name}
                  className="overflow-hidden rounded-lg border bg-card"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- a fixture still standing in for an event cover */}
                  <img
                    src={e.cover}
                    alt=""
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <span className="block truncate p-2 text-xs font-medium">
                    {e.name}
                  </span>
                </span>
              ))}
            </div>
            <Button className="w-full" tabIndex={-1} data-pop-primary="">
              Open full profile
            </Button>
          </div>
        )}
      </div>
    ),
  };
}

/** At a desk, the same look in a card beside the name: the Unverified mark's
 *  own popover, grown to hold the look. */
function CardAtName({ t }: { t: Tapped }) {
  const parts = lookParts(t);
  return (
    <div
      data-pop-surface="anchored-card"
      className={cn(
        "absolute top-full left-0 z-50 mt-2 w-80 space-y-3 p-4 text-sm",
        floatingPanel,
      )}
    >
      <div className="space-y-1">
        <div className="font-heading text-card-title font-medium">
          {parts.title}
        </div>
        <div className="text-sm text-muted-foreground">{parts.description}</div>
      </div>
      {parts.body}
    </div>
  );
}

/** The guest list, open in place as today (two groups shown), the tapped
 *  name marked, with whatever a desk's card holds beside it. */
function OpenList({ t, at }: { t: Tapped; at?: ReactNode }) {
  return (
    <div className="space-y-2">
      <GuestNames count={48} tapped={GUEST_ID[t.id]} at={at} />
      <span className="flex h-8 w-fit items-center rounded-full border border-dashed border-border px-3 text-sm text-muted-foreground">
        Show 24 more
      </span>
    </div>
  );
}

function draw(option: PeekOption, t: Tapped, size: Size): ReactNode {
  const phone = size === "phone";
  if (option === "none") {
    if (t.events)
      return (
        <PersonPage
          size={size}
          surface
          person={{
            name: t.name,
            seed: t.seed,
            avatar: t.avatar,
            handle: t.handle ?? "",
            line: t.line ?? "",
            events: t.events,
          }}
        />
      );
    // As shipped, a name with no page opens nothing: the tap lands and stops.
    return (
      <GuestAlbum
        size={size}
        view="foot"
        guests={
          <div data-pop-surface="nothing">
            <OpenList t={t} />
          </div>
        }
      />
    );
  }
  if (option === "card" && !phone)
    return (
      <GuestAlbum
        size={size}
        view="foot"
        guests={<OpenList t={t} at={<CardAtName t={t} />} />}
      />
    );
  const parts = lookParts(t);
  const surface =
    option === "mini-modal" ? (
      <CentredDialog parts={parts} />
    ) : phone ? (
      <BottomSheet parts={parts} />
    ) : (
      <SidePanel parts={parts} />
    );
  return (
    <GuestAlbum
      size={size}
      view="foot"
      guests={<OpenList t={t} />}
      overlay={surface}
    />
  );
}

const PHONES: readonly Tapped["id"][] = ["nina", "jay", "priya"];

const TAP_TITLE: Record<Tapped["id"], string> = {
  nina: "Nina tapped, a typed name",
  jay: "Jay tapped, confirmed, no page",
  priya: "Priya tapped, a page",
};

export function PeekPreview({
  option,
  at,
}: {
  option: PeekOption;
  at: Tapped["id"];
}) {
  const phones: PhoneScene[] = PHONES.map((id) => ({
    title: TAP_TITLE[id],
    node: draw(option, TAPPED[id], "phone"),
  }));
  return (
    <Scenes
      id={`peek-${option}-${at}`}
      title={OPTION_TITLE[option]}
      laptop={draw(option, TAPPED[at], "desk")}
      laptopTitle={TAP_TITLE[at]}
      phones={phones}
    />
  );
}
