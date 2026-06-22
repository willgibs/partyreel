// Verify a Lambda render landed in R2 and is a valid vertical reel: download the key from R2 (proving
// the s3OutputProvider direct-to-R2 write worked, no copy step) and save it locally for ffprobe/eyeball.
// Run: `npm run verify-r2 -- <r2-key>`  (key e.g. _spike/reel-render/output-<ts>.mp4)
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } =
  process.env;
const key = process.argv[2];
if (!key) throw new Error("Usage: npm run verify-r2 -- <r2-key>");

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID!,
    secretAccessKey: R2_SECRET_ACCESS_KEY!,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

async function main() {
  const res = await s3.send(
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
  );
  const bytes = await res.Body!.transformToByteArray();
  mkdirSync("out", { recursive: true });
  const dest = "out/lambda-output.mp4";
  writeFileSync(dest, Buffer.from(bytes));
  console.log(`Downloaded R2 ${R2_BUCKET}/${key}`);
  console.log(`  content-type: ${res.ContentType}`);
  console.log(`  size:         ${(bytes.length / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  saved:        ${dest}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
