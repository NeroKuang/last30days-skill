# 專案 DESIGN.md／Wireframe→UI kit 方法

## Claim

社群高票路徑：先 wireframe，再與模型共作 UI kit，把具體 guidelines 寫進 MD，之後每次迭代強制遵循 - 比單句「不要 generic」有效。

## Evidence
- [I was wrong about Claude’s UI skills](https://www.reddit.com/r/ClaudeAI/comments/1w3jydv/i_was_wrong_about_claudes_ui_skills/)（293pts）
- [Is there any way to stop AI coding agents from producing frontend AI slop?](https://www.reddit.com/r/ClaudeAI/comments/1w90wze/is_there_any_way_to_stop_ai_coding_agents_from/) - 僅靠詳細 prompt／vercel skills 仍常失敗

## Implications
- DESIGN.md／UI guidelines 是跨 Cursor／Claude／Lovable／v0 可共用的「專案技能」。
- 規則要具體（無邊框、柔和陰影、留白、動畫曲線等），不是抽象形容詞。

## Actions
1. 專案根目錄建 `DESIGN.md`（色票、字級、間距、禁區、動效原則）。
2. 流程：wireframe → UI kit／tokens → 再實作頁面，且每次提醒 follow DESIGN.md。
3. 不要只靠「don't make it look generic」。
