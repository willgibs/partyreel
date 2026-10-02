import Link from "next/link";

import {
  DOOR_FOOT,
  DoorColumn,
  DoorWords,
} from "@/components/guest/door/door-page";
import { Doorway } from "@/components/guest/door/doorway";
import { UnlistedAsk } from "@/components/guest/door/unlisted-ask";
import { Button } from "@/components/ui/button";
import { loginPath } from "@/lib/auth/return-path";

/**
 * THE SHUT DOOR'S TWO LINES (event-safety r1 `newcomer=same`; locked-door r1 `previous=private`).
 *
 * ★ ONE SCREEN FOR EVERY NEWCOMER TURNED AWAY: an Only me album, a closed door, a decline and a block
 * answer the same, so the newcomer's words may only say what all of them share: she can't open it, and
 * only the host can change that ("private" fits one cause; "Closed" fits all of them).
 *
 * ★ AND ONE LINE MORE FOR SOMEONE WHO WAS IN (his `previous=private`: "Differentiating these lets me
 * know that it was changed to private, which is why I can no longer access"): the host made it
 * private, as her dashboard card already says. A blocked former guest reads the same line, so the
 * block stays invisible (his "Sneaky block").
 *
 * ★ IT NAMES NOTHING (Will, 2026-10-02: the door shows only what is shown today, and the shut door has
 * never named the album or its host). The host is "the host" here, and no album is named: the
 * locked-door board's doorway named both on its shut door, and that call (`shows`) is overruled.
 */
export function shutDoorCopy(previous: boolean): {
  title: string;
  description: string;
} {
  return previous
    ? {
        title: "This album is private",
        description:
          "The host made it private. This link works again the moment they let you in.",
      }
    : {
        title: "This album is closed",
        description:
          "Only the host can let you in. This link works again the moment they do.",
      };
}

/**
 * THE SHUT DOOR (`locked-door` r2, `family=doorway`, `shape=shared`): the doorway, shut, with the line of
 * the party's light under it in the house five (nothing of a closed album is sampled, not even its
 * colour), its one message, one link home as its way out, and, for a visitor signed out, the quiet way
 * back in (event-safety's carried `back-in`): someone already in on another phone signs in, and the
 * door knows her by her account. It is the same door the welcome and the wait stand at, so a guest
 * turned away is still at the door she met, never on a page apart.
 *
 * ★ SOMEONE THE INVITE LIST DOES NOT NAME READS THE SAME MESSAGE, WITH HER OWN FOOT (`ask`: `locked-door`
 * r2 places `unlisted=ask` here): "Ask Maya to let me in", or "Use a different email", in place of
 * the way home. The message never moves, so a block, a decline, a closed door and Only me still read
 * as one.
 */
export function ShutDoor({
  previous,
  signedIn,
  returnTo,
  ask = null,
}: {
  previous: boolean;
  signedIn: boolean;
  /** The album's own path, which a sign-in comes back to. */
  returnTo: string;
  /** The unlisted reader's foot: the album to ask at, and the host she asks. */
  ask?: { qrToken: string; hostName: string | null } | null;
}) {
  const copy = shutDoorCopy(previous);
  return (
    <DoorColumn doorway={<Doorway state="shut" />}>
      <DoorWords title={copy.title} titleAs="h1" lines={[copy.description]} />
      <div data-door-foot="" className={DOOR_FOOT}>
        {ask ? (
          <UnlistedAsk qrToken={ask.qrToken} hostName={ask.hostName} />
        ) : (
          // Outline rather than a push: the door is telling her to come back, not selling her a way on.
          <Button asChild size="cta" variant="outline" className="w-full">
            <Link href="/">What is Partyreel?</Link>
          </Button>
        )}
        {signedIn || ask ? null : (
          <p className="text-sm text-muted-foreground">
            {"Already a guest? "}
            <Link
              href={loginPath(returnTo)}
              data-shut-door-back-in
              className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors duration-150 ease-emphasis hover:decoration-foreground"
            >
              Log in
            </Link>
          </p>
        )}
      </div>
    </DoorColumn>
  );
}
