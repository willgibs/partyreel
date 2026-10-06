// vercel-usage.mjs: the Vercel team's function load over Hobby's rolling 30 days, read before any work that runs on
// Vercel (a `[preview]`, `lab:demo` or a red-team against the alias, anything on partyreel.com). Born 2026-10-04: Hobby
// allows 4 Active CPU-hours a rolling 30 days and pauses the team's functions past it (Will's account was unlocked by
// Vercel once already), and we reached "almost maxed" unseen, with zero real users: our own red-teams and desk checks on
// the alias and album tabs left polling did it.
//
// Hobby's API never answers Active CPU itself (that is Pro's Observability Plus), so this reads what it does answer,
// `GET /v2/usage?type=requests` (daily function invocations per team, per project as a share), and estimates the CPU
// from CPU_SECONDS_PER_CALL, calibrated by hand from the dashboard's Usage page (Active CPU used / 30-day calls). Read-only.
// Prints one line; exits 0 under WARN, 2 at WARN or over (say so before any Vercel work), 3 at REFUSE or over (no Vercel
// work but what Will asks for by name).
import { call } from "./vercel-lib.mjs";

const HOBBY_CPU_HOURS = 4;
// Calibration: Will's dashboard reading against the 30-day calls this script printed at the same hour. null until read.
const CPU_SECONDS_PER_CALL = 0.044; // 2026-10-04 15:45Z: the dashboard read 3h 56m (14,160 s) against 320,789 calls
const WARN = 0.6, REFUSE = 0.85;
// Without a calibration, a plain count guards: about 330,000 calls in the 30 days that read "almost maxed" (2026-10-04).
const CALLS_AT_ALMOST_MAXED = 330_000;

const now = new Date();
const from = new Date(now.getTime() - 30 * 86_400_000);
const { status, json } = await call("GET", `/v2/usage?type=requests&from=${from.toISOString()}&to=${now.toISOString()}`);
if (status !== 200 || !json?.data) {
  console.log(`vercel usage: the read failed (HTTP ${status}); treat the load as unknown and run nothing on Vercel unasked`);
  process.exit(3);
}
const calls = (r) => r.function_invocation_successful_count + r.function_invocation_error_count + r.function_invocation_timeout_count;
const total = json.data.reduce((n, r) => n + calls(r), 0);
const today = calls(json.data[json.data.length - 1] ?? { function_invocation_successful_count: 0, function_invocation_error_count: 0, function_invocation_timeout_count: 0 });
const busiest = json.data.reduce((a, r) => (calls(r) > calls(a) ? r : a), json.data[0]);
const shares = (json.data.at(-1)?.breakdown?.function_invocations ?? []).map((p) => `${p.name} ${p.percent}%`).join(", ");
const share = CPU_SECONDS_PER_CALL ? (total * CPU_SECONDS_PER_CALL) / 3600 / HOBBY_CPU_HOURS : total / CALLS_AT_ALMOST_MAXED * 0.9;
const est = CPU_SECONDS_PER_CALL ? `about ${((total * CPU_SECONDS_PER_CALL) / 3600).toFixed(2)} of ${HOBBY_CPU_HOURS} CPU-hours` : `about ${Math.round(share * 100)}% of the limit by count (uncalibrated)`;
const verdict = share >= REFUSE ? "REFUSE: no Vercel work but what Will asks for by name" : share >= WARN ? "WARN: say so before any Vercel work, and keep it small" : "under the line";
console.log(`vercel usage ${now.toISOString().slice(0, 16)}Z | 30-day function calls ${total.toLocaleString("en-US")}; today ${today.toLocaleString("en-US")} (${shares || "no split"}: the API splits one day by project, never the window); busiest ${busiest?.date?.slice(0, 10)} ${calls(busiest).toLocaleString("en-US")} | ${est} | ${verdict}`);
process.exit(share >= REFUSE ? 3 : share >= WARN ? 2 : 0);
