#!/usr/bin/env node
// usher/kit/moltbook.mjs: Usher's Moltbook client (2026-09-20). Reads need no key (the public API answers them);
// writes need MOLTBOOK_API_KEY, read from the environment or .env.local, never on a command line, never printed,
// and sent ONLY to https://www.moltbook.com/api/v1/* (their rule and mine). A write's response may carry a
// `verification` challenge: it is printed, never auto-solved (a decision for the session, not the script).
// usage: node usher/kit/moltbook.mjs posts [hot|new|top|rising] [limit] · submolts · submolt <name> [sort] · post <id>
//        · comments <id> [sort] · search "<q>" · me · status · home · write <submolt> "<title>" <body.md>
//        · comment <postId> <body.md> [parentId] · upvote <postId>
import fs from "node:fs";
const BASE = "https://www.moltbook.com/api/v1";
const [cmd, ...a] = process.argv.slice(2);
const key = () => {
  if (process.env.MOLTBOOK_API_KEY) return process.env.MOLTBOOK_API_KEY;
  try { const m = fs.readFileSync("/Users/gibby/local/ai/partyreel/.env.local", "utf8").match(/^MOLTBOOK_API_KEY=(.*)$/m); if (m) return m[1].trim().replace(/^["']|["']$/g, ""); } catch {}
  try { return JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/moltbook/credentials.json`, "utf8")).api_key; } catch {}
  return null;
};
const call = async (path, { method = "GET", body, auth = false } = {}) => {
  const url = `${BASE}${path}`;
  if (!url.startsWith("https://www.moltbook.com/api/v1/")) throw new Error("the key goes nowhere but www.moltbook.com/api/v1");
  const headers = { "User-Agent": "usher (partyreel.com)" };
  if (auth) { const k = key(); if (!k) throw new Error("no MOLTBOOK_API_KEY yet (Will's step)"); headers.Authorization = `Bearer ${k}`; }
  if (body) headers["Content-Type"] = "application/json";
  const r = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${r.status} ${path}: ${(j.message || j.error || JSON.stringify(j)).slice(0, 200)}`);
  return j;
};
const name = (x) => (x && typeof x === "object" ? x.name : x) ?? "?";
const line = (p) => `${String(p.upvotes ?? p.score ?? 0).padStart(4)} up ${String(p.comment_count ?? 0).padStart(5)} c  m/${name(p.submolt).padEnd(16)} ${name(p.author).padEnd(20)} ${p.id}\n       ${(p.title || "").slice(0, 110)}`;
const out = (x) => console.log(typeof x === "string" ? x : JSON.stringify(x, null, 2));
try {
  if (cmd === "posts") out((await call(`/posts?sort=${a[0] || "hot"}&limit=${a[1] || 20}`)).posts.map(line).join("\n"));
  else if (cmd === "submolts") out((await call("/submolts")).submolts.map((s) => `${String(s.subscriber_count ?? "").padStart(7)}  m/${s.name.padEnd(20)} ${(s.description || "").slice(0, 100)}`).join("\n"));
  else if (cmd === "submolt") out((await call(`/posts?submolt=${a[0]}&sort=${a[1] || "hot"}&limit=${a[2] || 20}`)).posts.map(line).join("\n"));
  else if (cmd === "post") { const p = (await call(`/posts/${a[0]}`)).post ?? (await call(`/posts/${a[0]}`)); out(`${p.title}\n— ${name(p.author)} in m/${name(p.submolt)}, ${p.upvotes} up, ${p.comment_count} comments\n\n${p.content || p.url || ""}`); }
  else if (cmd === "comments") { const c = await call(`/posts/${a[0]}/comments?sort=${a[1] || "best"}&limit=${a[2] || 30}`); const list = c.comments || []; out(list.map((x) => `[${x.upvotes ?? 0} up] ${name(x.author)}${x.parent_id ? " (reply)" : ""} ${x.id}: ${(x.content || "").replace(/\s+/g, " ").slice(0, 400)}`).join("\n\n")); }
  else if (cmd === "search") out(await call(`/search?q=${encodeURIComponent(a[0])}&limit=${a[1] || 10}`));
  else if (cmd === "me") out(await call("/agents/me", { auth: true }));
  else if (cmd === "status") out(await call("/agents/status", { auth: true }));
  else if (cmd === "home") out(await call("/home", { auth: true }));
  else if (cmd === "write") { const r = await call("/posts", { method: "POST", auth: true, body: { submolt_name: a[0], title: a[1], content: fs.readFileSync(a[2], "utf8") } }); console.log(`POST_ID=${r.post?.id ?? ""}`); out(r); if (r.verification) console.error("VERIFICATION CHALLENGE: not solved by this script; read it and decide."); }
  else if (cmd === "comment") { const r = await call(`/posts/${a[0]}/comments`, { method: "POST", auth: true, body: { content: fs.readFileSync(a[1], "utf8"), ...(a[2] ? { parent_id: a[2] } : {}) } }); console.log(`COMMENT_ID=${r.comment?.id ?? ""}`); out(r); if (r.verification) console.error("VERIFICATION CHALLENGE: not solved by this script; read it and decide."); }
  else if (cmd === "upvote") out(await call(`/posts/${a[0]}/upvote`, { method: "POST", auth: true }));
  else out("usage: see the head of this file");
} catch (e) { console.error(e.message); process.exit(1); }
