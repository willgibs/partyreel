"use client";

import type { ComponentType } from "react";

import type { SheetView, ViewId } from "../model";

import { AccountScreen } from "./account";
import { AlbumScreen } from "./album";
import { CreateScreen } from "./create";
import { GuestGateScreen } from "./gate";
import type { ScreenProps } from "./screen-props";
import { DatesScreen, RowsScreen, SettingsScreen } from "./settings";

/**
 * EVERY REAL SCREEN THE BOARD DRAWS, BY VIEW: Settings' door (each set's
 * composite first frame) and its dates, Account's billing row, Create's foot,
 * the guest's door, the album's toolbar and Settings' first page. Each takes
 * the moment it is caught in: in use as a person meets it, or working.
 */
export const SCREENS: Record<
  Exclude<ViewId, SheetView>,
  ComponentType<ScreenProps>
> = {
  door: SettingsScreen,
  dates: DatesScreen,
  account: AccountScreen,
  create: CreateScreen,
  gate: GuestGateScreen,
  album: AlbumScreen,
  rows: RowsScreen,
};
