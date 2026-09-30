import { describe, expect, it, vi } from "vitest";

import { createDoorHold, heldDoorName } from "@/lib/guest/door-hold";

/**
 * THE DOOR WAITS FOR THE SERVER TO SAY WHO IS HERE (crumbs-29). A hold hands the door the name it had until the
 * server's next render lands; it is keyed to the render it was taken under, so the answer ends it by itself.
 */
describe("the door's hold", () => {
  const renderA = Promise.resolve("seed A");
  const renderB = Promise.resolve("seed B");

  it("hands the door the phone's own name while nothing holds it", () => {
    expect(heldDoorName(null, renderA, "Sam")).toBe("Sam");
    expect(heldDoorName(null, renderA, null)).toBeNull();
  });

  it("★ hands the door the name it had while the render the hold was taken under still stands", () => {
    // The queue put Sam's ticket down, and his name with it: the phone reads null, the door still reads Sam.
    expect(heldDoorName({ under: renderA, name: "Sam" }, renderA, null)).toBe(
      "Sam",
    );
  });

  it("★ lets go the moment the server answers: any new render ends it, whatever it says", () => {
    expect(heldDoorName({ under: renderA, name: "Sam" }, renderB, null)).toBe(
      null,
    );
    expect(
      heldDoorName({ under: renderA, name: "Sam" }, renderB, "Priya"),
    ).toBe("Priya");
  });

  it("is one store a page: read, set, heard by its subscribers until they leave", () => {
    const store = createDoorHold();
    const heard = vi.fn();
    expect(store.get()).toBeNull();
    const leave = store.subscribe(heard);
    store.set({ under: renderA, name: "Sam" });
    expect(store.get()).toEqual({ under: renderA, name: "Sam" });
    expect(heard).toHaveBeenCalledTimes(1);
    leave();
    store.set({ under: renderB, name: null });
    expect(heard).toHaveBeenCalledTimes(1);
    // Another page's store is its own.
    expect(createDoorHold().get()).toBeNull();
  });
});
