"use client";

import { ExplorationBoard } from "@/components/lab";
import type { BoardState } from "@/components/lab/board-spec";
import type { PreviewsFor } from "@/components/lab/exploration";

import { APP_VOCABULARY } from "./spec";
import { Scene, widthOf } from "./scene";
import { EmptyShowcase, type EmptyOption } from "./empty-states";
import { LoadingShowcase, type LoadingOption } from "./loading-surfaces";
import { GrammarShowcase, type GrammarOption } from "./tile-grammar";
import { ToolbarShowcase, type ToolbarOption } from "./bulk-toolbar";
import {
  type ControlShape,
  GuestControlsRow,
  HostControlsRow,
  LiveGrid,
  type Persistence,
} from "./gallery-controls";
import { ConfirmShowcase, type CueOption } from "./confirm-switch";

/**
 * THE PREVIEWS, and nothing else: one real surface per option, redrawn at
 * whichever width the shared dock knob is on (`s.width`, every decision's
 * `configs`). Every function here is a thin `Scene` wrapper over the real
 * composition in this board's own surfaces files; nothing is built here that
 * is not already a named export elsewhere in `sandbox/app-vocabulary/`.
 */

const empty = (s: BoardState, option: EmptyOption) => (
  <Scene id={`empty-${option}`} width={widthOf(s.width)} title="Nothing here yet" tall>
    <EmptyShowcase option={option} />
  </Scene>
);

const loading = (s: BoardState, option: LoadingOption) => (
  <Scene id={`loading-${option}`} width={widthOf(s.width)} title="Loading" tall>
    <LoadingShowcase option={option} />
  </Scene>
);

const grammar = (s: BoardState, option: GrammarOption) => (
  <Scene id={`grammar-${option}`} width={widthOf(s.width)} title="One tile, one grammar" tall>
    <GrammarShowcase option={option} />
  </Scene>
);

const toolbar = (s: BoardState, option: ToolbarOption) => (
  <Scene id={`toolbar-${option}`} width={widthOf(s.width)} title="The bulk toolbar" tall>
    <ToolbarShowcase option={option} />
  </Scene>
);

/** Every number measured: does the row wrap or overflow at this width, read
 *  off the frame's own root rather than assumed from the classNames. */
function measureFit(root: HTMLElement): string {
  const over = root.scrollWidth > root.clientWidth + 1;
  return over
    ? `overflows: ${root.scrollWidth}px of content in ${root.clientWidth}px`
    : `fits: ${root.scrollWidth}px in ${root.clientWidth}px`;
}

const galleryHome = (s: BoardState, shape: ControlShape) => (
  <Scene
    id={`gc-home-${shape}`}
    width={widthOf(s.width)}
    title="The gallery's controls"
    tall
    measure={measureFit}
  >
    <div className="min-h-full space-y-5 bg-background p-5 text-foreground">
      <div>
        <p className="mb-2 text-[10px] text-muted-foreground">
          The guest album&apos;s row
        </p>
        <GuestControlsRow shape={shape} value={240} />
      </div>
      <div>
        <p className="mb-2 text-[10px] text-muted-foreground">
          The host event page&apos;s Gallery section header
        </p>
        <HostControlsRow shape={shape} value={240} />
      </div>
      <div>
        <p className="mb-2 text-[10px] text-muted-foreground">
          The real masonry, wearing 240px
        </p>
        <LiveGrid value={240} />
      </div>
    </div>
  </Scene>
);

const galleryPersist = (s: BoardState, persist: Persistence) => {
  const shape = (s["gallery-controls-home"] as ControlShape) ?? "cluster";
  return (
    <Scene
      id={`gc-persist-${persist}`}
      width={widthOf(s.width)}
      title="How the choice persists"
      tall
    >
      <div className="min-h-full space-y-5 bg-background p-5 text-foreground">
        <div>
          <p className="mb-2 text-[10px] text-muted-foreground">
            The guest album&apos;s row, wearing the picked shape
          </p>
          <GuestControlsRow shape={shape} value={240} persist={persist} />
        </div>
        <div>
          <p className="mb-2 text-[10px] text-muted-foreground">
            The host event page&apos;s Gallery section header
          </p>
          <HostControlsRow shape={shape} value={240} persist={persist} />
        </div>
      </div>
    </Scene>
  );
};

const confirm = (s: BoardState, option: CueOption) => (
  <Scene id={`confirm-${option}`} width={widthOf(s.width)} title="The confirm switch" tall>
    <ConfirmShowcase option={option} />
  </Scene>
);

const PREVIEWS: PreviewsFor<typeof APP_VOCABULARY> = {
  "empty-states.primitive": (s) => empty(s, "primitive"),
  "empty-states.tiers": (s) => empty(s, "tiers"),
  "empty-states.statusquo": (s) => empty(s, "statusquo"),
  "loading.everywhere": (s) => loading(s, "everywhere"),
  "loading.none": (s) => loading(s, "none"),
  "loading.asneeded": (s) => loading(s, "asneeded"),
  "tile-grammar.mode": (s) => grammar(s, "mode"),
  "tile-grammar.tree": (s) => grammar(s, "tree"),
  "tile-grammar.twotwo": (s) => grammar(s, "twotwo"),
  "bulk-toolbar.label": (s) => toolbar(s, "label"),
  "bulk-toolbar.icon": (s) => toolbar(s, "icon"),
  "bulk-toolbar.hybrid": (s) => toolbar(s, "hybrid"),
  "gallery-controls-home.segmented": (s) => galleryHome(s, "segmented"),
  "gallery-controls-home.cluster": (s) => galleryHome(s, "cluster"),
  "gallery-controls-home.popover": (s) => galleryHome(s, "popover"),
  "gallery-controls-persistence.session": (s) => galleryPersist(s, "session"),
  "gallery-controls-persistence.device": (s) => galleryPersist(s, "device"),
  "gallery-controls-persistence.account": (s) => galleryPersist(s, "account"),
  "confirm-switch.label": (s) => confirm(s, "label"),
  "confirm-switch.icon": (s) => confirm(s, "icon"),
  "confirm-switch.primitive": (s) => confirm(s, "primitive"),
};

export function AppVocabularyBoard() {
  return <ExplorationBoard spec={APP_VOCABULARY} previews={PREVIEWS} />;
}
