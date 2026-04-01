# FX Parameter Reference

> SSoT: このファイル  
> 目的: GeoGraphy FX Plugin の「公開済みパラメーター」と「ライブラリが本来持つ全パラメーター」および「未実装 Pass」を完全に対照する参照ドキュメント  
> 対象読者: Window設計・Sequencer設計・新規 FX Plugin 開発者・慎太郎  
> 更新日: Day36（2026-03-31）

---

## このドキュメントの読み方

各 FX Plugin について以下の3層を整理する。

| 記号 | 意味 |
|---|---|
| ✅ 公開済 | `Plugin.params` に含まれ、Simple Window から触れる |
| 🔒 未公開 | ライブラリに存在するが `Plugin.params` に含まれていない |
| ⚡️ 注目 | VJ・Sequencer・新Window 設計で特に面白い軸 |
| 🆕 未実装 | Three.js に存在するが GeoGraphy に Plugin 自体がない |

**重要な前提：** `Plugin.params` に公開されていないパラメーターも、
Plugin のコードを修正することで公開し、より高機能な Window や Sequencer から操作可能になる。
Simple Window は「最小限の入口」に過ぎない。

---

## 1. 既存 FX Plugin の全パラメーター対照

---

### 1-1. Bloom（`UnrealBloomPass`）

**GeoGraphy実装:** `src/plugins/fx/bloom/index.ts`

| パラメーター | 型 | デフォルト | 公開状態 | 説明 |
|---|---|---|---|---|
| `strength` | float | 0.8 | ✅ 公開済 | 光の強さ（0〜3）|
| `radius` | float | 0.4 | ✅ 公開済 | 光の広がり半径（0〜1）|
| `threshold` | float | 0.1 | ✅ 公開済 | 発光しきい値（これ以上の輝度に適用）|
| `resolution` | Vector2 | 256×256 | 🔒 未公開 | レンダリング解像度（パフォーマンスに影響）|
| `nMips` | int | 5 | 🔒 未公開 | ブルームのミップマップ数（細かさの制御）|
| `clearColor` | Color | 黒 | 🔒 未公開 | ブルーム計算時のクリア色 |

**設計メモ:** 現状は最重要3つを公開できている。`nMips` を公開するとブルームの「密度感」が変わる。

---

### 1-2. AfterImage（`AfterimagePass`）

**GeoGraphy実装:** `src/plugins/fx/after-image/index.ts`

| パラメーター | 型 | デフォルト | 公開状態 | 説明 |
|---|---|---|---|---|
| `damp` | float | 0.96 | ✅ 公開済 | 残像の減衰率（0=即消滅、1=永久残留）|
| `tOld` / `tNew` | Texture | — | 🔒 制御不可 | 内部テクスチャバッファ（ユーザー制御対象外）|

**設計メモ:** AfterimagePass は構造上 `damp` 以外に意味のある公開パラメーターがない。
ただし `damp` を BPM 同期で 0.9〜0.99 の間で揺らすと面白い効果になる（Sequencer 候補）。

---

### 1-3. Glitch（`GlitchPass` + `DigitalGlitch` shader）

**GeoGraphy実装:** `src/plugins/fx/glitch/index.ts`  
**⚠️ 最も未開拓な Plugin**

| パラメーター | 型 | デフォルト | 公開状態 | 説明 |
|---|---|---|---|---|
| `goWild` | bool | false | ✅ 公開済 | グリッチ全開モード ON/OFF |
| `amount` | float | 0.08 | 🔒 未公開 ⚡️ | 歪み量（大きいほど激しく崩れる）|
| `angle` | float | 0.02 | 🔒 未公開 ⚡️ | 歪み方向の角度（ラジアン）|
| `seed_x` | float | 0.02 | 🔒 未公開 ⚡️ | 水平方向のランダムシード（-1〜1）|
| `seed_y` | float | 0.02 | 🔒 未公開 ⚡️ | 垂直方向のランダムシード（-1〜1）|
| `distortion_x` | float | 0.5 | 🔒 未公開 ⚡️ | 水平歪みが発生するY座標（0〜1）|
| `distortion_y` | float | 0.6 | 🔒 未公開 ⚡️ | 垂直歪みが発生するX座標（0〜1）|
| `col_s` | float | 0.05 | 🔒 未公開 ⚡️ | カラーずれの幅（コラムシフト幅）|
| `byp` | int | 0 | 🔒 制御不可 | グリッチ適用フラグ（内部制御）|
| `seed` | float | — | 🔒 制御不可 | フレームごとの乱数シード（内部）|

**設計メモ:** `goWild` だけ公開している現状は機能の10%も使えていない。
`amount` + `distortion_x/y` を公開するだけで「どこが・どれだけ崩れるか」を制御できる。
Sequencer で `distortion_x` を 0.0〜1.0 でスキャンすると「グリッチが画面を縦断する」表現が生まれる。

---

### 1-4. Kaleidoscope（カスタム `ShaderPass`）

**GeoGraphy実装:** `src/plugins/fx/kaleidoscope/index.ts`

| パラメーター | 型 | デフォルト | 公開状態 | 説明 |
|---|---|---|---|---|
| `segments` | float | 6 | ✅ 公開済 | 万華鏡の分割数（2〜16）|
| `angle` | float | 0.0 | ✅ 公開済 ⚡️ | 万華鏡の回転角度（0〜6.28）|

**設計メモ:** GeoGraphy 独自実装のため公開できるパラメーターは全て公開済み。
`angle` を Sequencer で継続的に動かすと万華鏡が回転し続ける表現になる（最有力 Sequencer 候補）。

---

### 1-5. RGB Shift（カスタム `ShaderPass`）

**GeoGraphy実装:** `src/plugins/fx/rgb-shift/index.ts`

| パラメーター | 型 | デフォルト | 公開状態 | 説明 |
|---|---|---|---|---|
| `amount` | float | 0.001 | ✅ 公開済 | RGB チャンネルのずれ量（0〜0.05）|
| `angle` | float | 0.0 | ✅ 公開済 ⚡️ | ずれの方向角度（0〜6.28 ラジアン）|

**設計メモ:** 全パラメーター公開済み。`angle` を回し続けると RGB がぐるぐる回転する。

---

### 1-6. Feedback（カスタム `ShaderPass`）

**GeoGraphy実装:** `src/plugins/fx/feedback/index.ts`

| パラメーター | 型 | デフォルト | 公開状態 | 説明 |
|---|---|---|---|---|
| `amount` | float | 0.7 | ✅ 公開済 ⚡️ | 前フレームとの混合比（0〜0.95）|

**設計メモ:** GeoGraphy 独自実装。`amount` が 0.95 に近づくほど映像が「凍結」に近づく。
Sequencer で `amount` を 0.0 → 0.9 と上昇させると映像がどんどん焼き付いていく効果。
`amount` を 1.0 にすると画面が固まるため、意図的に max=0.95 に制限している。

拡張可能パラメーター（独自実装なので追加可能）：

| パラメーター | 意味 |
|---|---|
| `scale` | フィードバック時にわずかにズームイン/アウト。映像が渦を巻いて中心に向かって吸い込まれる |
| `rotation` | フィードバック時にわずかに回転。映像が螺旋を描きながら蓄積される |
| `offsetX / offsetY` | フィードバック時に位置をずらす。映像が流れながら焼き付く |

---

### 1-7. Color Grading（カスタム `ShaderPass`）

**GeoGraphy実装:** `src/plugins/fx/color-grading/index.ts`

| パラメーター | 型 | デフォルト | 公開状態 | 説明 |
|---|---|---|---|---|
| `saturation` | float | 1.0 | ✅ 公開済 | 彩度（0=グレースケール、2=極彩色）|
| `contrast` | float | 1.0 | ✅ 公開済 | コントラスト（0〜2）|
| `brightness` | float | 1.0 | ✅ 公開済 ⚡️ | 明るさ（0〜2）|

**設計メモ:** 全パラメーター公開済み。FX スタックの最後に固定配置。
`saturation` を 0 にするとモノクロ映像になる。
`brightness` を Sequencer でパルス制御するとストロボ効果が作れる。

---

### 1-8. CRT（カスタム `ShaderPass`）

**GeoGraphy実装:** `src/plugins/fx/crt/index.ts`

| パラメーター | 型 | デフォルト | 公開状態 | 説明 |
|---|---|---|---|---|
| `scanlineIntensity` | float | 0.5 | ✅ 公開済 | スキャンラインの濃さ（0〜1）|
| `curvature` | float | 0.1 | ✅ 公開済 | 樽型歪みの強さ（0〜0.5）|
| `time` | float | — | 🔒 制御不可 | 内部タイムカウンター（スキャンライン動的更新）|

---

### 1-9. Zoom Blur（カスタム `ShaderPass`）

**GeoGraphy実装:** `src/plugins/fx/zoom-blur/index.ts`

| パラメーター | 型 | デフォルト | 公開状態 | 説明 |
|---|---|---|---|---|
| `strength` | float | 0.5 | ✅ 公開済 ⚡️ | 放射状ブラーの強さ（0〜2）|

**設計メモ:** 中心点（center X/Y）を追加することで「どこに向かって収束するか」を制御できるが現状は画面中央固定。

---

### 1-10. Mirror（カスタム `ShaderPass`）

**GeoGraphy実装:** `src/plugins/fx/mirror/index.ts`

| パラメーター | 型 | デフォルト | 公開状態 | 説明 |
|---|---|---|---|---|
| `horizontal` | float | 1 | ✅ 公開済 | 1=左右ミラー、0=上下ミラー |

**設計メモ:** 現状は「左右か上下か」の2択のみ。4分割・8分割ミラーや回転ミラーまで拡張できる。

---

## 2. 未実装 Pass（Three.js に存在するが GeoGraphy に Plugin がない）

---

### 2-1. 🆕 FilmPass（`FilmPass` + `FilmShader`）

**実装難度：低（ShaderPass ラッパーで実装可能）**

| パラメーター | 型 | デフォルト | 説明 |
|---|---|---|---|
| `intensity` ⚡️ | float | 0.5 | フィルムノイズの強さ（0〜1）|
| `grayscale` ⚡️ | bool | false | グレースケール変換 ON/OFF |
| `time` | float | 自動更新 | ノイズアニメーション用タイム（内部）|

---

### 2-2. 🆕 DotScreenPass（`DotScreenPass` + `DotScreenShader`）

**実装難度：低**

| パラメーター | 型 | デフォルト | 説明 |
|---|---|---|---|
| `scale` ⚡️ | float | 1.0 | ドットの大きさ |
| `angle` ⚡️ | float | 1.57（90°）| ドットグリッドの回転角度 |
| `center` | Vector2 | (0.5, 0.5) | ドットグリッドの中心点 |

---

### 2-3. 🆕 HalftonePass（`HalftonePass` + `HalftoneShader`）

**実装難度：低〜中**

| パラメーター | 型 | デフォルト | 説明 |
|---|---|---|---|
| `shape` ⚡️ | int | 1 | 1=Dot / 2=Ellipse / 3=Line / 4=Square |
| `radius` ⚡️ | float | 4 | ドット半径 |
| `rotateR` ⚡️ | float | π/12 | R チャンネルのグリッド回転角 |
| `rotateG` | float | π/6 | G チャンネルのグリッド回転角 |
| `rotateB` | float | π/4 | B チャンネルのグリッド回転角 |
| `scatter` ⚡️ | float | 0 | ドットのランダム散布量 |
| `blending` | float | 1.0 | 元画像との混合比 |
| `blendingMode` ⚡️ | int | 1 | 1=Linear / 2=Multiply / 3=Add / 4=Lighter / 5=Darker |
| `greyscale` | bool | false | グレースケール変換 |

---

### 2-4. 🆕 BokehPass（`BokehPass`）

**実装難度：高（scene と camera への参照が必要）**

| パラメーター | 型 | デフォルト | 説明 |
|---|---|---|---|
| `focus` ⚡️ | float | 1.0 | ピント距離（カメラから何ユニット先にピントを合わせるか）|
| `aperture` ⚡️ | float | 0.025 | 絞り値（小さいほど被写界深度が浅くボケが強い）|
| `maxblur` ⚡️ | float | 1.0 | ボケの最大量 |
| `aspect` | float | camera.aspect | アスペクト比（カメラ連動・自動）|
| `nearClip` / `farClip` | float | camera値 | クリップ距離（カメラ連動・自動）|

---

### 2-5. 🆕 OutlinePass（`OutlinePass`）

**実装難度：高（scene・camera・selectedObjects が必要）**

| パラメーター | 型 | デフォルト | 説明 |
|---|---|---|---|
| `edgeStrength` ⚡️ | float | 3.0 | アウトラインの強さ |
| `edgeGlow` ⚡️ | float | 0.0 | アウトラインのグロー量 |
| `edgeThickness` ⚡️ | float | 1.0 | アウトラインの太さ |
| `visibleEdgeColor` ⚡️ | Color | 白 | 正面から見えるエッジの色 |
| `hiddenEdgeColor` | Color | 暗赤 | 裏側に隠れたエッジの色 |
| `pulsePeriod` ⚡️ | float | 0 | アウトラインのパルス周期（0=パルスなし）|
| `downSampleRatio` | int | 2 | 解像度の間引き比（パフォーマンス）|

---

### 2-6. 🆕 RenderPixelatedPass

**実装難度：中（scene・camera 参照が必要）**

| パラメーター | 型 | デフォルト | 説明 |
|---|---|---|---|
| `pixelSize` ⚡️ | int | — | ピクセルサイズ（1=等倍、8=荒いピクセル）|
| `normalEdgeStrength` ⚡️ | float | 0.3 | 法線差分によるエッジ検出の強さ |
| `depthEdgeStrength` ⚡️ | float | 0.4 | 深度差分によるエッジ検出の強さ |

---

## 3. 未実装 Shader（ShaderPass ラッパーで即実装可能）

Three.js に Shader として存在するが GeoGraphy に Plugin がないもの。
いずれも `ShaderPass` でラップするだけで FX Plugin として使える。

| Shader | 公開パラメーター | 概要 |
|---|---|---|
| `BleachBypassShader` | `opacity`（0〜1） | 映画技法「ブリーチバイパス」。コントラスト↑・彩度↓の重厚感 |
| `FreiChenShader` | `aspect`（Vector2） | Frei-Chen エッジ検出。映像を鉛筆スケッチ状に変換 |
| `ColorifyShader` | `color`（Color RGB） | 映像全体を1色で着色。輝度は保持 |
| `FocusShader` | `sampleDistance`（0〜1）, `waveFactor`（0〜0.01） | 画面周辺ぼかし＋中心フォーカス。チルトシフト風 |
| `BrightnessContrastShader` | `brightness`（-1〜1）, `contrast`（-1〜1） | ColorGrading より軽量なシンプル輝度・コントラスト調整 |

---

## 4. Geometry Plugin の全パラメーター対照

Geometry Plugin は現時点で公開済みパラメーターと実装済みパラメーターが一致している。

### 4-1. Icosphere

| パラメーター | 値域 | 説明 |
|---|---|---|
| `detail` | 0〜5 | 球面の細分割レベル（0=20面体、5=球に近い）|
| `radius` | 0.5〜10 | 球の半径 |
| `speed` | 0.0〜2.0 | 回転速度 |
| `hue` | 0〜360 | 色相 |

### 4-2. Torus

| パラメーター | 値域 | 説明 |
|---|---|---|
| `radius` | 0.5〜10 | ドーナツ全体の半径 |
| `tube` | 0.1〜4.0 | チューブの太さ |
| `radialSegs` | 3〜64 | 断面の分割数 |
| `tubularSegs` | 8〜256 | チューブ周囲の分割数 |
| `speed` | 0.0〜2.0 | 回転速度 |
| `hue` | 0〜360 | 色相 |

### 4-3. Torus Knot

| パラメーター | 値域 | 説明 |
|---|---|---|
| `radius` | 0.5〜8.0 | 全体半径 |
| `tube` | 0.1〜2.0 | チューブの太さ |
| `tubularSegs` | 32〜512 | チューブ分割数 |
| `radialSegs` | 3〜32 | 断面分割数 |
| `p` | 1〜8 | 軸周りの巻き数（形状が劇的に変わる）⚡️ |
| `q` | 1〜8 | チューブの巻き数（形状が劇的に変わる）⚡️ |
| `speed` | 0.0〜2.0 | 回転速度 |
| `hue` | 0〜360 | 色相 |

### 4-4. Hex Grid

| パラメーター | 値域 | 説明 |
|---|---|---|
| `cols` | 4〜30 | 列数 |
| `rows` | 4〜30 | 行数 |
| `hexSize` | 0.5〜5.0 | 六角形のサイズ |
| `maxHeight` | 0.0〜10.0 | 高さの最大値（波打ちの振幅）⚡️ |
| `speed` | 0.0〜2.0 | 波の速度 |
| `hue` | 0〜360 | 色相 |

### 4-5. Contour

| パラメーター | 値域 | 説明 |
|---|---|---|
| `speed` | 0.0〜2.0 | 等高線の流れる速度 |
| `scale` | 0.1〜2.0 | ノイズのスケール（等高線の「荒さ」）⚡️ |
| `amplitude` | 0.1〜8.0 | 高さの振幅（山の高さ）⚡️ |
| `segments` | 10〜150 | グリッド分割数 |
| `size` | 10〜500 | 地形の広さ |
| `hue` | 0〜360 | 色相 |

### 4-6. Grid Wave

| パラメーター | 値域 | 説明 |
|---|---|---|
| `speed` | 0.1〜2.0 | 波の流れる速度 |
| `amplitude` | 0.1〜2.0 | 波の高さ |
| `frequency` | 0.1〜1.0 | 波の周波数（波の細かさ）⚡️ |
| `segments` | 10〜100 | グリッド分割数 |
| `size` | 1〜500 | グリッドの広さ |

### 4-7. Grid Tunnel

| パラメーター | 値域 | 説明 |
|---|---|---|
| `speed` | 0.0〜3.0 | トンネルを流れる速度 ⚡️ |
| `radius` | 1.0〜10.0 | トンネルの半径 |
| `segments` | 3〜24 | 断面の分割数（3=三角、6=六角、多=円）⚡️ |
| `rings` | 5〜40 | リングの数（奥行きの密度）|
| `length` | 10〜100 | トンネルの全長 |
| `hue` | 0〜360 | 色相 |

---

## 5. Particle Plugin の全パラメーター対照

### 5-1. Starfield

| パラメーター | 値域 | 説明 |
|---|---|---|
| `count` | 500〜10000 | パーティクル数 |
| `depth` | 10〜200 | 星の奥行き範囲 |
| `speed` | 0.0〜2.0 | 流れる速度 |
| `size` | 0.01〜0.3 | 星のサイズ |
| `opacity` | 0.0〜1.0 | 透明度 ⚡️ |

---

## 6. Sequencer / MacroKnob 制御の最有力候補まとめ

| 優先度 | Plugin | パラメーター | 効果 |
|---|---|---|---|
| ★★★ | Kaleidoscope | `angle` | 万華鏡が回り続ける |
| ★★★ | Color Grading | `brightness` | ストロボ・暗転効果 |
| ★★★ | Feedback | `amount` | 映像が焼き付く・溶ける |
| ★★★ | Glitch | `distortion_x` | グリッチが画面を縦断 |
| ★★ | RGB Shift | `angle` | 色収差が回転 |
| ★★ | Zoom Blur | `strength` | ビートに合わせたズーム感 |
| ★★ | Grid Tunnel | `speed` | トンネルの加速・減速 |
| ★★ | Contour | `amplitude` | 地形の盛り上がり・平坦化 |
| ★★ | Torus Knot | `p` / `q` | 形状が別物に変わる（段階制御）|
| ★ | AfterImage | `damp` | 残像の長さが変わる |
| ★ | Starfield | `opacity` | 星が浮かび上がる・消える |
