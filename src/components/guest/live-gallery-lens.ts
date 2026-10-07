"use client";

/**
 * "SHOW YOURS", ASKED FROM OUTSIDE THE ALBUM (the send's toast, `upload/send-toast.ts`). Her lens is the album's own
 * state (`live-gallery.tsx`: this visit's alone, album-order's Q4), and the toast is raised by the page, two islands
 * apart with the album's live source between them, so the ask travels on this one channel (the shape `guestSelect`
 * takes for Select): the toast asks, and the album that is mounted answers, turning to Yours and bringing itself into
 * view. With no album mounted (a failed read, a re-gate), the ask is no one's, and nothing happens.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

export const guestLens = {
  /** Show her own photographs: the album's Yours view, the album brought into view. */
  showYours() {
    for (const listener of listeners) listener();
  },
  /** The album's answer, while it is mounted. */
  onShowYours(listener: Listener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
