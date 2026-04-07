# GeoGraphy CC Mapping（SSoT）

> バージョン: v0.1（Day42・2026-04-07）
> 設計仕様: docs/spec/cc-mapping.spec.md
> CC Standard: docs/spec/cc-standard.spec.md
>
> **このファイルを編集したら必ず `pnpm gen:cc-map` を実行して settings/cc-map.json を再生成すること。**
> **手動で settings/cc-map.json を編集してはいけない。**

---

## 更新ルール

- 新 Plugin 追加時: 対応するセクションをこのファイルに追記 → pnpm gen:cc-map
- CC 番号変更時: このファイルを編集 → pnpm gen:cc-map
- ユーザーの CC 上書き（cc-overrides.json）はこのファイルに影響しない
- `pnpm gen:cc-map` 実行時に未マッピングの paramId が自動検出・警告される

---

## Geometry: icosphere

| paramId | CC#   | Block     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|-------|-----------|-----------|-----------|-------|-------|------|
| radius  | CC101 | EXISTENCE | 0.5       | 10        | 0.0   | 1.0   |      |
| detail  | CC201 | FORM      | 0         | 5         | 0.0   | 1.0   | int値 |
| speed   | CC300 | MOTION    | 0.0       | 2.0       | 0.0   | 1.0   |      |
| hue     | CC400 | COLOR     | 0         | 360       | 0.0   | 1.0   | 度数→CC変換 |

---

## Geometry: torus

| paramId    | CC#   | Block     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|------------|-------|-----------|-----------|-----------|-------|-------|------|
| radius     | CC101 | EXISTENCE | 0.5       | 10        | 0.0   | 1.0   |      |
| tube       | CC102 | EXISTENCE | 0.1       | 4.0       | 0.0   | 1.0   | Secondary Amount |
| radialSegs | CC202 | FORM      | 3         | 64        | 0.0   | 1.0   | int値 |
| tubularSegs| CC201 | FORM      | 8         | 256       | 0.0   | 1.0   | int値・Density |
| speed      | CC300 | MOTION    | 0.0       | 2.0       | 0.0   | 1.0   |      |
| hue        | CC400 | COLOR     | 0         | 360       | 0.0   | 1.0   | 度数→CC変換 |

---

## Geometry: torusknot

| paramId     | CC#   | Block     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-------------|-------|-----------|-----------|-----------|-------|-------|------|
| radius      | CC101 | EXISTENCE | 0.5       | 8.0       | 0.0   | 1.0   |      |
| tube        | CC102 | EXISTENCE | 0.1       | 2.0       | 0.0   | 1.0   | Secondary Amount |
| tubularSegs | CC201 | FORM      | 32        | 512       | 0.0   | 1.0   | int値・Density |
| radialSegs  | CC202 | FORM      | 3         | 32        | 0.0   | 1.0   | int値 |
| p           | CC204 | FORM      | 1         | 8         | 0.0   | 1.0   | int値・Topology A |
| q           | CC205 | FORM      | 1         | 8         | 0.0   | 1.0   | int値・Topology B（CC205新設） |
| speed       | CC300 | MOTION    | 0.0       | 2.0       | 0.0   | 1.0   |      |
| hue         | CC400 | COLOR     | 0         | 360       | 0.0   | 1.0   | 度数→CC変換 |

---

## Geometry: contour

| paramId   | CC#   | Block     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-----------|-------|-----------|-----------|-----------|-------|-------|------|
| size      | CC101 | EXISTENCE | 10        | 500       | 0.0   | 1.0   | Primary Amount |
| segments  | CC201 | FORM      | 10        | 150       | 0.0   | 1.0   | int値・Density |
| speed     | CC300 | MOTION    | 0.0       | 2.0       | 0.0   | 1.0   |      |
| amplitude | CC302 | MOTION    | 0.1       | 8.0       | 0.0   | 1.0   | Deformation |
| scale     | CC303 | MOTION    | 0.1       | 2.0       | 0.0   | 1.0   | Frequency |
| hue       | CC400 | COLOR     | 0         | 360       | 0.0   | 1.0   | 度数→CC変換 |

---

## Geometry: hex-grid

| paramId   | CC#   | Block     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-----------|-------|-----------|-----------|-----------|-------|-------|------|
| hexSize   | CC101 | EXISTENCE | 0.5       | 5.0       | 0.0   | 1.0   | Primary Amount |
| cols      | CC201 | FORM      | 4         | 30        | 0.0   | 1.0   | int値・Density |
| rows      | CC202 | FORM      | 4         | 30        | 0.0   | 1.0   | int値・Inner Shape |
| speed     | CC300 | MOTION    | 0.0       | 2.0       | 0.0   | 1.0   |      |
| maxHeight | CC302 | MOTION    | 0.0       | 10.0      | 0.0   | 1.0   | Deformation |
| hue       | CC400 | COLOR     | 0         | 360       | 0.0   | 1.0   | 度数→CC変換 |

---

## Geometry: grid-tunnel

| paramId  | CC#   | Block     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|----------|-------|-----------|-----------|-----------|-------|-------|------|
| radius   | CC101 | EXISTENCE | 1.0       | 10.0      | 0.0   | 1.0   |      |
| segments | CC201 | FORM      | 3         | 24        | 0.0   | 1.0   | int値・Density |
| rings    | CC202 | FORM      | 5         | 40        | 0.0   | 1.0   | int値・Inner Shape |
| speed    | CC300 | MOTION    | 0.0       | 3.0       | 0.0   | 1.0   |      |
| length   | CC507 | SPACE     | 10        | 100       | 0.0   | 1.0   | Depth |
| hue      | CC400 | COLOR     | 0         | 360       | 0.0   | 1.0   | 度数→CC変換 |

---

## Geometry: grid-wave

| paramId   | CC#   | Block     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-----------|-------|-----------|-----------|-----------|-------|-------|------|
| size      | CC101 | EXISTENCE | 1         | 500       | 0.0   | 1.0   | Primary Amount |
| segments  | CC201 | FORM      | 10        | 100       | 0.0   | 1.0   | int値・Density |
| speed     | CC300 | MOTION    | 0.1       | 2.0       | 0.0   | 1.0   |      |
| amplitude | CC302 | MOTION    | 0.1       | 2.0       | 0.0   | 1.0   | Deformation |
| frequency | CC303 | MOTION    | 0.1       | 1.0       | 0.0   | 1.0   | Frequency |

---

## Particle: starfield

| paramId | CC#   | Block     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|-------|-----------|-----------|-----------|-------|-------|------|
| size    | CC101 | EXISTENCE | 0.01      | 0.3       | 0.0   | 1.0   | Primary Amount |
| opacity | CC103 | EXISTENCE | 0.0       | 1.0       | 0.0   | 1.0   | Opacity |
| count   | CC201 | FORM      | 500       | 10000     | 0.0   | 1.0   | int値・Density |
| speed   | CC300 | MOTION    | 0.0       | 2.0       | 0.0   | 1.0   |      |
| depth   | CC507 | SPACE     | 10        | 200       | 0.0   | 1.0   | Depth |

---

## FX: bloom

| paramId   | CC#   | Block     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-----------|-------|-----------|-----------|-----------|-------|-------|------|
| strength  | CC101 | EXISTENCE | 0         | 3         | 0.0   | 1.0   | Primary Amount |
| radius    | CC603 | EDGE      | 0         | 1         | 0.0   | 1.0   | Sharpness/Blur |
| threshold | CC700 | BLEND     | 0         | 1         | 0.0   | 1.0   | Blend Amount |

---

## FX: after-image

| paramId | CC#   | Block     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|-------|-----------|-----------|-----------|-------|-------|------|
| damp    | CC701 | BLEND     | 0         | 1         | 0.0   | 1.0   | Feedback Amount（残像持続） |

---

## FX: feedback

| paramId | CC#   | Block     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|-------|-----------|-----------|-----------|-------|-------|------|
| amount  | CC701 | BLEND     | 0         | 0.95      | 0.0   | 1.0   | Feedback Amount |
| decay   | CC703 | BLEND     | 0.9       | 1.0       | 0.0   | 1.0   | Feedback Scale（減衰） |
| offsetX | CC500 | SPACE     | -0.05     | 0.05      | 0.0   | 1.0   | Position X（フィードバック流れ方向） |
| offsetY | CC501 | SPACE     | -0.05     | 0.05      | 0.0   | 1.0   | Position Y（フィードバック流れ方向） |

---

## FX: color-grading

| paramId    | CC#   | Block     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|------------|-------|-----------|-----------|-----------|-------|-------|------|
| saturation | CC401 | COLOR     | 0         | 2         | 0.0   | 1.0   | Saturation |
| contrast   | CC403 | COLOR     | 0         | 2         | 0.0   | 1.0   | Contrast |
| brightness | CC402 | COLOR     | 0         | 2         | 0.0   | 1.0   | Brightness |

---

## FX: glitch

| paramId  | CC#   | Block     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|----------|-------|-----------|-----------|-----------|-------|-------|------|
| goWild   | CC101 | EXISTENCE | 0         | 1         | 0.0   | 1.0   | ON/OFF的な使い方（0=通常/1=Wild） |
| interval | CC304 | MOTION    | 10        | 240       | 0.0   | 1.0   | Randomness（間隔が短いほどランダム）|

---

## FX: kaleidoscope

| paramId  | CC#   | Block     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|----------|-------|-----------|-----------|-----------|-------|-------|------|
| segments | CC203 | FORM      | 2         | 16        | 0.0   | 1.0   | int値・Symmetry/Repeat |
| angle    | CC301 | MOTION    | 0         | 6.28      | 0.0   | 1.0   | Phase/Offset |

---

## FX: rgb-shift

| paramId | CC#   | Block     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|-------|-----------|-----------|-----------|-------|-------|------|
| amount  | CC101 | EXISTENCE | 0         | 0.05      | 0.0   | 1.0   | Primary Amount |
| angle   | CC301 | MOTION    | 0         | 6.28      | 0.0   | 1.0   | Phase/Offset |

---

## FX: zoom-blur

| paramId  | CC#   | Block     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|----------|-------|-----------|-----------|-----------|-------|-------|------|
| strength | CC101 | EXISTENCE | 0         | 2         | 0.0   | 1.0   | Primary Amount |

---

## FX: mirror

| paramId    | CC#   | Block     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|------------|-------|-----------|-----------|-----------|-------|-------|------|
| horizontal | CC203 | FORM      | 0         | 1         | 0.0   | 1.0   | Symmetry（0=縦/1=横） |

---

## FX: crt

| paramId           | CC#   | Block     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-------------------|-------|-----------|-----------|-----------|-------|-------|------|
| scanlineIntensity | CC600 | EDGE      | 0         | 1         | 0.0   | 1.0   | Edge Strength（走査線） |
| curvature         | CC604 | EDGE      | 0         | 0.5       | 0.0   | 1.0   | Vignette（樽型歪み） |

---

## FX: film

| paramId   | CC#   | Block     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-----------|-------|-----------|-----------|-----------|-------|-------|------|
| intensity | CC101 | EXISTENCE | 0         | 1         | 0.0   | 1.0   | Primary Amount（ノイズ強度） |
| grayscale | CC401 | COLOR     | 0         | 1         | 0.0   | 1.0   | Saturation（0=カラー/1=グレー） |

---

## FX: frei-chen

| paramId | CC#   | Block     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|-------|-----------|-----------|-----------|-------|-------|------|
| width   | CC600 | EDGE      | 64        | 1920      | 0.0   | 1.0   | Edge Strength（aspect.x・小さいほどエッジ太） |
| height  | CC601 | EDGE      | 64        | 1080      | 0.0   | 1.0   | Edge Thickness（aspect.y） |

---

## 未マッピング・検討中

以下は現時点で CC Standard への対応が確定していない paramId。
`pnpm gen:cc-map` はこれらを警告として出力する。

| pluginId   | paramId | 理由 |
|------------|---------|------|
| grid-wave  | size    | CC101 と競合（contour の size も CC101）→ 同 Block でよいか確認要 |
| torusknot  | q       | CC205 を新設（cc-standard.spec.md への追記が必要） |

---

## CC205 新設の記録（Day42）

`torusknot.q` のために CC205（Topology B）を新設。
cc-standard.spec.md の Block 2xx FORM に追記が必要。

```
CC205 | Topology B | float | 0.0〜1.0 | TorusKnot の q パラメーター専用
```
