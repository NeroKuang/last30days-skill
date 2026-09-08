# AI Coding Agents

## 持久記憶
- 痛點：Session 一關就失憶
- OKF Agent Memory
- OpenContext MCP
- Rune / Heimdall
- 行動：選 Git／MCP 記憶策略

## 安全沙箱
- 痛點：不可信 repo + 代理會跑指令
- Grith（syscall 監督）
- GitSpawn（git-hijack）
- 行動：盤點權限、隔離外部 repo

## 採用與反彈
- 痛點：全面 agentic vs slop／gloop
- 職場政策驅動導入
- r/gamedev 架構崩壞聲量
- 行動：允許清單 + 試點回滾

## 本地 Harness
- 痛點：自架要比殼層不是只比模型
- Pi / OpenCode / Qwen Agent
- Claude Code 當對照 harness
- 行動：兩殼層 bake-off

## 互補 Stack
- 痛點：不該單挑一個贏家
- Cursor（IDE 日常）
- Claude Code（終端委派）
- Skills + Function Hooks
- 行動：畫預設路由（小改／重構／補全）
