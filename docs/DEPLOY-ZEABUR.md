# Zeabur 部署（Last30Days Research API）

Git-backed only. **禁止** `zeabur deploy`（會上傳本機目錄、可能忽略 Dockerfile）。見 SP [`docs/deployment/ZEABUR-OPS-RULES.md`](../docs/deployment/ZEABUR-OPS-RULES.md)。

## Repo

- Fork: https://github.com/NeroKuang/last30days-skill
- Upstream: https://github.com/mvanhorn/last30days-skill
- Build: 根目錄 **`Dockerfile`**（等同 `Dockerfile.server`）
- Listen: **5002**（SP 500x 規範）

## 建立服務

1. Zeabur Project（建議掛既有 NeroSP／個人 Project）→ **Add Service** → **Git** → `NeroKuang/last30days-skill`
2. Root Directory: `/`（預設）
3. 建置選 **Dockerfile**（根目錄 `Dockerfile`）
4. 公開 HTTP port：**5002**（若 UI 可設；否則確認 Dockerfile `EXPOSE 5002` + CMD）
5. Variables（勿設 `NODE_ENV`；**勿**把 `LAST30DAYS_API_KEY` 當本服務 auth）：

```env
RESEARCH_API_KEY=<openssl rand -hex 32>
RESEARCH_TIMEOUT_SECONDS=600
RESEARCH_MAX_CONCURRENCY=2
RESEARCH_PORT=5002
LAST30DAYS_MEMORY_DIR=/tmp/last30days-memory
```

可選（upstream provider，依 capabilities 需要再加）：

```env
SCRAPECREATORS_API_KEY=
# XAI_API_KEY=
# GITHUB_TOKEN=
```

6. 綁公開網域（Dashboard）→ 記下 `${ZEABUR_WEB_URL}`
7. 用 **git push** / Dashboard **Redeploy** / `zeabur service redeploy` 重建；不要用 `zeabur deploy`

## 驗收

```bash
curl -fsS "$ZEABUR_WEB_URL/health"
# → {"status":"ok","service":"last30days-research-api"}

curl -fsS -H "Authorization: Bearer $RESEARCH_API_KEY" \
  "$ZEABUR_WEB_URL/v1/capabilities"

curl -fsS -H "Authorization: Bearer $RESEARCH_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"topic":"AI coding agents","days":7,"depth":"quick"}' \
  "$ZEABUR_WEB_URL/v1/research"
```

`RUNNING` 不算過；要以 HTTP 回應為準。Research 可能數分鐘，平台／proxy timeout 請拉高。

## CLI 備註

```bash
zeabur auth login
zeabur project list
# 建立 Git service 後設 variable → redeploy
zeabur variable create --help
zeabur service redeploy --help
```
