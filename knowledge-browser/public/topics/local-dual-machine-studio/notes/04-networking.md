# 雙機連線

## Claim

標準拓樸：Mac LLM :1234（localhost）+ PC ComfyUI :8188（僅 LAN）；禁止公網裸露。

## Evidence

- 角色流量留在 Mac；重 GPU 工作留在 PC。
- 外出場景：Mac + Draw Things 離線仍可出圖。

## Implications

- 防火牆只放行內網區段到 8188。
- 驗收標準：Mac 瀏覽器開 `http://<PC-LAN-IP>:8188` 並成功出圖。

## Actions

- 兩台同一區網（有線優先）。  
- 記錄 PC 固定 LAN IP（DHCP 保留或靜態）。  
- 詳見 `SPEC.md` §5。
