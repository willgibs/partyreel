import type { ComponentType } from "react";

import { IdentityDoorBoard } from "@/app/(dev)/design/sandbox/identity-door/board";
import { IdentityClaimsBoard } from "@/app/(dev)/design/sandbox/identity-claims/board";
import { IdentityProfileBoard } from "@/app/(dev)/design/sandbox/identity-profile/board";
import { ReelScreenBoard } from "@/app/(dev)/design/sandbox/reel-screen/board";
import { GuestCaptureBoard } from "@/app/(dev)/design/sandbox/guest-capture/board";
import { ReelViewBoard } from "@/app/(dev)/design/sandbox/reel-view/board";
import { SiteChromeBoard } from "@/app/(dev)/design/sandbox/site-chrome/board";
import { ProfilePageBoard } from "@/app/(dev)/design/sandbox/profile-page/board";
import { ExportFlowBoard } from "@/app/(dev)/design/sandbox/export-flow/board";
import { AdminTriageBoard } from "@/app/(dev)/design/sandbox/admin-triage/board";
import { MediaViewerBoard } from "@/app/(dev)/design/sandbox/media-viewer/board";
import { EmailsBoard } from "@/app/(dev)/design/sandbox/emails/board";
import { HelpCenterBoard } from "@/app/(dev)/design/sandbox/help-center/board";
import { HostCurationBoard } from "@/app/(dev)/design/sandbox/host-curation/board";

import { PressPageBoard } from "@/app/(dev)/design/sandbox/press-page/board";
import { ContactPageBoard } from "@/app/(dev)/design/sandbox/contact-page/board";
import { AlbumMotionBoard } from "@/app/(dev)/design/sandbox/album-motion/board";
import { LooseEndsBoard } from "@/app/(dev)/design/sandbox/loose-ends/board";
import { PrivacyHeroBoard } from "@/app/(dev)/design/sandbox/privacy-hero/board";
import type { SandboxId } from "@/app/(dev)/design/touchpoints";

/**
 * THE BOARDS' CLIENT COMPONENTS (the Library x Lab round, 2026-09-15): the one
 * map from a standing board's id to the composition that renders it. A board
 * gets an entry here only while it stands in sandbox/ (touchpoints.ts sets
 * `board` on the same ids; touchpoints.test.ts pins the two lists equal);
 * when its ruling lands, both go and docs/design/rulings.md keeps the
 * history. Retiring one is therefore ATOMIC across three files plus the
 * board's directory: touchpoints.ts (which owns SandboxId), this map and
 * sandbox/registry.ts, and a lane touches only its own board's lines in each.
 *
 * `legacy` marks a board that predates the kit's template (it draws its own
 * header, index and asks); the migration wave clears the flag board by board,
 * and the desk reads the spec (sandbox/registry.ts) for the rest.
 */
export type BoardEntry = { Component: ComponentType; legacy?: true };

export const BOARD_COMPONENTS: Record<SandboxId, BoardEntry> = {
  "reel-view": { Component: ReelViewBoard },

  "identity-door": { Component: IdentityDoorBoard },
  "identity-claims": { Component: IdentityClaimsBoard },

  "identity-profile": { Component: IdentityProfileBoard },
  "reel-screen": { Component: ReelScreenBoard },
  "guest-capture": { Component: GuestCaptureBoard },

  "site-chrome": { Component: SiteChromeBoard },
  "profile-page": { Component: ProfilePageBoard },
  "export-flow": { Component: ExportFlowBoard },
  "admin-triage": { Component: AdminTriageBoard },
  "media-viewer": { Component: MediaViewerBoard },
  emails: { Component: EmailsBoard },
  "help-center": { Component: HelpCenterBoard },
  "host-curation": { Component: HostCurationBoard },

  "press-page": { Component: PressPageBoard },
  "contact-page": { Component: ContactPageBoard },
  "album-motion": { Component: AlbumMotionBoard },
  "loose-ends": { Component: LooseEndsBoard },
  "privacy-hero": { Component: PrivacyHeroBoard },
};
