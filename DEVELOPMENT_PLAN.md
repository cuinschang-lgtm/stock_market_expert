# 股票投资辅助工具开发流程

## 1. 项目目标

本项目目标是把 qclaw workspace 中“股票投资专家”的投研工作流，升级为一个可持续迭代的全栈股票投资辅助网站。网站不直接给出买入、卖出、目标价等投资指令，而是帮助用户完成数据整理、研究分析、投资逻辑追踪、事件提醒和研究笔记沉淀。

默认产品路线：

- 前端：Next.js + React + TypeScript + Tailwind CSS
- 后端：Next.js API Routes 或独立 Node/FastAPI 服务
- 数据库：PostgreSQL
- 缓存与任务状态：Redis
- 图表：ECharts 或 Recharts
- AI 编排：独立的投研分析 orchestrator
- 数据策略：先实现统一 `MarketDataProvider` 抽象，开发期使用 mock 数据，后续接入 qclaw/westock 或第三方金融 API
- 上线策略：先使用 Vercel 部署 MVP，等功能和用户需求稳定后，再评估是否迁移到腾讯云轻量应用服务器或云原生组合

核心原则：

- 先做可演示、可迭代的 MVP，再逐步接入真实数据和复杂分析。
- 页面层不直接依赖具体金融数据源，所有行情、财务、事件、行业数据都通过 provider 抽象获取。
- 所有 AI 分析必须保存输入、引用数据、来源、时间戳和结果摘要。
- 不喊单，不输出买卖建议，不传递内幕信息或未公开市场敏感数据。
- 所有投研结论都应标注“仅为信息整理与分析参考，不构成投资建议”。

## 2. MVP 范围

MVP 要形成一个最小但完整的投研闭环：

1. 用户进入 Dashboard，看到市场概览、自选股异动和今日重要事件。
2. 用户搜索股票，进入个股详情页。
3. 个股详情页展示行情、估值、财务摘要、事件时间线和 AI 快速分析。
4. 用户可以把股票加入自选股。
5. 用户可以保存 AI 分析结果或人工输入为研究笔记。
6. 用户可以在 AI Analyst 页面输入股票或主题，生成结构化分析。

MVP 页面：

- Dashboard
- Stock Detail
- Watchlist
- Research Notes
- AI Analyst

MVP 功能：

- 股票搜索
- 自选股添加、删除、分组（MVP 先使用浏览器 localStorage）
- 个股行情与基础财务展示
- 公司事件时间线
- AI 快速分析
- 研究笔记保存（MVP 先使用浏览器 localStorage）
- mock 数据完整演示

暂不纳入 MVP 的功能：

- 实盘交易
- 自动下单
- 投资组合收益归因
- 复杂估值模型编辑器
- 付费订阅体系
- 多用户协作

## 3. 推荐技术架构

### 3.1 前端

使用 Next.js App Router 构建网站主体。

建议目录：

```text
app/
  page.tsx
  dashboard/
  stocks/[symbol]/
  watchlist/
  notes/
  analyst/
components/
  layout/
  market/
  stocks/
  notes/
  analyst/
lib/
  formatters/
  charts/
  constants/
server/
  api/
  market-data/
  analyst/
data/
  mock/
docs/
```

UI 风格建议：

- 整体应是安静、专业、信息密度较高的投研工作台。
- 避免营销式 landing page。
- 首页直接进入可用的 Dashboard。
- 使用表格、分栏、时间线、标签、图表承载信息。
- 移动端保证核心信息不溢出、不遮挡。

### 3.2 后端

初期可使用 Next.js API Routes，后续如果分析任务变重，再拆成独立服务。

后端职责：

- 用户、自选股、笔记、投资逻辑的数据管理
- 行情、财务、事件、行业数据 provider 调用
- AI 分析任务创建、执行、保存
- 数据源鉴权与密钥管理
- 缓存、限流和错误兜底

### 3.3 数据库

建议使用 PostgreSQL，核心表：

- `users`
- `investor_profiles`
- `symbols`
- `watchlists`
- `watchlist_items`
- `positions`
- `quote_snapshots`
- `financial_snapshots`
- `company_events`
- `research_notes`
- `analysis_jobs`
- `analysis_reports`
- `theses`
- `thesis_updates`
- `catalysts`
- `source_citations`

MVP 阶段先使用本地 mock 数据，并支持 Supabase 云端持久化；如果 Supabase 密钥未配置，则自动回退到浏览器 localStorage。只要接口形态稳定，后续可以继续扩展 PostgreSQL 表结构。

### 3.4 缓存与任务

Redis 用于：

- 行情短缓存
- AI 分析任务状态
- 数据源 API 速率限制
- 热门股票和热门板块缓存

MVP 阶段如暂不引入 Redis，可先用内存缓存或静态 mock 数据模拟。

## 4. 数据适配层设计

页面和 AI 编排层统一依赖 `MarketDataProvider`，不直接依赖 qclaw/westock/第三方 API。

建议接口：

```ts
export interface MarketDataProvider {
  searchSymbols(query: string): Promise<SymbolSearchResult[]>;
  getQuote(symbol: string): Promise<QuoteSnapshot>;
  getKline(symbol: string, range: KlineRange): Promise<KlinePoint[]>;
  getFinancials(symbol: string, options?: FinancialQuery): Promise<FinancialSnapshot[]>;
  getCompanyEvents(symbol: string, options?: EventQuery): Promise<CompanyEvent[]>;
  getSectorOverview(sectorId: string): Promise<SectorOverview>;
}
```

Provider 实现顺序：

1. `MockMarketDataProvider`
   - 开发期默认使用。
   - 覆盖 A 股、港股、美股样例股票。
   - 支持 Dashboard、Stock Detail、AI Analyst 的完整演示。

2. `QclawMarketDataProvider`
   - 借鉴 qclaw/westock 的能力。
   - 适合作为本地增强数据源。
   - 不让页面层感知 qclaw 的命令格式。

3. `ExternalMarketDataProvider`
   - 面向线上部署。
   - 可接商业金融 API 或公开 API。
   - 通过环境变量配置密钥。

数据源切换方式：

```text
MARKET_DATA_PROVIDER=mock
MARKET_DATA_PROVIDER=qclaw
MARKET_DATA_PROVIDER=external
```

## 5. AI 投研编排

AI 模块不应只是聊天框，而应是结构化投研工作流。

### 5.1 意图路由

支持以下意图：

- `stock_analysis`：个股分析
- `sector_analysis`：行业/主题分析
- `idea_generation`：选股想法生成
- `earnings_preview`：财报预览
- `earnings_analysis`：财报解读
- `thesis_update`：投资逻辑更新
- `morning_note`：早报/市场综述

### 5.2 个股 fast 分析结构

默认个股分析先走 fast 模式，输出：

1. 当前位置
   - 最新价
   - 近 7 日涨跌
   - 与同行或指数对比

2. 估值水位
   - PE/PB/PS
   - 历史或同行对比
   - 最近一期财务摘要

3. 短期事件
   - 最近公告
   - 财报、回购、分红、监管、行业新闻
   - 事件对投资逻辑的潜在影响

4. 风险提示
   - 数据风险
   - 估值风险
   - 基本面风险
   - 事件风险

固定要求：

- 先给一句话总判断，但不使用“买入/卖出/强烈推荐”等表述。
- 每个关键数字必须来自 provider 或可追溯来源。
- 输出附数据时间戳和免责声明。

### 5.3 分析结果保存

每次 AI 分析保存为 `analysis_report`：

- 用户问题
- 标的或主题
- 意图类型
- 使用的数据快照
- 引用来源
- 生成时间
- 结构化结论
- 风险提示
- 免责声明

用户可以一键保存为研究笔记。

## 6. 开发阶段

### Phase 1: 项目初始化

目标：搭建可运行的全栈项目基础。

任务：

- 初始化 Next.js 项目。
- 配置 TypeScript、Tailwind CSS、ESLint。
- 安装组件库和图表库。
- 建立基础目录：`app/`、`components/`、`lib/`、`server/`、`data/`、`docs/`。
- 创建 mock 数据结构。
- 创建全局布局和主题样式。

验收：

- 本地开发服务器可启动。
- 首页能渲染基础布局。
- TypeScript 和 lint 检查通过。

### Phase 2: 产品骨架

目标：完成网站主体验证，不接真实数据。

任务：

- 实现主布局、侧边导航、顶部搜索。
- 实现 Dashboard。
- 实现 Stock Detail 页面。
- 实现 Watchlist 页面。
- 实现 Research Notes 页面。
- 实现 AI Analyst 页面。
- 使用 mock 数据串起核心交互。

验收：

- 用户可以从 Dashboard 搜索股票并进入详情。
- 用户可以查看自选股。
- 用户可以生成 mock AI 分析。
- 用户可以保存研究笔记。

### Phase 3: 数据与 API

目标：把页面数据从静态 mock 升级为统一 API 调用。

任务：

- 定义 symbol、quote、kline、financial、event、note、analysis 的 TypeScript 类型。
- 实现 `MarketDataProvider` 接口。
- 实现 `MockMarketDataProvider`。
- 创建 API endpoints：
  - `GET /api/symbols/search`
  - `GET /api/stocks/:symbol/quote`
  - `GET /api/stocks/:symbol/kline`
  - `GET /api/stocks/:symbol/financials`
  - `GET /api/stocks/:symbol/events`
  - `GET /api/sectors/:sectorId`
- 页面改为通过 API 获取数据。

验收：

- 替换 provider 不影响页面组件。
- API 返回结构稳定。
- mock 数据下页面功能完整。

### Phase 4: AI 投研编排

目标：实现结构化 AI 分析能力。

任务：

- 创建 `analysis_orchestrator`。
- 实现意图路由。
- 实现个股 fast 分析模板。
- 实现行业分析、选股、财报预览、财报解读、thesis 更新的接口占位。
- 保存每次分析任务和结果。
- 输出中加入来源、时间戳、免责声明。

验收：

- 用户输入股票后可生成结构化 fast 分析。
- 分析结果引用的数据可追溯。
- 分析结果可保存为研究笔记。
- 无买卖指令式表述。

### Phase 5: 核心 MVP 完成

目标：打通真实可用的最小投研闭环。

任务：

- Dashboard 展示市场概览、自选股异动、今日事件。
- Stock Detail 展示行情、估值、财务、事件时间线、AI 总结。
- Watchlist 支持添加、删除、分组。
- Research Notes 支持保存 AI 分析和人工笔记。
- AI Analyst 支持输入股票或主题并生成结构化分析。
- 增加基础空状态、错误状态、加载状态。

验收：

- 从搜索股票到生成分析再保存笔记的流程可完整演示。
- 桌面端和移动端布局可用。
- mock 数据下没有明显 UI 溢出或遮挡。

### Phase 6: 增强功能

目标：从 MVP 升级为更完整的投资研究工作台。

任务：

- 行业/主题研究页。
- 选股想法生成器。
- 财报中心。
- 催化日历。
- 投资逻辑追踪器。
- Markdown/PDF 报告导出。

建议优先级：

1. 投资逻辑追踪器
2. 催化日历
3. 财报中心
4. 行业/主题研究
5. 选股想法生成器
6. 报告导出

### Phase 7: 测试、部署与验收

目标：确保 MVP 稳定可演示，并能进入后续迭代。

任务：

- 单元测试：
  - 数据适配层
  - AI 输出结构
  - 格式化工具
  - 风控文案检查

- 集成测试：
  - 搜索股票 -> 打开详情 -> 生成分析 -> 保存笔记
  - 添加自选股 -> Dashboard 展示异动
  - 事件时间线 -> AI 分析引用事件

- UI 验收：
  - 桌面端
  - 移动端
  - 图表可读
  - 表格不横向溢出
  - 长股票名和长事件标题不遮挡

- 风控验收：
  - 无“买入”“卖出”“满仓”“清仓”等指令式建议
  - 所有分析带来源和时间戳
  - 所有分析带免责声明

- 部署：
  - MVP 阶段优先部署到 Vercel。
  - Vercel 区域优先选择香港节点，以改善中国大陆访问体验。
  - 当前默认使用 mock provider，暂不需要数据库、缓存和 AI API key。
  - 接入真实数据后，再配置 provider 类型、数据库连接、AI API key 和缓存服务。
  - 如果后续需要稳定大陆访问、本地金融数据脚本、备案域名或更强后端控制，再迁移到腾讯云。

## 7. 迭代路线

### Milestone 1: 可运行原型

交付：

- Next.js 项目
- Dashboard
- Stock Detail
- Watchlist
- mock 数据

目标：

- 证明产品形态成立。

### Milestone 2: MVP 投研闭环

交付：

- AI Analyst
- Research Notes
- 个股 fast 分析
- 分析结果保存

目标：

- 用户可以完成一次真实的研究动作。

### Milestone 3: 数据源接入

交付：

- qclaw/westock provider 或第三方 API provider
- 数据源错误兜底
- 缓存策略

目标：

- 从 mock 演示升级为真实数据驱动。

### Milestone 4: 逻辑追踪和催化提醒

交付：

- Thesis Tracker
- Catalyst Calendar
- 事件影响标注

目标：

- 形成持续使用价值，而不是一次性问答工具。

### Milestone 5: 专业报告输出

交付：

- Markdown 导出
- PDF 导出
- 早报
- 财报预览
- 财报解读

目标：

- 让用户可以沉淀、分享和复盘研究成果。

## 8. 风险与边界

### 8.1 投资合规边界

必须避免：

- 直接建议买入或卖出。
- 承诺收益。
- 预测短期点位。
- 使用未公开市场敏感信息。
- 把 AI 结论包装成确定性判断。

推荐表述：

- “当前需要重点观察的变量是...”
- “这会增强/削弱某条投资逻辑...”
- “从已取得的数据看，风险主要在...”
- “该结论依赖以下数据来源和时间点...”

### 8.2 数据风险

需要处理：

- 行情延迟
- 数据源不可用
- 不同市场货币单位不同
- 同名公司或多地上市主体混淆
- 财报口径不同
- 历史数据缺失

实现要求：

- 标的必须有市场和代码。
- 港股、美股、A 股货币单位不可混用。
- 所有数据展示标注时间戳。
- 数据缺失时明确显示“暂无数据”，不得编造。

### 8.3 AI 输出风险

需要处理：

- 幻觉数据
- 过度自信
- 结论无来源
- 用户把辅助分析当成投资建议

实现要求：

- AI 只能基于 provider 返回的数据和已引用来源生成分析。
- 关键数字不得由模型自由生成。
- 输出固定包含免责声明。
- 保存用于生成分析的数据快照，便于追溯。

## 9. 验收清单

文档验收：

- [ ] `DEVELOPMENT_PLAN.md` 存在。
- [ ] 包含 MVP、架构、阶段、数据策略、AI 工作流、测试计划。
- [ ] 明确默认选择：全栈产品路线、数据适配层优先。

MVP 验收：

- [ ] 本地可启动网站。
- [ ] mock 数据下核心页面可完整演示。
- [ ] 用户可以搜索股票并进入详情页。
- [ ] 用户可以生成 AI 分析。
- [ ] 用户可以保存研究笔记。
- [ ] 真实数据源可通过 provider 替换，不影响页面层。

质量验收：

- [ ] TypeScript 检查通过。
- [ ] 核心单元测试通过。
- [ ] 核心集成流程通过。
- [ ] 桌面端和移动端 UI 可用。
- [ ] AI 输出无投资指令式表述。
- [ ] AI 输出包含来源、时间戳和免责声明。

## 10. 默认假设

- 默认目标是构建可持续迭代的网站产品，而不是一次性的聊天机器人。
- 默认优先开发 MVP，可先使用 mock 数据。
- 默认不直接依赖 qclaw 私有运行环境，而是借鉴其投研工作流并抽象成网站能力。
- 默认文档文件名为 `DEVELOPMENT_PLAN.md`。
- 默认先做单用户本地/私有化使用体验，后续再补多用户权限、订阅和协作。

---

本工具仅用于信息整理、研究辅助和学习交流，不构成投资建议。投资有风险，决策需谨慎。
