/**
 * Public album read for `/a/[share_token]`. Anonymous: calls `get_public_album`
 * (SECURITY DEFINER) which returns approved media for a public, non-deleted event.
 *
 * ⚠️ The returned media carry R2 object KEYS, not URLs. They stay SERVER-SIDE —
 * the page presigns each key (lib/r2/presign.ts) before rendering. Never forward
 * a raw key to the browser (ADR-0003).
 */
import "server-only";

import { cache } from "react";

import type { Database } from "@/lib/db/types";
import { createClient } from "@/lib/supabase/server";

export type AlbumMedia = {
  id: string;
  type: Database["public"]["Enums"]["media_type"];
  original_key: string;
  preview_key: string | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  created_at: string;
};

export type PublicAlbum = {
  event: {
    id: string;
    name: string;
    description: string | null;
    event_date: string | null;
    // 3-state access. For a `password` album the envelope is returned (name shown on
    // the gate) but `media` is []; the page admin-reads it after the unlock cookie.
    visibility: Database["public"]["Enums"]["event_visibility"];
    has_password: boolean;
  };
  media: AlbumMedia[];
};

export type AlbumResult =
  | { ok: true; data: PublicAlbum }
  | { ok: false; code: "not_found" };

// cache() dedupes within a request so generateMetadata + the page render (+ the
// per-event opengraph-image) share ONE get_public_album RPC call per share token.
export const getPublicAlbum = cache(
  async (shareToken: string): Promise<AlbumResult> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_public_album", {
      p_share_token: shareToken,
    });
    if (error) throw error;

    // The RPC returns null for a missing / private / deleted album.
    if (!data) return { ok: false, code: "not_found" };

    // jsonb -> typed shape (the RPC builds exactly { event, media }).
    return { ok: true, data: data as unknown as PublicAlbum };
  },
);
