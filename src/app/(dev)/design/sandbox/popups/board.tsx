"use client";

import "./popups.css";

import { ExplorationBoard } from "@/components/lab";
import type { PreviewsFor } from "@/components/lab/exploration";

import { ChoicesPreview, pickAtOf } from "./choices";
import { confirmAtOf, ConfirmPreview } from "./confirm";
import { formAtOf, FormsPreview } from "./forms";
import { tappedOf } from "./fixtures";
import { listAtOf, ListsPreview } from "./lists";
import { PeekPreview } from "./peek";
import { planAtOf, PlansPreview } from "./plans";
import { SettingsPreview } from "./settings";
import { shareAtOf, SharePreview } from "./share";
import { POPUPS } from "./spec";

/**
 * THE PREVIEWS: eight kinds of popup, each option drawn as the rule it is on
 * that kind's real screens (`Scenes`: the laptop's screen on the kind's knob,
 * three real screens of the kind in a hand, the keyboard up wherever a field
 * is focused). Every option is a component, never a call, and every caption
 * is read off its own frame (`scene.tsx`).
 */

const PREVIEWS: PreviewsFor<typeof POPUPS> = {
  "lists.sheet": (s) => (
    <ListsPreview option="sheet" at={listAtOf(s["list-at"])} />
  ),
  "lists.panel": (s) => (
    <ListsPreview option="panel" at={listAtOf(s["list-at"])} />
  ),
  "lists.page": (s) => (
    <ListsPreview option="page" at={listAtOf(s["list-at"])} />
  ),
  "lists.centred": (s) => (
    <ListsPreview option="centred" at={listAtOf(s["list-at"])} />
  ),
  "lists.inline": (s) => (
    <ListsPreview option="inline" at={listAtOf(s["list-at"])} />
  ),

  "confirm.dialog": (s) => (
    <ConfirmPreview option="dialog" at={confirmAtOf(s["confirm-at"])} />
  ),
  "confirm.sheet": (s) => (
    <ConfirmPreview option="sheet" at={confirmAtOf(s["confirm-at"])} />
  ),
  "confirm.undo": (s) => (
    <ConfirmPreview option="undo" at={confirmAtOf(s["confirm-at"])} />
  ),
  "confirm.inline": (s) => (
    <ConfirmPreview option="inline" at={confirmAtOf(s["confirm-at"])} />
  ),

  "forms.sheet": (s) => (
    <FormsPreview option="sheet" at={formAtOf(s["form-at"])} />
  ),
  "forms.dialog": (s) => (
    <FormsPreview option="dialog" at={formAtOf(s["form-at"])} />
  ),
  "forms.screen": (s) => (
    <FormsPreview option="screen" at={formAtOf(s["form-at"])} />
  ),
  "forms.inline": (s) => (
    <FormsPreview option="inline" at={formAtOf(s["form-at"])} />
  ),

  "choices.sheet": (s) => (
    <ChoicesPreview option="sheet" at={pickAtOf(s["pick-at"])} />
  ),
  "choices.dialog": (s) => (
    <ChoicesPreview option="dialog" at={pickAtOf(s["pick-at"])} />
  ),
  "choices.menu": (s) => (
    <ChoicesPreview option="menu" at={pickAtOf(s["pick-at"])} />
  ),
  "choices.inline": (s) => (
    <ChoicesPreview option="inline" at={pickAtOf(s["pick-at"])} />
  ),

  "share.sheet": (s) => (
    <SharePreview option="sheet" at={shareAtOf(s["share-at"])} />
  ),
  "share.card": (s) => (
    <SharePreview option="card" at={shareAtOf(s["share-at"])} />
  ),
  "share.native": (s) => (
    <SharePreview option="native" at={shareAtOf(s["share-at"])} />
  ),

  "plans.sheet": (s) => (
    <PlansPreview option="sheet" at={planAtOf(s["plan-at"])} />
  ),
  "plans.wide": (s) => (
    <PlansPreview option="wide" at={planAtOf(s["plan-at"])} />
  ),
  "plans.page": (s) => (
    <PlansPreview option="page" at={planAtOf(s["plan-at"])} />
  ),

  "settings.sheet": () => <SettingsPreview option="sheet" />,
  "settings.panel": () => <SettingsPreview option="panel" />,
  "settings.page": () => <SettingsPreview option="page" />,
  "settings.dialog": () => <SettingsPreview option="dialog" />,

  "peek.sheet": (s) => <PeekPreview option="sheet" at={tappedOf(s.tapped)} />,
  "peek.card": (s) => <PeekPreview option="card" at={tappedOf(s.tapped)} />,
  "peek.mini-modal": (s) => (
    <PeekPreview option="mini-modal" at={tappedOf(s.tapped)} />
  ),
  "peek.none": (s) => <PeekPreview option="none" at={tappedOf(s.tapped)} />,
};

export function PopupsBoard() {
  return <ExplorationBoard spec={POPUPS} previews={PREVIEWS} />;
}
