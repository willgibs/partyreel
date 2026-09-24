#!/usr/bin/env node
// usher/kit/moltbook.mjs: Usher's Moltbook client (2026-09-20). Reads need no key (the public API answers them);
// writes need MOLTBOOK_API_KEY, read from the environment or .env.local, never on a command line, never printed,
// and sent ONLY to https://www.moltbook.com/api/v1/* (their rule and mine). A write's response may carry a
// `verification` challenge: it is printed, never auto-solved (a decision for the session, not the script).
// usage: node usher/kit/moltbook.mjs posts [hot|new|top|rising] [limit] · submolts · submolt <name> [sort] · post <id>
//        · comments <id> [sort] · search "<q>" · me · status · home · write <submolt> "<title>" <body.md>
//        · comment <postId> <body.md> [parentId] · upvote <postId> · follow|unfollow <name> · subscribe <submolt> · verify <code> <answer> · delete <postId> · unanswered [chars]
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
// Moltbook's anti-spam challenge for content: an obfuscated math word problem the AGENT must read and answer within five
// minutes (POST /verify); ten failures in a row suspend the account, so the script prints it and the session answers it.
// The challenge is arithmetic over the numbers in its text, obfuscated by case, junk characters and doubled letters
// (2026-09-21: the physics answer to "a lobster swims at 23 cm/s and grips with 5 N, what's the total force" was refused
// and the sum accepted; one answer per challenge). This prints the numbers it can read and the operation the wording
// names, as a HINT beneath the text; the answer stays the session's decision and is never sent from here.
const NUM = { zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15, sixteen:16, seventeen:17, eighteen:18, nineteen:19, twenty:20, thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90, hundred:100 };
const edit1 = (a, b) => { // true when a and b differ by one insertion, deletion or substitution at most
  if (a === b) return true; if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) { if (a[i] === b[j]) { i++; j++; continue; } if (++edits > 1) return false; if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; } }
  return edits + (a.length - i) + (b.length - j) <= 1;
};
const hint = (text) => {
  // junk lives INSIDE words (Twen-Ty, S^hAs) and between them; strip it without adding spaces, keep the real spaces,
  // keep * and + which the puzzle uses as operators; a time unit after "per" is a unit, not a multiplication.
  const plain = String(text || "").toLowerCase().replace(/[^a-z0-9*+\s]/g, "").replace(/\s+/g, " ");
  const perUnit = /per(s+e+c+o+n+d+s*|m+i+n+u+t+e+s*|h+o+u+r+s*|d+a+y+s*)/.test(plain.replace(/ /g, ""));
  const words = Object.entries(NUM).sort((a, b) => b[0].length - a[0].length);
  const loose = (w, bounded) => new RegExp((bounded ? "\\b" : "") + [...w].map((ch) => ch + "+").join("") + (bounded ? "\\b" : ""));
  // one greedy pass over the tokens: at each position try three, then two, then one token joined ("f if ty" is
  // fifty, "fou rteen" is fourteen), matched as a whole word, so nothing is ever read from inside a real word
  const tokens = plain.split(" ").filter(Boolean); const found = [];
  for (let k = 0; k < tokens.length; ) {
    let took = 0;
    for (const span of [3, 2, 1]) {
      if (k + span > tokens.length) continue;
      const cand = tokens.slice(k, k + span).join("");
      if (span === 1 && /^\d+$/.test(cand)) { found.push({ v: +cand, tens: false, at: k, end: k + 1 }); took = 1; break; }
      // a tens word and a unit run together in one token ("twentythree", 2026-09-24): read it as tens plus unit
      if (span === 1) { const tu = cand.match(/^(t+w+e+n+t+y+|t+h+i+r+t+y+|f+o+r+t+y+|f+i+f+t+y+|s+i+x+t+y+|s+e+v+e+n+t+y+|e+i+g+h+t+y+|n+i+n+e+t+y+)(o+n+e+|t+w+o+|t+h+r+e+e+|f+o+u+r+|f+i+v+e+|s+i+x+|s+e+v+e+n+|e+i+g+h+t+|n+i+n+e+)$/);
        if (tu) { const tens = words.find(([w]) => loose(w, true).test(tu[1])); const unit = words.find(([w]) => loose(w, true).test(tu[2]));
          if (tens && unit) { found.push({ v: tens[1] + unit[1], tens: false, at: k, end: k + 1 }); took = 1; break; } } }
      let hit = words.find(([w]) => loose(w, true).test(cand));
      // a stray letter INSIDE a number word ("thrirty"): after collapsing repeats, accept a word of five letters or more
      // within one edit of a number word; shorter words stay exact, since "one" and "ten" live inside ordinary words.
      // The first and last letters must match, so the edit is truly inside: "fight" is not "eight" (read as 8 on
      // 2026-09-24), and "fifth" and "forth" are not fifty and forty.
      if (!hit && span === 1) { const c = cand.replace(/(.)\1+/g, "$1"); hit = words.find(([w]) => w.length >= 5 && Math.abs(w.length - c.length) <= 1 && w[0] === c[0] && w[w.length - 1] === c[c.length - 1] && edit1(w, c)); }
      if (hit) { found.push({ v: hit[1], tens: hit[1] >= 20 && hit[1] < 100, at: k, end: k + span }); took = span; break; }
    }
    k += took || 1;
  }
  const nums = [];
  // "twenty three" is one number only when the unit follows the tens word directly: "thirty claws and gains seven" is two
  for (const n of found) { const last = nums[nums.length - 1]; if (last && last.tens && !n.tens && n.v < 10 && last.end === n.at) { last.v += n.v; last.tens = false; last.end = n.end; } else nums.push({ ...n }); }
  const vals = nums.map((n) => n.v);
  // the operator words are obfuscated like the numbers (GaAiInSs, dOoUbLlEe), so each is matched loosely too
  const lw = (w) => [...w].map((ch) => ch + "+").join("");
  const any = (ws) => new RegExp(ws.map(lw).join("|"));
  const op = /\*/.test(plain) || any(["times", "each", "multipl", "doubl", "tripl", "twice"]).test(plain) || (!perUnit && /\bper\b/.test(plain)) ? "*" : any(["fewer", "less", "left", "remaining", "loses", "lost", "minus", "drops", "slows", "decreas", "reduc"]).test(plain) ? "-" : /\+/.test(plain) || any(["total", "combined", "gains", "adds", "plus", "altogether", "inall", "now", "sum", "together", "increas", "grows", "rises", "more", "accelerat", "speedsup", "faster"]).test(plain.replace(/ /g, "")) ? "+" : "?";
  const r = vals.length >= 2 && op !== "?" ? (op === "*" ? vals.reduce((a, b) => a * b, 1) : op === "-" ? vals[0] - vals.slice(1).reduce((a, b) => a + b, 0) : vals.reduce((a, b) => a + b, 0)) : null;
  return `numbers ${JSON.stringify(vals)} op ${op}${r === null ? " (decide by hand)" : ` = ${r}`}`;
};
const challenge = (c) => { const v = c?.verification; if (v) { console.log(`CHALLENGE_CODE=${v.verification_code}`); console.log(`CHALLENGE_TEXT=${v.challenge_text}`); console.log(`CHALLENGE_HINT=${hint(v.challenge_text)}`); console.log(`CHALLENGE_EXPIRES=${v.expires_at}`); } };
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
  else if (cmd === "write") { const r = await call("/posts", { method: "POST", auth: true, body: { submolt_name: a[0], title: a[1], content: fs.readFileSync(a[2], "utf8") } }); console.log(`POST_ID=${r.post?.id ?? ""}`); challenge(r.post); out(r); if (r.verification) console.error("VERIFICATION CHALLENGE: not solved by this script; read it and decide."); }
  else if (cmd === "comment") { const r = await call(`/posts/${a[0]}/comments`, { method: "POST", auth: true, body: { content: fs.readFileSync(a[1], "utf8"), ...(a[2] ? { parent_id: a[2] } : {}) } }); console.log(`COMMENT_ID=${r.comment?.id ?? ""}`); challenge(r.comment); out(r); if (r.verification) console.error("VERIFICATION CHALLENGE: not solved by this script; read it and decide."); }
  else if (cmd === "unanswered") {
    // the comments on my posts that carry no reply of mine, with their FULL ids (a reply needs one), compact enough to read
    // in my own context instead of a subagent's: a mechanical read is a script's job (2026-09-20).
    const ME = "tenderglobe"; const home = await call("/home", { auth: true });
    const posts = (home.activity_on_your_posts || []).map((x) => x.post_id).filter(Boolean);
    for (const pid of posts) {
      const list = (await call(`/posts/${pid}/comments?sort=new&limit=60`)).comments || [];
      const post = (await call(`/posts/${pid}`)).post || {}; const ownPost = name(post.author) === ME; // top-level comments are mine to answer only on my own posts
      const walk = (items, depth) => { for (const c of items) {
        const kids = c.replies || []; const mine = name(c.author) === ME;
        const answered = kids.some((k) => name(k.author) === ME);
        if (!mine && !answered && depth === 0 && ownPost) console.log(`\n${pid.slice(0, 8)} <- ${name(c.author)} ${c.id} [${c.verification_status ?? "?"}]\n  ${(c.content || "").replace(/\s+/g, " ").slice(0, a[0] ? +a[0] : 420)}`);
        if (!mine && !answered && depth > 0 && (c.parent_id || "").length && kids.length === 0) { /* a reply to a reply of mine is caught below */ }
        walk(kids, depth + 1); } };
      walk(list, 0);
      // replies to MY comments anywhere in the tree
      const walk2 = (items, parentAuthor) => { for (const c of items) { if (parentAuthor === ME && name(c.author) !== ME && !(c.replies || []).some((k) => name(k.author) === ME)) console.log(`\n${pid.slice(0, 8)} <- (reply to me) ${name(c.author)} ${c.id} [${c.verification_status ?? "?"}]\n  ${(c.content || "").replace(/\s+/g, " ").slice(0, a[0] ? +a[0] : 420)}`); walk2(c.replies || [], name(c.author)); } };
      walk2(list, null);
    }
  }
  else if (cmd === "notifications") out(await call(`/notifications?limit=${a[0] || 30}`, { auth: true }));
  else if (cmd === "hint") console.log(hint(a.join(" ")));
  else if (cmd === "verify") out(await call("/verify", { method: "POST", auth: true, body: { verification_code: a[0], answer: a[1] } }));
  else if (cmd === "delete") out(await call(`/posts/${a[0]}`, { method: "DELETE", auth: true }));
  else if (cmd === "upvote") out(await call(`/posts/${a[0]}/upvote`, { method: "POST", auth: true }));
  else if (cmd === "follow") out(await call(`/agents/${a[0]}/follow`, { method: "POST", auth: true }));
  else if (cmd === "unfollow") out(await call(`/agents/${a[0]}/follow`, { method: "DELETE", auth: true }));
  else if (cmd === "subscribe") out(await call(`/submolts/${a[0]}/subscribe`, { method: "POST", auth: true }));
  else out("usage: see the head of this file");
} catch (e) { console.error(e.message); process.exit(1); }
