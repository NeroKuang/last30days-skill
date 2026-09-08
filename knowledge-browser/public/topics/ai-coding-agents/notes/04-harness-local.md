# Local LLM Harness Landscape

## Claim

自架／本地編碼場景裡，社群比的是 **harness（代理殼層）** 多於單一模型名：Pi、OpenCode、Qwen Agent、Claude Code 等並列投票與討論。

## Evidence

- [r/LocalLLM — Best harness for coding with local LLM](https://www.reddit.com/r/LocalLLM/comments/1vrsi3r/best_harness_for_coding_with_local_llm_pi/)（87 / 134）：明確以 harness 為投票單位。
- [r/LocalLLaMA — best local AI harness](https://www.reddit.com/r/LocalLLaMA/comments/1vukppf/whats_the_best_local_ai_harness_for_coding/)（54 / 127）。
- [CMP 170HX → 長上下文 coding server](https://www.reddit.com/r/LocalLLM/comments/1vw09b1/i_unlocked_a_800_mining_gpu_into_a_64gb/)（225 / 88）：硬體／context 長度仍是本地路線的硬約束敘事。

## Implications

- 選本地方案時先鎖 harness 工作流（工具呼叫、repo 編輯、MCP），再選模型。
- Claude Code 在本地討論裡常被當成可對照的「高自主 harness」，即使模型來源不同。

## Actions

1. 若走本地：列 2 個 harness 做同一任務 bake-off（修一個真 bug + 跑測）。
2. 記錄失敗模式：工具呼叫錯誤、context 截斷、拒絕寫檔。
3. 成本敏感團隊：把「雲端 agent 時數」與「本地 GPU 折舊」放同一張表。

## Links

- Topic: [INDEX](../INDEX.md)
- Related: [[01-persistent-memory]] · [[05-complementary-stacks]]
