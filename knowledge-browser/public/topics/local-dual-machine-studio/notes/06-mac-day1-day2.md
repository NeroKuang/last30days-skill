# Mac Day 1–2 詳細步驟

## Claim

Mac Phase 0 可執行路徑：先 LM Studio（MLX + Server 1234），再 Otaku 接本機；Draw Things 已安裝，只補模型與測圖。

## Evidence
- 2026-09-09 本機盤點：有 Draw Things；無 LM Studio／Otaku。
- 定案：不依賴 Cursor；角色先 Otaku。

## Implications
- Day 1 不過關（Server 沒起來）就不要裝 Otaku 除錯。
- 第一週不做 ST／OpenClaw／PC。

---

## Day 1｜LM Studio

### 安裝
1. 開 https://lmstudio.ai/ → 下載 **macOS Apple Silicon**。
2. 拖進「應用程式」→ 開啟（若被擋：系統設定 → 隱私權與安全性 → 仍要打開）。

### 下載角色主腦（模型 A）
1. 左側 **Discover**。
2. 關鍵字優先（有哪個下哪個，**優先 MLX**）：
   - `Qwen MLX uncensored` 或 `abliterated MLX`
   - 備援：`Qwen instruct MLX`
3. 建議起步：**32B～35B 級 4-bit MLX**（128GB 可再加大，先求穩）。
4. **Load** 進記憶體。

### 開 Local Server
1. 進 **Developer／Server**。
2. **Start Server**。
3. Port **1234**；綁定 **localhost**（不要對外）。
4. 驗證：

```bash
curl -s http://127.0.0.1:1234/v1/models
```

有 JSON 模型列表 = 過關。

### Day 1 過關標準
- [ ] LM Studio 內可對話
- [ ] `:1234` `/v1/models` 有回應

---

## Day 2｜Otaku

### 安裝

```bash
curl -LsSf https://otaku.sh/install.sh | sh
otaku web
```

瀏覽器開提示網址（常見 `http://localhost:9600`）。

### 接 LM Studio
1. 選 provider：**LM Studio** 或 **Generic OpenAI**。
2. Base URL：`http://127.0.0.1:1234/v1`
3. API Key：填 `lmstudio`（本機多半不驗）。
4. 選已 Load 的模型。

### 建第一個角色
1. 名字、性格、外貌關鍵詞（髮色／服裝／寫實或二次元）。
2. 完成一場本機對話。

### Day 2 過關標準
- [ ] Otaku 經本機模完成一場角色對話

---

## 同日｜Draw Things（已安裝）

1. 開啟 Draw Things。
2. 下載：**寫實**（Flux 或 SDXL 寫實）+ **二次元**（SDXL anime／Pony）。
3. 用角色外貌關鍵詞各出 1 張。

- [ ] 寫實測圖 ×1
- [ ] 二次元測圖 ×1

---

## 今天不要做
- SillyTavern、OpenClaw
- PC／ComfyUI
- 一次下三顆 70B

## 卡住時回報
1. LM Studio 看到的模型名  
2. `curl http://127.0.0.1:1234/v1/models` 結果  
3. Otaku provider 選項列表  

## Actions
1. 依序勾選上方 checkbox。  
2. 全過後進入「先 PC」或 `notes/03-pc-install.md`。  
3. 進度變更時更新 `00-decision-log.md` 本機盤點段。
