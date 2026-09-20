// wave6-check.mjs: the served alias against the sixth batch's first three lanes (public pages only; no key).
const A = "https://partyreel-git-launch-prep-partyreel.vercel.app";
const get = async (p) => { const r = await fetch(A + p, { headers: { "Cache-Control": "no-cache" }, redirect: "follow" }); return [r.status, await r.text(), r.url]; };
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const [ls, login] = await get("/login");
console.log("login status", login && (login.match(/sentry-release=([0-9a-f]{8})/) || [])[1], ls);
const lt = strip(login);
const checks = [
  ["login: the code first", lt.includes("Email me a code")],
  ["login: Google beside", lt.includes("Continue with Google")],
  ["login: the password on a quiet link", /Have a password\?/.test(lt)],
  ["login: the consent line", /By continuing you agree/.test(lt)],
  ["login: no 'Create account' link (the code is the signup)", !/Create account/.test(lt)],
  ["login: the wall of frames (four images)", (login.match(/<img[^>]+(wedding|party|festival|balloon)/gi) || []).length >= 3],
];
const [es, err] = await get("/login?error=expired_link");
checks.push(["login?error=expired_link: the failure line", /link has expired|expired/i.test(strip(err))]);
const [ds, demo, durl] = await get("/demo");
const dt = strip(demo);
checks.push(["demo album: reached", ds === 200 && /Partyreel Demo/.test(dt)]);
checks.push(["demo album: Invite in the row", /Invite/.test(dt)]);
checks.push(["demo album: no Save in the row", !/>\s*Save\s*</.test(demo.replace(/<a [^>]*download[^>]*>[\s\S]*?<\/a>/g, ""))]);
checks.push(["demo album: the glass utility on the page", /class="[^"]*\bglass\b/.test(demo)]);
checks.push(["demo album: a phone tile carries no control (hover row hidden below md)", /hidden[^"]*md:flex/.test(demo)]);
const [gs, ghost] = await get("/e/0333eef9d7994951b86e5b2a71da49f9");
const gt = strip(ghost);
checks.push(["ghost event: the river on the empty album ('The album starts with you')", /The album starts with you/.test(gt)]);
checks.push(["ghost event: Save absent from the row", !/Save the event|Save this event/.test(gt)]);
for (const [n, ok] of checks) console.log(ok ? "ok  " : "FAIL", n);
