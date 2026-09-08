# Knowledge Browser（Zeabur Web 即時瀏覽）

把 `/last30days` 研究沉澱成可複用知識體後，用同一套 Research API 服務掛載 **公開靜態瀏覽器**，讓你用一般瀏覽器鑽取心智圖與原子筆記。

**給 ChatGPT 維護的完整契約**：[`GPT-KNOWLEDGE-SPEC.md`](./GPT-KNOWLEDGE-SPEC.md)（可整份貼進 Custom GPT Instructions）。

## 路徑分工

| 層 | 位置 | 角色 |
|----|------|------|
| Source of truth | `~/Documents/Last30Days/knowledge/` | 本機寫入、可改、不進聊天 |
| Deploy payload | `knowledge-browser/public/` | sync 後進 git，隨 Dockerfile COPY |
| Runtime URL | `https://last30days-research.zeabur.app/knowledge/` | 即時 Web 瀏覽（無需 Bearer） |

API 研究端點（`/v1/*`）仍要 `RESEARCH_API_KEY`；知識瀏覽器是 **read-only 公開靜態**（勿放 secrets）。

## 本機流程

```bash
# 1) 寫／改知識體於 Documents
# 2) 同步進 repo
./knowledge-browser/sync.sh

# 3) 本機預覽（任選）
#    a) 靜態：python3 -m http.server 5003 -d knowledge-browser/public
#    b) 與 API 同掛載：uvicorn server.app:app --port 5002
#       → http://127.0.0.1:5002/knowledge/
```

## Zeabur 上線

1. `./knowledge-browser/sync.sh`
2. Commit `knowledge-browser/public` + `server/app.py`（mount）
3. `git push origin main`（或你的部署分支）
4. Dashboard **Redeploy** 或 `zeabur service redeploy`（**禁止** `zeabur deploy`）
5. 打開：`https://last30days-research.zeabur.app/knowledge/`

## 寫入約定（之後每次研究）

1. 在 `topics/<slug>/` 建 INDEX、mindmap.md、meta.json、notes/、sources.md
2. 更新根 `catalog.json`
3. 跑 `sync.sh` → commit → redeploy
4. （可選）更新 Cursor canvas：`~/.cursor/projects/.../canvases/`

## 驗收

- [ ] `GET /knowledge/` 回 HTML
- [ ] `GET /knowledge/catalog.json` 列出主題
- [ ] 點主題可見心智圖與筆記正文
- [ ] `/health` 與 `/v1/research` 行為不變
