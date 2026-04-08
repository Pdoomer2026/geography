# GeoGraphy CC Mapping（SSoT）

> バージョン: v0.3（Day51・2026-04-08）
> 設計仕様: docs/spec/cc-mapping.spec.md
> CC Standard: docs/spec/cc-standard.spec.md
>
> **このファイルを編集したら必ず `pnpm gen:cc-map` を実行して settings/cc-map.json を再生成すること。**
> **settings/cc-map.json は自動生成物・手動編集禁止。**
> **セマンティック情報（blockName）は cc-standard.spec.md の各 CC# 定義を参照すること。**

---

## このファイルの読み方

### 開発者が読む場合
新しい Plugin を追加したとき、対応する paramId の CC 番号をここに追記する。
追記後に `pnpm gen:cc-map` を実行して `settings/cc-map.json` を再生成する。

### AI が読む場合（v3 自然言語インターフェース）
このファイルで「paramId → CC番号 → Block」を特定する。
次に `docs/spec/cc-standard.spec.md` の該当 CC# 定義で AI語彙・意味を参照する。
2ファイルが役割分担しており、意味情報の重複記載はしない。

### 更新ルール
- 新 Plugin 追加時: 対応するセクションをこのファイルに追記 → pnpm gen:cc-map
- CC 番号変更時: このファイルを編集 → pnpm gen:cc-map
- ユーザーの CC 上書き（cc-overrides.json）はこのファイルに影響しない
- `pnpm gen:cc-map` 実行時に未マッピングの paramId が自動検出・警告される

---

## Geometry: icosphere

| paramId | CC#   | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|-------|-----------|----------------|-----------|-----------|-------|-------|------|
| radius  | CC101 | EXISTENCE | Primary Amount | 0.5       | 10        | 0.0   | 1.0   |      |
| detail  | CC201 | FORM      | Density/Detail | 0         | 5         | 0.0   | 1.0   | int値 |
| speed   | CC300 | MOTION    | Temporal Speed | 0.0       | 2.0       | 0.0   | 1.0   |      |
| hue     | CC400 | COLOR     | Hue            | 0         | 360       | 0.0   | 1.0   | 度数→CC変換 |

---

## Geometry: torus

| paramId     | CC#   | Block     | blockName        | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-------------|-------|-----------|------------------|-----------|-----------|-------|-------|------|
| radius      | CC101 | EXISTENCE | Primary Amount   | 0.5       | 10        | 0.0   | 1.0   |      |
| tube        | CC102 | EXISTENCE | Secondary Amount | 0.1       | 4.0       | 0.0   | 1.0   |      |
| tubularSegs | CC201 | FORM      | Density/Detail   | 8         | 256       | 0.0   | 1.0   | int値 |
| radialSegs  | CC202 | FORM      | Inner Shape      | 3         | 64        | 0.0   | 1.0   | int値 |
| speed       | CC300 | MOTION    | Temporal Speed   | 0.0       | 2.0       | 0.0   | 1.0   |      |
| hue         | CC400 | COLOR     | Hue              | 0         | 360       | 0.0   | 1.0   | 度数→CC変換 |

---

## Geometry: torusknot

| paramId     | CC#   | Block     | blockName        | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-------------|-------|-----------|------------------|-----------|-----------|-------|-------|------|
| radius      | CC101 | EXISTENCE | Primary Amount   | 0.5       | 8.0       | 0.0   | 1.0   |      |
| tube        | CC102 | EXISTENCE | Secondary Amount | 0.1       | 2.0       | 0.0   | 1.0   |      |
| tubularSegs | CC201 | FORM      | Density/Detail   | 32        | 512       | 0.0   | 1.0   | int値 |
| radialSegs  | CC202 | FORM      | Inner Shape      | 3         | 32        | 0.0   | 1.0   | int値 |
| p           | CC204 | FORM      | Topology A       | 1         | 8         | 0.0   | 1.0   | int値 |
| q           | CC205 | FORM      | Topology B       | 1         | 8         | 0.0   | 1.0   | int値・CC205新設 |
| speed       | CC300 | MOTION    | Temporal Speed   | 0.0       | 2.0       | 0.0   | 1.0   |      |
| hue         | CC400 | COLOR     | Hue              | 0         | 360       | 0.0   | 1.0   | 度数→CC変換 |

---

## Geometry: contour

| paramId   | CC#   | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-----------|-------|-----------|----------------|-----------|-----------|-------|-------|------|
| size      | CC101 | EXISTENCE | Primary Amount | 10        | 500       | 0.0   | 1.0   |      |
| segments  | CC201 | FORM      | Density/Detail | 10        | 150       | 0.0   | 1.0   | int値 |
| speed     | CC300 | MOTION    | Temporal Speed | 0.0       | 2.0       | 0.0   | 1.0   |      |
| amplitude | CC302 | MOTION    | Deformation    | 0.1       | 8.0       | 0.0   | 1.0   |      |
| scale     | CC303 | MOTION    | Frequency      | 0.1       | 2.0       | 0.0   | 1.0   |      |
| hue       | CC400 | COLOR     | Hue            | 0         | 360       | 0.0   | 1.0   | 度数→CC変換 |

---

## Geometry: hex-grid

| paramId   | CC#   | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-----------|-------|-----------|----------------|-----------|-----------|-------|-------|------|
| hexSize   | CC101 | EXISTENCE | Primary Amount | 0.5       | 5.0       | 0.0   | 1.0   |      |
| cols      | CC201 | FORM      | Density/Detail | 4         | 30        | 0.0   | 1.0   | int値 |
| rows      | CC202 | FORM      | Inner Shape    | 4         | 30        | 0.0   | 1.0   | int値 |
| speed     | CC300 | MOTION    | Temporal Speed | 0.0       | 2.0       | 0.0   | 1.0   |      |
| maxHeight | CC302 | MOTION    | Deformation    | 0.0       | 10.0      | 0.0   | 1.0   |      |
| hue       | CC400 | COLOR     | Hue            | 0         | 360       | 0.0   | 1.0   | 度数→CC変換 |

---

## Geometry: grid-tunnel

| paramId  | CC#   | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|----------|-------|-----------|----------------|-----------|-----------|-------|-------|------|
| radius   | CC101 | EXISTENCE | Primary Amount | 1.0       | 10.0      | 0.0   | 1.0   |      |
| segments | CC201 | FORM      | Density/Detail | 3         | 24        | 0.0   | 1.0   | int値 |
| rings    | CC202 | FORM      | Inner Shape    | 5         | 40        | 0.0   | 1.0   | int値 |
| speed    | CC300 | MOTION    | Temporal Speed | 0.0       | 3.0       | 0.0   | 1.0   |      |
| length   | CC507 | SPACE     | Depth          | 10        | 100       | 0.0   | 1.0   |      |
| hue      | CC400 | COLOR     | Hue            | 0         | 360       | 0.0   | 1.0   | 度数→CC変換 |

---

## Geometry: grid-wave

| paramId   | CC#   | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-----------|-------|-----------|----------------|-----------|-----------|-------|-------|------|
| size      | CC101 | EXISTENCE | Primary Amount | 1         | 500       | 0.0   | 1.0   |      |
| segments  | CC201 | FORM      | Density/Detail | 10        | 100       | 0.0   | 1.0   | int値 |
| speed     | CC300 | MOTION    | Temporal Speed | 0.1       | 2.0       | 0.0   | 1.0   |      |
| amplitude | CC302 | MOTION    | Deformation    | 0.1       | 2.0       | 0.0   | 1.0   |      |
| frequency | CC303 | MOTION    | Frequency      | 0.1       | 1.0       | 0.0   | 1.0   |      |
| hue       | CC400 | COLOR     | Hue            | 0         | 360       | 0.0   | 1.0   | 度数→CC変換 |

---

## Camera: static-camera

| paramId | CC#   | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|-------|-----------|----------------|-----------|-----------|-------|-------|------|
| posX    | CC500 | SPACE     | Position X     | -50       | 50        | 0.0   | 1.0   | 中心=0.5 |
| posY    | CC501 | SPACE     | Position Y     | -50       | 50        | 0.0   | 1.0   | 中心=0.5 |
| posZ    | CC502 | SPACE     | Position Z     | -50       | 50        | 0.0   | 1.0   | 中心=0.5 |
| lookAtX | CC510 | SPACE     | LookAt X       | -50       | 50        | 0.0   | 1.0   | 注視点・中心=0.5 |
| lookAtY | CC511 | SPACE     | LookAt Y       | -50       | 50        | 0.0   | 1.0   | 注視点・中心=0.5 |
| lookAtZ | CC512 | SPACE     | LookAt Z       | -50       | 50        | 0.0   | 1.0   | 注視点・中心=0.5 |

---

## Camera: orbit-camera

| paramId    | CC#   | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|------------|-------|-----------|----------------|-----------|-----------|-------|-------|------|
| radius     | CC101 | EXISTENCE | Primary Amount | 1         | 50        | 0.0   | 1.0   |      |
| height     | CC501 | SPACE     | Position Y     | -20       | 30        | 0.0   | 1.0   |      |
| speed      | CC300 | MOTION    | Temporal Speed | 0.0       | 3.0       | 0.0   | 1.0   |      |
| autoRotate | CC110 | EXISTENCE | Auto Rotate    | 0         | 1         | 0.0   | 1.0   | bool型 |

---

## Camera: aerial-camera

| paramId | CC#   | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|-------|-----------|----------------|-----------|-----------|-------|-------|------|
| height  | CC501 | SPACE     | Position Y     | 1         | 100       | 0.0   | 1.0   | 俯瞰視点の高さ |

---

## Particle: starfield

| paramId | CC#   | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|-------|-----------|----------------|-----------|-----------|-------|-------|------|
| size    | CC101 | EXISTENCE | Primary Amount | 0.01      | 0.3       | 0.0   | 1.0   |      |
| opacity | CC103 | EXISTENCE | Opacity        | 0.0       | 1.0       | 0.0   | 1.0   |      |
| count   | CC201 | FORM      | Density/Detail | 500       | 10000     | 0.0   | 1.0   | int値 |
| speed   | CC300 | MOTION    | Temporal Speed | 0.0       | 2.0       | 0.0   | 1.0   |      |
| depth   | CC507 | SPACE     | Depth          | 10        | 200       | 0.0   | 1.0   |      |

---

## FX: bloom

| paramId   | CC#   | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-----------|-------|-----------|----------------|-----------|-----------|-------|-------|------|
| strength  | CC101 | EXISTENCE | Primary Amount | 0         | 3         | 0.0   | 1.0   |      |
| radius    | CC603 | EDGE      | Sharpness/Blur | 0         | 1         | 0.0   | 1.0   |      |
| threshold | CC700 | BLEND     | Blend Amount   | 0         | 1         | 0.0   | 1.0   |      |

---

## FX: after-image

| paramId | CC#   | Block     | blockName       | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|-------|-----------|-----------------|-----------|-----------|-------|-------|------|
| damp    | CC701 | BLEND     | Feedback Amount | 0         | 1         | 0.0   | 1.0   | 残像持続 |

---

## FX: feedback

| paramId | CC#   | Block     | blockName       | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|-------|-----------|-----------------|-----------|-----------|-------|-------|------|
| amount  | CC701 | BLEND     | Feedback Amount | 0         | 0.95      | 0.0   | 1.0   |      |
| decay   | CC703 | BLEND     | Feedback Scale  | 0.9       | 1.0       | 0.0   | 1.0   | 減衰率 |
| offsetX | CC500 | SPACE     | Position X      | -0.05     | 0.05      | 0.0   | 1.0   | フィードバック流れ方向 |
| offsetY | CC501 | SPACE     | Position Y      | -0.05     | 0.05      | 0.0   | 1.0   | フィードバック流れ方向 |

---

## FX: color-grading

| paramId    | CC#   | Block     | blockName  | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|------------|-------|-----------|------------|-----------|-----------|-------|-------|------|
| saturation | CC401 | COLOR     | Saturation | 0         | 2         | 0.0   | 1.0   |      |
| brightness | CC402 | COLOR     | Brightness | 0         | 2         | 0.0   | 1.0   |      |
| contrast   | CC403 | COLOR     | Contrast   | 0         | 2         | 0.0   | 1.0   |      |

---

## FX: glitch

| paramId  | CC#   | Block     | blockName  | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|----------|-------|-----------|------------|-----------|-----------|-------|-------|------|
| goWild   | CC101 | EXISTENCE | Primary Amount | 0     | 1         | 0.0   | 1.0   | 0=通常/1=Wild |
| interval | CC304 | MOTION    | Randomness | 10        | 240       | 0.0   | 1.0   | 値小=高頻度 |

---

## FX: kaleidoscope

| paramId  | CC#   | Block     | blockName        | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|----------|-------|-----------|------------------|-----------|-----------|-------|-------|------|
| segments | CC203 | FORM      | Symmetry/Repeat  | 2         | 16        | 0.0   | 1.0   | int値 |
| angle    | CC301 | MOTION    | Phase/Offset     | 0         | 6.28      | 0.0   | 1.0   |      |

---

## FX: rgb-shift

| paramId | CC#   | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|-------|-----------|----------------|-----------|-----------|-------|-------|------|
| amount  | CC101 | EXISTENCE | Primary Amount | 0         | 0.05      | 0.0   | 1.0   |      |
| angle   | CC301 | MOTION    | Phase/Offset   | 0         | 6.28      | 0.0   | 1.0   |      |

---

## FX: zoom-blur

| paramId  | CC#   | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|----------|-------|-----------|----------------|-----------|-----------|-------|-------|------|
| strength | CC101 | EXISTENCE | Primary Amount | 0         | 2         | 0.0   | 1.0   |      |

---

## FX: mirror

| paramId    | CC#   | Block     | blockName       | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|------------|-------|-----------|-----------------|-----------|-----------|-------|-------|------|
| horizontal | CC203 | FORM      | Symmetry/Repeat | 0         | 1         | 0.0   | 1.0   | 0=縦/1=横 |

---

## FX: crt

| paramId           | CC#   | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-------------------|-------|-----------|----------------|-----------|-----------|-------|-------|------|
| scanlineIntensity | CC600 | EDGE      | Edge Strength  | 0         | 1         | 0.0   | 1.0   | 走査線強度 |
| curvature         | CC604 | EDGE      | Vignette       | 0         | 0.5       | 0.0   | 1.0   | 樽型歪み |

---

## FX: film

| paramId   | CC#   | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-----------|-------|-----------|----------------|-----------|-----------|-------|-------|------|
| intensity | CC101 | EXISTENCE | Primary Amount | 0         | 1         | 0.0   | 1.0   | ノイズ強度 |
| grayscale | CC401 | COLOR     | Saturation     | 0         | 1         | 0.0   | 1.0   | 0=カラー/1=グレー |

---

## FX: frei-chen

| paramId | CC#   | Block     | blockName       | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|-------|-----------|-----------------|-----------|-----------|-------|-------|------|
| width   | CC600 | EDGE      | Edge Strength   | 64        | 1920      | 0.0   | 1.0   | aspect.x・小さいほどエッジ太 |
| height  | CC601 | EDGE      | Edge Thickness  | 64        | 1080      | 0.0   | 1.0   | aspect.y |

---

## 未マッピング・検討中

`pnpm gen:cc-map` 実行時にここのリストも警告として出力する。

| pluginId  | paramId | 状態 | 対応方針 |
|-----------|---------|------|---------|
| torusknot | q       | CC205新設 | cc-standard.spec.md Block 2xx に CC205 Topology B を追記する |

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v0.1 | 2026-04-07 | 初版作成・全 Plugin 分のマッピングを記載 |
| v0.2 | 2026-04-07 | 「意味・AI語彙」列を削除・blockName 列に整理。cc-standard.spec.md との役割分担を明確化 |
| v0.3 | 2026-04-08 | Camera Plugin 3種（static/orbit/aerial）のマッピング追加。grid-wave hue 欠落修正。CC110/CC510〜512 新設に伴う更新 |
