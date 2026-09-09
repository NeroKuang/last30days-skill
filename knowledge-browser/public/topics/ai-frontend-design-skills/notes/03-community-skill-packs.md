# 社群 Skill 包

## Claim

除官方外，可裝模組化 UX／UI skill 包；也有人做成 registry 避免單一巨型 frontend skill 吃爆 token。

## Evidence
- [hueyexe/frontend-agent-skills](https://github.com/hueyexe/frontend-agent-skills) - ui-visual-composition、accessibility、design-systems 等
- [nodfe/web-design-skill](https://github.com/nodfe/web-design-skill) - 受 Claude Design 啟發的可攜 SKILL.md
- [I got tired of AI frontend skills being huge instruction dumps](https://www.reddit.com/r/ClaudeAI/comments/1w1mofb/i_got_tired_of_ai_frontend_skills_being_huge/) - registry 取向

## Implications
- 按任務載入子 skill，比一份 30–50k token 全能 frontend 指令更務實。
- Cursor 可用 `npx skills add <repo> --skill <name>` 類流程（以該 repo README 為準）。

## Actions
1. 先官方 `frontend-design`，再視需要加 `ui-visual-composition` 或 `web-design-skill`。
2. 避免同時啟用互相衝突的巨型 design skill。
