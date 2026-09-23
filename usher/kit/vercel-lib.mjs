import fs from "node:fs";
const envFile = fs.readFileSync("/Users/gibby/local/ai/partyreel/.env.local", "utf8");
const TOKEN = envFile.match(/^VERCEL_TOKEN=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
export const TEAM = "team_ht9qAVBQVZf60dpGNJUwmaj5", APP = "prj_9jMOBYmlxMtjNOuWXthVIcwAjWaB", ADMIN = "prj_gJhEa7ul4ehpQljDI1EIm6d9jd9D";
const H = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };
export const call = async (m, p, b) => { const r = await fetch(`https://api.vercel.com${p}${p.includes("?") ? "&" : "?"}teamId=${TEAM}`, { method: m, headers: H, body: b ? JSON.stringify(b) : undefined }); return { status: r.status, json: await r.json().catch(() => null) }; };
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const err = (j) => JSON.stringify(j && j.error ? { code: j.error.code, message: j.error.message } : j).slice(0, 200);
export const probe = async (url) => { const r = await fetch(url, { redirect: "manual", headers: { "Cache-Control": "no-cache" } }); return `${r.status}${r.headers.get("location") ? " -> " + r.headers.get("location") : ""}`; };
