# Persistent Memory for Coding Agents

## Claim

AI coding agents（Claude Code、Cursor、Windsurf、本地模型）在 context window 關閉後會丟失專案決策與領域知識；近 30 天 HN 高相關討論集中在 **Git 原生／MCP 記憶層**，而不是又一次編輯器評測。

## Evidence

- [OKF Agent Memory](https://github.com/okf-memory/okf-agent-memory)（HN ~78 points / 31 comments，2026-09-05）：Markdown + YAML frontmatter 活在 repo `knowledge/`，BM25 檢索、stdio MCP、progressive disclosure，對準 CLAUDE.md／AGENTS.md 膨脹與向量庫成本兩極。
- 同窗還有 [OpenContext](https://www.opencntx.dev/)、[Rune](https://github.com/thecolourfoundation/rune)（「agents forget the codebase between sessions」）、[Heimdall](https://github.com/ArihantDeva/heimdall) 等 Show HN／repo。

## Implications

- 「給代理更好的模型」無法單獨解決跨 session 失憶；需要 **可審計、可 diff 的外部記憶契約**。
- MCP 正在成為記憶／工具的預設接線方式。

## Actions

1. 為核心專案選一種記憶策略：輕量（結構化 AGENTS.md + 分檔）或 OKF／MCP memory server。
2. 規定哪些事實必須 `verified: human`，禁止代理 silently overwrite。
3. 用一次真實任務量測：有無記憶層時的重講成本（分鐘／token）。

## Links

- Topic: [INDEX](../INDEX.md)
- Related: [[05-complementary-stacks]]
