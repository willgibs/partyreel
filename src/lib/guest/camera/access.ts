/**
 * WHETHER THE CAMERA OPENED, AND WHAT TO SAY WHEN IT DID NOT. Pure: `stream.ts` asks the phone, this reads its answer.
 *
 * A camera that cannot open is never a dead end (bible 3): `denied` says where the switch is and tries again,
 * `busy` asks her to close the other app, and `unavailable` (no camera API here: an in-app browser, an insecure page,
 * a policy that refuses it, a phone with no camera that fits) hands her the phone's own camera through the file
 * picker's `capture`, one shot at a time, still counted on her roll by the server.
 */

export type CameraAccess =
  /** Not asked yet. */
  | "idle"
  /** Asked; the phone's own prompt may be up. */
  | "asking"
  /** The picture is live. */
  | "live"
  /** She (or the browser, for this site) said no. */
  | "denied"
  /** Another app holds the camera, or it would not start. */
  | "busy"
  /** No camera this page can open. */
  | "unavailable";

/** What a failed `getUserMedia` means here. */
export function accessFromError(
  error: unknown,
): "denied" | "busy" | "unavailable" {
  const name =
    error && typeof error === "object" && "name" in error
      ? String((error as { name: unknown }).name)
      : "";
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "denied";
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return "busy";
    default:
      // NotFoundError, OverconstrainedError (after the loose retry), SecurityError (a policy or an insecure page),
      // TypeError (no `mediaDevices` at all): nothing she can switch on here.
      return "unavailable";
  }
}

/** Whether this page can ask for a camera at all. */
export function canAskCamera(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
  );
}
