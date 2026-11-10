const CN = "〇一二三四五六七八九";

/** 二〇二六年<11>月<8>日：年份用中文數字，月日用直立併排 */
export function dateHTML(d: Date): string {
  const y = String(d.getUTCFullYear()).split("").map((c) => CN[+c]).join("");
  return `${y}年<span class="tcy">${d.getUTCMonth() + 1}</span>月<span class="tcy">${d.getUTCDate()}</span>日`;
}

/** 帶 base 的站內連結，例如 url("2026-11-08") → /hangjian/2026-11-08/ */
export function url(p = ""): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
  return base + (p ? p.replace(/^\/|\/$/g, "") + "/" : "");
}

/** 把內文切成行；空字串代表分段 */
export function lines(body = ""): string[] {
  return body.split(/\r?\n/).map((l) => l.trim());
}
