// node signin.mjs <email> <base> <key> [--open <path>] : a TEST HOST's session in this walk's own headless Chrome (the
// device drv.mjs holds under <key>, from newctx.mjs), for a cloud walk that has no Will's Chrome and no Google chooser
// (Will's yes, 2026-10-06). The service key mints a magic link (`auth.admin.generateLink`, type magiclink: it sends no
// mail), the publishable key's `verifyOtp` on its hashed token makes the session through @supabase/ssr's own server
// client (so the cookies are the ones the app's proxy and `getUser()` read, chunked and encoded as it writes them), and
// they are set on <base>'s origin in that device's context. `--open` then loads a page there and prints where it landed.
//
// ★ It REFUSES every address but the two test hosts (testing-verification.md's accounts), the operator above all: her
//   session is the admin portal's, behind a second factor this must never mint around. It also refuses an account with
//   a verified MFA factor and any base but localhost, before it reads a key or calls anything. negative.sh holds both.
// ★ It never prints a token, a link or a cookie: names, counts and the user id's head only.
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { envValue } from "../kit-env.mjs";

const TEST_HOSTS = new Set(["willg97@gmail.com", "hi@willgibs.com"]);
const OPERATOR = "partyr33l@gmail.com";
const argv = process.argv.slice(2);
const [rawEmail = "", base = "", key = ""] = argv;
const open = argv.includes("--open") ? argv[argv.indexOf("--open") + 1] : "";
const refuse = (why) => {
  console.error(`signin.mjs refuses: ${why}`);
  process.exit(3);
};

const email = rawEmail.trim().toLowerCase();
if (email === OPERATOR)
  refuse(
    "the operator's session is never minted (her portal stands behind a second factor)",
  );
if (!TEST_HOSTS.has(email))
  refuse(
    `${email || "(no address)"} is not a test host (${[...TEST_HOSTS].join(", ")})`,
  );
let origin;
try {
  origin = new URL(base);
} catch {
  refuse(`"${base}" is not a URL`);
}
if (
  origin.protocol !== "http:" ||
  !["localhost", "127.0.0.1"].includes(origin.hostname)
)
  refuse(
    `${base} is not a local server (a cloud walk signs in on its own build, never the alias or partyreel.com)`,
  );
if (!key) {
  console.error(
    "usage: signin.mjs <email> <base> <key> [--open <path>]  (key: a device from newctx.mjs)",
  );
  process.exit(2);
}

const { call, ev, nav } = await import("./lib.mjs");
const URL_ = envValue("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE =
  envValue("SUPABASE_SECRET_KEY") || envValue("SUPABASE_SERVICE_ROLE_KEY");
const PUBLISHABLE = envValue("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
if (!URL_ || !SERVICE || !PUBLISHABLE) {
  console.error(
    "signin.mjs needs NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (.env.local or the environment)",
  );
  process.exit(2);
}

// 1. The link, minted and never sent. Its user must be the address asked for, with no second factor.
const admin = createClient(URL_, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
if (link.error || !link.data?.properties?.hashed_token) {
  console.error(`generateLink failed: ${link.error?.message ?? "no token"}`);
  process.exit(1);
}
const user = link.data.user;
if ((user?.email ?? "").toLowerCase() !== email)
  refuse("the link names another account");
if ((user?.factors ?? []).some((f) => f.status === "verified"))
  refuse("the account holds a verified second factor");

// 2. The session, made the way the app's server client makes one, into a jar of our own.
const jar = new Map();
const server = createServerClient(URL_, PUBLISHABLE, {
  cookies: {
    getAll: () => [...jar].map(([name, c]) => ({ name, value: c.value })),
    setAll: (list) => {
      for (const { name, value, options } of list) {
        if (value) jar.set(name, { value, options: options ?? {} });
        else jar.delete(name);
      }
    },
  },
});
const verified = await server.auth.verifyOtp({
  token_hash: link.data.properties.hashed_token,
  type: "magiclink",
});
if (verified.error || !verified.data?.session) {
  console.error(`verifyOtp failed: ${verified.error?.message ?? "no session"}`);
  process.exit(1);
}
if ((verified.data.user?.email ?? "").toLowerCase() !== email)
  refuse("the session names another account");
await new Promise((r) => setTimeout(r, 50)); // setAll may land a tick after the verify resolves
if (!jar.size) {
  console.error("the session wrote no cookie");
  process.exit(1);
}

// 3. Into the device's own context, on the local origin only.
const now = Math.floor(Date.now() / 1000);
let set = 0;
for (const [name, { value, options }] of jar) {
  const r = await call({
    key,
    method: "Network.setCookie",
    params: {
      name,
      value,
      url: origin.origin,
      path: options.path ?? "/",
      httpOnly: Boolean(options.httpOnly),
      secure: false,
      sameSite: "Lax",
      ...(options.maxAge ? { expires: now + Number(options.maxAge) } : {}),
    },
  });
  if (r.error || r.result?.success === false) {
    console.error(
      `setting ${name} failed on device ${key}: ${JSON.stringify(r.error ?? r).slice(0, 160)}`,
    );
    process.exit(1);
  }
  set++;
}
console.log(
  `signed in ${email} (user ${user.id.slice(0, 8)}…) on device ${key} at ${origin.origin}: ${set} cookie(s), ${[...jar.keys()].join(", ")}`,
);

// 4. Optionally, a page as that host sees it (read-only: a load, nothing pressed).
if (open) {
  await nav(key, `${origin.origin}${open}`, 2500);
  const at = await ev(
    key,
    `JSON.stringify({ path: location.pathname, title: document.title, h1: (document.querySelector('h1')?.innerText || '').trim().slice(0, 80) })`,
  );
  console.log(`opened ${open}: ${at}`);
  if (typeof at === "string" && JSON.parse(at).path.startsWith("/login")) {
    console.error("landed on /login: the session did not take");
    process.exit(1);
  }
}
