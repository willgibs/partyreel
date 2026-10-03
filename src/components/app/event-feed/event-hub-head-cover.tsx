"use client";

import "./event-hub-head-cover.css";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateEventAction } from "@/app/(app)/dashboard/actions";
import {
  type HubAlbum,
  useHostAlbum,
  useHubEntries,
} from "@/components/app/event-feed/host-album";
import { ContactSheet } from "@/components/guest/gallery-empty-state-sheet";
import { Button } from "@/components/ui/button";
import { ConsequenceLine } from "@/components/ui/consequence-line";
import { type HerShot, SHEET_CAP } from "@/lib/disposable/contact-sheet";
import {
  coverWaitingOf,
  type HubDevelopFacts,
} from "@/lib/disposable/host-cover";
import { useWaitClock } from "@/lib/disposable/use-wait-clock";
import { ENTRY_VIDEO, WHO_HOST } from "@/lib/events/album-wire";
import { developsWhen } from "@/lib/guest/camera/words";
import { useInViewSentinel } from "@/lib/shared/use-in-view-sentinel";
import { GLASS } from "@/lib/glass";
import { cn } from "@/lib/utils";

/**
 * MAYA'S COVER: UNTIL HER ALBUM DEVELOPS, HER HUB DRAWS WHAT HER GUESTS SEE (the-wait r1, Will's `cover=guests`: "This
 * feels the most bespoke, continues the guest experience into a similar host experience for a cohesive idea, and feels
 * the most 'disposable' plus develop"). Her album's place on the hub is the very contact sheet her guests meet, her own
 * lit, everyone's counted; Look lifts it for this visit, into her album as it is (scrollable, her tools on every photo:
 * "definitely not a hold to peek so it's easy to scroll"), and Cover it puts it back. Develop now asks first, as
 * Settings' does. The head above wears what her guests see too (`useHubCoverStills`).
 *
 * ★ THE GRID IS CAPPED AND THE COUNT CLIMBS (his note: "consider how annoyingly long that grid could become in huge
 * events, maybe consider a max visual size then just let the count increase"): the sheet's own cap (`ContactSheet`).
 *
 * ★ A DELIGHT OR TWO ("all work no play is a boring consumer product"): the count ticking as guests shoot ("+1 just
 * now"), and Look lifting the cover as a develop does, the album rising out of a flash of light (`event-hub-head-cover.css`,
 * none under reduced motion).
 *
 * ★ HER OWN, LIT: the links of the sheet's newest say whose each is (`WHO_HOST`), so the hub asks for those links once
 * (the album's own link store, the rows' when she looks), and her photographs light up where she took them.
 *
 * ★ APPROVAL NEVER STANDS WITH A DEVELOP (Will's `both=never`): this cover is her check before the develop; she moves the
 * develop time in Settings if she needs longer.
 */

/** How many of the newest waiting items' links the cover asks for, to light her own: one call's worth, the sheet's. */
const OWN_LINKS = SHEET_CAP;

const noSubscription = () => () => {};
const noRevision = () => 0;

function useLinksRevision(album: HubAlbum | null): number {
  return useSyncExternalStore(
    album ? album.store.links.subscribe : noSubscription,
    album ? album.store.links.revision : noRevision,
    noRevision,
  );
}

/** The cover, standing in her album's place until she looks. */
export function HostAlbumCover({
  eventId,
  develop,
  onLook,
}: {
  eventId: string;
  /** The album's develop facts, a develop time ahead (the gallery covers only then). */
  develop: HubDevelopFacts & { develops_at: string };
  onLook: () => void;
}) {
  const album = useHostAlbum();
  const entries = useHubEntries(album);
  const developsAt = develop.develops_at;
  const sealedFrom = develop.sealed_from;
  const facts = useMemo(
    () =>
      coverWaitingOf(entries ?? [], {
        develops_at: developsAt,
        sealed_from: sealedFrom,
      }),
    [entries, developsAt, sealedFrom],
  );

  // Her own among the newest that wait: their links say whose each is, asked for once (the album's own store).
  const asked = useMemo(() => facts.ids.slice(0, OWN_LINKS), [facts.ids]);
  const askedKey = asked.join(",");
  useEffect(() => {
    if (!album || asked.length === 0) return;
    void album.store.links.ensure(asked);
    // `askedKey` stands for the ids asked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album, askedKey]);
  const linksRevision = useLinksRevision(album);
  const hers = useMemo<HerShot[]>(() => {
    if (!album || !entries) return [];
    const byId = new Map(entries.map((e) => [e[0], e]));
    const out: HerShot[] = [];
    for (const id of asked) {
      const link = album.linkOf(id);
      const e = byId.get(id);
      if (!link || !e || !((link.who?.[1] ?? 0) & WHO_HOST)) continue;
      out.push({
        key: id,
        at: Math.floor(e[4] / 1000),
        src: link.tile,
        video: (e[3] & ENTRY_VIDEO) !== 0,
        sending: false,
      });
    }
    return out;
    // `linksRevision` stands for the links `linkOf` reads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album, entries, asked, linksRevision]);

  const nowMs = useWaitClock();
  const when = nowMs !== null ? developsWhen(developsAt, nowMs) : null;
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [developing, setDeveloping] = useState(false);

  const developNow = async () => {
    setDeveloping(true);
    // The database stores a develop time this close to its own clock as its own now (`events_reveal_stamp`), and the
    // save opens every row in that same save; the page reads the developed album afresh.
    const result = await updateEventAction(eventId, {
      develops_at: new Date().toISOString(),
    });
    setDeveloping(false);
    setAsking(false);
    if (!result.ok) {
      toast.error(
        result.message || "Couldn't develop the album. Please try again.",
      );
      return;
    }
    router.refresh();
  };

  return (
    <div data-host-cover="covered" className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <span
          className="min-w-0 flex-1 text-pretty text-muted-foreground"
          data-host-cover-say=""
        >
          {when
            ? `What your guests see until it develops ${when}.`
            : "What your guests see until it develops."}
        </span>
        <Button type="button" size="sm" onClick={onLook} data-host-look="">
          <Eye /> Look
        </Button>
        {!asking ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={developing}
            onClick={() => setAsking(true)}
          >
            Develop now
          </Button>
        ) : null}
      </div>
      {asking ? (
        <ConsequenceLine
          confirmLabel="Develop now"
          onConfirm={() => void developNow()}
          onCancel={() => setAsking(false)}
          busy={developing}
        >
          Every photo added so far shows now, to every guest. New ones show
          straight away.
        </ConsequenceLine>
      ) : null}
      <ContactSheet
        waiting={facts}
        hers={hers}
        clock={{ kind: "develop", developsAt }}
      />
    </div>
  );
}

/**
 * LOOKING EARLY: the line over her album while the cover is lifted, and, once it has scrolled away, the same words in a
 * pill at the window's foot, so Cover it is one press away wherever she is in the album.
 */
export function LookingEarly({
  developsAt,
  onCover,
}: {
  developsAt: string;
  onCover: () => void;
}) {
  const nowMs = useWaitClock();
  const when = nowMs !== null ? developsWhen(developsAt, nowMs) : null;
  const words = when
    ? `Looking early. Your guests see these when it develops ${when}.`
    : "Looking early. Your guests see these when it develops.";
  const { sentinelRef, inView } = useInViewSentinel<HTMLDivElement>();
  return (
    <>
      <div
        ref={sentinelRef}
        data-host-cover="lifted"
        className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-border px-3 py-2 text-sm"
      >
        <Eye className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1 text-pretty" data-host-cover-say="">
          {words}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCover}
          data-host-cover-it=""
        >
          <EyeOff /> Cover it
        </Button>
      </div>
      {!inView ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-3">
          <div
            data-host-cover-pill=""
            className={cn(
              GLASS,
              "pointer-events-auto flex items-center gap-3 rounded-full py-1.5 pr-1.5 pl-4 text-sm text-white",
            )}
          >
            <span className="flex items-center gap-2">
              <Eye className="size-4 shrink-0" aria-hidden />
              Looking early
            </span>
            <Button
              type="button"
              size="sm"
              variant="on-photo"
              onClick={onCover}
            >
              Cover it
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
