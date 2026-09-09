# 討論定案與決策日誌

## Claim

本主題所有後續建議必須對齊此日誌與 `SPEC.md`；使用者明確要求「不知道怎麼選就照 Agent 預設」。

## Evidence（對話定案，2026-09-08～09）

### 研究起點
- `/last30days`：Mac 本地 multi／無審查 LLM + 類 GPT／Grok Agent 能力。
- 社群主軸：推理層（MLX／LM Studio）≠ Agent 編排；無審查多為第二權重；混合本地+雲端較務實。

### 硬體
- Mac：16" MacBook Pro · **M5 Max** · **128 GB**（About This Mac 截圖確認）。
- PC：AMD **9970X3D** · RTX **5080 12GB** · **64 GB RAM**（使用者提供）。

### 產品偏好（鎖定）
| 項目 | 定案 |
|---|---|
| Cursor | **不依賴** |
| 角色前端 | **Otaku 先** → 需要再 **SillyTavern** |
| 圖風 | **寫實 + 二次元**（兩條 checkpoint） |
| 短影片 | 可選；PC ComfyUI；Phase 2 |
| 決策 | 不確定 → **照 SPEC 預設** |

### Otaku vs SillyTavern（已解釋並定案）
- Otaku：輕量、好上手、生態較小。
- ST：角色卡／世界書／擴充生態最大、學習成本較高。
- **先 Otaku**；養角／換卡需求再上 ST。兩者可並存、同指 `:1234`。

### 架構定案
- **腦在 Mac，畫筆在 PC。**
- Mac：LM Studio MLX + Otaku；（備援）Draw Things。
- PC：ComfyUI CUDA；LLM 僅小模備援。
- 連線：Mac `:1234` localhost；PC `:8188` 僅 LAN；禁止公網裸露。

### 本機盤點（2026-09-09）
- **已有**：`Draw Things.app`
- **尚未**：LM Studio、Otaku（無 `~/.lmstudio`、`~/.otaku`；`:1234` 未開）

### 進行中
- 使用者選擇 **先 Mac**；已交付 Day 1–2 點選步驟（見 `06-mac-day1-day2.md`）。
- PC 安裝尚未開始。

## Implications
- Agent 不可改推「以 Cursor 為核心」或「PC 當 70B 主腦」。
- 換模／加軟體前先讀 `SPEC.md` §2 硬限制與 §8 對齊規則。

## Actions
1. 維護本檔與 `SPEC.md` 為雙源：日誌記「為何」，SPEC 記「怎麼做」。
2. Mac Phase 0 過關後勾 `05-week1-acceptance.md`。
3. 下一討論若改偏好，先改本日誌再改 SPEC 版本號。
