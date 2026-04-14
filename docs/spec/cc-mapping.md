# GeoGraphy CC Mapping（SSoT）

> バージョン: v0.4（Day60・2026-04-14）
> 設計仕様: docs/spec/cc-mapping.spec.md
> CC Standard: docs/spec/cc-standard.spec.md
>
> **このファイルを編集したら必ず `pnpm gen:cc-map` を実行して settings/cc-map.json を再生成すること。**
> **settings/cc-map.json は自動生成物・手動編集禁止。**
> **セマンティック情報（blockName）は cc-standard.spec.md の各 CC# 定義を参照すること。**

---

## 番号体系（v0.4 確定版）

```
CC [万の位] [千の位] [百の位] [下2桁]

万の位  ライブラリ
  1  Three.js
  2  将来（Pixi.js 等）

千の位  プラグイン種別
  1  Geometry
  2  Camera
  3  Particle
  4  FX
  5  Shader（将来）

百の位  セマンティック分類
  1  EXISTENCE
  2  FORM
  3  MOTION
  4  COLOR
  5  SPACE
  6  EDGE
  7  BLEND

下2桁  パラメータ連番（01〜99）
  同一セマンティック内での識別番号
  同じ意味のパラメータ（例: 全Geometryのradius）は同番号を共有
  → 同一レイヤーに1Geometryのみのため衝突しない
```

**読み方の例:**
```
CC11101 → Three.js / Geometry / EXISTENCE / 01番目
CC12301 → Three.js / Camera   / MOTION    / 01番目
CC14601 → Three.js / FX       / EDGE      / 01番目
CC21101 → Pixi.js  / Geometry / EXISTENCE / 01番目（将来）
```

---

## このファイルの読み方

### 開発者が読む場合
新しい Plugin を追加したとき、対応する paramId の CC 番号をここに追記する。
追記後に `pnpm gen:cc-map` を実行して `settings/cc-map.json` を再生成する。

### AI が読む場合
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

| paramId | CC#     | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|---------|-----------|----------------|-----------|-----------|-------|-------|------|
| radius  | CC11101 | EXISTENCE | Primary Amount | 0.5       | 10        | 0.0   | 1.0   |      |
| detail  | CC11201 | FORM      | Density/Detail | 0         | 5         | 0.0   | 1.0   | int値 |
| speed   | CC11301 | MOTION    | Temporal Speed | 0.0       | 2.0       | 0.0   | 1.0   |      |
| hue     | CC11401 | COLOR     | Hue            | 0         | 360       | 0.0   | 1.0   | 度数→CC変換 |

---

## Geometry: torus

| paramId     | CC#     | Block     | blockName        | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-------------|---------|-----------|------------------|-----------|-----------|-------|-------|------|
| radius      | CC11101 | EXISTENCE | Primary Amount   | 0.5       | 10        | 0.0   | 1.0   |      |
| tube        | CC11102 | EXISTENCE | Secondary Amount | 0.1       | 4.0       | 0.0   | 1.0   |      |
| tubularSegs | CC11201 | FORM      | Density/Detail   | 8         | 256       | 0.0   | 1.0   | int値 |
| radialSegs  | CC11202 | FORM      | Inner Shape      | 3         | 64        | 0.0   | 1.0   | int値 |
| speed       | CC11301 | MOTION    | Temporal Speed   | 0.0       | 2.0       | 0.0   | 1.0   |      |
| hue         | CC11401 | COLOR     | Hue              | 0         | 360       | 0.0   | 1.0   | 度数→CC変換 |

---

## Geometry: torusknot

| paramId     | CC#     | Block     | blockName        | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-------------|---------|-----------|------------------|-----------|-----------|-------|-------|------|
| radius      | CC11101 | EXISTENCE | Primary Amount   | 0.5       | 8.0       | 0.0   | 1.0   |      |
| tube        | CC11102 | EXISTENCE | Secondary Amount | 0.1       | 2.0       | 0.0   | 1.0   |      |
| tubularSegs | CC11201 | FORM      | Density/Detail   | 32        | 512       | 0.0   | 1.0   | int値 |
| radialSegs  | CC11202 | FORM      | Inner Shape      | 3         | 32        | 0.0   | 1.0   | int値 |
| p           | CC11203 | FORM      | Topology A       | 1         | 8         | 0.0   | 1.0   | int値 |
| q           | CC11204 | FORM      | Topology B       | 1         | 8         | 0.0   | 1.0   | int値 |
| speed       | CC11301 | MOTION    | Temporal Speed   | 0.0       | 2.0       | 0.0   | 1.0   |      |
| hue         | CC11401 | COLOR     | Hue              | 0         | 360       | 0.0   | 1.0   | 度数→CC変換 |

---

## Geometry: contour

| paramId   | CC#     | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-----------|---------|-----------|----------------|-----------|-----------|-------|-------|------|
| size      | CC11101 | EXISTENCE | Primary Amount | 10        | 500       | 0.0   | 1.0   |      |
| segments  | CC11201 | FORM      | Density/Detail | 10        | 150       | 0.0   | 1.0   | int値 |
| speed     | CC11301 | MOTION    | Temporal Speed | 0.0       | 2.0       | 0.0   | 1.0   |      |
| amplitude | CC11302 | MOTION    | Deformation    | 0.1       | 8.0       | 0.0   | 1.0   |      |
| scale     | CC11303 | MOTION    | Frequency      | 0.1       | 2.0       | 0.0   | 1.0   |      |
| hue       | CC11401 | COLOR     | Hue            | 0         | 360       | 0.0   | 1.0   | 度数→CC変換 |

---

## Geometry: hex-grid

| paramId   | CC#     | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-----------|---------|-----------|----------------|-----------|-----------|-------|-------|------|
| hexSize   | CC11101 | EXISTENCE | Primary Amount | 0.5       | 5.0       | 0.0   | 1.0   |      |
| cols      | CC11201 | FORM      | Density/Detail | 4         | 30        | 0.0   | 1.0   | int値 |
| rows      | CC11202 | FORM      | Inner Shape    | 4         | 30        | 0.0   | 1.0   | int値 |
| speed     | CC11301 | MOTION    | Temporal Speed | 0.0       | 2.0       | 0.0   | 1.0   |      |
| maxHeight | CC11302 | MOTION    | Deformation    | 0.0       | 10.0      | 0.0   | 1.0   |      |
| hue       | CC11401 | COLOR     | Hue            | 0         | 360       | 0.0   | 1.0   | 度数→CC変換 |

---

## Geometry: grid-tunnel

| paramId  | CC#     | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|----------|---------|-----------|----------------|-----------|-----------|-------|-------|------|
| radius   | CC11101 | EXISTENCE | Primary Amount | 1.0       | 10.0      | 0.0   | 1.0   |      |
| segments | CC11201 | FORM      | Density/Detail | 3         | 24        | 0.0   | 1.0   | int値 |
| rings    | CC11202 | FORM      | Inner Shape    | 5         | 40        | 0.0   | 1.0   | int値 |
| speed    | CC11301 | MOTION    | Temporal Speed | 0.0       | 3.0       | 0.0   | 1.0   |      |
| length   | CC11501 | SPACE     | Depth          | 10        | 100       | 0.0   | 1.0   |      |
| hue      | CC11401 | COLOR     | Hue            | 0         | 360       | 0.0   | 1.0   | 度数→CC変換 |

---

## Geometry: grid-wave

| paramId   | CC#     | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-----------|---------|-----------|----------------|-----------|-----------|-------|-------|------|
| size      | CC11101 | EXISTENCE | Primary Amount | 1         | 500       | 0.0   | 1.0   |      |
| segments  | CC11201 | FORM      | Density/Detail | 10        | 100       | 0.0   | 1.0   | int値 |
| speed     | CC11301 | MOTION    | Temporal Speed | 0.1       | 2.0       | 0.0   | 1.0   |      |
| amplitude | CC11302 | MOTION    | Deformation    | 0.1       | 2.0       | 0.0   | 1.0   |      |
| frequency | CC11303 | MOTION    | Frequency      | 0.1       | 1.0       | 0.0   | 1.0   |      |
| hue       | CC11401 | COLOR     | Hue            | 0         | 360       | 0.0   | 1.0   | 度数→CC変換 |

---

## Camera: static-camera

| paramId | CC#     | Block | blockName  | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|---------|-------|------------|-----------|-----------|-------|-------|------|
| posX    | CC12501 | SPACE | Position X | -50       | 50        | 0.0   | 1.0   | 中心=0.5 |
| posY    | CC12502 | SPACE | Position Y | -50       | 50        | 0.0   | 1.0   | 中心=0.5 |
| posZ    | CC12503 | SPACE | Position Z | -50       | 50        | 0.0   | 1.0   | 中心=0.5 |
| lookAtX | CC12504 | SPACE | LookAt X   | -50       | 50        | 0.0   | 1.0   | 注視点・中心=0.5 |
| lookAtY | CC12505 | SPACE | LookAt Y   | -50       | 50        | 0.0   | 1.0   | 注視点・中心=0.5 |
| lookAtZ | CC12506 | SPACE | LookAt Z   | -50       | 50        | 0.0   | 1.0   | 注視点・中心=0.5 |

---

## Camera: orbit-camera

| paramId    | CC#     | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|------------|---------|-----------|----------------|-----------|-----------|-------|-------|------|
| radius     | CC12101 | EXISTENCE | Primary Amount | 1         | 50        | 0.0   | 1.0   |      |
| autoRotate | CC12102 | EXISTENCE | Auto Rotate    | 0         | 1         | 0.0   | 1.0   | bool型 |
| speed      | CC12301 | MOTION    | Temporal Speed | 0.0       | 3.0       | 0.0   | 1.0   |      |
| height     | CC12502 | SPACE     | Position Y     | -20       | 30        | 0.0   | 1.0   |      |

---

## Camera: aerial-camera

| paramId | CC#     | Block | blockName  | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|---------|-------|------------|-----------|-----------|-------|-------|------|
| height  | CC12502 | SPACE | Position Y | 1         | 100       | 0.0   | 1.0   | 俯瞰視点の高さ |

---

## Particle: starfield

| paramId | CC#     | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|---------|-----------|----------------|-----------|-----------|-------|-------|------|
| size    | CC13101 | EXISTENCE | Primary Amount | 0.01      | 0.3       | 0.0   | 1.0   |      |
| opacity | CC13102 | EXISTENCE | Opacity        | 0.0       | 1.0       | 0.0   | 1.0   |      |
| count   | CC13201 | FORM      | Density/Detail | 500       | 10000     | 0.0   | 1.0   | int値 |
| speed   | CC13301 | MOTION    | Temporal Speed | 0.0       | 2.0       | 0.0   | 1.0   |      |
| depth   | CC13501 | SPACE     | Depth          | 10        | 200       | 0.0   | 1.0   |      |

---

## FX: bloom

| paramId   | CC#     | Block | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-----------|---------|-------|----------------|-----------|-----------|-------|-------|------|
| strength  | CC14101 | EXISTENCE | Primary Amount | 0     | 3         | 0.0   | 1.0   |      |
| radius    | CC14603 | EDGE  | Sharpness/Blur | 0         | 1         | 0.0   | 1.0   |      |
| threshold | CC14701 | BLEND | Blend Amount   | 0         | 1         | 0.0   | 1.0   |      |

---

## FX: after-image

| paramId | CC#     | Block | blockName       | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|---------|-------|-----------------|-----------|-----------|-------|-------|------|
| damp    | CC14702 | BLEND | Feedback Amount | 0         | 1         | 0.0   | 1.0   | 残像持続 |

---

## FX: feedback

| paramId | CC#     | Block | blockName       | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|---------|-------|-----------------|-----------|-----------|-------|-------|------|
| amount  | CC14702 | BLEND | Feedback Amount | 0         | 0.95      | 0.0   | 1.0   |      |
| decay   | CC14703 | BLEND | Feedback Scale  | 0.9       | 1.0       | 0.0   | 1.0   | 減衰率 |
| offsetX | CC14501 | SPACE | Position X      | -0.05     | 0.05      | 0.0   | 1.0   | フィードバック流れ方向 |
| offsetY | CC14502 | SPACE | Position Y      | -0.05     | 0.05      | 0.0   | 1.0   | フィードバック流れ方向 |

---

## FX: color-grading

| paramId    | CC#     | Block | blockName  | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|------------|---------|-------|------------|-----------|-----------|-------|-------|------|
| saturation | CC14401 | COLOR | Saturation | 0         | 2         | 0.0   | 1.0   |      |
| brightness | CC14402 | COLOR | Brightness | 0         | 2         | 0.0   | 1.0   |      |
| contrast   | CC14403 | COLOR | Contrast   | 0         | 2         | 0.0   | 1.0   |      |

---

## FX: glitch

| paramId  | CC#     | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|----------|---------|-----------|----------------|-----------|-----------|-------|-------|------|
| goWild   | CC14101 | EXISTENCE | Primary Amount | 0         | 1         | 0.0   | 1.0   | 0=通常/1=Wild |
| interval | CC14302 | MOTION    | Randomness     | 10        | 240       | 0.0   | 1.0   | 値小=高頻度 |

---

## FX: kaleidoscope

| paramId  | CC#     | Block  | blockName       | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|----------|---------|--------|-----------------|-----------|-----------|-------|-------|------|
| segments | CC14201 | FORM   | Symmetry/Repeat | 2         | 16        | 0.0   | 1.0   | int値 |
| angle    | CC14301 | MOTION | Phase/Offset    | 0         | 6.28      | 0.0   | 1.0   |      |

---

## FX: rgb-shift

| paramId | CC#     | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|---------|-----------|----------------|-----------|-----------|-------|-------|------|
| amount  | CC14101 | EXISTENCE | Primary Amount | 0         | 0.05      | 0.0   | 1.0   |      |
| angle   | CC14301 | MOTION    | Phase/Offset   | 0         | 6.28      | 0.0   | 1.0   |      |

---

## FX: zoom-blur

| paramId  | CC#     | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|----------|---------|-----------|----------------|-----------|-----------|-------|-------|------|
| strength | CC14101 | EXISTENCE | Primary Amount | 0         | 2         | 0.0   | 1.0   |      |

---

## FX: mirror

| paramId    | CC#     | Block | blockName       | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|------------|---------|-------|-----------------|-----------|-----------|-------|-------|------|
| horizontal | CC14201 | FORM  | Symmetry/Repeat | 0         | 1         | 0.0   | 1.0   | 0=縦/1=横 |

---

## FX: crt

| paramId           | CC#     | Block | blockName     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-------------------|---------|-------|---------------|-----------|-----------|-------|-------|------|
| scanlineIntensity | CC14601 | EDGE  | Edge Strength | 0         | 1         | 0.0   | 1.0   | 走査線強度 |
| curvature         | CC14604 | EDGE  | Vignette      | 0         | 0.5       | 0.0   | 1.0   | 樽型歪み |

---

## FX: film

| paramId   | CC#     | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-----------|---------|-----------|----------------|-----------|-----------|-------|-------|------|
| intensity | CC14101 | EXISTENCE | Primary Amount | 0         | 1         | 0.0   | 1.0   | ノイズ強度 |
| grayscale | CC14401 | COLOR     | Saturation     | 0         | 1         | 0.0   | 1.0   | 0=カラー/1=グレー |

---

## FX: frei-chen

| paramId | CC#     | Block | blockName       | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|---------|-------|-----------------|-----------|-----------|-------|-------|------|
| width   | CC14601 | EDGE  | Edge Strength   | 64        | 1920      | 0.0   | 1.0   | aspect.x |
| height  | CC14602 | EDGE  | Edge Thickness  | 64        | 1080      | 0.0   | 1.0   | aspect.y |

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v0.1 | 2026-04-07 | 初版作成・全 Plugin 分のマッピングを記載 |
| v0.2 | 2026-04-07 | 「意味・AI語彙」列を削除・blockName 列に整理。cc-standard.spec.md との役割分担を明確化 |
| v0.3 | 2026-04-08 | Camera Plugin 3種（static/orbit/aerial）のマッピング追加。grid-wave hue 欠落修正。CC110/CC510〜512 新設に伴う更新 |
| v0.4 | 2026-04-14 | 番号体系を5桁に刷新（Day60）。万の位=ライブラリ / 千の位=種別 / 百の位=セマンティック / 下2桁=連番。MIDI 1.0 帯域（0〜127）との衝突を完全解消。Geometry・Camera・FX・Particle の種別分離により同一レイヤー内の衝突を解消 |
