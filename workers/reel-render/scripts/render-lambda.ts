// Render the <Reel> on Remotion Lambda (AWS) and write the .mp4 DIRECTLY to R2 via
// `outName.s3OutputProvider` — no S3->R2 copy step (Remotion's official lambda/r2 path).
// This is the Slice-1 spike measurement harness: it renders, polls progress, and prints
// wall-clock + Remotion's own cost accrual + an independent estimatePrice, so we can settle
// lazy-on-download vs eager-on-finalize and the box sizing (memory / framesPerLambda).
//
// Prereqs (Phase B + the deploy step):
//   - workers/reel-render/.env has R2_* (already) + REMOTION_AWS_ACCESS_KEY_ID/SECRET_ACCESS_KEY
//   - the Lambda function is deployed (scripts/deploy-lambda or the CLI) and the site is created;
//     set REMOTION_SERVE_URL to the site URL. The function name is speculated from the box config
//     below (override with REMOTION_LAMBDA_FUNCTION_NAME if you deployed a non-default box).
//
// Run: `npm run render-lambda`           (warm number; run twice, 2nd is warm)
//      `npm run render-lambda -- --cold` (only labels the log; cold = first run after idle)
import "dotenv/config";
import { readFileSync } from "node:fs";

import {
  estimatePrice,
  getRenderProgress,
  renderMediaOnLambda,
  speculateFunctionName,
  type AwsRegion,
} from "@remotion/lambda/client";

import type { ReelProps } from "../src/reel-types";

// The Lambda box — must match what we deploy (functions deploy --memory-size-mb / --disk-size-mb /
// --timeout). speculateFunctionName derives the deployed function's name from these deterministically.
const BOX = { memorySizeInMb: 2048, diskSizeInMb: 2048, timeoutInSeconds: 120 } as const;

const region = (process.env.REMOTION_AWS_REGION ?? "us-east-1") as AwsRegion;
const serveUrl = process.env.REMOTION_SERVE_URL;
const functionName =
  process.env.REMOTION_LAMBDA_FUNCTION_NAME ?? speculateFunctionName(BOX);
// New AWS accounts start with a tiny Lambda concurrency quota, and Remotion fans out one renderer
// per frame-chunk. A high framesPerLambda = fewer chunks = fewer concurrent lambdas (stays under the
// cap). Trades wall-clock for staying under quota; cost is ~constant (same total compute). Once the
// account's "Concurrent executions" quota is raised (Service Quotas), drop/unset this for full fan-out.
const framesPerLambda = process.env.REMOTION_FRAMES_PER_LAMBDA
  ? Number(process.env.REMOTION_FRAMES_PER_LAMBDA)
  : undefined;

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } =
  process.env;

function requireEnv() {
  const missing: string[] = [];
  if (!serveUrl) missing.push("REMOTION_SERVE_URL (from `lambda sites create`)");
  if (!R2_ACCOUNT_ID) missing.push("R2_ACCOUNT_ID");
  if (!R2_ACCESS_KEY_ID) missing.push("R2_ACCESS_KEY_ID");
  if (!R2_SECRET_ACCESS_KEY) missing.push("R2_SECRET_ACCESS_KEY");
  if (!R2_BUCKET) missing.push("R2_BUCKET");
  if (!process.env.REMOTION_AWS_ACCESS_KEY_ID)
    missing.push("REMOTION_AWS_ACCESS_KEY_ID");
  if (!process.env.REMOTION_AWS_SECRET_ACCESS_KEY)
    missing.push("REMOTION_AWS_SECRET_ACCESS_KEY");
  if (missing.length) {
    throw new Error(`Missing env in workers/reel-render/.env:\n  - ${missing.join("\n  - ")}`);
  }
}

async function main() {
  requireEnv();
  const cold = process.argv.includes("--cold");
  const inputProps = JSON.parse(readFileSync("out/props.json", "utf8")) as ReelProps;

  // A clearly-namespaced spike key so the output is trivial to find + clean up in R2.
  const outKey = `_spike/reel-render/output-${Date.now()}.mp4`;

  console.log(`[render-lambda] ${cold ? "COLD" : "warm"} | fn=${functionName} | region=${region}`);
  console.log(`[render-lambda] serveUrl=${serveUrl}`);
  console.log(`[render-lambda] -> R2 ${R2_BUCKET}/${outKey}`);

  const startedAt = Date.now();
  const { renderId, bucketName } = await renderMediaOnLambda({
    region,
    functionName,
    serveUrl: serveUrl!,
    composition: "Reel",
    inputProps,
    codec: "h264",
    ...(framesPerLambda ? { framesPerLambda } : {}),
    // Write the output STRAIGHT to R2 (no S3 copy). endpoint is R2's S3 API; creds are the R2
    // Object Read&Write key. Virtual-hosted addressing (omit forcePathStyle) matches our app's
    // R2 client + the presigned URLs in build-props.
    outName: {
      bucketName: R2_BUCKET!,
      key: outKey,
      s3OutputProvider: {
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    },
  });

  console.log(`[render-lambda] started renderId=${renderId} (Remotion bucket=${bucketName})`);

  // Poll until done. Log overall progress + the lambda fan-out so we see the framesPerLambda effect.
  for (;;) {
    const p = await getRenderProgress({ renderId, bucketName, functionName, region });
    if (p.fatalErrorEncountered) {
      console.error("[render-lambda] FATAL:", JSON.stringify(p.errors, null, 2));
      process.exit(1);
    }
    if (p.done) {
      const wall = ((Date.now() - startedAt) / 1000).toFixed(2);
      const est = estimatePrice({
        region,
        memorySizeInMb: BOX.memorySizeInMb,
        diskSizeInMb: BOX.diskSizeInMb,
        lambdasInvoked: p.lambdasInvoked,
        durationInMilliseconds: p.timeToFinish ?? Date.now() - startedAt,
      });
      console.log("─".repeat(60));
      console.log(`[render-lambda] DONE (${cold ? "COLD" : "warm"})`);
      console.log(`  wall-clock:        ${wall}s   (client-measured, incl. cold start)`);
      console.log(`  timeToFinish:      ${p.timeToFinish != null ? (p.timeToFinish / 1000).toFixed(2) + "s" : "n/a"}   (render only)`);
      console.log(`  lambdasInvoked:    ${p.lambdasInvoked}`);
      console.log(`  cost (Remotion):   ${p.costs.displayCost} (${p.costs.currency}, accrued ${p.costs.accruedSoFar})`);
      console.log(`  cost (estimate):   $${est.toFixed(5)}`);
      console.log(`  output:            R2 ${p.outBucket}/${p.outKey}`);
      console.log(`  outputFile (URL):  ${p.outputFile}`);
      console.log("─".repeat(60));
      return;
    }
    process.stdout.write(`\r[render-lambda] ${(p.overallProgress * 100).toFixed(1)}% | ${p.lambdasInvoked} lambdas   `);
    await new Promise((r) => setTimeout(r, 1000));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
