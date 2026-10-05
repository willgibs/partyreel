"use client";

import type { ComponentType } from "react";

import type { SheetView, ViewId } from "../model";

import { AccountMenuScreen, AccountScreen } from "./account";
import { AddScreen } from "./add";
import { CreateScreen } from "./create";
import { ConfirmScreen } from "./edge/confirm";
import { DashboardScreen } from "./edge/dashboard";
import { StartScreen } from "./edge/start";
import { StyleScreen } from "./edge/style";
import { ToastsScreen } from "./edge/toasts";
import { TooltipScreen } from "./edge/tooltip";
import { GuestGateScreen } from "./gate";
import type { ScreenProps } from "./screen-props";
import { SettingsScreen } from "./settings";

/**
 * EVERY REAL SCREEN THE BOARD DRAWS, BY VIEW: the five a trait is judged on
 * (Settings over the hub, Create, the guest's Add, the guest's door, Account)
 * and the edge's own (the dashboard's Display, a delete confirm, toasts while
 * uploading, the reel's Style menu, the account menu, a tooltip, and a new
 * host's dashboard). Each takes the moment it is caught in.
 */
export const SCREENS: Record<
  Exclude<ViewId, SheetView>,
  ComponentType<ScreenProps>
> = {
  settings: SettingsScreen,
  create: CreateScreen,
  add: AddScreen,
  door: GuestGateScreen,
  account: AccountScreen,
  menu: AccountMenuScreen,
  dashboard: DashboardScreen,
  confirm: ConfirmScreen,
  toasts: ToastsScreen,
  style: StyleScreen,
  tooltip: TooltipScreen,
  start: StartScreen,
};
