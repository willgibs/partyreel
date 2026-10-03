import { type DownloadPlace } from "@/lib/export/walk";

/**
 * THE OLD DOWNLOAD MENU'S LINE, KEPT FOR WHAT QUOTES IT. The quick choice that stood here ("Download album":
 * Everything, Photos, Videos, a guest's Yours, a host's Include hidden items) left with take-home r1: a guest takes
 * photos home by Select, then Save (`guest/live-gallery-save.tsx`), and a host by her two sets
 * (`take-home-panel.tsx`). The take-home board still draws today's menu as its `today` options, quoting this line,
 * so it stays until that board retires.
 *
 * THE LINE UNDER THE ROWS: the act's terms. Where a file goes (a desk knows; a phone is told), then the parts when a
 * row needs them, then, on an iPhone, the way a single photograph reaches Photos.
 */
export function downloadMenuNote({
  loading,
  failed,
  place,
  anyInParts,
}: {
  loading: boolean;
  failed: boolean;
  place: DownloadPlace;
  anyInParts: boolean;
}): string {
  if (loading) return "Adding it up";
  if (failed) return "Couldn't add it up. Close and try again.";
  const where =
    place === "files"
      ? "Each saves to your Files app"
      : place === "downloads"
        ? "Each saves to your Downloads"
        : "Each downloads as one file";
  const parts = anyInParts ? ", a big album in parts" : "";
  const photos =
    place === "files"
      ? " To keep a photo in Photos, open it and tap Save."
      : "";
  return `${where}${parts}.${photos}`;
}
