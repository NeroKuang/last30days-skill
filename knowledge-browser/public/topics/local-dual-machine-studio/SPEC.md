# SPEC：雙機本機創作堂（權威定案）

> 版本：2026-09-09b · 擁有者：Nero  
> 變更規則：換軟體／模型級別前，先對照本檔「硬體上限」；衝突時以硬體上限為準。  
> 決策脈絡：`notes/00-decision-log.md` · Mac 逐步：`notes/06-mac-day1-day2.md`  
> 進度：Draw Things 已裝；LM Studio／Otaku／PC ComfyUI 尚未（使用者選先 Mac）。

---

## 0. 硬體與鎖定偏好

### 0.1 Mac

- 機種：MacBook Pro 16"
- 晶片：Apple M5 Max
- 記憶體：128 GB 統一記憶體

### 0.2 PC

- CPU：AMD 9970X3D
- GPU：NVIDIA RTX 5080 **12 GB VRAM**
- 系統 RAM：64 GB

### 0.3 產品偏好（不可在建議中擅自改掉）

| 項目 | 定案 |
|---|---|
| IDE／雲端 Agent | **不依賴 Cursor** |
| 角色前端 | **Otaku 先** → 必要再 **SillyTavern** |
| 圖風 | **寫實 + 二次元**（兩條 checkpoint，不通吃） |
| 短影片 | Phase 2 以後；主戰場在 PC |
| 決策原則 | 使用者不確定時，**照本 SPEC 預設** |

---

## 1. 分工（誰做什麼）

| 工作 | Mac | PC |
|---|---|---|
| 大模型角色／無審查長聊 | **主** | 備援小模 only |
| 角色前端 Otaku／ST | **主** | 可不安裝 |
| 寫實／二次元出圖 | Draw Things **備援／外出** | **ComfyUI 主** |
| 短影片 | 實驗備援 | **ComfyUI 主** |
| OpenClaw 等工具 Agent | 可選（非第一週） | 可選（非第一週） |

**理由：** 128GB 統一記憶體適合大 LLM；5080 僅 12GB VRAM，CUDA 出圖／短片強，不適合當 70B 級主腦。

---

## 2. 模型／VRAM／記憶體邊界（硬限制）

### 2.1 Mac（128GB）

| 允許 | 避免 |
|---|---|
| 角色／uncensored 主腦約 32B–72B（MLX，4–5 bit 起） | 第一週同時常駐三顆大模 |
| 常駐主腦 + 小工人 7B–14B | 把 Mac 當短片主機搶優先權 |
| Draw Things 與 LLM 並存（卡頓則卸載小模） | 對外綁定 `0.0.0.0` 無防火牆 |

### 2.2 PC（12GB VRAM · 64GB RAM）

| 允許 | 避免／改配方 |
|---|---|
| SDXL 寫實／二次元舒適 | Flux **全精度**硬上（改 NF4／GGUF／降解析） |
| Flux 量化 + 較小邊長（如 768–1024 視體感） | 把 70B LLM 當日常主腦 |
| 短影片數秒級、偏低解析先求穩 | 長片／高解析不降設定硬推 |
| 備援 LLM：7B–14B（或 32B Q4 視體感） | 與重影片工作流同時塞滿 VRAM 無卸載策略 |
| 系統 RAM 64GB：夠 OS + 載入；**瓶頸是 VRAM** | 以為 64GB RAM = 可忽略 12GB VRAM |

### 2.3 並存策略

- 純角色長聊：Mac 主腦常駐即可。
- 角色 + 出圖：Mac LLM + PC ComfyUI（網路）為首選；單 Mac 則 LLM + Draw Things。
- 出短影片：PC 卸載多餘 LLM／大圖模，專心 video 工作流。

---

## 3. Mac 最小安裝清單

| 順序 | 軟體 | 用途 | 第一週？ |
|---|---|---|---|
| 1 | [LM Studio](https://lmstudio.ai/) | MLX 推理 · `http://127.0.0.1:1234/v1` | 必 |
| 2 | [Otaku](https://otaku.sh/) | 角色前端 | 必 |
| 3 | [Draw Things](https://drawthings.ai/)（App Store） | 外出／單機出圖 | 建議 |
| 4 | SillyTavern | 角色卡生態 | 否（Phase 1.5） |
| 5 | OpenClaw | 工具型 Agent | 否（可選） |

### 3.1 Mac 模型目錄

| ID | 角色 | 搜尋方向（名稱會變，以 LM Studio／HF 為準） |
|---|---|---|
| A | 角色／無審查主腦 | Qwen 系 instruct **abliterated／uncensored**，優先 **MLX**，32B–72B |
| C | 小工人 | 7B–14B MLX，摘要／省電 |
| （圖） | 寫實 | Draw Things：Flux 或 SDXL 寫實（如 Juggernaut 類） |
| （圖） | 二次元 | Draw Things：SDXL anime／Pony 系 |

### 3.2 Mac Day 步驟（可執行）

1. 安裝 LM Studio → Discover 搜 MLX → 下載 A → Load → Developer → Start Server（port **1234**，綁 **localhost**）。
2. 安裝 Otaku（官網 install 指令）→ 選 LM Studio／OpenAI-compatible → base `http://127.0.0.1:1234/v1` → 建一張角色卡 → 完成一場對話。
3. （建議）App Store 裝 Draw Things → 各下一顆寫實、一顆二次元 → 各出一張測試圖。

---

## 4. PC 最小安裝清單

| 順序 | 軟體 | 用途 | 第一週？ |
|---|---|---|---|
| 1 | 最新 NVIDIA Driver（5080 對應） | CUDA | 必 |
| 2 | [ComfyUI](https://github.com/comfyanonymous/ComfyUI)（官方／整合包擇一） | 出圖／短片 | 必 |
| 3 | ComfyUI Manager | 裝節點／工作流 | 必 |
| 4 | Ollama 或 LM Studio（Windows） | 僅備援小模 | 可選 |
| 5 | （之後）短影片工作流節點 | Phase 2 | 否 |

### 4.1 PC 模型目錄

| ID | 角色 | 注意 |
|---|---|---|
| R | 寫實 checkpoint | SDXL 寫實 或 Flux **量化** |
| A2 | 二次元 checkpoint | SDXL anime／Pony + 之後角色 LoRA |
| V | 短影片（Phase 2） | 選標註低 VRAM／Mac-or-12GB 友善的工作流；先數秒 |

### 4.2 PC Day 步驟（可執行）

1. 更新 GPU 驅動 → 確認工作管理員／nvidia-smi 可見 5080 · 12GB。
2. 安裝 ComfyUI → 啟動預設 UI（常見 `http://127.0.0.1:8188`）。
3. 放入 R、A2 → 各跑一張預設工作流；OOM 則降解析或換量化。
4. 啟用區網存取（僅 LAN）：監聽 `0.0.0.0:8188` **且** 防火牆只允許內網區段；測從 Mac 瀏覽器開啟。

---

## 5. 雙機連線

```text
[Mac] Otaku /（之後）ST  ←→  LM Studio :1234
                │
                │  同一 LAN（有線優先）
                ▼
[PC]  ComfyUI :8188  （寫實／二次元／之後短片）
```

| 規則 | 作法 |
|---|---|
| 拓樸 | 腦 Mac、畫筆 PC |
| Port | Mac LLM **1234**；PC Comfy **8188** |
| 綁定 | LLM 建議僅 localhost；Comfy 僅對 LAN IP 開放 |
| 公網 | **禁止** 無 VPN／無認證裸露 |
| 外出 | 只帶 Mac + Draw Things；回家再丟重圖／影片給 PC |

**連線驗收：** Mac Safari／Chrome 開啟 `http://<PC-LAN-IP>:8188` 並成功出一張圖。

---

## 6. 分階段路線圖

| Phase | 內容 | 完成定義 |
|---|---|---|
| **0（第一週）** | Mac：LM Studio + Otaku；PC：ComfyUI 寫實+二次元各一張；雙機 LAN 出圖 | 見 §7 |
| **1.5** | 需要角色卡生態 → 加 SillyTavern（仍指 Mac :1234） | 匯入一張社群角色卡可聊 |
| **2** | PC 短影片工作流；出片時卸載多餘模 | 穩定產出數秒短片且不反覆 OOM |
| **3（可選）** | OpenClaw 接 LM Studio；ST／腳本串 Comfy API | 能自動丟 prompt 出圖 |

---

## 7. 第一週驗收清單

- [ ] Mac：Otaku 經 LM Studio 完成一場角色對話  
- [ ] PC：ComfyUI 寫實圖 ×1、二次元圖 ×1（無不可恢復 OOM）  
- [ ] 雙機：Mac 瀏覽器經 LAN 打開 PC ComfyUI 並出圖 ×1  
- [ ] （建議）Mac Draw Things 離線出圖 ×1  
- [ ] 確認未把 :1234／:8188 暴露到公網  

---

## 8. 後續建議對齊規則（給未來的我／Agent）

1. 角色前端問題 → Otaku；卡生態再 ST。  
2. 出圖／影片 → **優先 PC ComfyUI**；Mac Draw Things = 備援。  
3. 換大語言模型 → **優先 Mac MLX**；PC 只建議小模。  
4. 任何方案若需 >12GB 常駐 VRAM 或否認 5080 上限 → **改配方或拒絕**，不裝作可行。  
5. 不把 Cursor 寫進必裝路徑。  

---

## 9. 刻意不做（第一週）

- Cursor 依賴  
- 第一天就上 SillyTavern／OpenClaw／長影片  
- PC 當 70B 主腦  
- 公網暴露本機 API  
