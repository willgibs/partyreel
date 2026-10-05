/**
 * WHAT `GET /api/drive/status` ANSWERS: her connection and her sends that matter now, the one shape every place a send
 * shows reads (`use-drive-status.ts`). Pure.
 */
import type { SendView } from "@/lib/drive/moments";

export type DriveStatus = {
  configured: boolean;
  connection: {
    /** "Connected as": the address only when Google said it is verified. */
    email: string | null;
    status: "connected" | "failing" | "revoked";
    connectedAt: string;
    /** The Partyreel folder in her Drive, once a send made it. */
    folderUrl: string | null;
    /** Her Drive's room, as last asked (the panel's "12.6 GB free"); null when unknown or unlimited. */
    free: number | null;
  } | null;
  sends: SendView[];
  now: string;
};

