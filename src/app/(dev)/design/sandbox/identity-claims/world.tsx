"use client";

import { useReducer } from "react";

import {
  type Action,
  type Batch,
  bannerOf,
  claimedOf,
  isDone,
  type Mode,
  play,
  reduce,
  type Step,
} from "./batch";
import { WAITING } from "./fixtures";
import {
  AlbumGround,
  Banner,
  DashboardGround,
  MomentCard,
  PageInvite,
  PointerLine,
} from "./ground";
import { FinishToast, ReviewDialog, ReviewSheet } from "./review";

/**
 * ONE WORLD PER FRAME: a page, the review over it, and the state they share.
 *
 * The page answers the review live: a claim written under `save=once` puts its
 * Guest card into Your events behind the sheet and takes its count off the
 * banner, and a review closed having added photos plays the one toast. The
 * frame opens wherever its script leaves the machine (`batch.ts`), then every
 * press inside it is the mode's own.
 */
export function ClaimsWorld({
  mode,
  script = [],
  open = true,
  where = "dashboard",
  pointer = false,
  reviewInPlace = false,
}: {
  mode: Mode;
  script?: readonly Step[];
  /** Whether the review's sheet starts open. */
  open?: boolean;
  where?: "dashboard" | "album";
  /** The album's moment card carries `pointer`'s one line. */
  pointer?: boolean;
  /** `pointer=here`: the line's button opens the review over this album. */
  reviewInPlace?: boolean;
}) {
  const [batch, dispatch] = useReducer(
    (b: Batch, a: Action) => reduce(mode, b, a),
    undefined,
    () => play(mode, script, { open }),
  );

  const overlay = (
    <>
      {batch.open && (
        <ReviewSheet mode={mode} batch={batch} dispatch={dispatch} />
      )}
      {batch.dialog && (
        <ReviewDialog mode={mode} batch={batch} dispatch={dispatch} />
      )}
      {batch.toast !== null && <FinishToast added={batch.toast} />}
    </>
  );

  if (where === "album") {
    return (
      <AlbumGround overlay={overlay}>
        <MomentCard
          extra={
            pointer ? (
              <PointerLine
                events={WAITING.length}
                onReview={
                  reviewInPlace ? () => dispatch({ type: "open" }) : undefined
                }
              />
            ) : null
          }
        />
      </AlbumGround>
    );
  }

  const banner = bannerOf(mode, batch);
  const claimed = claimedOf(batch);
  const notice = banner ? (
    <Banner
      words={banner.words}
      action={banner.action}
      onAction={() => dispatch({ type: "open" })}
    />
  ) : isDone(batch) && claimed.length > 0 ? (
    <PageInvite />
  ) : null;

  return (
    <DashboardGround notice={notice} claimed={claimed} overlay={overlay} />
  );
}
