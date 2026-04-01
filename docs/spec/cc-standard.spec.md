# GeoGraphy CC Standard

> バージョン: v0.1（Day36・2026-03-31）  
> ステータス: ドラフト（壁打ち中）  
> 参照元: `docs/spec/fx-parameter-reference.md`（全パラメーター対照表）

---

## 1. 設計思想

### なぜ GeoGraphy CC Standard が必要か

現在 GeoGraphy の各 Plugin は独自の paramId（`radius`, `strength`, `amplitude`…）でパラメーターを管理している。これは Plugin 単体では問題ないが、以下の状況で課題が生じる：

- Sequencer が「全 Plugin に共通して使い回せる動き」を定義できない
- MacroKnob が「このノブは何を動かすか」を Plugin ごとに個別定義しなければならない
- 物理 MIDI コントローラーが「何番のノブが何を動かすか」をソフトごとに学習しなければならない
- AI が自然言語から映像を設計しようとしても「共通の語彙」がない

GeoGraphy CC Standard はこれらを解決する**共通言語**として設計する。

### MIDI 2.0 AC 空間を選ぶ理由

MIDI 1.0 の CC は 0〜127 の 128個。うち多くが音楽用途で定義済みのため CG 用途には狭い。  
MIDI 2.0 の Assignable Controllers（AC）空間は **32,768個** あり、GeoGraphy 専用の体系を自由に設計できる。解像度も 7bit（128段階）から **32bit**（約43億段階）に拡張され、リアルタイム VJ 制御に十分な滑らかさが得られる。

### デファクトスタンダードを狙う意図

GeoGraphy CC Standard は GeoGraphy 内部の規約にとどまらず、将来的に：

- 他の VJ ソフト（Resolume・TouchDesigner 等）が準拠できる仕様として公開
- 物理 MIDI コントローラーメーカーが GeoGraphy CC Standard 対応を名乗れる
- 「CC番号を見れば映像パラメーターの意味がわかる」業界共通語彙になる

ことを目指す。

### AI 自然言語インターフェースの起点として

GeoGraphy CC Standard のカテゴリー体系は、AI との自然言語によるシーンデザインの**中間言語**になる。

```
人間の言葉（自然言語）
  ↓ AI が変換
CC Standard の語彙（中間言語）
  ↓ GeoGraphy が解釈
Plugin パラメーターの具体値（実装レベル）
```

「ネオンが光る廃墟の夜」→ AI が CC Standard の値を決定 → Scene State JSON → GeoGraphy が再現。
この流れを可能にするために、CC のカテゴリー名・意味・値域を**人間にも AI にも理解しやすい言葉**で定義する。

---

## 2. 二層構造

```
Layer 1：GeoGraphy CC Standard（本命）
  MIDI 2.0 AC 空間に CG 専用番号体系を定義
  Block 1xx〜9xx で CG 概念を完全に網羅
  Plugin は GeoGraphy CC番号だけを知ればよい

Layer 2：MIDI 1.0 互換ブリッジ（音楽との共通部分のみ）
  音楽と CG で概念が一致するパラメーターに限り
  MIDI 1.0 の既存 CC番号を「別名」として定義
  MacroKnob が変換テーブルを持つ（Plugin 側は関与しない）
  どちらの CC番号で送っても同じ paramId が動く
  同時受信時は「最後に受け取った値が勝つ」
```

---

## 3. GeoGraphy CC Standard（Layer 1）

### Block 定義一覧

| Block | 名前 | 意味 | AI 語彙（例）|
|---|---|---|---|
| **1xx** | EXISTENCE | 存在・量・透明度 | 「消えていく」「圧倒的な存在感」「浮かび上がる」|
| **2xx** | FORM | 形・密度・対称・複雑さ | 「シンプルな」「複雑な」「対称的な」「有機的な」|
| **3xx** | MOTION | 動き・変形・周波数・位相 | 「激しい」「穏やかな」「脈打つ」「揺れる」「静止した」|
| **4xx** | COLOR | 色・明暗・彩度 | 「暖かい」「冷たい」「モノクロの」「鮮やかな」「暗い」|
| **5xx** | SPACE | 空間・位置・視点・焦点 | 「遠い」「近い」「中央に」「広大な」「圧縮された」|
| **6xx** | EDGE | 輪郭・境界・鮮鋭度 | 「くっきりした」「滲んだ」「光る輪郭」「消えていく境界」|
| **7xx** | BLEND | 混合・時間的蓄積・合成 | 「焼き付く」「溶ける」「混ざり合う」「クリアな」|
| **8xx** | _(Shader Plugin 固有)_ | Shader Plugin の描画スタイル制御 | CC Standard の対象外 |
| **9xx** | SCENE | シーン全体のエネルギー・緊張・密度 | 「激しい」「穏やかな」「緊張感のある」「夢のような」|

---

### Block 1xx：EXISTENCE（存在・量）

| CC# | 名前 | 型 | 値域 | 意味 |
|---|---|---|---|---|
| CC100 | Enabled | bool | 0/1 | Plugin の ON/OFF |
| CC101 | Primary Amount | float | 0.0〜1.0 | 主要な「大きさ・強さ」の主軸。`radius`, `size`, `strength` に対応 |
| CC102 | Secondary Amount | float | 0.0〜1.0 | 大きさ・強さの副軸。`tube`, `inner radius` 等に対応 |
| CC103 | Opacity | float | 0.0〜1.0 | 透明度・不透明度。`opacity`, `damp`（残像系）に対応 |

**将来追加候補：**
- CC104: Threshold（しきい値。Bloom の `threshold` 等）

---

### Block 2xx：FORM（形・密度・対称）

| CC# | 名前 | 型 | 値域 | 意味 |
|---|---|---|---|---|
| CC200 | Shape Type | int | 0〜N | 形状モードの切り替え。`p`/`q`（TorusKnot）, `shape`（Halftone）に対応 |
| CC201 | Density / Detail | float | 0.0〜1.0 | 密度・細かさ。`segments`, `detail`, `count`, `cols/rows` に対応 |
| CC202 | Inner Shape | float | 0.0〜1.0 | 形状の内側パラメーター。`tube`, `radialSegs` 等に対応 |
| CC203 | Symmetry / Repeat | float | 0.0〜1.0 | 対称・反復数。`segments`（Kaleidoscope）, `horizontal`（Mirror）に対応 |

**将来追加候補：**
- CC204: Topology（トポロジー変化。TorusKnot の `p`/`q` 専用）
- CC205: Scatter（ランダム散布。HalftonePass の `scatter`、Particle 系）

---

### Block 3xx：MOTION（動き・変形・周波数）

| CC# | 名前 | 型 | 値域 | 意味 |
|---|---|---|---|---|
| CC300 | Temporal Speed | float | 0.0〜1.0 | 時間的な速度。全 Plugin の `speed` に対応。最も普遍的な軸 |
| CC301 | Phase / Offset | float | 0.0〜1.0 | 波・アニメーションの位相オフセット。`angle`（Kaleidoscope, RGB Shift）に対応 |
| CC302 | Deformation | float | 0.0〜1.0 | 変形・歪み・振幅。`amplitude`, `distortion_x/y`（Glitch）, `maxHeight` に対応 |
| CC303 | Frequency | float | 0.0〜1.0 | 波の周波数・細かさ。`frequency`（Grid Wave）, `scale`（Contour）に対応 |
| CC304 | Randomness | float | 0.0〜1.0 | ランダム性の強さ。`seed_x/y`（Glitch）, `scatter`（Halftone）に対応 |

**将来追加候補：**
- CC305: Rotation Speed（回転速度。カメラ回転・Geometry 回転の独立制御）
- CC306: Turbulence（乱流。Particle 系の動きの乱れ）

---

### Block 4xx：COLOR（色・明暗・彩度）

| CC# | 名前 | 型 | 値域 | 意味 |
|---|---|---|---|---|
| CC400 | Hue | float | 0.0〜1.0 | 色相（0=赤, 0.33=緑, 0.67=青, 1.0=赤に戻る）。全 Geometry の `hue` に対応 |
| CC401 | Saturation | float | 0.0〜1.0 | 彩度。0=グレースケール, 1=標準, 上限=過飽和 |
| CC402 | Brightness | float | 0.0〜1.0 | 明るさ。0=真っ暗, 0.5=標準, 1.0=白飛び |
| CC403 | Contrast | float | 0.0〜1.0 | コントラスト。0=フラット, 0.5=標準, 1.0=最大 |
| CC404 | Color Tint | Color | RGB | 映像全体への着色。`color`（ColorifyShader）に対応 |

**将来追加候補：**
- CC405: Color Temperature（色温度。暖色↔寒色）
- CC406: RGB Shift Amount（RGB チャンネルのずれ量。`amount`（RGB Shift）に対応）

---

### Block 5xx：SPACE（空間・位置・視点）

| CC# | 名前 | 型 | 値域 | 意味 |
|---|---|---|---|---|
| CC500 | Position X | float | -1.0〜1.0 | X 軸位置 |
| CC501 | Position Y | float | -1.0〜1.0 | Y 軸位置 |
| CC502 | Position Z | float | -1.0〜1.0 | Z 軸位置（奥行き）|
| CC503 | Rotation | float | 0.0〜1.0 | 回転角度（0=0°, 1.0=360°）|
| CC504 | Scale / Zoom | float | 0.0〜1.0 | 拡大縮小。`strength`（Zoom Blur）, カメラ zoom に対応 |
| CC505 | Focus / Center X | float | 0.0〜1.0 | フォーカス・ブラー等の中心点 X |
| CC506 | Focus / Center Y | float | 0.0〜1.0 | フォーカス・ブラー等の中心点 Y |
| CC507 | Depth | float | 0.0〜1.0 | 奥行き範囲。`depth`（Starfield）, `length`（Grid Tunnel）に対応 |

**将来追加候補：**
- CC508: Field of View（カメラの視野角）
- CC509: Focus Distance（BokehPass の `focus` に対応）

---

### Block 6xx：EDGE（輪郭・境界・鮮鋭度）

| CC# | 名前 | 型 | 値域 | 意味 |
|---|---|---|---|---|
| CC600 | Edge Strength | float | 0.0〜1.0 | 輪郭の強さ。`edgeStrength`（OutlinePass）, FreiChen の検出強度に対応 |
| CC601 | Edge Thickness | float | 0.0〜1.0 | 輪郭の太さ。`edgeThickness`（OutlinePass）に対応 |
| CC602 | Edge Glow | float | 0.0〜1.0 | 輪郭の発光量。`edgeGlow`（OutlinePass）+ Bloom の組み合わせに対応 |
| CC603 | Sharpness / Blur | float | -1.0〜1.0 | 鮮鋭度。負=ブラー, 0=標準, 正=シャープ |
| CC604 | Vignette | float | 0.0〜1.0 | 画面周辺の暗化。CRT の周辺減光等に対応 |

**将来追加候補：**
- CC605: Edge Color（輪郭の色。`visibleEdgeColor`（OutlinePass）に対応）
- CC606: Normal Edge Strength（RenderPixelatedPass の `normalEdgeStrength` に対応）

---

### Block 7xx：BLEND（混合・時間的蓄積）

| CC# | 名前 | 型 | 値域 | 意味 |
|---|---|---|---|---|
| CC700 | Blend Amount | float | 0.0〜1.0 | Dry/Wet 混合比。FX 全般の効果量に対応 |
| CC701 | Feedback Amount | float | 0.0〜1.0 | 前フレームとの混合比。`amount`（Feedback）, `damp`（AfterImage）に対応 |
| CC702 | Blend Mode | int | 0〜N | 合成モード。`blendingMode`（HalftonePass）に対応 |
| CC703 | Feedback Scale | float | 0.0〜1.0 | フィードバック時のズーム量（Feedback 拡張 `scale`）|
| CC704 | Feedback Rotation | float | -1.0〜1.0 | フィードバック時の回転量（Feedback 拡張 `rotation`）|

**将来追加候補：**
- CC705: Feedback Offset X/Y（Feedback が流れる方向）
- CC706: Mix Crossfade（Mixer Plugin の A/B クロスフェード）

---

### Block 9xx：SCENE（シーン全体の状態）

> AI との自然言語インターフェースの**接点**となる最重要ブロック。
> AI はまず Block 9xx の値を決定し、そこから Block 1xx〜7xx の具体値を導出する。

| CC# | 名前 | 型 | 値域 | 意味 |
|---|---|---|---|---|
| CC900 | Scene Energy | float | 0.0〜1.0 | シーン全体のエネルギー量。0=静止, 1.0=最大限の動き |
| CC901 | Scene Tension | float | -1.0〜1.0 | 緊張感。-1.0=完全な弛緩（夢・瞑想）, 1.0=極度の緊張（恐怖・興奮）|
| CC902 | Scene Density | float | 0.0〜1.0 | 映像の密度・情報量。0=ミニマル, 1.0=カオス |
| CC903 | Sync Rate | float | 0.0〜1.0 | BPM に対する反応速度。0=1小節, 0.5=4分音符, 1.0=16分音符 |

**AI による Block 9xx → Block 1xx〜7xx の変換例：**

```
「ネオン廃墟の夜」と指示された場合

Block 9xx（AI が決定）：
  CC900 Scene Energy   = 0.4（中程度）
  CC901 Scene Tension  = -0.6（やや緊張）
  CC902 Scene Density  = 0.3（スパース）
  CC903 Sync Rate      = 0.5（4分音符同期）

↓ AI が Block 9xx を元に具体値を導出

Block 4xx（COLOR）：
  CC400 Hue        = 0.75（紫〜青）
  CC402 Brightness = 0.25（暗め）
  CC403 Contrast   = 0.8（高め）

Block 6xx（EDGE）：
  CC600 Edge Strength = 0.9（強い輪郭）
  CC602 Edge Glow     = 0.8（発光するエッジ）

Block 7xx（BLEND）：
  CC701 Feedback Amount = 0.85（長い残像）

Block 3xx（MOTION）：
  CC300 Temporal Speed  = 0.3（遅め）
  CC302 Deformation     = 0.2（わずかな歪み）
```

---

## 4. MIDI 1.0 互換ブリッジ（Layer 2）

音楽と CG で概念が一致するパラメーターのみ。MacroKnob が変換テーブルを持つ。Plugin 側は関与しない。

| MIDI 1.0 CC# | 音楽での意味 | 対応する GeoGraphy CC# | 対応概念 |
|---|---|---|---|
| CC1 | Modulation（震え・揺らぎ）| CC302 | Deformation |
| CC7 | Volume（音量）| CC103 | Opacity |
| CC10 | Pan（左右定位）| CC500 | Position X |
| CC11 | Expression（表情・強弱）| CC101 | Primary Amount |
| CC64 | Sustain（音を伸ばす・持続）| CC701 | Feedback Amount |
| CC71 | Resonance（フィルターの鋭さ）| CC600 | Edge Strength |
| CC74 | Filter Cutoff（音の明るさ）| CC201 | Density / Detail |

**同時受信時のルール：** 最後に受け取った値が勝つ（last-write-wins）。

---

## 5. 全 Plugin 横断マッピング表

各セルの記号：🔓=公開済み / 🔒=未公開（ライブラリに存在）/ 🆕=未実装（Plugin 自体がない）/ —=該当なし

### Geometry Plugin

| CC# | 概念 | Icosphere | Torus | TorusKnot | HexGrid | Contour | GridWave | GridTunnel |
|---|---|---|---|---|---|---|---|---|
| CC101 | Primary Amount | `radius`🔓 | `radius`🔓 | `radius`🔓 | `hexSize`🔓 | `size`🔓 | `size`🔓 | `radius`🔓 |
| CC201 | Density / Detail | `detail`🔓 | `radialSegs`🔓 | `tubularSegs`🔓 | `cols`🔓 | `segments`🔓 | `segments`🔓 | `segments`🔓 |
| CC202 | Inner Shape | — | `tube`🔓 | `tube`🔓 | `rows`🔓 | — | — | `rings`🔓 |
| CC203 | Symmetry / Repeat | — | `tubularSegs`🔓 | `radialSegs`🔓 | — | — | — | — |
| CC204 | Topology | — | — | `p`🔓 | — | — | — | — |
| CC300 | Temporal Speed | `speed`🔓 | `speed`🔓 | `speed`🔓 | `speed`🔓 | `speed`🔓 | `speed`🔓 | `speed`🔓 |
| CC302 | Deformation | — | — | — | `maxHeight`🔓 | `amplitude`🔓 | `amplitude`🔓 | — |
| CC303 | Frequency | — | — | — | — | `scale`🔓 | `frequency`🔓 | — |
| CC400 | Hue | `hue`🔓 | `hue`🔓 | `hue`🔓 | `hue`🔓 | `hue`🔓 | — | `hue`🔓 |
| CC507 | Depth | — | — | — | — | — | — | `length`🔓 |

**Topology 補足：** TorusKnot の `q` は CC204 の第2軸として CC204b 等の拡張で対応予定。

---

### FX Plugin（既存）

| CC# | 概念 | Bloom | AfterImage | Glitch | Kaleidoscope | RGBShift | Feedback | ColorGrading | CRT | ZoomBlur | Mirror |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CC101 | Primary Amount | `strength`🔓 | — | `amount`🔒 | — | `amount`🔓 | — | — | — | `strength`🔓 | — |
| CC103 | Opacity | — | `damp`🔓 | — | — | — | — | — | — | — | — |
| CC201 | Density / Detail | — | — | — | `segments`🔓 | — | — | — | — | — | — |
| CC203 | Symmetry / Repeat | — | — | — | `segments`🔓 | — | — | — | — | — | `horizontal`🔓 |
| CC301 | Phase / Offset | — | — | `angle`🔒 | `angle`🔓 | `angle`🔓 | — | — | — | — | — |
| CC302 | Deformation | — | — | `distortion_x`🔒 | — | — | — | — | `curvature`🔓 | — | — |
| CC304 | Randomness | — | — | `seed_x`🔒 | — | — | — | — | — | — | — |
| CC401 | Saturation | — | — | — | — | — | — | `saturation`🔓 | — | — | — |
| CC402 | Brightness | — | — | — | — | — | — | `brightness`🔓 | — | — | — |
| CC403 | Contrast | — | — | — | — | — | — | `contrast`🔓 | — | — | — |
| CC600 | Edge Strength | — | — | `col_s`🔒 | — | — | — | — | `scanlineIntensity`🔓 | — | — |
| CC603 | Sharpness / Blur | `radius`🔓 | — | — | — | — | — | — | — | — | — |
| CC604 | Vignette | — | — | — | — | — | — | — | `curvature`🔓 | — | — |
| CC700 | Blend Amount | `threshold`🔓 | — | — | — | — | — | — | — | — | — |
| CC701 | Feedback Amount | — | `damp`🔓 | — | — | — | `amount`🔓 | — | — | — | — |
| CC703 | Feedback Scale | — | — | — | — | — | `scale`🔒 | — | — | — | — |
| CC704 | Feedback Rotation | — | — | — | — | — | `rotation`🔒 | — | — | — | — |

---

### FX Plugin（未実装・Three.js に存在）

| CC# | 概念 | FilmPass | DotScreenPass | HalftonePass | BokehPass | OutlinePass | RenderPixelated | BleachBypass | FreiChen | Colorify | FocusShader |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CC101 | Primary Amount | `intensity`🆕 | `scale`🆕 | `radius`🆕 | `aperture`🆕 | `edgeStrength`🆕 | — | `opacity`🆕 | — | — | `sampleDistance`🆕 |
| CC200 | Shape Type | — | — | `shape`🆕 | — | — | — | — | — | — | — |
| CC201 | Density / Detail | — | — | `radius`🆕 | — | — | `pixelSize`🆕 | — | — | — | — |
| CC301 | Phase / Offset | — | `angle`🆕 | `rotateR`🆕 | — | — | — | — | — | — | — |
| CC304 | Randomness | — | — | `scatter`🆕 | — | — | — | — | — | — | — |
| CC400 | Hue | — | — | — | — | — | — | — | — | `color`🆕 | — |
| CC401 | Saturation | `grayscale`🆕 | — | `greyscale`🆕 | — | — | — | — | — | — | — |
| CC509 | Focus Distance | — | — | — | `focus`🆕 | — | — | — | — | — | — |
| CC600 | Edge Strength | — | — | — | — | `edgeStrength`🆕 | `normalEdgeStrength`🆕 | — | `aspect`🆕 | — | — |
| CC601 | Edge Thickness | — | — | — | — | `edgeThickness`🆕 | — | — | — | — | — |
| CC602 | Edge Glow | — | — | — | — | `edgeGlow`🆕 | — | — | — | — | — |
| CC700 | Blend Amount | — | — | `blending`🆕 | — | — | — | — | — | — | — |
| CC702 | Blend Mode | — | — | `blendingMode`🆕 | — | — | — | — | — | — | — |

---

### Particle Plugin

| CC# | 概念 | Starfield |
|---|---|---|
| CC101 | Primary Amount | `size`🔓 |
| CC103 | Opacity | `opacity`🔓 |
| CC201 | Density / Detail | `count`🔓 |
| CC300 | Temporal Speed | `speed`🔓 |
| CC507 | Depth | `depth`🔓 |

---

## 6. CC番号に収まらないパラメーター（検討中）

現時点で既存 Block に自然に収まらないパラメーター。将来の Block 拡張または個別定義の候補。

| Plugin | paramId | 現状の分類 | 検討 |
|---|---|---|---|
| TorusKnot | `q` | CC204 に `p` を割り当てたが `q` が余る | CC204 を「Topology A」、新設 CC205 を「Topology B」とする |
| HalftonePass | `rotateG`, `rotateB` | CC301 に `rotateR` を割り当てたが G/B が余る | CC301〜303 を RGB 個別に割り当てる拡張案 |
| Glitch | `distortion_y` | CC302 に `distortion_x` を割り当てたが Y が余る | CC302 を X、CC303 を Y とする案（Frequency と競合） |
| OutlinePass | `pulsePeriod` | Block 3xx の時間系だが `speed` とは異なる | CC305 Pulse Period として新設検討 |
| OutlinePass | `visibleEdgeColor` | Block 4xx COLOR と Block 6xx EDGE の両方にまたがる | CC605 Edge Color として新設 |

---

## 7. 新規 Plugin 開発ガイドライン

新しい Plugin を作成するときに CC Standard に準拠するための手順。

### ステップ1：各パラメーターを Block に割り当てる

この質問に答えながら Block を決定する：

```
「このパラメーターは何を制御しているか？」
  → 存在・量・透明度   → Block 1xx
  → 形・密度・対称     → Block 2xx
  → 動き・変形・周波数 → Block 3xx
  → 色・明暗・彩度     → Block 4xx
  → 空間・位置・視点   → Block 5xx
  → 輪郭・境界・鮮鋭度 → Block 6xx
  → 混合・時間的蓄積   → Block 7xx
  → シーン全体         → Block 9xx（Plugin 内部では使わない）
```

### ステップ2：値を 0.0〜1.0 に正規化する

GeoGraphy CC Standard は全て **0.0〜1.0（float）または整数（int）** で送受信する。  
Plugin 側で実際の値域（例: `radius` の 0.5〜10.0）に変換する。

```typescript
// 例：CC101 の値（0.0〜1.0）を radius（0.5〜10.0）に変換
const radius = 0.5 + ccValue * (10.0 - 0.5)
```

### ステップ3：Plugin の CLAUDE.md に CC マッピングを記録する

```markdown
## CC Standard マッピング
| paramId | CC# | Block |
|---------|-----|-------|
| radius  | CC101 | EXISTENCE |
| speed   | CC300 | MOTION    |
| hue     | CC400 | COLOR     |
```

---

## 8. Scene State JSON スキーマ（AI インターフェース）

AI が自然言語からシーンを生成する際の JSON フォーマット。

```json
{
  "name": "ネオン廃墟",
  "description": "暗闇に光る紫のジオメトリ。長い残像。緩やかな崩壊感。",
  "scene_state": {
    "CC900": 0.4,
    "CC901": -0.6,
    "CC902": 0.3,
    "CC903": 0.5
  },
  "cc_values": {
    "CC101": 0.8,
    "CC400": 0.75,
    "CC402": 0.25,
    "CC403": 0.8,
    "CC600": 0.9,
    "CC602": 0.8,
    "CC701": 0.85,
    "CC300": 0.3,
    "CC302": 0.2
  },
  "active_plugins": {
    "geometry": "torusknot",
    "fx": ["bloom", "feedback", "rgb-shift", "color-grading"]
  }
}
```

**AI へのプロンプトテンプレート（将来実装）：**

```
以下の CC Standard を使って「[映像の概念]」を表現する Scene State JSON を生成してください。

Block 9xx（SCENE）を最初に決定し、その値から Block 1xx〜7xx の具体値を導出してください。
各 CC 値は 0.0〜1.0 の範囲で指定してください。
```

---

## 付録：CC番号クイックリファレンス

```
1xx EXISTENCE  100=ON/OFF  101=Amount  102=Amount2  103=Opacity
2xx FORM       200=Shape   201=Density 202=Inner    203=Symmetry
3xx MOTION     300=Speed   301=Phase   302=Deform   303=Freq    304=Random
4xx COLOR      400=Hue     401=Sat     402=Bright   403=Contrast 404=Tint
5xx SPACE      500=PosX    501=PosY    502=PosZ     503=Rot     504=Zoom
               505=FocusX  506=FocusY  507=Depth
6xx EDGE       600=Strength 601=Thick  602=Glow     603=Sharp   604=Vignette
7xx BLEND      700=Blend   701=Feedback 702=Mode    703=FbScale 704=FbRot
9xx SCENE      900=Energy  901=Tension 902=Density  903=SyncRate
```
