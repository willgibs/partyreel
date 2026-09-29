/**
 * THE DOOR PASS: the server's own proof, for one request, that an event's door let it through.
 *
 * A gated album's contents (and a password album's, for someone already in who holds no unlock cookie)
 * are read on the admin client, and each of those reads CARRIES ITS OWN GATE rather than trusting its
 * caller (`album-guest.ts`, `guest-events-admin.ts`), so a careless caller can never hand an arbitrary
 * event id to a service-role read and dump a locked album. Before the doors that gate was the unlock
 * cookie or the host; now it is also this pass, which only the door's resolution
 * (`lib/events/closed-door.server.ts`) issues, after `event_door_standing` has said so.
 *
 * ★ A PASS IS AN OBJECT THIS MODULE MADE, NOT A SHAPE. Issued passes live in a module-private WeakSet,
 * so a literal `{ eventId }` a caller builds by hand, or one read back out of a serialized payload,
 * holds nothing: forging one takes this module's own function, which is the one door. And a pass names
 * its event, so it never opens a second album.
 */
import "server-only";

export type DoorPass = Readonly<{ eventId: string }>;

const issued = new WeakSet<DoorPass>();

/** Only the door's resolution calls this, once the standing has let the request through. */
export function issueDoorPass(eventId: string): DoorPass {
  const pass: DoorPass = Object.freeze({ eventId });
  issued.add(pass);
  return pass;
}

/** Whether this event carries a pass the door issued for it. */
export function holdsDoorPass(event: {
  id: string;
  doorPass?: DoorPass | null;
}): boolean {
  const pass = event.doorPass;
  return Boolean(pass && issued.has(pass) && pass.eventId === event.id);
}
