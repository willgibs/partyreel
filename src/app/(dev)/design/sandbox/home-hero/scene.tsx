"use client";

import { useEffect, useState } from "react";

import { MarketingFooter } from "@/components/marketing/chrome/marketing-footer";
import { MarketingHeader } from "@/components/marketing/chrome/marketing-header";
import { HOME_SECTION_COMPONENTS } from "@/components/marketing/sections/home";
import { homeSurfaceChunks } from "@/components/marketing/sections/home/section-ids";
import { PaperChapter } from "@/components/marketing/system/paper-chapter";
import { DEMO_EVENT_URL } from "@/lib/demo";

import { CinemaHeroDraft } from "./hero";
import { isStreamId, type StreamId } from "./stream-ids";

/**
 * THE REAL HOME PAGE WITH ONE SECTION REPLACED.
 *
 * ★ THE ORDER AND THE CHAPTERS COME FROM PRODUCTION'S OWN SOURCE, not from a
 * copy of it. `homeSurfaceChunks()` is the Vitest-pinned sequence the real route
 * maps, and this maps the same chunks through the same component record: if a
 * section is added, moved or re-chaptered tomorrow, this scene moves with it and
 * cannot drift into a pretty lie about what `/` looks like. The ONE substitution
 * is `cinema-hero`, which is the whole point of the board.
 *
 * ★ AND THE WRAPPER IS THE (cinema) LAYOUT'S, to the attribute. `dark` is the
 * descendant-scoped token flip; `data-mkt-skin="cinema"` is what lets
 * marketing.css deepen the room to the ruled 0.11 and what the header's portal
 * rule reads; `text-foreground` is load-bearing rather than drift, because body
 * sits outside this wrapper and inherited ink on a light session would paint the
 * h1 near-black on the cinema room; `overflow-x-clip` is the promise that the
 * page never scrolls sideways. Copying a layout is a thing to be nervous about,
 * so it is four attributes and a comment rather than a re-imagining.
 *
 * What this scene deliberately does NOT carry: the motion tuner (key-gated dev
 * chrome, and a second copy of it inside a frame would fight the board's own).
 */
export function HomeScene({
  stream,
  phone,
}: {
  stream: StreamId;
  phone: boolean;
}) {
  // Seeded from the route so the FIRST paint is already the right stream; the
  // board's push arrives an effect later (the kit's Frame, landmine 4).
  const [live, setLive] = useState<StreamId>(stream);

  useEffect(() => {
    const onSet = (e: Event) => {
      const next = (e as CustomEvent<{ stream?: string }>).detail?.stream;
      if (!isStreamId(next)) return;
      // Bail out when nothing moved: `push` is re-dispatched on every load and
      // on every render of the board, and a blind set would re-render fifteen
      // marketing sections each time any other knob on the board changed.
      setLive((k) => (k === next ? k : next));
    };
    window.addEventListener("lab:set", onSet);
    return () => window.removeEventListener("lab:set", onSet);
  }, []);

  return (
    <div
      className="dark flex min-h-0 flex-1 flex-col overflow-x-clip text-foreground"
      data-mkt
      data-mkt-skin="cinema"
    >
      <MarketingHeader skin="cinema" overlay />
      <main className="flex-1">
        {homeSurfaceChunks().map((chunk) => {
          const sections = chunk.ids.map((id) => {
            if (id === "cinema-hero") {
              return (
                // The hero is a viewport-tall first screen in production, and it
                // is one here for the same reason: the frame IS a viewport, so
                // the header sits over it and the next section starts exactly
                // where it does on the real page.
                <div
                  key={id}
                  className="relative h-[100svh] min-h-[560px] w-full"
                >
                  <CinemaHeroDraft
                    mode={phone ? "phone" : "desktop"}
                    stream={live}
                    qrUrl={DEMO_EVENT_URL ?? null}
                  />
                </div>
              );
            }
            const Component = HOME_SECTION_COMPONENTS[id];
            return <Component key={id} />;
          });
          return chunk.surface === "paper" ? (
            <PaperChapter key={chunk.ids[0]}>{sections}</PaperChapter>
          ) : (
            sections
          );
        })}
      </main>
      <MarketingFooter />
    </div>
  );
}
