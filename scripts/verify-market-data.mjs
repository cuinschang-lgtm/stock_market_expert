const baseUrl = process.env.SME_BASE_URL ?? "http://127.0.0.1:3000";

async function readJson(path, expectedStatus = 200) {
  const url = new URL(path, baseUrl);
  const response = await fetch(url, { cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (response.status !== expectedStatus) {
    throw new Error(`${path} expected ${expectedStatus}, received ${response.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const quote = await readJson("/api/stocks/sh600519/quote");
  assert(quote.quote?.symbol === "sh600519", "quote response should include sh600519");
  assert(quote.meta?.sourceLabel, "quote response should include market data meta");

  const kline = await readJson("/api/stocks/sh600519/kline");
  assert(Array.isArray(kline.kline), "kline response should include kline array");
  assert(kline.meta?.sourceLabel, "kline response should include market data meta");

  const invalid = await readJson("/api/analysis/stock/badcode", 404);
  assert(String(invalid.error ?? "").includes("暂未找到"), "invalid symbol should return friendly error");

  console.log("Market data verification passed");
  console.log(`Quote source: ${quote.meta.sourceLabel} (${quote.meta.mode})`);
  console.log(`Kline source: ${kline.meta.sourceLabel} (${kline.meta.mode})`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
