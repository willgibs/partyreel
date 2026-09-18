"use client";

import { ExplorationBoard, FitStage, Stage } from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import {
  ABSENCE,
  EMPTY,
  FEATURE_H1,
  GATE,
  HERO_SUB,
  HOST_EMPTY,
  MOMENT,
  PRO_LINE,
} from "./lines";
import { VOICE } from "./spec";
import {
  FeatureHero,
  GuestAlbum,
  GuestSheet,
  HomeHero,
  HostDashboard,
  PricingPair,
} from "./surfaces";

/**
 * THE PREVIEWS, AND NOTHING ELSE: every candidate line, set in the surface it
 * ships on, at that surface's true size.
 *
 * ★ THE PREVIEW IS THE ONLY PLACE THE LINE ITSELF APPEARS. An option's `label`
 * carries the fragment a reviewer recognises it by (the dock caps a label at 48
 * characters, and most of these sentences are longer), and its `means` says
 * what it does differently. The words themselves are never restated in prose,
 * because a voice board that prints its candidates in a list is the silo Will
 * killed the last one for.
 *
 * ★ A STAGE PER SURFACE, CHOSEN BY WHAT THE SURFACE IS. A hero and a phone
 * screen ARE viewports, so they take `Stage` at 1440 by 930 and 375 by 760; a
 * section of arbitrary height takes `FitStage`, whose ground ends where the
 * block does. Both mark themselves a specimen, which is what keeps the reading
 * budget honest: the words a reviewer LOOKS at here are not words they have to
 * read before answering.
 *
 * ★ NO `bodySkin` ANYWHERE. It flips the whole lab page to one ground, and this
 * board crosses four of them in eight questions (the dark room, paper, the app
 * and a guest's phone), so a page-wide skin would be wrong on most of them.
 */
const PREVIEWS: PreviewsFor<typeof VOICE> = {
  /* 1. The guest's welcome sheet, at a phone's own 375. */
  "absence.named": <PhoneSheet step="welcome" line={ABSENCE.named} />,
  "absence.actions": <PhoneSheet step="welcome" line={ABSENCE.actions} />,
  "absence.phone": <PhoneSheet step="welcome" line={ABSENCE.phone} />,
  "absence.roll": <PhoneSheet step="welcome" line={ABSENCE.roll} />,

  /* 2. The home hero, at 1440, standing still. */
  "hero-sub.today": <HeroStage sub={HERO_SUB.today} />,
  "hero-sub.morning": <HeroStage sub={HERO_SUB.morning} />,
  "hero-sub.one": <HeroStage sub={HERO_SUB.one} />,
  "hero-sub.guests": <HeroStage sub={HERO_SUB.guests} />,

  /* 3. /features/curation's hero, the real PageHero wearing the candidate. */
  "feature-h1.today": <FeatureStage h1={FEATURE_H1.today} />,
  "feature-h1.decide": <FeatureStage h1={FEATURE_H1.decide} />,
  "feature-h1.pass": <FeatureStage h1={FEATURE_H1.pass} />,
  "feature-h1.album": <FeatureStage h1={FEATURE_H1.album} />,

  /* 4. /pricing's pair, so the Pro line is read beside the Free one. */
  "pro-line.again": <PricingStage proLine={PRO_LINE.again} />,
  "pro-line.covered": <PricingStage proLine={PRO_LINE.covered} />,
  "pro-line.video": <PricingStage proLine={PRO_LINE.video} />,
  "pro-line.next": <PricingStage proLine={PRO_LINE.next} />,

  /* 5. The host's dashboard with nothing on it. */
  "host-empty.land": <DashboardStage title={HOST_EMPTY.land} />,
  "host-empty.code": <DashboardStage title={HOST_EMPTY.code} />,
  "host-empty.start": <DashboardStage title={HOST_EMPTY.start} />,
  "host-empty.album": <DashboardStage title={HOST_EMPTY.album} />,

  /* 6. The sheet's account step. */
  "gate.today": <PhoneSheet step="gate" line={GATE.today} />,
  "gate.ask": <PhoneSheet step="gate" line={GATE.ask} />,
  "gate.host": <PhoneSheet step="gate" line={GATE.host} />,
  "gate.just": <PhoneSheet step="gate" line={GATE.just} />,

  /* 7. The guest album before the first upload. */
  "empty.lands": <PhoneAlbum view="empty" line={EMPTY.lands} />,
  "empty.starts": <PhoneAlbum view="empty" line={EMPTY.starts} />,
  "empty.fills": <PhoneAlbum view="empty" line={EMPTY.fills} />,
  "empty.every": <PhoneAlbum view="empty" line={EMPTY.every} />,

  /* 8. The toast an upload leaves behind. */
  "moment.today": <PhoneAlbum view="toast" line={MOMENT.today} />,
  "moment.sent": <PhoneAlbum view="toast" line={MOMENT.sent} />,
  "moment.through": <PhoneAlbum view="toast" line={MOMENT.through} />,
  "moment.got": <PhoneAlbum view="toast" line={MOMENT.got} />,
};

/* ── the stages, one per surface ─────────────────────────────────────────── */

/** A guest's phone: the app's own light ground at 375 by 760. */
function PhoneSheet({
  step,
  line,
}: {
  step: "welcome" | "gate";
  line: string;
}) {
  return (
    <Stage mode="phone" ground="app-light">
      <GuestSheet step={step} line={line} />
    </Stage>
  );
}

function PhoneAlbum({ view, line }: { view: "empty" | "toast"; line: string }) {
  return (
    <Stage mode="phone" ground="app-light">
      <GuestAlbum view={view} line={line} />
    </Stage>
  );
}

/** The home hero: a viewport, so it takes the 1440 by 930 canvas whole. */
function HeroStage({ sub }: { sub: string }) {
  return (
    <Stage mode="desktop" ground="cinema">
      <HomeHero sub={sub} />
    </Stage>
  );
}

/**
 * A section of its own height on the dark room it ships on.
 *
 * ★ NO `swapKey`. It remounts the child so an entrance can be seen again, and
 * nothing here has one; what it cost was a remeasure on every press, and a
 * `FitStage` that has just remounted reports a small box for a frame. The type
 * ladder's steps resolve against that box, so a capture taken in that frame
 * photographed an 80px headline at its phone end (2026-09-18).
 */
function FeatureStage({ h1 }: { h1: string }) {
  return (
    <FitStage mode="desktop" ground="cinema">
      <FeatureHero h1={h1} />
    </FitStage>
  );
}

/** The pricing pair, on paper. */
function PricingStage({ proLine }: { proLine: string }) {
  return (
    <FitStage mode="desktop" ground="paper">
      <PricingPair proLine={proLine} />
    </FitStage>
  );
}

/** The host's dashboard, on the app's light theme. */
function DashboardStage({ title }: { title: string }) {
  return (
    <Stage mode="desktop" ground="app-light" height={640}>
      <HostDashboard title={title} />
    </Stage>
  );
}

export function VoiceBoard() {
  return <ExplorationBoard spec={VOICE} previews={PREVIEWS} />;
}
