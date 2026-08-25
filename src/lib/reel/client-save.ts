/**
 * Saving a reel VIDEO to the device. Two ways in, both anchor-click based, extracted verbatim out of
 * reel-composer so the Marquee, the Studio and the GUEST overlay can share one implementation instead
 * of each growing its own subtly different anchor dance.
 *
 * Not React: they touch nothing but the document, so they don't need to be hooks (and as plain module
 * functions they're stable references, which is one fewer thing in every caller's dependency array).
 */

/**
 * Save from a presigned URL. The url itself carries `Content-Disposition: attachment`, which is what
 * actually makes the browser save rather than navigate; the `download` attribute is only a hint and is
 * IGNORED cross-origin, so do not "simplify" by relying on it.
 */
export function downloadReel(url: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  a.download = "";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Save a just-encoded blob straight from memory: no round-trip through R2 for the copy the person is
 * standing there waiting for. Called the moment the encode lands, BEFORE any upload, so a flaky
 * network can never take the video away after the work is done.
 */
export function saveBlobLocally(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on a delay: the browser needs the URL alive until the save stream actually opens.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
