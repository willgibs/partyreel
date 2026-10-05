import { defineConfig } from "vitest/config";

// The Worker's own suite: the protocol twin's vectors, the transfer against a fake Drive and a fake R2, the lane's
// slice and its ends, the queue's readings. Node's environment: Web Crypto, streams and fetch are all there, and the
// fakes stand in for Google and the bucket (no Worker runtime needed).
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
