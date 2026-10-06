// node usher/kit/media-gen.mjs [outDir] [--photos 4] [--videos 1] [--prefix rt] [--at <ISO>] [--zone +HH:MM]
// Test media with no Mac and no third-party picture: ffmpeg alone (on the Mac and every cloud container), unique bytes
// every run (a fresh noise seed and the run's id drawn into each frame), so no two uploads ever share a hash.
//   <prefix>-photo-<n>.jpg   a phone's photograph: 4032x3024 (every other one portrait), about 4 MB, and a capture time
//                            in the minimal Exif a phone writes (Make, Model, Orientation, DateTimeOriginal with its
//                            OffsetTimeOriginal), one minute apart going back from --at (default now) in --zone (default
//                            this machine's), so the strip and capture-time read a real stamp
//   <prefix>-video-<n>.mp4   a 3-second 1080x1920 H.264 + AAC clip, its movie header stamped with the capture time
//   party-cam.y4m            the red-team's fake camera (drv.mjs's head)
//   images/<shape>.jpg       the compute model's six shapes (`scripts/compute-model/run.mjs` reads them from here)
// outDir defaults to $PARTYREEL_TEST_MEDIA, else <tmp>/partyreel-test-media. Prints one line per file and a last line
// `MEDIA <dir> <photos> photos <videos> videos`.
//
// node usher/kit/media-gen.mjs --capture-fixtures: the two capture-time walk fixtures, derived from
// `src/lib/media/strip-metadata-fixtures/imageio-capture.jpg` (ImageIO's, 2026:10:03 21:14:05 at -04:00) into the same
// folder, so the walk needs no scratch: `imageio-nozone.jpg`, its three OffsetTime tags dropped from the Exif IFD (the
// wall clock alone, read in the uploader's zone), and `imageio-lying.jpg`, its DateTimeOriginal moved to 2099 (past the
// server's ceiling, so `captured_at` stays NULL). Every other byte is ImageIO's; the run is deterministic.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
if (argv.includes("--capture-fixtures")) {
  const dir = join(
    dirname(fileURLToPath(import.meta.url)),
    "../../src/lib/media/strip-metadata-fixtures",
  );
  const src = readFileSync(join(dir, "imageio-capture.jpg"));
  const app1 = src.indexOf(Buffer.from("Exif\0\0", "latin1"));
  if (src.readUInt16BE(app1 - 4) !== 0xffe1)
    throw new Error("imageio-capture.jpg: no Exif APP1 where expected");
  const t = app1 + 6; // the TIFF header
  const le = src.toString("latin1", t, t + 2) === "II";
  const u16 = (b, o) => (le ? b.readUInt16LE(o) : b.readUInt16BE(o));
  const u32 = (b, o) => (le ? b.readUInt32LE(o) : b.readUInt32BE(o));
  const findTag = (b, ifd, tag) => {
    const n = u16(b, t + ifd);
    for (let i = 0; i < n; i++) {
      const e = t + ifd + 2 + i * 12;
      if (u16(b, e) === tag) return e;
    }
    return -1;
  };
  const exifIfd = u32(src, findTag(src, u32(src, t + 4), 0x8769) + 8);
  // No zone: the Exif IFD rewritten without 0x9010-0x9012, its entries closed up and the freed bytes zeroed after the
  // next-IFD pointer, so every offset into the data area stays where it was.
  const nozone = Buffer.from(src);
  const at = t + exifIfd,
    n = u16(src, at);
  const keep = [];
  for (let i = 0; i < n; i++) {
    const e = at + 2 + i * 12;
    if (![0x9010, 0x9011, 0x9012].includes(u16(src, e)))
      keep.push(src.subarray(e, e + 12));
  }
  if (n - keep.length !== 3)
    throw new Error(
      `imageio-capture.jpg: expected three OffsetTime tags, found ${n - keep.length}`,
    );
  const next = src.subarray(at + 2 + n * 12, at + 2 + n * 12 + 4);
  le
    ? nozone.writeUInt16LE(keep.length, at)
    : nozone.writeUInt16BE(keep.length, at);
  Buffer.concat([...keep, next, Buffer.alloc(36)]).copy(nozone, at + 2);
  writeFileSync(join(dir, "imageio-nozone.jpg"), nozone);
  // Lying: DateTimeOriginal's value, and only it, says 2099.
  const lying = Buffer.from(src);
  const dto = findTag(src, exifIfd, 0x9003);
  const off = t + u32(src, dto + 8);
  if (src.toString("latin1", off, off + 19) !== "2026:10:03 21:14:05")
    throw new Error("imageio-capture.jpg: DateTimeOriginal moved");
  lying.write("2099", off, "latin1");
  writeFileSync(join(dir, "imageio-lying.jpg"), lying);
  console.log(`wrote imageio-nozone.jpg and imageio-lying.jpg in ${dir}`);
  process.exit(0);
}
const opt = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);
const OUT =
  (argv[0] && !argv[0].startsWith("--") ? argv[0] : "") ||
  process.env.PARTYREEL_TEST_MEDIA ||
  join(tmpdir(), "partyreel-test-media");
const PHOTOS = Number(opt("--photos", "4"));
const VIDEOS = Number(opt("--videos", "1"));
const PREFIX = opt("--prefix", "rt");
const AT = new Date(opt("--at", new Date().toISOString()));
if (Number.isNaN(AT.getTime())) {
  console.error("--at takes an ISO time");
  process.exit(2);
}
const localZone = () => {
  const m = -AT.getTimezoneOffset();
  const a = Math.abs(m);
  return `${m < 0 ? "-" : "+"}${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}`;
};
const ZONE = opt("--zone", localZone());
if (!/^[+-]\d{2}:\d{2}$/.test(ZONE)) {
  console.error("--zone takes +HH:MM or -HH:MM");
  process.exit(2);
}
const RUN = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
try {
  execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
} catch {
  console.error("media-gen needs ffmpeg on the PATH");
  process.exit(2);
}
mkdirSync(join(OUT, "images"), { recursive: true });

// ── The minimal Exif a phone writes, little-endian TIFF ───────────────────────────────────────────
/** The wall clock and zone of an instant as Exif writes them ("YYYY:MM:DD HH:MM:SS", "+HH:MM"). */
function wallOf(ms, zone) {
  const sign = zone[0] === "-" ? -1 : 1;
  const off = sign * (Number(zone.slice(1, 3)) * 60 + Number(zone.slice(4, 6)));
  const d = new Date(ms + off * 60_000);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}:${p(d.getUTCMonth() + 1)}:${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}
/** An APP1 Exif segment: IFD0 (Make, Model, Orientation, the Exif pointer) and the Exif IFD (ExifVersion, DateTimeOriginal, OffsetTimeOriginal). */
function exifApp1({
  wall,
  zone,
  make = "Partyreel",
  model = "Test phone",
  orientation = 1,
}) {
  const ascii = (s) => Buffer.from(`${s}\0`, "latin1");
  const ifd0 = [
    [0x010f, 2, ascii(make)],
    [0x0110, 2, ascii(model)],
    [0x0112, 3, orientation],
    [0x8769, 4, null],
  ];
  const exif = [
    [0x9000, 7, Buffer.from("0232")],
    [0x9003, 2, ascii(wall)],
    [0x9011, 2, ascii(zone)],
  ];
  const size = (n) => 2 + n * 12 + 4;
  const ifd0At = 8,
    exifAt = ifd0At + size(ifd0.length);
  let dataAt = exifAt + size(exif.length);
  const tiff = Buffer.alloc(
    dataAt + 64 + make.length + model.length + wall.length + zone.length,
  );
  tiff.write("II", 0, "latin1");
  tiff.writeUInt16LE(42, 2);
  tiff.writeUInt32LE(ifd0At, 4);
  const writeIfd = (at, entries) => {
    tiff.writeUInt16LE(entries.length, at);
    entries.forEach(([tag, type, v], i) => {
      const e = at + 2 + i * 12;
      tiff.writeUInt16LE(tag, e);
      tiff.writeUInt16LE(type, e + 2);
      if (tag === 0x8769) {
        tiff.writeUInt32LE(1, e + 4);
        tiff.writeUInt32LE(exifAt, e + 8);
        return;
      }
      if (type === 3) {
        tiff.writeUInt32LE(1, e + 4);
        tiff.writeUInt16LE(v, e + 8);
        return;
      }
      tiff.writeUInt32LE(v.length, e + 4);
      if (v.length <= 4) {
        v.copy(tiff, e + 8);
        return;
      }
      tiff.writeUInt32LE(dataAt, e + 8);
      v.copy(tiff, dataAt);
      dataAt += v.length + (v.length % 2);
    });
    tiff.writeUInt32LE(0, at + 2 + entries.length * 12);
  };
  writeIfd(ifd0At, ifd0);
  writeIfd(exifAt, exif);
  const body = Buffer.concat([
    Buffer.from("Exif\0\0", "latin1"),
    tiff.subarray(0, dataAt),
  ]);
  const head = Buffer.alloc(4);
  head.writeUInt16BE(0xffe1, 0);
  head.writeUInt16BE(body.length + 2, 2);
  return Buffer.concat([head, body]);
}
/** A JPEG with the Exif segment placed right after its SOI (where a camera puts it, ahead of ffmpeg's JFIF APP0). */
const withExif = (jpeg, app1) =>
  Buffer.concat([jpeg.subarray(0, 2), app1, jpeg.subarray(2)]);

// ── Pictures, from ffmpeg's own sources (no third-party picture) ──────────────────────────────────
const PALETTES = [
  ["0xd94f30", "0x2a1b3d", "0xf2b134", "0x3d8fd9"],
  ["0x1f6f5c", "0xf4e3c1", "0xc2410c", "0x312e81"],
  ["0xbe185d", "0x0f172a", "0xfde68a", "0x0ea5e9"],
];
const seed = () => Math.floor(Math.random() * 2 ** 31);
const label = (text, size) =>
  `drawtext=text='${text}':fontsize=${size}:fontcolor=white:borderw=${Math.ceil(size / 12)}:bordercolor=black@0.6:x=(w-text_w)/2:y=(h-text_h)/2`;
function frame(file, w, h, text, i) {
  const [c0, c1, c2, c3] = PALETTES[i % PALETTES.length];
  // Drawn at a quarter size and scaled up, so the noise reads like a sensor's and the file like a phone's (~4 MB at 12 MP).
  const vf = `gradients=s=${Math.round(w / 4)}x${Math.round(h / 4)}:seed=${seed()}:c0=${c0}:c1=${c1}:c2=${c2}:c3=${c3}:nb_colors=4,noise=alls=12:allf=u,scale=${w}:${h}:flags=bicubic,${label(text, Math.round(Math.min(w, h) / 12))},format=yuvj420p`;
  execFileSync("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-f",
    "lavfi",
    "-i",
    vf,
    "-frames:v",
    "1",
    "-q:v",
    "6",
    file,
  ]);
}

const made = [];
const stampAt = (n) => AT.getTime() - n * 60_000;
for (let n = 0; n < PHOTOS; n++) {
  const portrait = n % 2 === 1;
  const file = join(OUT, `${PREFIX}-photo-${n + 1}.jpg`);
  frame(
    file,
    portrait ? 3024 : 4032,
    portrait ? 4032 : 3024,
    `${PREFIX} ${RUN} ${n + 1}`,
    n,
  );
  const wall = wallOf(stampAt(n), ZONE);
  writeFileSync(
    file,
    withExif(readFileSync(file), exifApp1({ wall, zone: ZONE })),
  );
  made.push(
    `${file} ${readFileSync(file).length} bytes, taken ${wall} ${ZONE}`,
  );
}
for (let n = 0; n < VIDEOS; n++) {
  const file = join(OUT, `${PREFIX}-video-${n + 1}.mp4`);
  const created = new Date(stampAt(PHOTOS + n)).toISOString();
  execFileSync("ffmpeg", [
    "-hide_banner",
    "-loglevel",
    "error",
    "-y",
    "-f",
    "lavfi",
    "-i",
    `testsrc2=s=1080x1920:r=30:d=3,${label(`${PREFIX} ${RUN} v${n + 1}`, 72)}`,
    "-f",
    "lavfi",
    "-i",
    `sine=f=${330 + 110 * n}:d=3`,
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-preset",
    "veryfast",
    "-c:a",
    "aac",
    "-shortest",
    "-movflags",
    "+faststart",
    "-metadata",
    `creation_time=${created}`,
    file,
  ]);
  made.push(`${file} ${readFileSync(file).length} bytes, created ${created}`);
}
// The fake camera: one still second of the first photograph (Chrome loops a .y4m).
const cam = join(OUT, "party-cam.y4m");
const camSrc = join(OUT, "party-cam-src.jpg");
frame(camSrc, 640, 480, `${PREFIX} cam ${RUN}`, 0);
execFileSync("ffmpeg", [
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  "-loop",
  "1",
  "-i",
  camSrc,
  "-t",
  "1",
  "-r",
  "15",
  "-pix_fmt",
  "yuv420p",
  cam,
]);
made.push(`${cam} (the fake camera)`);
// The compute model's six shapes (its photos() appends unique bytes to each copy it sends).
for (const [i, shape] of [
  "landscape-1600x1200",
  "portrait-1080x1350",
  "portrait-1200x1600",
  "square-1200x1200",
  "tall-1080x1920",
  "wide-1920x1080",
].entries()) {
  const [w, h] = shape.split("-")[1].split("x").map(Number);
  const file = join(OUT, "images", `${shape}.jpg`);
  frame(file, w, h, `${shape} ${RUN}`, i);
  writeFileSync(
    file,
    withExif(
      readFileSync(file),
      exifApp1({ wall: wallOf(stampAt(i), ZONE), zone: ZONE }),
    ),
  );
}
made.push(`${join(OUT, "images")}/ (the compute model's six shapes)`);
for (const m of made) console.log(m);
console.log(`MEDIA ${OUT} ${PHOTOS} photos ${VIDEOS} videos`);
