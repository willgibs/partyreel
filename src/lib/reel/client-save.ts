/**
 * Saving a clip straight from memory: the clip creator's Save on Android and at a desk (the
 * native way there already), and its silent fallback on iOS whenever the system sheet would
 * save nothing.
 *
 * Not React: it touches nothing but the document, so it needs no hook (and as a plain module
 * function it is a stable reference, one fewer thing in every caller's dependency array).
 */

/**
 * Save a just-encoded blob from memory: no round trip through R2 for the copy the person is standing
 * there waiting for, so a flaky network can never take the video away after the work is done.
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
