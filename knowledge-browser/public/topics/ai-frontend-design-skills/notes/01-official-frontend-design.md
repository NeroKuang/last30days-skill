# 官方 frontend-design Skill／Plugin

## Claim

Anthropic 官方 `frontend-design`（plugin 或 skill）是目前最對準「AI 前端別出 AI slop」的第一安裝項。

## Evidence
- [Improving frontend design through Skills](https://claude.com/blog/improving-frontend-design-through-skills)
- [plugins/frontend-design README](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/README.md)

## Implications
- Cursor／Claude Code 類宿主：優先裝官方 skill，再疊專案 DESIGN.md。
- Skill 是 on-demand 上下文，不是永久塞滿 system prompt。

## Actions
1. Claude Code：`/plugin install frontend-design@claude-plugins-official`（或以 `npx skills add` 拉官方 skill）。
2. Cursor：把同等 `SKILL.md` 放進專案／agents skills，前端任務時顯式引用。
3. 搭配 Anthropic frontend aesthetics cookbook 的「維度引導／反預設」提示法。
