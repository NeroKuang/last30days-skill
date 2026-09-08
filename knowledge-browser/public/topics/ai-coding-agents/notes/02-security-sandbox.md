# Security and Sandbox for Coding Agents

## Claim

當代理能讀 repo、跑 shell、改檔時，**不可信倉庫與工具執行路徑**變成一等安全問題；近 30 天出現明確的 hijack 敘事與 syscall 級監督產品。

## Evidence

- [GitSpawn / AI coding agents git-hijack](https://www.manifold.security/blog/ai-coding-agents-git-hijack)（HN）：不可信 repo 可藉代理執行碼。
- [Grith is live](https://grith.ai/blog/grith-is-live)／[grith-ai/grith](https://github.com/grith-ai/grith)：面向 Linux 的代理 security proxy／syscall-level supervision。

## Implications

- 「對內部 monorepo 開 agent」與「對任意 clone／PR 開 agent」的信任模型必須分開。
- 安全產品會往 **代理 runtime 旁路**（proxy、seccomp、allowlist）長，而不只是 prompt 警告。

## Actions

1. 盤點代理預設權限：網路、寫入路徑、可否跑任意 shell。
2. 外部／未審 repo 一律隔離 worktree + 只讀或沙箱 profile。
3. 若跑 Linux CI／遠端 agent，評估 Grith 類 syscall 監督是否值得 POC。

## Links

- Topic: [INDEX](../INDEX.md)
- Related: [[03-adoption-backlash]]
