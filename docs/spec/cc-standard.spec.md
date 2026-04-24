# GeoGraphy CC Standard

> バージョン: v0.3（Day42・2026-04-07）— CC204/CC205 Topology A/B 実装済みに格上げ
> 前バージョン: v0.2（Day39・2026-04-03）
> ステータス: ドラフト（壁打ち中）
> 参照元: `docs/spec/cc-mapping.md`（全 Plugin 横断マッピング表・SSoT）

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

> **外部受信と内部バスの分離（Day58 確定）**
> GeoGraphy の CC番号体系は MIDI 2.0 AC 空間に統一した独自の体系（内部バス）。
> 外部コントローラーとの通信は Web MIDI API 経由のため MIDI 1.0 プロトコルで受信するが、
> GeoGraphy に入った瞬間に MidiInputWrapper が TransportEvent（slot + value・0.0〜1.0）に変換し、内部バスは常に MIDI 2.0 準拠。
> 「CC番号体系 = MIDI 2.0 AC」と「受信プロトコル」は別の話。
> MIDI 2.0 ネイティブ受信（高精度 32bit で直接受け取る）は将来タスク（C++ addon 実装が前提）。

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
CC Standard の語彙（中間言語）← このファイルが定義
  ↓
cc-mapping.md で Plugin の paramId に対応づける
  ↓ GeoGraphy が解釈
Plugin パラメーターの具体値（実装レベル）
```

「ネオンが光る廃墟の夜」→ AI が CC Standard の値を決定 → TransportEvent → GeoGraphy が再現。
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
| **8xx** | SHADER | Shader Plugin 専用の描画スタイル制御 | 「一筆書き」「スプレー」「展開」「矩形」|
| **9xx** | SCENE | シーン全体のエネルギー・緊張・密度 | 「激しい」「穏やかな」「緊張感のある」「夢のような」|

---

### Block 1xx：EXISTENCE（存在・量）

| CC# | 名前 | 型 | 値域 | 意味 |
|---|---|---|---|---|
| CC100 | Enabled | bool | 0/1 | Plugin の ON/OFF |
| CC101 | Primary Amount | float | 0.0〜1.0 | 主要な「大きさ・強さ」の主軸。`radius`, `size`, `strength` に対応 |
| CC102 | Secondary Amount | float | 0.0〜1.0 | 大きさ・強さの副軸。`tube`, `inner radius` 等に対応 |
| CC103 | Opacity | float | 0.0〜1.0 | 透明度・不透明度。`opacity`, `damp`（残像系）に対応 |

| CC110 | Auto Rotate | bool | 0/1 | カメラ自動回転 ON/OFF。orbit-camera の `autoRotate` に対応 |

**将来追加候補：**
- CC104: Threshold（しきい値。Bloom の `threshold` 等）

---

### Block 2xx：FORM（形・密度・対称）

| CC# | 名前 | 型 | 値域 | 意味 |
|---|---|---|---|---|
| CC200 | Shape Type | int | 0〜N | 形状モードの切り替え |
| CC201 | Density / Detail | float | 0.0〜1.0 | 密度・細かさ。`segments`, `detail`, `count`, `cols/rows` に対応 |
| CC202 | Inner Shape | float | 0.0〜1.0 | 形状の内側パラメーター。`radialSegs`, `rows`, `rings` 等に対応 |
| CC203 | Symmetry / Repeat | float | 0.0〜1.0 | 対称・反復数。`segments`（Kaleidoscope）, `horizontal`（Mirror）に対応 |
| CC204 | Topology A | int | 0〜N | トポロジー変化の第1軸。TorusKnot の `p` に対応 |
| CC205 | Topology B | int | 0〜N | トポロジー変化の第2軸。TorusKnot の `q` に対応（Day42 新設）|

---

### Block 3xx：MOTION（動き・変形・周波数）

| CC# | 名前 | 型 | 値域 | 意味 |
|---|---|---|---|---|
| CC300 | Temporal Speed | float | 0.0〜1.0 | 時間的な速度。全 Plugin の `speed` に対応 |
| CC301 | Phase / Offset | float | 0.0〜1.0 | 波・アニメーションの位相オフセット |
| CC302 | Deformation | float | 0.0〜1.0 | 変形・歪み・振幅。`amplitude`, `maxHeight` に対応 |
| CC303 | Frequency | float | 0.0〜1.0 | 波の周波数・細かさ |
| CC304 | Randomness | float | 0.0〜1.0 | ランダム性の強さ |

---

### Block 4xx：COLOR（色・明暗・彩度）

| CC# | 名前 | 型 | 値域 | 意味 |
|---|---|---|---|---|
| CC400 | Hue | float | 0.0〜1.0 | 色相（0=赤, 0.33=緑, 0.67=青, 1.0=赤に戻る） |
| CC401 | Saturation | float | 0.0〜1.0 | 彩度 |
| CC402 | Brightness | float | 0.0〜1.0 | 明るさ |
| CC403 | Contrast | float | 0.0〜1.0 | コントラスト |
| CC404 | Color Tint | Color | RGB | 映像全体への着色 |

---

### Block 5xx：SPACE（空間・位置・視点）

| CC# | 名前 | 型 | 値域 | 意味 |
|---|---|---|---|---|
| CC500 | Position X | float | -1.0〜1.0 | X 軸位置 |
| CC501 | Position Y | float | -1.0〜1.0 | Y 軸位置 |
| CC502 | Position Z | float | -1.0〜1.0 | Z 軸位置（奥行き）|
| CC503 | Rotation | float | 0.0〜1.0 | 回転角度 |
| CC504 | Scale / Zoom | float | 0.0〜1.0 | 拡大縮小 |
| CC505 | Focus / Center X | float | 0.0〜1.0 | フォーカス中心点 X |
| CC506 | Focus / Center Y | float | 0.0〜1.0 | フォーカス中心点 Y |
| CC507 | Depth | float | 0.0〜1.0 | 奥行き範囲 |
| CC510 | LookAt X | float | -1.0〜1.0 | カメラ注視点 X |
| CC511 | LookAt Y | float | -1.0〜1.0 | カメラ注視点 Y |
| CC512 | LookAt Z | float | -1.0〜1.0 | カメラ注視点 Z |

---

### Block 6xx：EDGE（輪郭・境界・鮮鋭度）

| CC# | 名前 | 型 | 値域 | 意味 |
|---|---|---|---|---|
| CC600 | Edge Strength | float | 0.0〜1.0 | 輪郭の強さ |
| CC601 | Edge Thickness | float | 0.0〜1.0 | 輪郭の太さ |
| CC602 | Edge Glow | float | 0.0〜1.0 | 輪郭の発光量 |
| CC603 | Sharpness / Blur | float | -1.0〜1.0 | 鮮鋭度。負=ブラー, 0=標準, 正=シャープ |
| CC604 | Vignette | float | 0.0〜1.0 | 画面周辺の暗化 |

---

### Block 7xx：BLEND（混合・時間的蓄積）

| CC# | 名前 | 型 | 値域 | 意味 |
|---|---|---|---|---|
| CC700 | Blend Amount | float | 0.0〜1.0 | Dry/Wet 混合比 |
| CC701 | Feedback Amount | float | 0.0〜1.0 | 前フレームとの混合比 |
| CC702 | Blend Mode | int | 0〜N | 合成モード |
| CC703 | Feedback Scale | float | 0.0〜1.0 | フィードバック時の減衰率 |
| CC704 | Feedback Rotation | float | -1.0〜1.0 | フィードバック時の回転量 |

---

### Block 8xx：SHADER（Shader Plugin 専用）

> `shader-plugin.spec.md` の SSoT 記述と連動する。Block 1xx〜7xx は全 Plugin 共通。Block 8xx は疎結合 ShaderPlugin 専用。

| CC# | 名前 | 型 | 値域 | 意味 |
|---|---|---|---|---|
| CC800 | Effect Type | int | 0〜2 | 描画モードの切り替え。0=Fill / 1=Outline / 2=Detail |
| CC801 | Draw Progress | float | 0.0〜1.0 | 描画進捗（`uProgress`） |
| CC802 | Line Width | float | 0.0〜1.0 | アウトラインの線幅 |
| CC803 | Spray Radius | float | 0.0〜1.0 | スプレーの拡散半径 |
| CC804 | Noise Strength | float | 0.0〜1.0 | ノイズの強度 |
| CC805 | Shader Color | float | 0.0〜1.0 | Shader 専用の色相 |

---

### Block 9xx：SCENE（シーン全体の状態）

> AI との自然言語インターフェースの**接点**となる最重要ブロック。

| CC# | 名前 | 型 | 値域 | 意味 |
|---|---|---|---|---|
| CC900 | Scene Energy | float | 0.0〜1.0 | シーン全体のエネルギー量 |
| CC901 | Scene Tension | float | -1.0〜1.0 | 緊張感 |
| CC902 | Scene Density | float | 0.0〜1.0 | 映像の密度・情報量 |
| CC903 | Sync Rate | float | 0.0〜1.0 | BPM に対する反応速度 |

---

## 4. MIDI 1.0 互換ブリッジ（Layer 2）

音楽と CG で概念が一致するパラメーターのみ。MacroKnob が変換テーブルを持つ。Plugin 側は関与しない。

| MIDI 1.0 CC# | 音楽での意味 | 対応する GeoGraphy CC# | 対応概念 |
|---|---|---|---|
| CC1 | Modulation | CC302 | Deformation |
| CC7 | Volume | CC103 | Opacity |
| CC10 | Pan | CC500 | Position X |
| CC11 | Expression | CC101 | Primary Amount |
| CC64 | Sustain | CC701 | Feedback Amount |
| CC71 | Resonance | CC600 | Edge Strength |
| CC74 | Filter Cutoff | CC201 | Density / Detail |

**同時受信時のルール：** 最後に受け取った値が勝つ（last-write-wins）。

---

## 5. 全 Plugin 横断マッピング表

> **注意**: このセクションは参照用の概要です。
> **SSoT（唯一の真実の情報源）は `docs/spec/cc-mapping.md`** です。
> 新 Plugin 追加・CC 番号変更は必ず cc-mapping.md を先に更新してください。

各セルの記号：🔓=公開済み / 🔒=未公開（ライブラリに存在）/ 🆕=未実装（Plugin 自体がない）/ —=該当なし

### Geometry Plugin

| CC# | 概念 | Icosphere | Torus | TorusKnot | HexGrid | Contour | GridWave | GridTunnel |
|---|---|---|---|---|---|---|---|---|
| CC101 | Primary Amount | `radius`🔓 | `radius`🔓 | `radius`🔓 | `hexSize`🔓 | `size`🔓 | `size`🔓 | `radius`🔓 |
| CC102 | Secondary Amount | — | `tube`🔓 | `tube`🔓 | — | — | — | — |
| CC201 | Density / Detail | `detail`🔓 | `tubularSegs`🔓 | `tubularSegs`🔓 | `cols`🔓 | `segments`🔓 | `segments`🔓 | `segments`🔓 |
| CC202 | Inner Shape | — | `radialSegs`🔓 | `radialSegs`🔓 | `rows`🔓 | — | — | `rings`🔓 |
| CC204 | Topology A | — | — | `p`🔓 | — | — | — | — |
| CC205 | Topology B | — | — | `q`🔓 | — | — | — | — |
| CC300 | Temporal Speed | `speed`🔓 | `speed`🔓 | `speed`🔓 | `speed`🔓 | `speed`🔓 | `speed`🔓 | `speed`🔓 |
| CC302 | Deformation | — | — | — | `maxHeight`🔓 | `amplitude`🔓 | `amplitude`🔓 | — |
| CC303 | Frequency | — | — | — | — | `scale`🔓 | `frequency`🔓 | — |
| CC400 | Hue | `hue`🔓 | `hue`🔓 | `hue`🔓 | `hue`🔓 | `hue`🔓 | — | `hue`🔓 |
| CC507 | Depth | — | — | — | — | — | — | `length`🔓 |

### Camera Plugin（Day45 追加）

| CC# | 概念 | static-camera | orbit-camera | aerial-camera |
|---|---|---|---|---|
| CC101 | Primary Amount | — | `radius`🔓 | — |
| CC110 | Auto Rotate | — | `autoRotate`🔓 | — |
| CC300 | Temporal Speed | — | `speed`🔓 | — |
| CC500 | Position X | `posX`🔓 | — | — |
| CC501 | Position Y | `posY`🔓 | `height`🔓 | `height`🔓 |
| CC502 | Position Z | `posZ`🔓 | — | — |
| CC510 | LookAt X | `lookAtX`🔓 | — | — |
| CC511 | LookAt Y | `lookAtY`🔓 | — | — |
| CC512 | LookAt Z | `lookAtZ`🔓 | — | — |

### Particle Plugin

| CC# | 概念 | Starfield |
|---|---|---|
| CC101 | Primary Amount | `size`🔓 |
| CC103 | Opacity | `opacity`🔓 |
| CC201 | Density / Detail | `count`🔓 |
| CC300 | Temporal Speed | `speed`🔓 |
| CC507 | Depth | `depth`🔓 |

### FX Plugin（実装済み）

| CC# | 概念 | Bloom | AfterImage | Glitch | Kaleidoscope | RGBShift | Feedback | ColorGrading | CRT | ZoomBlur | Mirror | Film | FreiChen |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| CC101 | Primary Amount | `strength`🔓 | — | `goWild`🔓 | — | `amount`🔓 | — | — | — | `strength`🔓 | — | `intensity`🔓 | — |
| CC203 | Symmetry/Repeat | — | — | — | `segments`🔓 | — | — | — | — | — | `horizontal`🔓 | — | — |
| CC301 | Phase/Offset | — | — | — | `angle`🔓 | `angle`🔓 | — | — | — | — | — | — | — |
| CC304 | Randomness | — | — | `interval`🔓 | — | — | — | — | — | — | — | — | — |
| CC401 | Saturation | — | — | — | — | — | — | `saturation`🔓 | — | — | — | `grayscale`🔓 | — |
| CC402 | Brightness | — | — | — | — | — | — | `brightness`🔓 | — | — | — | — | — |
| CC403 | Contrast | — | — | — | — | — | — | `contrast`🔓 | — | — | — | — | — |
| CC500 | Position X | — | — | — | — | — | `offsetX`🔓 | — | — | — | — | — | — |
| CC501 | Position Y | — | — | — | — | — | `offsetY`🔓 | — | — | — | — | — | — |
| CC600 | Edge Strength | — | — | — | — | — | — | — | `scanlineIntensity`🔓 | — | — | — | `width`🔓 |
| CC601 | Edge Thickness | — | — | — | — | — | — | — | — | — | — | — | `height`🔓 |
| CC603 | Sharpness/Blur | `radius`🔓 | — | — | — | — | — | — | — | — | — | — | — |
| CC604 | Vignette | — | — | — | — | — | — | — | `curvature`🔓 | — | — | — | — |
| CC700 | Blend Amount | `threshold`🔓 | — | — | — | — | — | — | — | — | — | — | — |
| CC701 | Feedback Amount | — | `damp`🔓 | — | — | — | `amount`🔓 | — | — | — | — | — | — |
| CC703 | Feedback Scale | — | — | — | — | — | `decay`🔓 | — | — | — | — | — | — |

### Shader Plugin（疎結合・実装待ち）

| CC# | 概念 | graffiti-fill | graffiti-outline | graffiti-detail |
|---|---|---|---|---|
| CC800 | Effect Type | `effectType`🆕 | `effectType`🆕 | `effectType`🆕 |
| CC801 | Draw Progress | `uProgress`🆕 | `uProgress`🆕 | `uProgress`🆕 |
| CC802 | Line Width | — | `uLineWidth`🆕 | — |
| CC803 | Spray Radius | `uSprayRadius`🆕 | — | — |
| CC804 | Noise Strength | `uNoiseStrength`🆕 | `uNoiseStrength`🆕 | `uNoiseStrength`🆕 |
| CC805 | Shader Color | `uColor`🆕 | `uColor`🆕 | `uColor`🆕 |

---

## 6. 新規 Plugin 開発ガイドライン

### ステップ1：各パラメーターを Block に割り当てる

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

### ステップ2：docs/spec/cc-mapping.md に追記する

Plugin 追加後は cc-mapping.md の該当セクションに paramId・CC番号・値域を追記する。
追記後に `pnpm gen:cc-map` を実行して `settings/cc-map.json` を再生成する。

### ステップ3：値を 0.0〜1.0 に正規化する

```typescript
// 例：CC101 の値（0.0〜1.0）を radius（0.5〜10.0）に変換
const radius = 0.5 + ccValue * (10.0 - 0.5)
```

---

## 7. AI との連携フロー（v3 実装対象）

```
ユーザー「ネオン廃墟の夜にして」
  ↓
AI が settings/cc-map.json を読む（セマンティック情報付き）
  ↓
Block 9xx の値を決定 → Block 1xx〜7xx の具体値を導出
  ↓
TransportEvent として engine.handleMidiCC() に流す
  ↓
TransportManager → ParameterStore 更新 → 映像が変わる
```

cc-mapping.md（人間が書く・セマンティック情報あり）→ cc-map.json（機械が動く・意味を知らない）
という「外側と内側の分離」が自然言語 AI 対応の基盤。

---

## 付録：CC番号クイックリファレンス

```
1xx EXISTENCE  100=ON/OFF  101=Amount   102=Amount2   103=Opacity   110=AutoRotate
2xx FORM       200=Shape   201=Density  202=Inner     203=Symmetry  204=TopoA  205=TopoB
3xx MOTION     300=Speed   301=Phase    302=Deform    303=Freq      304=Random
4xx COLOR      400=Hue     401=Sat      402=Bright    403=Contrast  404=Tint
5xx SPACE      500=PosX    501=PosY     502=PosZ      503=Rot       504=Zoom
               505=FocusX  506=FocusY   507=Depth
               510=LookAtX 511=LookAtY  512=LookAtZ
6xx EDGE       600=Strength 601=Thick   602=Glow      603=Sharp     604=Vignette
7xx BLEND      700=Blend   701=Feedback 702=Mode      703=FbScale   704=FbRot
8xx SHADER     800=EffectType 801=Progress 802=LineWidth 803=SprayR 804=Noise  805=Color
9xx SCENE      900=Energy  901=Tension  902=Density   903=SyncRate
```
