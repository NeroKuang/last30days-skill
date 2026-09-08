# Adoption vs Backlash

## Claim

近 30 天社群同時出現「職場全面擁抱 agentic coding」與「產出變成不可維護 slop」的高互動串；採用與反彈是同一現象的兩面，不是互斥陣營。

## Evidence

- [r/gamedev — I dont even understand how people use AI to code](https://www.reddit.com/r/gamedev/comments/1vsgym6/i_dont_even_understand_how_people_use_ai_to_code/)（643 score / 763 comments）：OP：「It just messes up my games code base… the architecture is complete gloop。」
- [r/BetterOffline — company will fully embrace slop agentic coding](https://www.reddit.com/r/BetterOffline/comments/1vtb1ai/my_company_will_now_fully_embrace_slop_agentic/)（230 / 195）：政策驅動採用引發離職考量。
- [AI coding in 2026](https://www.reddit.com/r/BetterOffline/comments/1vps9au/ai_coding_in_2026/)（216 / 514）：「真有人在用」與「被誇大」拉扯。
- [r/antiai hot take](https://www.reddit.com/r/antiai/comments/1vx4hg0/hot_take_you_arent_a_good_enough_programmer_or/)：把失敗歸因於人的程式／prompt 能力不足。
- 旁證：[1f916.ai agents-only forum](https://www.reddit.com/r/ClaudeAI/comments/1vjphbl/update_1f916ai_the_agentsonly_forum_has_480_posts/)、[Claude agent 除錯梗](https://www.reddit.com/r/technology/comments/1w7v8zp/artificial_gooner_intelligence_claude_ai_coding/) 顯示文化注意力仍高。

## Implications

- 團隊若只推「多用 agent」而不設 **diff 審查／架構門檻／禁止無測合併**，會同時提高產出與技術債。
- 對外溝通應誠實：工具有效，但對大型架構與遊戲邏輯等領域失敗聲量大。

## Actions

1. 寫一頁「代理允許做／必須人審」清單（允許：測例、樣板；禁止：無 diff 合併核心模組）。
2. 用一次真實 PR 量測：代理草稿 vs 人改到可合併的時間比。
3. 對「全面 agentic」政策，先做 2 週試點 + 回滾條件，再全公司。

## Links

- Topic: [INDEX](../INDEX.md)
- Related: [[05-complementary-stacks]] · [[02-security-sandbox]]
