# 东方财富 A股数据源接入设计（方案A：仅A股）

## 背景与目标

当前系统的“搜索覆盖”已通过新浪 suggest 达到全量，但 A 股的行情/估值/财务字段存在以下问题：

- PB/PS 等估值字段经常缺失或为 `0`
- 财务摘要大量为空（目前未接入真实财报）
- 线上（Vercel）访问部分国内接口不稳定，需要可控超时与兜底，避免 SSR 白屏

本次目标：将 **东方财富（EastMoney）作为 A 股主数据源**，补齐 A 股行情与核心财务摘要；其它市场保持现状。

范围：**仅 A 股**（`sh*` / `sz*`）。港股/美股保持既有 Provider，不在本次方案范围内。

## 成功标准（验收）

- 线上 `https://stockmarketexpert.vercel.app/`：
  - 搜索 `688981` / `中芯国际` / `sh688981` 能进入个股页
  - 个股页不出现白屏，不出现 `RangeError: Invalid time value`
  - A 股 `PB/PS/市值` 等字段明显较现状更完整（不再普遍为 0）
  - AI 分析可正常渲染（含“数据来源”的时间戳展示）
- 超时/异常时仍可渲染：行情缺失时显示“实时行情暂时不可用”，K 线/财务缺失时显示“暂无数据”。

## 总体架构

### Provider 路由（推荐实现）

新增 `EastMoneyAshareProvider`，并在 Provider 层做按 symbol 路由：

- `symbol` 以 `sh` / `sz` 开头 → **EastMoneyAshareProvider（主）**
- 其它 symbol → 现有 Provider（QQ/Yahoo/Mock）保持不变

并继续保留 `TimeoutProvider`（统一超时与兜底），保证线上稳定。

### 数据流

1. 用户搜索：走现有 `searchSymbols`（新浪 suggest）→ 返回 `shXXXXXX`/`szXXXXXX`
2. 进入个股页：SSR 调用 `getQuote/getKline/getFinancials/getCompanyEvents`
3. A 股行情/财务由 EastMoney 提供；事件暂保持 mock（或后续扩展）
4. AI 分析：调用 `/api/analysis/stock/[symbol]`，使用 Provider 聚合后的 quote/kline/financials/events 作为输入

## 关键映射与数据约定

### symbol → secid（东方财富）

东方财富多数接口使用 `secid={market}.{code}`：

- `sh600519` → `1.600519`
- `sz300750` → `0.300750`
- `sh688981` → `1.688981`

规则：

- `sh` → `1`
- `sz` → `0`

### 时间戳格式（避免 Invalid time value）

系统内所有用于展示的时间戳（`QuoteSnapshot.updatedAt`、`AnalystReport.generatedAt`、`sources[].timestamp`）必须保证：

- `new Date(value)` 可解析
- 若不可解析，UI 层格式化函数必须安全降级（返回原字符串），不得抛异常

推荐统一为 ISO 或 ISO-like：

- `2026-07-09T11:28:06+08:00`
- `2026-07-09T03:28:06.000Z`

## 接口与实现细节

### 1) 行情（Quote）

目标：补齐 A 股行情与估值字段（至少：现价、涨跌幅、成交额、市值、PE、PB、PS）。

候选数据源：

- `https://push2.eastmoney.com/api/qt/stock/get?secid=...&fields=...`

实现：

- 在 `EastMoneyAshareProvider.getQuote()` 内请求上述接口
- 将字段映射到 `QuoteSnapshot`：
  - `price`、`change`、`changePercent`
  - `volume`、`turnover`（格式化为“xx亿”）
  - `peTtm`、`pb`、`ps`、`dividendYield`（若接口无则置 0）
  - `yearHigh/yearLow`（52周高低）
  - `updatedAt` 必须为可解析时间串（见“时间戳格式”）

超时策略：

- A 股行情：3~5 秒超时（线上更短），失败走 TimeoutProvider 的 fallback

### 2) K 线（Kline）

目标：提供“近 7 日价格”图表所需数据（日期标签 + 收盘价）。

候选数据源（东方财富）：

- `push2his.eastmoney.com` 的分时/日线接口（具体 fields 以实现阶段确认）

实现：

- 返回 `KlinePoint[]`，日期建议统一为 `YYYY-MM-DD` 或 `MM-DD`
- UI 图表使用数值 idx 作为 x 轴（避免 Date 解析）

超时策略：

- 5 秒超时，失败返回空数组

### 3) 财务摘要（Financials）

目标：先满足“最近财务摘要”展示（收入、净利润、同比、毛利率、经营现金流）。

候选数据源：

- 东方财富 F10 财务接口（实现阶段确认具体 URL 与字段）

实现：

- 先做“最近一期（年报/季报）”+ “上一期对比”即可
- 输出 `FinancialSnapshot[]`，并确保字段单位一致（例如“亿元”）

超时策略：

- 5 秒超时，失败返回空数组（UI 显示“暂无财务数据”）

### 4) 事件（Company Events）

本期不做复杂接入，保持现有 mock/events 结构；后续可扩展为公告/新闻抓取或第三方事件源。

## 缓存策略（建议）

为减少接口压力并提升稳定性：

- Quote：`no-store` 或 `revalidate: 10~30s`
- Kline：`revalidate: 5~30min`
- Financials：`revalidate: 1~6h`

缓存可在 API route 或 provider 内做（取决于现有实现风格）。

## 风险与降级

1. **东方财富接口字段变动**：通过字段映射集中在 provider 文件，便于维护。
2. **线上网络不稳定**：所有调用必须走 TimeoutProvider，永不让 SSR 因单点失败崩溃。
3. **时间戳导致白屏**：格式化函数与数据源均保证“可解析或降级”。

## 变更清单（文件级）

- 新增：`server/market-data/eastmoney-provider.ts`
  - `searchSymbols`（可复用现有新浪搜索或保持 provider 层统一）
  - `getQuote/getKline/getFinancials`（A 股实现）
- 修改：`server/market-data/provider.ts`
  - 增加按 symbol 路由：A 股 → EastMoney；其它 → 原 provider
  - 保留 TimeoutProvider 统一超时
- 可能调整：`server/analyst/report.ts`
  - 让 sources 时间戳更统一（如果需要）

## 测试计划

1. 本地 dev：
   - `sh600519`、`sz300750`、`sh688981` 三只 A 股
   - 验证 quote/kline/financials API 返回结构
   - 打开个股页，确认无报错，AI 分析可生成并渲染
2. 线上 vercel：
   - 同样三只 A 股验证
   - 重点观察 console 是否还有 `Invalid time value` 与白屏

