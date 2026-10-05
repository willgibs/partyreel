/**
 * The few Node modules the Worker's TESTS read (the suite runs under Node; the Worker itself never imports one), typed
 * by hand so the package keeps the one types root a Worker has (`@cloudflare/workers-types`), as its siblings do.
 */
declare module "node:fs" {
  export function readdirSync(
    path: string,
    options?: { recursive?: boolean },
  ): string[];
  export function readFileSync(path: string, encoding: "utf8"): string;
}
declare module "node:path" {
  export function join(...parts: string[]): string;
}
declare module "node:crypto" {
  export function createHash(algorithm: string): {
    update(data: Uint8Array | string): { digest(encoding: "hex"): string };
  };
}
declare const __dirname: string;
