import { readInviteLightAction } from "@/app/(app)/me/actions";
import { decodeImage } from "@/lib/reel/engine/assets";
import type { CanvasImage } from "@/lib/reel/engine/canvas2d";

import { CELL, litFrom, type Lit } from "./page-invite-light";

/**
 * READING HER PHOTOGRAPHS' LIGHT, ON HER DEVICE (`account-moments` r2, `invite=plate`): the thin DOM half of
 * `page-invite-light.ts`. The Server Function hands her newest previews (presigned, with her seed); each is decoded the
 * hub's own way (`decodeImage`: CORS-clean and `no-store`, since a tile's plain read of the same link poisons the cache for
 * a CORS one, uploads-and-r2.md), drawn into a `CELL` of one strip, and the strip's pixels go to the ladder.
 *
 * ★ THE COST OF A VIEW: one Server Function (one RPC read, six hand-signed presigns), then at most six preview GETs of about
 * 16KB straight from R2 (Class B operations; no Vercel, no egress bill), and the pixels never leave her device. A photograph
 * that cannot be read is passed over; none that can be read is her seed's light, and no answer at all is the house's, so
 * the plate is lit whatever fails, and `asked` / `read` let the plate say once a page that a refused origin dimmed it.
 */

/** What a read gave the plate: its light, and how many photographs were asked for and read. */
export type InviteRead = { lit: Lit; asked: number; read: number };

/** Her photographs as one strip, `CELL` a photograph, and how many could be read (the strip is null where none could). */
async function readStrip(
  srcs: readonly string[],
): Promise<{ px: Uint8ClampedArray | null; read: number }> {
  const decoded = await Promise.all(
    srcs.map((src) => decodeImage(src).catch(() => null)),
  );
  const imgs = decoded.filter((img): img is CanvasImage => img !== null);
  try {
    if (imgs.length === 0) return { px: null, read: 0 };
    const canvas = document.createElement("canvas");
    canvas.width = CELL * imgs.length;
    canvas.height = CELL;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return { px: null, read: 0 };
    imgs.forEach((img, i) => ctx.drawImage(img, i * CELL, 0, CELL, CELL));
    return {
      px: ctx.getImageData(0, 0, canvas.width, CELL).data,
      read: imgs.length,
    };
  } finally {
    // A decoded bitmap lives outside the JS heap, so it is released by hand once its small copy is drawn.
    for (const img of imgs) if ("close" in img) img.close();
  }
}

/** Her light: asked of the server, read on this device, and never a failure (the house's ember stands in for one). */
export async function readInviteLight(): Promise<InviteRead> {
  const answer = await readInviteLightAction().catch(() => null);
  const photos = answer?.photos ?? [];
  const { px, read } = await readStrip(photos).catch(() => ({
    px: null,
    read: 0,
  }));
  return {
    lit: litFrom(px, answer?.seed ?? ""),
    asked: photos.length,
    read,
  };
}
