import { ImageResponse } from "next/og";

import { WORDMARK_DISPLAY } from "@/lib/brand/wordmark";
import { getEventCardName } from "@/lib/db/queries/event-card";
import {
  EVENT_CARD_ALT,
  EVENT_CARD_CACHE_CONTROL,
  EVENT_CARD_SIZE,
  PRIVATE_CARD_PARAM,
} from "@/lib/guest/event-card";

import { CardTitle } from "./title";
import { ADD_CARD_PARAM, cardFoot } from "./words";

/**
 * THE EVENT'S SHARE CARD: the event name on the branded dark surface, so a pasted event link unfurls
 * with the real name. Private and missing events fall back to a generic card (no existence or name
 * leak, the same rule as the page's `generateMetadata`). One link per event (database-security.md).
 *
 * ★ A ROUTE, NOT THE `opengraph-image` FILE CONVENTION. A link to one photograph (`?photo=<id>`)
 * unfurls as THAT photograph on an album anyone may open (page.tsx), and file-based metadata
 * outranks `generateMetadata` (Next's own rule), so no photograph could ever take the place of a
 * convention-file card. The page names this route as the image for every other link.
 *
 * ★ THE SAME CARD FOR EVERY VIEWER, because the edge shares it (`EVENT_CARD_CACHE_CONTROL`: public,
 * an hour, served to whoever asks next). So it follows the EVENT's own visibility, read as nobody in
 * particular (`getEventCardName`), never this request's session, cookie or ticket: drawn per viewer
 * (build 17's red-team), one blocked fetch left an open album unfurling nameless for an hour, and the
 * blocked viewer got the named card while her page said private. A viewer the closed door masks is
 * never pointed here: her page names the private album's card (`?private`, generic by its address
 * alone), as a private album's page does (`privateEventCardPath`).
 *
 * ★ ITS TITLE IS DRAWN BY `CardTitle`, NEVER A TEXT NODE (crumbs-93): the renderer draws each word kerned inside the box it
 * measured unkerned, so the gap after a long word opens ("A Partyreel  event"); a word drawn letter by letter keeps one
 * gap (`title.tsx`).
 *
 * ★ ITS FOOT FOLLOWS THE ALBUM, BY ITS ADDRESS TOO (`?add`, crumbs-87): the plain card says what is true of every album
 * ("See the photos & videos"), and the address the page names for an album that takes photos right now invites ("Add
 * your photos & videos"). The page names the one that is true when it renders, so a host who closes uploads is not
 * answered by an hour of the old invitation from the edge; and the flag is honoured only where a name is (a private,
 * unknown or deleted album's card is the generic one whatever the address says).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const { searchParams } = new URL(request.url);
  const privateCard = searchParams.has(PRIVATE_CARD_PARAM);
  const named = privateCard ? null : await getEventCardName(token);
  const eventName = named ?? EVENT_CARD_ALT;
  // Guard against pathological names blowing out the layout.
  const heading =
    eventName.length > 70 ? `${eventName.slice(0, 69)}…` : eventName;
  // The invitation only on a card that names its album: the generic card says nothing of uploads.
  const foot = cardFoot(named !== null && searchParams.has(ADD_CARD_PARAM));

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#0d0d0d",
        padding: "88px",
        color: "#fafafa",
      }}
    >
      {/* The brand signs the card as it signs every page: the wordmark alone,
          drawn from its one home in its display cut (52px is a poster's size
          for it, brand-marks r1), quieter than the event's name, which leads. */}
      <svg
        width={Math.round(52 * WORDMARK_DISPLAY.aspect)}
        height="52"
        viewBox={WORDMARK_DISPLAY.viewBox}
        fill="#fafafa"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={WORDMARK_DISPLAY.d} />
      </svg>

      <CardTitle text={heading} size={76} wrapWidth={1000} clipWidth={1024} />

      <div style={{ display: "flex", fontSize: "30px", color: "#a1a1aa" }}>
        {foot}
      </div>
    </div>,
    {
      ...EVENT_CARD_SIZE,
      headers: { "Cache-Control": EVENT_CARD_CACHE_CONTROL },
    },
  );
}
