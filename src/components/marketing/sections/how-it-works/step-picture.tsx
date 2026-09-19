import type { ComponentType } from "react";

import type { LoopPictureId } from "@/lib/constants/how-it-works";

import {
  ArrivesPicture,
  AddPicture,
  DoorPicture,
  RoomPicture,
  SavePicture,
  ScanPicture,
} from "./guest-pictures";
import {
  CreatePicture,
  FillPicture,
  KeepPicture,
  ReelPicture,
  ShapePicture,
  SharePicture,
} from "./host-pictures";

/**
 * ONE MAP FROM A STEP'S ID TO ITS PICTURE. The step list is pure data
 * (lib/constants/how-it-works.ts) so a node test can read the story without
 * JSX; this is the one place the two halves meet, and the `Record` key type
 * makes a step with no picture a type error rather than a hole on the page.
 */
const PICTURE: Record<LoopPictureId, ComponentType> = {
  create: CreatePicture,
  share: SharePicture,
  fill: FillPicture,
  shape: ShapePicture,
  keep: KeepPicture,
  reel: ReelPicture,
  scan: ScanPicture,
  door: DoorPicture,
  add: AddPicture,
  room: RoomPicture,
  save: SavePicture,
  arrives: ArrivesPicture,
};

export function StepPicture({ id }: { id: LoopPictureId }) {
  const Picture = PICTURE[id];
  return <Picture />;
}
