# Complementary Agent Stacks

## Claim

實務共識偏向 **組 stack**，不是單挑贏家：IDE 內聯／diff（Cursor 系）+ 終端高自主代理（Claude Code／Codex）+ 可選 autocomplete（Copilot）；skills／hooks 成為第二層擴充面。

## Evidence

- Web 補充與論壇常見「Cursor Ultra + Claude Max／Code」並用敘事；AxoForum 實測語：「The tools are complementary, not competing。」
- HN：[mattpocock/skills](https://github.com/mattpocock/skills)（~43 points）— 「AI Coding Agent Skills for Real Engineers」。
- GitHub：[anthropics/claude-code#91870 Function Hooks](https://github.com/anthropics/claude-code/issues/91870)（136 comments / 121 reactions）— 插件／hooks 深度改行為且強調可組合安全。
- 產品定位補充（非 API 主證據）：Cursor／Windsurf 偏編輯器代理；Claude Code／Codex 偏委派整段任務。

## Implications

- 採購與訂閱決策應按 **工作模式切分**（日常編輯 vs 長任務委派），避免用單一 SWE-bench 分數決定一切。
- 可組合 skills／hooks 會拉開「同一模型、不同 harness」的生產力差距。

## Actions

1. 畫自己的預設路由：小改 → IDE agent；跨檔重構／調查 → terminal agent；打字補全 → autocomplete。
2. 為 Claude Code／Cursor 各留 1–2 個高價值 skill（對齊本專案慣例）。
3. 訂閱前先量測一週：哪個工具實際吃掉最多「可合併產出」時間。

## Links

- Topic: [INDEX](../INDEX.md)
- Related: [[01-persistent-memory]] · [[03-adoption-backlash]] · [[04-harness-local]]
