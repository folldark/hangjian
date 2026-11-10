import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// 詩作來源：平常是 src/content/poems（由 scripts/publish.mjs 從 vault 複製進來）
// npm run demo 時改讀範例資料夾
const base = process.env.POEM_CONTENT ?? "./src/content/poems";

const poems = defineCollection({
  loader: glob({ pattern: "*.md", base }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
  }),
});

export const collections = { poems };
