# Last30Days Knowledge Base

本機研究沉澱庫。每次 `/last30days`（或 Zeabur Research API）綜合後，應寫入可複用知識體，而不是只留在聊天紀錄。

## 布局

```text
knowledge/
  README.md                 # 本說明
  catalog.json              # Web 瀏覽器索引（機器可讀）
  topics/
    <slug>/
      INDEX.md              # 主題入口
      mindmap.md            # Mermaid 心智圖
      meta.json             # 主題 metadata + 圖節點
      notes/                # 原子知識體（一概念一檔）
      sources.md            # 可追溯引用（僅真實 URL）
```

## 寫入規則

1. **原子性**：一則 note = 一個可獨立引用的概念／模式／決策。
2. **可行動**：每則 note 結尾要有 `## Actions`（下一步可做的事）。
3. **可追溯**：主張需連到 `sources.md` 或 note 內真實 URL；禁止捏造 citation。
4. **雙輸出**：主題必有 `mindmap.md`（Mermaid）+ 同步進 Cursor Canvas／Web 瀏覽器。
5. **同步**：改完本目錄後執行 repo 內 `knowledge-browser/sync.sh`，再 commit／redeploy 才會上線到 Zeabur Web。

## Web 即時瀏覽

- 本機預覽：`knowledge-browser` 靜態檔，或 Research API mount 的 `/knowledge/`
- 生產：Zeabur Research API 同網域 `/knowledge/`（見 repo `docs/KNOWLEDGE-BROWSER.md`）
