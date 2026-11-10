# 行間

直式書寫、由右至左的短詩網站。Astro 靜態網站，部署在 GitHub Pages。

## 寫詩到上線

```text
Obsidian（手機或電腦）
  Cmd+P → QuickAdd: 新詩 → 3_areas/詩/2026-11-10 詩題.md
  寫完把 publish: false 改成 true
        |
        v
poem-publish               （任何目錄都可以；等同在 repo 裡 npm run publish-poems）
  只複製 publish: true 的詩 → src/content/poems/ → commit → push
        |
        v
GitHub Actions 建置 → GitHub Pages（約 1～2 分鐘）
```

## 詩的格式

```markdown
---
title: "晚自習"
date: 2026-11-08
publish: true
slug:
tags:
  - 詩
aliases: []
---
整棟樓只剩這一層亮著

窗戶把我們
一格一格裝好
寄給夜晚
```

- 一行一句；空一行代表分段（直書時是一道較寬的空白）。
- `title` 留空時用檔名（去掉開頭日期）。
- 網址預設用 `date`，例如 `/2026-11-08/`。同一天兩首時，其中一首要填 `slug`（英文小寫、數字、`-`）。
- `%% 註解 %%` 和 `[[連結]]` 的方括號會被清掉；`tags`、`aliases` 等其他欄位不會帶到網站。
- 下架：把 `publish` 改回 `false` 或刪檔，再跑一次 `npm run publish-poems`。

## 指令

| 指令 | 用途 |
|---|---|
| `npm run publish-poems` | 從 vault 發布（commit＋push） |
| `poem-publish [參數]` | 同上，任何目錄可用；`~/.local/bin/poem-publish` 由 chezmoi 建立 symlink 指向 `bin/poem-publish` |
| `npm run publish-poems -- --dry-run` | 只列出會新增／更新／下架哪些詩 |
| `npm run demo` | 用 `examples/` 的範例詩在本機預覽版面 |
| `npm run dev` | 用目前已發布的詩在本機預覽 |

詩的來源預設是 `~/obsidian-sync/3_areas/詩`，可用 `--source` 或環境變數 `POEM_SOURCE` 改。

## 設定

- 網址前綴在 `astro.config.mjs` 的 `base`；改 repo 名稱或綁網域時改這裡。
- 版面樣式全部在 `src/styles/global.css`，色票在最上面的 `:root`。
