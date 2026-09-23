"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { CLAIMABLE_ROWS, HERS, IMPOSTOR } from "./fixtures";
import {
  AfterToastLines,
  BellButton,
  ChecklistTicket,
  ClaimedEventCard,
  ClaimedStrip,
  ConfirmDialog,
  ConfirmInlineTicket,
  ConfirmSecondScreen,
  DashboardScene,
  MomentCard,
  OneAtATimeCard,
  PointerLine,
  ShippedTicket,
  TicketBanner,
  TicketBellDrawer,
  TicketSheetPanel,
} from "./parts";
import { AlbumGround, Scene, screenOf, Scrim, ToastVisual } from "./scene";
import { IDENTITY_CLAIMS } from "./spec";

/**
 * THE PREVIEWS, AND NOTHING ELSE (`guest-capture/board.tsx`'s own discipline).
 * Every option holds Priya's own screen at today's shape everywhere but the
 * one thing its decision asks: `ticket` varies only where the ticket sits;
 * `pointer` varies only what the moment card gains; `pass` varies only how
 * the two events are worked through; `confirm` varies only the warning before
 * a deletion; `after` varies only what stands on the page once Finish lands.
 *
 * ★ THE BASELINE FOR `confirm` AND `after` IS THE SAME STORY: Tom's Leaving
 * Do already marked Claim, Beach Bonfire left over. `confirm`'s three options
 * are three shapes of the warning that leftover state would trigger on
 * Finish; `after`'s three are three shapes of what Finish leaves behind once
 * it is confirmed. Every caption states a fact the fixtures and the markup
 * both already carry, never an assertion loosely made.
 */

const TOTAL_WAITING = HERS.uploadCount + IMPOSTOR.uploadCount;

function ticketScreen(id: "card" | "banner" | "bell", s: BoardState) {
  const sc = screenOf(s.screen as string);
  if (id === "banner") {
    return (
      <Scene
        id="ticket-banner"
        screen={sc}
        title="The ticket's home"
        caption="One banner line above the feed; the sheet holds both rows on its own panel."
      >
        <DashboardScene
          ticket={<TicketBanner />}
          overlay={
            <>
              <Scrim />
              <TicketSheetPanel />
            </>
          }
        />
      </Scene>
    );
  }
  if (id === "bell") {
    return (
      <Scene
        id="ticket-bell"
        screen={sc}
        title="The ticket's home"
        caption="The bell reads 2; Your events keeps its one card, unchanged."
      >
        <DashboardScene
          headerExtra={<BellButton badge={CLAIMABLE_ROWS.length} />}
          overlay={
            <>
              <Scrim />
              <TicketBellDrawer />
            </>
          }
        />
      </Scene>
    );
  }
  return (
    <Scene
      id="ticket-card"
      screen={sc}
      title="The ticket's home"
      caption="One card, two rows, both decisions and Claim all sit at the head of Your events."
    >
      <DashboardScene ticket={<ShippedTicket />} />
    </Scene>
  );
}

function pointerScreen(id: "quiet" | "line" | "toast", s: BoardState) {
  const sc = screenOf(s.screen as string);
  if (id === "line") {
    return (
      <Scene
        id="pointer-line"
        screen={sc}
        title="The pointer from the album"
        caption={`One more line: ${TOTAL_WAITING} photos from ${CLAIMABLE_ROWS.length} other events are waiting for you.`}
      >
        <AlbumGround>
          <MomentCard extra={<PointerLine />} />
        </AlbumGround>
      </Scene>
    );
  }
  if (id === "toast") {
    return (
      <Scene
        id="pointer-toast"
        screen={sc}
        title="The pointer from the album"
        caption="A second toast appears once, beside the moment card that stays as it was."
      >
        <AlbumGround>
          <MomentCard />
        </AlbumGround>
        <ToastVisual
          lines={[
            `${TOTAL_WAITING} photos from ${CLAIMABLE_ROWS.length} other events are waiting for you.`,
          ]}
        />
      </Scene>
    );
  }
  return (
    <Scene
      id="pointer-quiet"
      screen={sc}
      title="The pointer from the album"
      caption="The moment card names Maya and Jay's wedding only; nothing else is said here."
    >
      <AlbumGround>
        <MomentCard />
      </AlbumGround>
    </Scene>
  );
}

function passScreen(id: "rows" | "cards" | "checklist", s: BoardState) {
  const sc = screenOf(s.screen as string);
  if (id === "cards") {
    return (
      <Scene
        id="pass-cards"
        screen={sc}
        title="Working through more than one"
        caption="1 of 2: Tom's Leaving Do fills the card; Beach Bonfire waits behind it."
      >
        <DashboardScene ticket={<OneAtATimeCard />} />
      </Scene>
    );
  }
  if (id === "checklist") {
    return (
      <Scene
        id="pass-checklist"
        screen={sc}
        title="Working through more than one"
        caption={`Both rows open at once, ${HERS.uploadCount} and ${IMPOSTOR.uploadCount} small photos shown under each.`}
      >
        <DashboardScene ticket={<ChecklistTicket />} />
      </Scene>
    );
  }
  return (
    <Scene
      id="pass-rows"
      screen={sc}
      title="Working through more than one"
      caption="Both events listed at once: Tom's Leaving Do and Beach Bonfire, Claim all beneath."
    >
      <DashboardScene ticket={<ShippedTicket />} />
    </Scene>
  );
}

function confirmScreen(
  id: "dialog" | "inline" | "second-screen",
  s: BoardState,
) {
  const sc = screenOf(s.screen as string);
  if (id === "inline") {
    return (
      <Scene
        id="confirm-inline"
        screen={sc}
        title="Warning before a deletion"
        caption="Beach Bonfire's row turns destructive in place; Tom's Leaving Do stays claimed above it."
      >
        <DashboardScene ticket={<ConfirmInlineTicket />} />
      </Scene>
    );
  }
  if (id === "second-screen") {
    return (
      <Scene
        id="confirm-second-screen"
        screen={sc}
        title="Warning before a deletion"
        caption={`${IMPOSTOR.uploadCount} photos from Beach Bonfire shown small before Delete and finish.`}
      >
        <DashboardScene ticket={<ConfirmSecondScreen />} />
      </Scene>
    );
  }
  return (
    <Scene
      id="confirm-dialog"
      screen={sc}
      title="Warning before a deletion"
      caption={`A centred dialog: ${IMPOSTOR.uploadCount} photos and videos, at ${IMPOSTOR.eventName}, Delete and finish or Go back.`}
    >
      <DashboardScene
        ticket={<ShippedTicket initialDecisions={{ [HERS.eventId]: "claim" }} />}
        overlay={<ConfirmDialog />}
      />
    </Scene>
  );
}

function afterScreen(id: "toast" | "profile" | "strip", s: BoardState) {
  const sc = screenOf(s.screen as string);
  if (id === "profile") {
    return (
      <Scene
        id="after-profile"
        screen={sc}
        title="What Finish leaves her looking at"
        caption="Tom's Leaving Do settles into Your events as the toast plays; a second line adds Choose what shows on your page."
      >
        <DashboardScene
          extraCard={<ClaimedEventCard />}
          overlay={<AfterToastLines withProfile />}
        />
      </Scene>
    );
  }
  if (id === "strip") {
    return (
      <Scene
        id="after-strip"
        screen={sc}
        title="What Finish leaves her looking at"
        caption="A Just claimed strip singles Tom's Leaving Do out above Your events, instead of letting it settle in quietly like the baseline."
      >
        <DashboardScene ticket={<ClaimedStrip />} />
      </Scene>
    );
  }
  return (
    <Scene
      id="after-toast"
      screen={sc}
      title="What Finish leaves her looking at"
      caption={`Added ${HERS.uploadCount} photos to your account. Tom's Leaving Do settles quietly into Your events as an ordinary Guest card, the ticket gone.`}
    >
      <DashboardScene
        extraCard={<ClaimedEventCard />}
        overlay={<AfterToastLines withProfile={false} />}
      />
    </Scene>
  );
}

const PREVIEWS: PreviewsFor<typeof IDENTITY_CLAIMS> = {
  "ticket.card": (s) => ticketScreen("card", s),
  "ticket.banner": (s) => ticketScreen("banner", s),
  "ticket.bell": (s) => ticketScreen("bell", s),

  "pointer.quiet": (s) => pointerScreen("quiet", s),
  "pointer.line": (s) => pointerScreen("line", s),
  "pointer.toast": (s) => pointerScreen("toast", s),

  "pass.rows": (s) => passScreen("rows", s),
  "pass.cards": (s) => passScreen("cards", s),
  "pass.checklist": (s) => passScreen("checklist", s),

  "confirm.dialog": (s) => confirmScreen("dialog", s),
  "confirm.inline": (s) => confirmScreen("inline", s),
  "confirm.second-screen": (s) => confirmScreen("second-screen", s),

  "after.toast": (s) => afterScreen("toast", s),
  "after.profile": (s) => afterScreen("profile", s),
  "after.strip": (s) => afterScreen("strip", s),
};

export function IdentityClaimsBoard() {
  return <ExplorationBoard spec={IDENTITY_CLAIMS} previews={PREVIEWS} />;
}
