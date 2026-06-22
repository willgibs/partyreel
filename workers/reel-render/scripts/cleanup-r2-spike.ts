// Delete the spike's render outputs from R2 (the clearly-namespaced _spike/reel-render/ prefix), so the
// prod bucket stays tidy. Spike outputs are disposable + regenerable. Run: `npm run cleanup-r2`
import "dotenv/config";

import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } =
  process.env;
const PREFIX = "_spike/reel-render/";

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
  const listed = await s3.send(
    new ListObjectsV2Command({ Bucket: R2_BUCKET, Prefix: PREFIX }),
  );
  const keys = (listed.Contents ?? []).map((o) => ({ Key: o.Key! }));
  if (keys.length === 0) {
    console.log(`Nothing under ${PREFIX}`);
    return;
  }
  await s3.send(
    new DeleteObjectsCommand({
      Bucket: R2_BUCKET,
      Delete: { Objects: keys },
    }),
  );
  console.log(`Deleted ${keys.length} object(s) under ${PREFIX}:`);
  keys.forEach((k) => console.log(`  - ${k.Key}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
