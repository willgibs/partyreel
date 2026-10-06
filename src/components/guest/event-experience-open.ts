"use client";

/**
 * ★ WHETHER THE ALBUM TAKES UPLOADS, AS THE PAGE HEARS IT (guest-requests). The page's server reads the host's switch
 * once (`event.accepting_uploads`), and the album's sync carries it on every full answer (`accepting`, from the sync
 * route's own read of the event, its validator hashing it while it is off, so a close or a reopen reaches an open page
 * on its next poll). The page holds the newest word and counts the words it has heard: an upload the album refused as
 * closed is newer than every word heard before it, so what lifts that refusal is a word heard after it, the same word
 * again included (`heard` moves with each one). The album's camera reads it (`album-camera.tsx`): it asks a closed album
 * again once the album says it is open, and never by itself.
 */
import { useCallback, useState } from "react";

/** The album's word on whether it takes uploads, as the page last heard it, and how many words it has heard. */
export type UploadsWord = { open: boolean; heard: number };

export function useLiveUploadsWord(initial: boolean): {
  word: UploadsWord;
  /** A full sync's word (`GalleryLiveProvider`'s `onUploadsWord`): the newest, whatever it says. */
  onWord: (accepting: boolean) => void;
} {
  const [word, setWord] = useState<UploadsWord>(() => ({
    open: initial,
    heard: 0,
  }));
  // A fresh server reading (the page rendered again: a refresh) is a word too (the adjust-state-during-render pattern,
  // so no frame says the old one).
  const [seen, setSeen] = useState(initial);
  if (initial !== seen) {
    setSeen(initial);
    setWord((prev) => ({ open: initial, heard: prev.heard + 1 }));
  }
  const onWord = useCallback((accepting: boolean) => {
    setWord((prev) => ({ open: accepting, heard: prev.heard + 1 }));
  }, []);
  return { word, onWord };
}
