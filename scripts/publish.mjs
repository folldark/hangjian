#!/usr/bin/env node
// 把 vault 裡標了 publish: true 的詩，整理後複製到網站 repo，再 commit + push。
//
// 用法：
//   npm run publish-poems              正式發布
//   npm run publish-poems -- --dry-run 只列出會變動什麼，不寫檔
//
// 參數：
//   --source <資料夾>  詩的來源（預設 ~/obsidian-sync/3_areas/詩，或環境變數 POEM_SOURCE）
//   --out <資料夾>     輸出位置（預設 src/content/poems）
//   --no-git           只寫檔，不 commit / push
//   --dry-run          什麼都不寫

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const flag = (name) => args.includes(name);

const source = path.resolve(
  opt("--source") ?? process.env.POEM_SOURCE ?? path.join(os.homedir(), "obsidian-sync", "3_areas", "詩")
);
const out = path.resolve(repoRoot, opt("--out") ?? "src/content/poems");
const dryRun = flag("--dry-run");
const useGit = !flag("--no-git") && !dryRun;

function fail(msg) {
  console.error(`\n錯誤：${msg}`);
  process.exit(1);
}

if (!fs.existsSync(source)) fail(`找不到詩的資料夾：${source}`);

// 只讀需要的幾個欄位；tags、aliases 等其他欄位一律不帶到網站
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { fm: {}, body: text };
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (/^(["']).*\1$/.test(v)) v = v.slice(1, -1);
    fm[kv[1]] = v;
  }
  return { fm, body: text.slice(m[0].length) };
}

function cleanBody(body) {
  const lines = body
    .replace(/%%[\s\S]*?%%/g, "")                       // Obsidian 註解
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, "$1")         // [[連結|顯示]] → 顯示
    .replace(/\[\[([^\]]*)\]\]/g, "$1")                  // [[連結]] → 連結
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+$/, ""));
  const result = [];
  for (const l of lines) {
    if (l === "" && (result.length === 0 || result.at(-1) === "")) continue;
    result.push(l);
  }
  while (result.at(-1) === "") result.pop();
  return result.join("\n");
}

const poems = [];
const warnings = [];
for (const file of fs.readdirSync(source).filter((f) => f.endsWith(".md")).sort()) {
  const { fm, body } = parseFrontmatter(fs.readFileSync(path.join(source, file), "utf8"));
  if (fm.publish !== "true") continue;

  const title = fm.title || file.replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{2}\s*/, "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fm.date ?? "")) {
    warnings.push(`「${file}」的 date 不是 YYYY-MM-DD 格式，略過`);
    continue;
  }
  const slug = (fm.slug || fm.date).toLowerCase();
  if (!/^[a-z0-9-]+$/.test(slug)) {
    warnings.push(`「${file}」的 slug 只能用英文小寫、數字和 -，略過`);
    continue;
  }
  const text = cleanBody(body);
  if (!text) {
    warnings.push(`「${file}」沒有內文，略過`);
    continue;
  }
  poems.push({ file, title, date: fm.date, slug, text });
}

// 網址衝突：同一天兩首又都沒填 slug
const bySlug = new Map();
for (const p of poems) {
  if (bySlug.has(p.slug)) {
    fail(`「${bySlug.get(p.slug).file}」和「${p.file}」的網址都是 ${p.slug}，請在其中一首的 frontmatter 填 slug（例如 slug: ${p.slug}-b）`);
  }
  bySlug.set(p.slug, p);
}

const render = (p) => `---\ntitle: ${JSON.stringify(p.title)}\ndate: ${p.date}\n---\n${p.text}\n`;

const existing = fs.existsSync(out) ? fs.readdirSync(out).filter((f) => f.endsWith(".md")) : [];
const added = [], updated = [], removed = [];
for (const p of poems) {
  const target = path.join(out, `${p.slug}.md`);
  const next = render(p);
  if (!fs.existsSync(target)) added.push(p);
  else if (fs.readFileSync(target, "utf8") !== next) updated.push(p);
  else continue;
  if (!dryRun) {
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(target, next);
  }
}
for (const f of existing) {
  if (!bySlug.has(f.replace(/\.md$/, ""))) {
    const t = parseFrontmatter(fs.readFileSync(path.join(out, f), "utf8")).fm.title ?? f;
    removed.push({ title: t, slug: f.replace(/\.md$/, "") });
    if (!dryRun) fs.unlinkSync(path.join(out, f));
  }
}

for (const w of warnings) console.warn(`注意：${w}`);
console.log(`來源：${source}`);
console.log(`公開中的詩：${poems.length} 首`);
const list = (label, arr) => arr.length && console.log(`${label}：${arr.map((p) => `${p.title}（${p.slug}）`).join("、")}`);
list("新增", added);
list("更新", updated);
list("下架", removed);

if (!added.length && !updated.length && !removed.length) {
  console.log("沒有變更，不需要發布。");
  process.exit(0);
}
if (dryRun) {
  console.log("（--dry-run：沒有寫入任何檔案）");
  process.exit(0);
}
if (!useGit) process.exit(0);

const git = (...a) => execFileSync("git", a, { cwd: repoRoot, stdio: ["ignore", "pipe", "inherit"] }).toString().trim();
const summary = [
  added.length && `新增 ${added.map((p) => p.title).join("、")}`,
  updated.length && `更新 ${updated.map((p) => p.title).join("、")}`,
  removed.length && `下架 ${removed.map((p) => p.title).join("、")}`,
].filter(Boolean).join("；");

git("add", "--all", path.relative(repoRoot, out));
git("commit", "-m", `發布詩作：${summary}`);
console.log(`已 commit：${summary}`);

if (git("remote")) {
  execFileSync("git", ["push"], { cwd: repoRoot, stdio: "inherit" });
  console.log("已 push，GitHub Actions 建置約需 1～2 分鐘。");
} else {
  console.log("這個 repo 還沒有 remote，只 commit 沒有 push。");
}
