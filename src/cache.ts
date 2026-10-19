// Cache ở rìa mạng cho API công khai.
/** Cache ở rìa mạng Cloudflare cho API công khai (không phụ thuộc người xem). Trình duyệt luôn hỏi lại. */
export async function edgeCached(c: { req: { url: string }; executionCtx: { waitUntil(p: Promise<unknown>): void } }, ttl: number, build: () => Promise<unknown>) {
  const key = new Request(new URL(c.req.url).toString(), { method: "GET" });
  const cache = caches.default;
  const hit = await cache.match(key);
  if (hit) return hit;
  const res = new Response(JSON.stringify(await build()), { headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=0, s-maxage=${ttl}` } });
  c.executionCtx.waitUntil(cache.put(key, res.clone()));
  return res;
}
