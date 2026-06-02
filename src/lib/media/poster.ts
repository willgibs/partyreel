// iOS Safari paints a `<video>` element BLACK instead of its first frame unless the src
// carries a media fragment telling it to seek+render a frame. Desktop browsers decode and
// paint the first frame from `preload="metadata"` alone; iOS does not (and a *paused* video
// is never decoded otherwise, so it shows black). We don't generate real poster images, so
// this fragment IS our poster: `#t=0.1` lands just past the first keyframe, which iOS
// reliably decodes. The fragment is client-only (never sent in the HTTP request), so it does
// NOT touch a presigned R2 URL's signature; the ~0.1s playback-start offset is imperceptible.
//
// Single source for the hack — used by the grid thumbnail (MediaTile) and the lightbox
// (center + neighbor videos). Keep center/neighbor on the SAME value so a video reused across
// slots doesn't reload when it becomes current.
export function videoPosterSrc(url: string): string {
  return `${url}#t=0.1`;
}
