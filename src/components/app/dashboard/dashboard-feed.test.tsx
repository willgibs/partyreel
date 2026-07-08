import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DashboardFeed } from "./dashboard-feed";

const slots = {
  eventsSection: <div data-testid="events" />,
  followingSection: <div data-testid="following" />,
  uploadsSection: <div data-testid="uploads" />,
  likesSection: <div data-testid="likes" />,
  trashSection: <div data-testid="trash" />,
};

// Behavior pins for the single-feed filter logic (never styles): which section
// shows per filter, that Trash is isolated, the chip-gate, and live switching.
describe("DashboardFeed", () => {
  it("'all' stacks events + uploads + likes, never trash", () => {
    render(
      <DashboardFeed initialFilter="all" trashCount={2} showChips {...slots} />,
    );
    expect(screen.getByTestId("events")).toBeInTheDocument();
    expect(screen.getByTestId("uploads")).toBeInTheDocument();
    expect(screen.getByTestId("likes")).toBeInTheDocument();
    expect(screen.queryByTestId("trash")).not.toBeInTheDocument();
    // Following is chip-only, like Trash: a lens on other hosts' events.
    expect(screen.queryByTestId("following")).not.toBeInTheDocument();
  });

  it("Following is reachable only via its own filter", () => {
    render(
      <DashboardFeed
        initialFilter="following"
        trashCount={0}
        showChips
        {...slots}
      />,
    );
    expect(screen.getByTestId("following")).toBeInTheDocument();
    expect(screen.queryByTestId("events")).not.toBeInTheDocument();
  });

  it("a specific filter narrows to that one section", () => {
    render(
      <DashboardFeed
        initialFilter="uploads"
        trashCount={0}
        showChips
        {...slots}
      />,
    );
    expect(screen.getByTestId("uploads")).toBeInTheDocument();
    expect(screen.queryByTestId("events")).not.toBeInTheDocument();
    expect(screen.queryByTestId("likes")).not.toBeInTheDocument();
  });

  it("Trash is reachable only via its own filter", () => {
    render(
      <DashboardFeed
        initialFilter="trash"
        trashCount={3}
        showChips
        {...slots}
      />,
    );
    expect(screen.getByTestId("trash")).toBeInTheDocument();
    expect(screen.queryByTestId("events")).not.toBeInTheDocument();
  });

  it("hides the chips when there is nothing to navigate (pure onboarding)", () => {
    render(
      <DashboardFeed
        initialFilter="all"
        trashCount={0}
        showChips={false}
        {...slots}
      />,
    );
    expect(
      screen.queryByRole("group", { name: /filter/i }),
    ).not.toBeInTheDocument();
    // the teaser stack still renders (all three content sections in "all")
    expect(screen.getByTestId("events")).toBeInTheDocument();
    expect(screen.getByTestId("likes")).toBeInTheDocument();
  });

  it("clicking a chip switches the visible section", () => {
    render(
      <DashboardFeed initialFilter="all" trashCount={1} showChips {...slots} />,
    );
    // The chip LABEL is "Deleted" (2026-06-20 rename); the filter VALUE stays "trash".
    fireEvent.click(screen.getByRole("button", { name: /Deleted/ }));
    expect(screen.getByTestId("trash")).toBeInTheDocument();
    expect(screen.queryByTestId("events")).not.toBeInTheDocument();
  });
});
