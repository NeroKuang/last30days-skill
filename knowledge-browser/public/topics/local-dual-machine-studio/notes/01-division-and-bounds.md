# 分工與硬體邊界

## Claim

雙機應採「腦在 Mac、畫筆在 PC」：大 LLM／角色在 M5 Max 128GB；出圖／短片在 RTX 5080 12GB。

## Evidence

- Mac 統一記憶體 128GB，適合 32B–72B 級 MLX 與長 context。
- PC 瓶頸是 **12GB VRAM**，不是 64GB 系統 RAM；CUDA 利於 diffusion，不利當大模日常主腦。
- 使用者偏好：不依賴 Cursor；Otaku 先；寫實+二次元。

## Implications

- 建議永遠先問「這活該 Mac 還是 PC」。
- Flux 全精度、長影片、PC 跑 70B 日常 → 直接改配方。

## Actions

- 對齊 `SPEC.md` §1–§2。
- 出圖任務預設開 PC ComfyUI；外出才用 Mac Draw Things。
