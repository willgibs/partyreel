import { DeskScreen } from "./desk-screens";
import { PhoneScreen } from "./phone-screen";
import { isDeskScreen, isPhoneScreen } from "./registry";

/**
 * THE SCREEN BESIDE A STEP (help-center r1 `article=screen`), by its registry id: a desk's picture
 * rendered here on the server, a phone's document made on the client as the reader nears it.
 *
 * An id the registry does not hold throws, so a typo in an article fails the build (every article is
 * prerendered) rather than shipping a step with a hole beside it; `step-screens.test.ts` catches it
 * sooner, by reading every `screen="…"` in the library.
 */
export function StepScreen({ id }: { id: string }) {
  if (isDeskScreen(id)) return <DeskScreen id={id} />;
  if (isPhoneScreen(id)) return <PhoneScreen id={id} />;
  throw new Error(
    `Unknown step screen "${id}": add it to step-screens/registry.ts and draw it`,
  );
}
