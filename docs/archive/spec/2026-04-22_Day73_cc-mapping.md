# GeoGraphy CC Mapping（SSoT）

> バージョン: v0.5（Day63・2026-04-15）
> 設計仕様: docs/spec/cc-mapping.spec.md
> CC Standard: docs/spec/cc-standard.spec.md
> 読み方ガイド: docs/spec/cc-mapping-guide.md
>
> **このファイルを編集したら必ず `pnpm gen:all` を実行して自動生成物を再生成すること。**
> **settings/cc-map.json / src/types/geo-types.generated.d.ts / src/types/geo-cc-map.generated.ts は自動生成物・手動編集禁止。**
> **セマンティック情報（blockName）は cc-standard.spec.md の各 CC# 定義を参照すること。**

---

## 番号体系（v0.5 確定版）

```
CC [L] [T] [S] [X] [P]

L（1桁）ライブラリ
  1  Three.js
  2  将来（Pixi.js 等）

T（1桁）プラグイン種別
  1  Geometry
  2  Camera
  3  Particle
  4  FX
  5  Shader（将来）

S（1桁）セマンティック分類
  1  EXISTENCE
  2  FORM
  3  MOTION
  4  COLOR
  5  SPACE
  6  EDGE
  7  BLEND
  8  SHADER
  9  SCENE

X（1桁）プラグイン内識別番号
  同一レイヤーに複数インスタンスが存在しうる種別（FX等）で衝突を防ぐ
  Geometry / Camera / Particle / Shader: X=0 固定（同一レイヤーに1つ）
  FX: X=1〜9（FX種別ごとに割り当て・下表参照）

P（1桁）パラメータ連番（1〜9）
  同一 [L][T][S][X] 内での識別番号

最大値: CC25999 = 25,999 ≤ 32,767（MIDI 2.0 AC 上限）✅
```

**読み方の例:**
```
CC11001 → L=1(Three.js) / T=1(Geometry) / S=0(?) ...
CC11101 → L=1(Three.js) / T=1(Geometry) / S=1(EXISTENCE) / X=0(固定) / P=1(radius)
CC14111 → L=1(Three.js) / T=4(FX)       / S=1(EXISTENCE) / X=1(bloom) / P=1(strength)
CC14151 → L=1(Three.js) / T=4(FX)       / S=1(EXISTENCE) / X=5(glitch)/ P=1(goWild)
```

---

## FX プラグイン内識別番号（X桁）割り当て表

| X | FX名 | 備考 |
|---|---|---|
| 1 | bloom | |
| 2 | after-image | |
| 3 | feedback | |
| 4 | color-grading | |
| 5 | glitch | |
| 6 | kaleidoscope | |
| 7 | rgb-shift | |
| 8 | zoom-blur | |
| 9 | mirror | |
| 0 | crt / film / frei-chen | セマンティック帯が完全分離しており衝突ゼロ（詳細は cc-mapping-guide.md §3 参照） |

> **新 FX 追加時:** X=1〜9 の空き番号を割り当てる。X=0 グループに追加する場合は衝突チェック必須（cc-mapping-guide.md §6 参照）。

---

## このファイルの読み方

### 開発者が読む場合
新しい Plugin を追加したとき、対応する paramId の CC 番号をここに追記する。
追記後に `pnpm gen:all` を実行して自動生成物を再生成する。

### AI が読む場合
このファイルで「paramId → CC番号 → Block」を特定する。
次に `docs/spec/cc-standard.spec.md` の該当 CC# 定義で AI語彙・意味を参照する。
2ファイルが役割分担しており、意味情報の重複記載はしない。

### 更新ルール
- 新 Plugin 追加時: 対応するセクションをこのファイルに追記 → pnpm gen:all
- CC 番号変更時: このファイルを編集 → pnpm gen:all
- ユーザーの CC 上書き（cc-overrides.json）はこのファイルに影響しない
- `pnpm gen:all` 実行時に未マッピングの paramId が自動検出・警告される

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

## FX: bloom（X=1）

| paramId   | CC#     | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-----------|---------|-----------|----------------|-----------|-----------|-------|-------|------|
| strength  | CC14111 | EXISTENCE | Primary Amount | 0         | 3         | 0.0   | 1.0   |      |
| radius    | CC14613 | EDGE      | Sharpness/Blur | 0         | 1         | 0.0   | 1.0   |      |
| threshold | CC14711 | BLEND     | Blend Amount   | 0         | 1         | 0.0   | 1.0   |      |

---

## FX: after-image（X=2）

| paramId | CC#     | Block | blockName       | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|---------|-------|-----------------|-----------|-----------|-------|-------|------|
| damp    | CC14722 | BLEND | Feedback Amount | 0         | 1         | 0.0   | 1.0   | 残像持続 |

---

## FX: feedback（X=3）

| paramId | CC#     | Block | blockName       | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|---------|-------|-----------------|-----------|-----------|-------|-------|------|
| amount  | CC14732 | BLEND | Feedback Amount | 0         | 0.95      | 0.0   | 1.0   |      |
| decay   | CC14733 | BLEND | Feedback Scale  | 0.9       | 1.0       | 0.0   | 1.0   | 減衰率 |
| offsetX | CC14531 | SPACE | Position X      | -0.05     | 0.05      | 0.0   | 1.0   | フィードバック流れ方向 |
| offsetY | CC14532 | SPACE | Position Y      | -0.05     | 0.05      | 0.0   | 1.0   | フィードバック流れ方向 |

---

## FX: color-grading（X=4）

| paramId    | CC#     | Block | blockName  | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|------------|---------|-------|------------|-----------|-----------|-------|-------|------|
| saturation | CC14441 | COLOR | Saturation | 0         | 2         | 0.0   | 1.0   |      |
| brightness | CC14442 | COLOR | Brightness | 0         | 2         | 0.0   | 1.0   |      |
| contrast   | CC14443 | COLOR | Contrast   | 0         | 2         | 0.0   | 1.0   |      |

---

## FX: glitch（X=5）

| paramId  | CC#     | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|----------|---------|-----------|----------------|-----------|-----------|-------|-------|------|
| goWild   | CC14151 | EXISTENCE | Primary Amount | 0         | 1         | 0.0   | 1.0   | 0=通常/1=Wild |
| interval | CC14352 | MOTION    | Randomness     | 10        | 240       | 0.0   | 1.0   | 値小=高頻度 |

---

## FX: kaleidoscope（X=6）

| paramId  | CC#     | Block  | blockName       | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|----------|---------|--------|-----------------|-----------|-----------|-------|-------|------|
| segments | CC14261 | FORM   | Symmetry/Repeat | 2         | 16        | 0.0   | 1.0   | int値 |
| angle    | CC14361 | MOTION | Phase/Offset    | 0         | 6.28      | 0.0   | 1.0   |      |

---

## FX: rgb-shift（X=7）

| paramId | CC#     | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|---------|-----------|----------------|-----------|-----------|-------|-------|------|
| amount  | CC14171 | EXISTENCE | Primary Amount | 0         | 0.05      | 0.0   | 1.0   |      |
| angle   | CC14371 | MOTION    | Phase/Offset   | 0         | 6.28      | 0.0   | 1.0   |      |

---

## FX: zoom-blur（X=8）

| paramId  | CC#     | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|----------|---------|-----------|----------------|-----------|-----------|-------|-------|------|
| strength | CC14181 | EXISTENCE | Primary Amount | 0         | 2         | 0.0   | 1.0   |      |

---

## FX: mirror（X=9）

| paramId    | CC#     | Block | blockName       | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|------------|---------|-------|-----------------|-----------|-----------|-------|-------|------|
| horizontal | CC14291 | FORM  | Symmetry/Repeat | 0         | 1         | 0.0   | 1.0   | 0=縦/1=横 |

---

## FX: crt（X=0）

| paramId           | CC#     | Block | blockName     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-------------------|---------|-------|---------------|-----------|-----------|-------|-------|------|
| scanlineIntensity | CC14601 | EDGE  | Edge Strength | 0         | 1         | 0.0   | 1.0   | 走査線強度 |
| curvature         | CC14604 | EDGE  | Vignette      | 0         | 0.5       | 0.0   | 1.0   | 樽型歪み |

---

## FX: film（X=0）

| paramId   | CC#     | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|-----------|---------|-----------|----------------|-----------|-----------|-------|-------|------|
| intensity | CC14101 | EXISTENCE | Primary Amount | 0         | 1         | 0.0   | 1.0   | ノイズ強度 |
| grayscale | CC14401 | COLOR     | Saturation     | 0         | 1         | 0.0   | 1.0   | 0=カラー/1=グレー |

---

## FX: frei-chen（X=0）

| paramId | CC#     | Block | blockName       | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|---------|-------|-----------------|-----------|-----------|-------|-------|------|
| width   | CC14601 | EDGE  | Edge Strength   | 64        | 1920      | 0.0   | 1.0   | aspect.x |
| height  | CC14602 | EDGE  | Edge Thickness  | 64        | 1080      | 0.0   | 1.0   | aspect.y |

> **X=0 グループ（crt / film / frei-chen）の衝突なし保証:**
> - crt:      EDGE帯（CC14601, CC14604）のみ使用
> - film:     EXISTENCE帯（CC14101）/ COLOR帯（CC14401）のみ使用
> - frei-chen: EDGE帯（CC14601, CC14602）のみ使用
> - ⚠️ crt と frei-chen は同じ CC14601 を使用しているため、同一レイヤーへの同時適用は禁止

---

## 変更履歴

| バージョン | 日付 | 内容 |
|-----------|------|------|
| v0.1 | 2026-04-07 | 初版作成・全 Plugin 分のマッピングを記載 |
| v0.2 | 2026-04-07 | 「意味・AI語彙」列を削除・blockName 列に整理。cc-standard.spec.md との役割分担を明確化 |
| v0.3 | 2026-04-08 | Camera Plugin 3種（static/orbit/aerial）のマッピング追加。grid-wave hue 欠落修正。CC110/CC510〜512 新設に伴う更新 |
| v0.4 | 2026-04-14 | 番号体系を5桁に刷新（Day60）。万の位=ライブラリ / 千の位=種別 / 百の位=セマンティック / 下2桁=連番。MIDI 1.0 帯域（0〜127）との衝突を完全解消。Geometry・Camera・FX・Particle の種別分離により同一レイヤー内の衝突を解消 |
| v0.5 | 2026-04-15 | 番号体系を [L][T][S][X][P] の5桁構造に再定義（Day63）。X桁（プラグイン内識別番号）を新設し FX の CC番号衝突を解消。FX 12種に X=0〜9 を割り当て。MIDI 2.0 AC 上限（32,767）との整合性を確認・保証。読み方ガイドを cc-mapping-guide.md として分離 |
