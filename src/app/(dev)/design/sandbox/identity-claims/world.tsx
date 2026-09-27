"use client";

import { type ReactNode, useReducer, useState } from "react";

import {
  type Action,
  type Batch,
  bannerOf,
  claimedOf,
  play,
  reduce,
  type Step,
  waitingOf,
} from "./batch";
import { CURRENT_EVENT, type WaitingEvent } from "./fixtures";
import {
  AlbumGround,
  Banner,
  DashboardGround,
  MomentCard,
  NamedPointer,
  PageInvite,
  PointerLine,
} from "./ground";
import { ClosingToast, ReviewDialog, ReviewPanel } from "./review";
import type { Size } from "./screens";

/** `pointer`'s five answers: where she first meets the one review. */
export type Pointer = "quiet" | "line" | "here" | "named" | "bell";

type Where = "album" | "dashboard";

/**
 * The one row an option adds to the moment card, or nothing: `quiet` and
 * `bell` leave the card as it ships, and once nothing waits no option says
 * anything (the row goes with the last decision).
 */
function momentRow(
  pointer: Pointer,
  waiting: readonly WaitingEvent[],
  reviewHere: () => void,
  toDashboard: () => void,
): ReactNode {
  if (waiting.length === 0) return null;
  switch (pointer) {
    case "line":
      return (
        <PointerLine waiting={waiting} onDashboard onReview={toDashboard} />
      );
    case "here":
      return (
        <PointerLine
          waiting={waiting}
          onDashboard={false}
          onReview={reviewHere}
        />
      );
    case "named":
      return <NamedPointer waiting={waiting} onReview={reviewHere} />;
    default:
      return null;
  }
}

/**
 * ONE WORLD PER FRAME: a page, the review over it, and the state they share.
 *
 * ★ EACH OPTION IS A STRATEGY, PLAYED LIVE. What the album says (nothing, a
 * line, the events by name, or a count on her avatar), what its button opens
 * (the review over this album, or her dashboard with the review open), and
 * what the dashboard counts (the banner always, the bell under `bell`) are all
 * read from `pointer` here, and a press inside a frame does what the option
 * does: `line`'s Review all 4 turns the frame into her dashboard with the review
 * open, `here`'s opens it over the album, `bell`'s count opens her menu.
 *
 * ★ THE PAGE ANSWERS THE REVIEW. A claim puts its Guest card into Your events
 * behind the panel and takes its count off the banner, the line and the badge,
 * and a review closed having added photos plays the one toast, so a frame
 * closed after two says what two decisions leave behind. The frame opens
 * wherever its script leaves the machine (`batch.ts`).
 */
export function ClaimsWorld({
  pointer,
  size,
  start,
  script = [],
  open = false,
  bell = false,
}: {
  pointer: Pointer;
  size: Size;
  /** The page the frame opens on. */
  start: Where;
  script?: readonly Step[];
  /** The review starts open over `start`. */
  open?: boolean;
  /** The bell's panel starts open (`pointer=bell`'s own frame). */
  bell?: boolean;
}) {
  const [where, setWhere] = useState<Where>(start);
  const [batch, dispatch] = useReducer(
    (b: Batch, a: Action) => reduce(b, a),
    undefined,
    () => play(script, { open }),
  );
  const [bellOpen, setBellOpen] = useState(bell);
  const [menuOpen, setMenuOpen] = useState(false);

  const waiting = waitingOf(batch);
  // Only `bell` counts on her avatar and the bell; the others leave both bare.
  const count = pointer === "bell" ? waiting.length : 0;

  const review = () => {
    setBellOpen(false);
    setMenuOpen(false);
    dispatch({ type: "open" });
  };
  // A different page: her dashboard, with the review already open on it.
  const toDashboard = () => {
    setWhere("dashboard");
    review();
  };

  const overlay = (
    <>
      {batch.open && (
        <ReviewPanel
          size={size}
          back={where === "album" ? CURRENT_EVENT.name : "Dashboard"}
          batch={batch}
          dispatch={dispatch}
        />
      )}
      {batch.asking && (
        <ReviewDialog size={size} batch={batch} dispatch={dispatch} />
      )}
      {batch.toast !== null && <ClosingToast added={batch.toast} />}
    </>
  );

  if (where === "album") {
    return (
      <AlbumGround
        size={size}
        count={count}
        menu={menuOpen}
        onMenu={() => setMenuOpen((v) => !v)}
        onWaiting={toDashboard}
        overlay={overlay}
      >
        <MomentCard
          pointer={momentRow(pointer, waiting, review, toDashboard)}
        />
      </AlbumGround>
    );
  }

  const banner = bannerOf(batch);
  const claimed = claimedOf(batch);
  const notice = banner ? (
    <Banner words={banner.words} action={banner.action} onAction={review} />
  ) : claimed.length > 0 ? (
    <PageInvite />
  ) : null;

  return (
    <DashboardGround
      size={size}
      count={count}
      bell={bellOpen}
      onBell={() => setBellOpen((v) => !v)}
      waiting={pointer === "bell" ? waiting : []}
      onReview={review}
      notice={notice}
      claimed={claimed}
      overlay={overlay}
    />
  );
}
