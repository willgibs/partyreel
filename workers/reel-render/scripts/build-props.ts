// Build the reel inputProps (out/props.json) from REAL demo-event R2 media, presigning short-lived GET
// URLs the Remotion render (local + Lambda) fetches over HTTPS. Mirrors the app's R2 S3-client config
// (src/lib/r2/client.ts) — the WHEN_REQUIRED checksum settings are load-bearing against R2.
//
// Run: `npm run build-props`  (reads R2_* from workers/reel-render/.env)
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type {
  ReelClip,
  ReelProps,
} from "../../../src/lib/reel/composition/reel-types";
import { THEME_CLASSIC } from "../../../src/lib/reel/composition/reel-types";

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } =
  process.env;
if (
  !R2_ACCOUNT_ID ||
  !R2_ACCESS_KEY_ID ||
  !R2_SECRET_ACCESS_KEY ||
  !R2_BUCKET
) {
  throw new Error(
    "Set R2_ACCOUNT_ID/ACCESS_KEY_ID/SECRET_ACCESS_KEY/BUCKET in workers/reel-render/.env",
  );
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

// Real approved media from the demo event (varied dims exercise cover/crop; the demo predates previews
// so these are ORIGINALS — a conservative render-time vs production's smaller previews). 6 photos + 2
// short-trimmed video clips, interleaved.
const E = "events/2485e1e6-12b1-4d02-aee3-1e2bb5d38d4f";
type Item = {
  type: "photo" | "video";
  key: string;
  trimStartSec?: number;
  trimDurationSec?: number;
};
const items: Item[] = [
  {
    type: "photo",
    key: `${E}/photo/eea04b91-17eb-4424-9095-8d42e437311e/original.jpg`,
  },
  {
    type: "photo",
    key: `${E}/photo/21285cf7-271a-410b-bded-f63f6eb0a079/original.jpg`,
  },
  {
    type: "video",
    key: `${E}/video/dc2540eb-3d41-4848-8f45-23414a60781d/original.mp4`,
    trimStartSec: 0.5,
    trimDurationSec: 3,
  },
  {
    type: "photo",
    key: `${E}/photo/df9894b2-590c-49ae-8959-37c2e93a3bac/original.jpg`,
  },
  {
    type: "photo",
    key: `${E}/photo/11234cd7-9f05-4a7f-91c1-ac95ffba7602/original.jpg`,
  },
  {
    type: "video",
    key: `${E}/video/bccd26cd-5560-4f4c-b52d-5da15478eda9/original.mp4`,
    trimStartSec: 1,
    trimDurationSec: 3,
  },
  {
    type: "photo",
    key: `${E}/photo/dc3d53e5-66eb-4f0d-98c7-b4d14147b49a/original.jpg`,
  },
  {
    type: "photo",
    key: `${E}/photo/90908db2-83e4-411a-9237-303aca6b43d4/original.jpg`,
  },
];

const TTL_SECONDS = 6 * 60 * 60; // 6h — covers studio + local render + a Lambda render

// PHOTOS_ONLY=1 drops the video clips — used in the spike to isolate the video-decode cost (the
// OffthreadVideo fallback) from the photo Ken-Burns cost in the Lambda wall-clock measurement.
const photosOnly = process.env.PHOTOS_ONLY === "1";

async function main() {
  const picked = photosOnly ? items.filter((it) => it.type === "photo") : items;
  const clips: ReelClip[] = await Promise.all(
    picked.map(async (it) => {
      const url = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: R2_BUCKET, Key: it.key }),
        { expiresIn: TTL_SECONDS },
      );
      const clip: ReelClip = { url, type: it.type };
      if (it.trimStartSec != null) clip.trimStartSec = it.trimStartSec;
      if (it.trimDurationSec != null) clip.trimDurationSec = it.trimDurationSec;
      return clip;
    }),
  );

  const props: ReelProps = { clips, theme: THEME_CLASSIC, seed: 42 };
  mkdirSync("out", { recursive: true });
  writeFileSync("out/props.json", JSON.stringify(props, null, 2));
  console.log(
    `Wrote out/props.json — ${clips.length} clips (presigned ${TTL_SECONDS / 3600}h)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
