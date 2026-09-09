# PC 最小安裝

## Claim

PC 第一週最小集：最新驅動 + ComfyUI + Manager；寫實與二次元兩條 checkpoint；短影片 Phase 2。

## Evidence

- 5080 12GB：SDXL 舒適；Flux 需量化／降解析。
- 64GB RAM 不解除 VRAM 上限。
- CUDA ComfyUI 為 Mac Draw Things 之上的主畫筆。

## Implications

- LLM 在 PC 僅備援 7B–14B（或謹慎 32B Q4）。
- OOM → 降邊長、換量化、卸載並行模，不換「再買更大 VRAM」以外的假解（規格內解法）。

## Actions

1. 更新 NVIDIA 驅動，確認 12GB 可見。  
2. 裝 ComfyUI → :8188 → 寫實／二次元各一張。  
3. 僅對 LAN 開放，供 Mac 存取。  
詳見 `SPEC.md` §4。
