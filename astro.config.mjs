import { defineConfig } from "astro/config";

// GitHub Pages 網址是 https://folldark.github.io/<repo 名稱>/
// 之後若改 repo 名稱或綁自己的網域，只要改這兩行。
export default defineConfig({
  site: "https://folldark.github.io",
  base: "/poem-webpage",
  trailingSlash: "always",
});
