# Stock Market Expert

股票投资辅助工具 MVP。当前版本优先选择 Vercel 上线，使用 mock 数据跑通 Dashboard、个股研究页、自选股、研究笔记和 AI 快速分析闭环。功能成熟后，再评估是否迁移到腾讯云轻量应用服务器以获得更好的中国大陆访问体验和本地数据脚本运行能力。

## 功能

- Dashboard：市场指数、热门板块、自选股异动、今日事件、最近笔记
- 个股详情：行情、估值、K 线、财务摘要、事件时间线、AI 快速分析
- 自选股：mock 分组和行情列表
- 自选股：mock 分组、行情列表、浏览器本地加入/删除
- 研究笔记：mock 笔记列表、AI 分析本地保存
- AI Analyst：结构化 fast 分析，包含当前位置、估值水位、短期事件和风险提示
- API Routes：搜索、行情、K 线、财务、事件、分析报告

## 本地开发

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。

## Vercel 上线

1. 将项目推送到 GitHub。
2. 在 Vercel 新建项目并导入仓库。
3. Framework Preset 选择 `Next.js`。
4. 暂时无需配置环境变量，默认使用 mock 数据。
5. 部署后访问 Vercel 分配的域名。

当前 `vercel.json` 指定 `hkg1` 区域，通常对中国大陆访问更友好一些，但仍不等同于大陆服务器。等产品功能和用户需求稳定后，再决定是否迁移到腾讯云。

## 当前持久化策略

MVP 现在支持 Supabase 云端持久化，并保留浏览器 `localStorage` 兜底。未配置 Supabase service role key 时，用户加入的自选股和 AI 分析笔记会继续保存到当前浏览器。

Supabase 项目：

```text
NEXT_PUBLIC_SUPABASE_URL=https://uogxhykrxgcnlxqcjnhg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<Supabase project service_role key>
DEFAULT_USER_ID=demo-user
```

初始化数据库时，在 Supabase SQL Editor 执行 `supabase/schema.sql`。当前 MVP 使用固定 `DEFAULT_USER_ID`，下一阶段接入 Supabase Auth 后再切换为真实用户 ID 和 RLS 策略。

## 后续数据源

数据层通过 `MarketDataProvider` 抽象，当前默认实现是 `MockMarketDataProvider`。后续可以新增：

- `QclawMarketDataProvider`
- `WestockMarketDataProvider`
- `ExternalMarketDataProvider`

页面层和 AI 编排层不应直接依赖具体数据源。

## 风险声明

本工具仅用于信息整理、研究辅助和学习交流，不构成投资建议。投资有风险，决策需谨慎。
