"use client";

/**
 * YOUR EVENTS' DOOR: SEND SEVERAL ALBUMS AT ONCE (Will, desk 2: `doors = both`, "a season goes in one press"). One
 * press beside the Display menu opens her albums as a list: each its cover, its name and day, what it holds, and
 * whether her Drive has it already ("In your Drive", "12 new", "Sending"); she picks, and Send to Drive goes to the
 * same promise and final press as one album's (`DriveSendSteps`), the albums sharing her three lanes, oldest first, so
 * whole albums finish in order.
 *
 * A list rather than checks on the tiles: it reads the same over the gallery, the table and the list, and a planner
 * with two hundred albums picks from rows. (Recorded as Will's to overrule: the board drew checks on the tiles.)
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, FolderUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupFooter,
  PopupHeader,
} from "@/components/ui/popup";
import { DESK_QUERY } from "@/components/ui/popup-kinds";
import { Switch } from "@/components/ui/switch";
import type { DriveReturn } from "@/lib/drive/oauth-cookie";
import { MAX_ALBUMS_A_PRESS, type AlbumPreview } from "@/lib/drive/press";
import { formatCount } from "@/lib/format/count";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn, formatBytes, formatEventDate } from "@/lib/utils";

import { peekIntent, takeIntent, takeReturnWord } from "./drive-client";
import { DriveGlyph, NotSetUpNotice } from "./drive-parts";
import { DriveSendSteps, type SendDone } from "./send-steps";
import { useDriveStatus } from "./use-drive-status";

type Albums = { albums: AlbumPreview[]; more: boolean };

function stateOf(
  a: AlbumPreview,
): { label: string; tone: "info" | "success" | "muted" } | null {
  if (a.unfinished) return { label: "Sending", tone: "info" };
  if (a.sentBefore && a.newItems === 0)
    return { label: "In your Drive", tone: "success" };
  if (a.sentBefore)
    return { label: `${formatCount(a.newItems)} new`, tone: "muted" };
  return null;
}

/**
 * ★ THE LIST STANDS ONLY WHERE DRIVE IS SET UP, AND WHERE IT IS NOT THAT COMES FIRST (red-team 55's NIT): the list let
 * her pick albums (up to ten a press) and only the press said "isn't set up yet", where Take it home says it on its first
 * press. It reads the one status poll once, when the popup opens (the step mounts only while open, so a host who never
 * opens this asks nothing), and asks for no album until Drive is there: an unread status (a failed read) is no
 * verdict, and the press says what it finds.
 */
function PickGate({
  children,
  fallback,
  onThere,
}: {
  children: ReactNode;
  /** What stands in the list's place where Drive is not set up. */
  fallback: ReactNode;
  /** Drive is there (or the read said nothing): the list may be asked for, once per mount. */
  onThere: () => void;
}) {
  const { status, loaded } = useDriveStatus();
  const notSetUp = loaded && status !== null && !status.configured;
  const there = loaded && !notSetUp;
  useEffect(() => {
    if (there) onThere();
    // Once for each time the step stands: `onThere` is the picker's own closure over what it holds right now.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [there]);
  return notSetUp ? <>{fallback}</> : <>{children}</>;
}

export function AlbumPicker({
  covers,
  trigger,
}: {
  /** Each album's cover where Your events has one (a presigned tile, never a key). */
  covers: ReadonlyMap<string, string | null>;
  /** The control that opens it. */
  trigger: (open: () => void) => React.ReactNode;
}) {
  const desk = useMediaQuery(DESK_QUERY);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"pick" | "drive">("pick");
  const [list, setList] = useState<Albums | null>(null);
  const [failed, setFailed] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [includeHidden, setIncludeHidden] = useState(false);
  const [returned, setReturned] = useState<DriveReturn | null>(null);

  const load = (hidden: boolean) => {
    setList(null);
    setFailed(false);
    void fetch(`/api/drive/albums?hidden=${hidden ? 1 : 0}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as
          | ({ ok?: boolean } & Albums)
          | null;
        if (body?.ok) setList({ albums: body.albums, more: body.more });
        else setFailed(true);
      })
      .catch(() => setFailed(true));
  };

  const openPicker = (preset?: {
    events: string[];
    includeHidden: boolean;
    returned: DriveReturn | null;
  }) => {
    setOpen(true);
    setStep(preset ? "drive" : "pick");
    setPicked(new Set(preset?.events ?? []));
    setIncludeHidden(preset?.includeHidden ?? false);
    setReturned(preset?.returned ?? null);
    // A fresh list for every opening, asked for by the pick step once Drive is known to be there (`PickGate`).
    setList(null);
    setFailed(false);
  };

  // Back from Google with albums she meant to send from here (or from the storage door): the final press again.
  useEffect(() => {
    const intent = peekIntent();
    if (!intent || (intent.source !== "picker" && intent.source !== "storage"))
      return;
    const word = takeReturnWord();
    if (!word) return;
    takeIntent();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the tab's sessionStorage, read once after mount
    openPicker({
      events: intent.events,
      includeHidden: intent.includeHidden,
      returned: word,
    });
    // Once, on the paint after the return.
  }, []);

  const chosen = useMemo(
    () => (list?.albums ?? []).filter((a) => picked.has(a.eventId)),
    [list, picked],
  );
  const bytes = chosen.reduce((n, a) => n + (a.unfinished ? 0 : a.newBytes), 0);
  const full = picked.size >= MAX_ALBUMS_A_PRESS;

  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < MAX_ALBUMS_A_PRESS) next.add(id);
      return next;
    });

  const done = (result: SendDone) => {
    setOpen(false);
    const n = result.started.filter((r) => r.state === "started").length;
    if (n > 0) {
      toast.success(
        n === 1
          ? "Sending to Google Drive"
          : `Sending ${formatCount(n)} albums to Google Drive`,
        {
          id: "drive-started-picker",
          description:
            "You can close this page: we'll email you when they're in your Drive.",
        },
      );
    }
  };

  return (
    <>
      {trigger(() => openPicker())}
      <Popup open={open} onOpenChange={setOpen}>
        <PopupContent kind="list" data-drive-picker={step}>
          {step === "drive" ? (
            <DriveSendSteps
              eventIds={[...picked]}
              includeHidden={includeHidden}
              source="picker"
              returnPath="/dashboard"
              upLabel="Your albums"
              onBack={() => {
                setReturned(null);
                setStep("pick");
              }}
              onDone={done}
              returned={returned}
              desk={desk}
            />
          ) : (
            <PickGate
              onThere={() => {
                if (!list && !failed) load(includeHidden);
              }}
              fallback={
                <>
                  <PopupHeader title="Send to Google Drive" back="Dashboard" />
                  <PopupBody className="pt-2">
                    <NotSetUpNotice />
                  </PopupBody>
                </>
              }
            >
              <PopupHeader
                title="Send to Google Drive"
                back="Dashboard"
                description="Pick the albums to keep in your own Drive, every original. Each gets its own folder."
              />
              <PopupBody className="flex flex-col gap-1 pt-2">
                {failed ? (
                  <div className="flex flex-col items-start gap-3 py-6">
                    <p className="text-sm text-muted-foreground">
                      Couldn&rsquo;t list your albums.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => load(includeHidden)}
                    >
                      Try again
                    </Button>
                  </div>
                ) : !list ? (
                  <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader2
                      className="size-4 animate-spin motion-reduce:animate-none"
                      aria-hidden
                    />{" "}
                    Adding up your albums
                  </p>
                ) : list.albums.length === 0 ? (
                  <p className="py-8 text-sm text-muted-foreground">
                    No albums to send yet.
                  </p>
                ) : (
                  <ul className="flex flex-col">
                    {list.albums.map((a) => {
                      const on = picked.has(a.eventId);
                      const state = stateOf(a);
                      const cover = covers.get(a.eventId) ?? null;
                      return (
                        <li key={a.eventId}>
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={on}
                            disabled={a.items === 0 || (!on && full)}
                            onClick={() => toggle(a.eventId)}
                            data-drive-pick={a.eventId}
                            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
                          >
                            <span
                              aria-hidden
                              className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded-full border",
                                on
                                  ? "border-transparent bg-success text-success-foreground"
                                  : "border-border bg-background",
                              )}
                            >
                              {on ? (
                                <Check className="size-3.5" strokeWidth={3} />
                              ) : null}
                            </span>
                            <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-muted">
                              {cover ? (
                                // eslint-disable-next-line @next/next/no-img-element -- a presigned cover, never next/image
                                <img
                                  src={cover}
                                  alt=""
                                  className="absolute inset-0 size-full object-cover"
                                />
                              ) : (
                                <span className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                  <DriveGlyph />
                                </span>
                              )}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-baseline justify-between gap-2">
                                <span className="truncate font-medium text-foreground">
                                  {a.name}
                                </span>
                                {state ? (
                                  <span
                                    className={cn(
                                      "shrink-0 text-xs",
                                      state.tone === "success"
                                        ? "text-success"
                                        : state.tone === "info"
                                          ? "text-info"
                                          : "text-muted-foreground",
                                    )}
                                  >
                                    {state.label}
                                  </span>
                                ) : null}
                              </span>
                              <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                                <span className="truncate">
                                  {a.eventDate
                                    ? formatEventDate(
                                        a.eventDate,
                                        a.eventEndDate,
                                      )
                                    : "No date"}
                                </span>
                                <span aria-hidden>·</span>
                                <span className="shrink-0">
                                  {a.items === 0
                                    ? "Nothing yet"
                                    : `${formatCount(a.items)} · ${formatBytes(a.bytes)}`}
                                </span>
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {list?.more ? (
                  <p className="px-2 pt-2 text-xs text-muted-foreground">
                    Your newest 200. Send an older one from its own album.
                  </p>
                ) : null}
                <label className="mt-2 flex items-center justify-between gap-3 px-2 text-sm">
                  <span className="text-muted-foreground">
                    Include hidden items
                  </span>
                  <Switch
                    checked={includeHidden}
                    onCheckedChange={(next) => {
                      setIncludeHidden(next);
                      load(next);
                    }}
                    aria-label="Include hidden items"
                  />
                </label>
              </PopupBody>
              <PopupFooter>
                <span className="mr-auto self-center text-sm text-muted-foreground tabular-nums">
                  {picked.size === 0
                    ? "Pick albums to send"
                    : `${formatCount(picked.size)} ${picked.size === 1 ? "album" : "albums"} · ${formatBytes(bytes)}`}
                </span>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={picked.size === 0}
                  onClick={() => setStep("drive")}
                >
                  <FolderUp /> Send to Drive
                </Button>
              </PopupFooter>
            </PickGate>
          )}
        </PopupContent>
      </Popup>
    </>
  );
}
