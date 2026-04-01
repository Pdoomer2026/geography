# FX Visual Design Proposals

> **このドキュメントは `fx-parameter-reference.md` の上に乗る提案書**  
> 必ず `fx-parameter-reference.md` を併読すること。パラメーターの定義・値域・公開状態はそちらを参照。  
> このドキュメントは「そのパラメーターをどう動かすと何が生まれるか」だけを扱う。  
> 参照元: Three.js 公式ドキュメント・VJ コミュニティ（VDMX 等）の知見・ライブラリソース解析  
> 更新日: Day36（2026-03-31）

---

## 1. 既存 FX Plugin への映像設計提案

---

### Bloom

> Three.js 公式の UnrealBloomPass は Unreal Engine 4 の実装に着想を得たミップマップチェーン方式。
> 単純な加算ブレンドより遥かに自然な光の拡散を生む。
> **注意**: `strength=0` でも加算ブレンドによりシーンが微妙に明るくなる。
> 完全オフには `enabled=false`（instantiate しない）が必要。

**提案 A「ネオン光点」**
`threshold=0.8`, `strength=2.0`, `radius=0.3`。
黒背景のジオメトリエッジだけが強く光り、暗闇に浮かぶネオン看板の質感。

**提案 B「光に溶ける」**
`threshold=0`, `strength=3.0`, `radius=1.0`。
全体が光に溶けていく。Feedback と組み合わせると永遠に燃え続ける宇宙になる。

**🎯 Sequencer提案**
`strength` を BPM の4拍に合わせて 0.5 → 3.0 → 0.5 のパルス。
キックドラムと完全同期させると「映像がビートで爆発する」VJ の定番演出。

---

### AfterImage

> VJ 界では「テール」「ゴースト」と呼ばれる表現の基本中の基本。
> VDMX などプロ VJ ソフトでも最も多用されるエフェクトのひとつ。

**提案 A「ライトペインティング」**
`damp=0.97`。ジオメトリが動くたびに発光する尾を引く。
長時間露光写真のような軌跡が積み重なる。

**提案 B「時間が加速する」演出**
`damp` を 0.99 → 0.60 へ急激に落とす。
積み重なった残像が一瞬で消え「時間が加速した」感覚。

**🎯 Sequencer提案**
`damp` を 0.70〜0.97 の Sine 波で揺らす。残像の長さが音楽に合わせて呼吸する。
4小節ごとに `damp` を最大にして残像を蓄積し、ドロップで一気に消す演出が映える。

---

### Glitch

> **GeoGraphy で最も未開拓な Plugin。**
> 現在 `goWild` しか公開していないが内部には7つのパラメーターが眠っている。
> VJ コミュニティでグリッチは No.1 テクノ・rave 演出として挙げられる（LIME ART GROUP 調査）。
> `distortion_x/y` を制御することで映像の「どこが・どれだけ崩れるか」を完全に制御できる。

**提案 A「スキャン崩壊」**（要：`distortion_x` 公開）
`distortion_x` を Sequencer で 0.0 → 1.0 とゆっくり動かす。
グリッチ帯が画面の上から下へスキャンするように移動する。
テレビの砂嵐が流れ落ちるような映像。

**提案 B「一瞬の事故」演出**（要：`amount` 公開）
普段は `amount=0.005`（繊細な揺らぎ）にしておき、ドロップの瞬間だけ `amount=0.2` に跳ね上げる。
「起きてはいけないことが起きた」感覚を一瞬で作れる。

**提案 C「カラーブレイク」**（要：`col_s` 公開）
`col_s=0.2`, `amount=0.05`, `distortion_x=0.5` 固定。
RGB がゆっくり分離し続ける。Bloom と組み合わせると発光しながら崩れる映像。

**🎯 Sequencer提案**（要：複数パラメーター公開）
`distortion_x` を Sine 波 + `amount` を別の Sine 波で独立制御。
2軸が独立して動くと「制御された混沌」が生まれる。

**実装優先度：★★★**（`amount`, `distortion_x`, `distortion_y` の3つを公開するだけで表現が激変する）

---

### Kaleidoscope

> VJ コミュニティで「シンメトリービジュアル」は最も観客ウケする定番表現のひとつ。
> Mirror と組み合わせると強力な対称表現が生まれる。

**提案 A「永遠に回る結晶」**
`angle` を Sequencer で毎フレーム +0.01 ずつ加算。
Icosphere + Kaleidoscope + Bloom の組み合わせで宝石が光りながら回り続ける映像。

**提案 B「ドロップで分割数を変える」**
`segments=2`（ミラー）でビルドアップ → ドロップで `segments=12`（精密万華鏡）に切り替え。
見た目が突然変化する。

**拡張提案**（独自実装のため追加可能）
- `centerX / centerY` → 万華鏡の中心点を動かすと非対称に崩れる
- `zoom` → 折り返しの前にズームを加える。渦巻き効果が生まれる

**🎯 Sequencer提案**
`angle` を Saw 波（のこぎり）で動かす → 一定速度で回転し続ける万華鏡。

---

### RGB Shift

**提案 A「常時微細収差」**
`amount=0.002`, `angle=固定`。
常にわずかに収差があることで「デジタルなのに壊れかけている」質感。
No-Texture 美学と相性が良い。

**提案 B「回転する色分離」**
`angle` を Sequencer で継続的に増加。
RGB が画面上でぐるぐる回転しながらずれる。Kaleidoscope と組み合わせると特に強力。

**🎯 Sequencer提案**
`amount` を 0 → 0.03 のパルス。音に合わせて色が一瞬ぶれる。

---

### Feedback

> **VJ 界で最も歴史的に重要なエフェクトのひとつ。**
> VDMX 公式チュートリアルで「最も強力なリアルタイム映像技法」として筆頭に挙げられている。
> 映像が自己参照し始めると、フラクタルに近い無限の映像が生まれる。

**提案 A「無限の焼き付き」**
`amount=0.90`。ジオメトリが動くたびにその軌跡が画面に蓄積し続ける。
AfterImage より重厚な残像になる。

**提案 B「渦巻く宇宙」**（要：`scale` + `rotation` 拡張実装）
`amount=0.88`, `scale=1.002`, `rotation=0.001`。
フィードバックのたびに映像がわずかにズームしながら回転。映像が内側に吸い込まれ続ける。

**提案 C「ビルドアップとリセット」演出**
ビルドアップ中は `amount=0.93` で映像を蓄積し、ドロップの瞬間に `amount=0` でリセット。
それまで積み上がった映像が一瞬で消える。観客が息を呑む瞬間を作れる。

**🎯 Sequencer提案**
`amount` 単体で10通りの映像表現が作れる最もコスパの高い軸。Sequencer 最優先。

---

### Color Grading

**提案 A「突然のモノクロ」演出**
`saturation` を瞬間的に 1.0 → 0.0 に落とす。
カラーから白黒への切り替えは観客の注意を強制的に引く。

**提案 B「ストロボ」演出**
`brightness` を Square 波（矩形波）で 1.0 → 0.0 → 1.0 と高速切り替え。
Bloom と組み合わせると本物のストロボライトに近い表現。
**⚠️ 光感受性発作への配慮が必要（4Hz 以下推奨）**

**提案 C「夢の霧」**
`contrast=0.2`, `saturation=0.5`。映像全体が薄いベール越しに見える霧感。
Bloom を強くすると「夢の中」の映像になる。

**🎯 Sequencer提案**
`brightness` のパルス制御が最も即効性がある。ビート同期ストロボは VJ の定番。

---

### CRT

**提案 A「劣化した監視カメラ」**
`scanlineIntensity=0.7`, `curvature=0.3` + RGB Shift `amount=0.003`。
劣化した映像の質感になる。

**提案 B「控えめなレトロ」**
`scanlineIntensity=0.3` で常時かけておき他の FX と組み合わせる。
HalftonePass + CRT で「印刷された映像」の感覚が出る。

**拡張提案**（独自実装のため追加可能）
- `scanlineSpeed` → スキャンラインが流れる速度（遅くするとフリッカー感）
- `vignette` → 画面周辺を暗くするビネット効果（CRT の特徴）

---

### Zoom Blur

**提案 A「ドロップへの突入」**
ビルドアップ中に `strength` を 0 → 1.5 へ上昇させ、ドロップで 0 に戻す。
加速してから爆発するロケットの感覚。

**拡張提案**（独自実装のため追加可能）
- `centerX / centerY` → ブラーの中心点。動かすと映像が偏った方向に流れる

**🎯 Sequencer提案**
`strength` をキックに同期させた短いパルス。蹴り込むような映像の動きが生まれる。

---

### Mirror

**提案「4分割ミラー」**（要：拡張実装）
`horizontal` の 0/1 切り替えより遥かに映える。
Grid Tunnel + 4分割 Mirror の組み合わせは強力な対称トンネルになる。

**拡張提案**（独自実装のため追加可能）
- `quadrant` → 上下左右同時折り返し（4分割）
- `octant` → 8分割ミラー。Kaleidoscope に近い表現
- `angle` → ミラー面の角度を回転させる

---

## 2. 未実装 Pass・Shader への映像設計提案

---

### FilmPass（実装優先度 ★★★）

> フィルムノイズとグレースケールを1つで実現。実装難度が低く汎用性が高い。

**提案 A「有機的なノイズ」**
`intensity=0.3` を常時かけておくだけで映像に有機的なノイズが乗り、デジタルの硬さが消える。

**提案 B「古い SF 映画」**
Bloom（滲む光）+ FilmPass（モノクロ + フィルムノイズ）= 古い白黒 SF 映画の質感。
Color Grading の `saturation=0` より映画的な粒子感が生まれる。

---

### HalftonePass（実装優先度 ★★）

> `shape` の4種類が全て別の映像スタイルになる。

**`shape` 別の映像スタイル：**

| shape値 | 形状 | 映像スタイル |
|---|---|---|
| 1（Dot）| 円形ドット | 網点印刷。拡大すると印象派絵画 |
| 2（Ellipse）| 楕円 | 動体に追従して引き伸びる。動きが可視化される |
| 3（Line）| 直線 | スキャンライン状。CRT より鋭くシャープ |
| 4（Square）| 正方形 | ピクセルアート風。色の密度が高い |

**提案「カラーモアレ」**
`rotateR`, `rotateG`, `rotateB` を少しずつずらす。
印刷のズレのような虹色干渉縞が生まれる。

**🎯 Sequencer提案**
`radius` をビートに合わせてパルス → 点が大きくなったり小さくなる呼吸感。
`scatter` を揺らすとハーフトーンが崩れていく。

---

### RenderPixelatedPass（実装優先度 ★★）

**提案 A「ピクセルアートとジオメトリ」**
`pixelSize=6`, `normalEdgeStrength=0.5`。
3D ジオメトリがドット絵キャラクターのように見える。No-Texture コンセプトと親和性が高い。

**提案 B「崩壊するリアル」演出**
`pixelSize` を Sequencer で 1 → 16 → 1 とゆっくり動かす。
映像が粗くなってまた戻る。「解像度が壊れていく」表現。

**提案 C「発光するピクセルエッジ」**
`normalEdgeStrength=1.5` + Bloom を組み合わせ。
ピクセル化されたジオメトリのエッジが光る。レトロゲーム + ネオンの融合。

---

### OutlinePass（実装優先度 ★ ※ FXPlugin Interface 改修が必要）

> GeoGraphy の No-Texture コンセプトとの相性が全 Pass 中最高。
> テクスチャなし・アウトラインだけで描かれたジオメトリは GeoGraffi ビジョンの先行実装になりえる。

**提案 A「光るワイヤーフレーム」**
`edgeStrength=5`, `edgeGlow=2`, `edgeThickness=1` + Bloom。
ジオメトリのエッジだけが光る。暗闇に浮かぶ線画の世界。

**提案 B「パルスするアウトライン」**
`pulsePeriod` を BPM 同期。エッジが音楽に合わせて明滅する。

**提案 C「感情の色変化」**
`visibleEdgeColor` を動的に切り替える。赤=緊迫感、青=冷静、白=爆発。

---

### BleachBypassShader（実装優先度 ★★）

> 映画の現像技法「ブリーチバイパス」を再現。
> コントラストが上がり彩度が落ちた独特の「脱色感」が生まれる。
> 映画『プライベート・ライアン』『1984』に使われた質感。

**提案 A「終末感」**
`opacity=0.5` で常時適用。映像全体が重厚でシリアスなトーンになる。

**提案 B「脱色の演出」**
`opacity` を 0 → 1 へ徐々に上げる。カラフルな映像が徐々に「脱色」されていく。
「時間が止まった」瞬間の演出に使える。

---

### FreiChenShader（実装優先度 ★★★）

> Frei-Chen フィルターによる高精度エッジ検出。
> ジオメトリのエッジだけを抽出して白く表示する。
> OutlinePass と異なりポストプロセス全体に適用されるため「映像を鉛筆スケッチに変換する」効果。

**提案「鉛筆スケッチ映像」**
FreiChen で黒背景 + エッジだけを白く描く。
Three.js の 3D ジオメトリが手描き線画になる。

**組み合わせ提案「GeoGraffi プロトタイプ」**
FreiChen（エッジ抽出）+ Bloom（エッジだけが光る）+ ColorifyShader（線に色を付ける）。
No-Texture × 発光するエッジ。これが GeoGraffi ビジョンの最も手軽な実装形。

---

### ColorifyShader（実装優先度 ★★）

> 映像全体を指定した1色で着色する。輝度は保持しつつ色相を統一。

**提案「感情の色制御」**
赤=緊迫感、青=冷静、緑=マトリックス的、紫=幻想的。
ライブ中に `color` を切り替えると映像の感情が瞬時に変わる。

**🎯 Sequencer提案**
BPM に合わせて `color` を赤→青→白とサイクルさせる。「色のビート」が生まれる。

---

### FocusShader（実装優先度 ★）

> 画面周辺をぼかし、中心にフォーカスを当てる「チルトシフト風」エフェクト。
> BokehPass より GPU 負荷が軽い。

**提案「スポットライト」**
`sampleDistance=0.9` で常時かけると「中央だけが見える」スポットライト効果。
Icosphere を中央に置いて FocusShader をかけると球体に光が集まる神聖な感じになる。

---

## 3. Geometry 軸への映像設計提案

Geometry の params は全て公開済みだが「どの軸を Sequencer で動かすと映えるか」を整理する。

| Plugin | 最注目パラメーター | Sequencer での映像効果 |
|---|---|---|
| Icosphere | `detail` | 0〜5 を段階的に上げる → 球が徐々に滑らかになる「進化」表現 |
| Torus | `tube` | 0.1〜3.0 を Sine 波 → チューブが呼吸するように太くなったり細くなる |
| Torus Knot | `p` / `q` | 整数値を段階切り替え → 形が別の結び目に突然変化する（最強の演出軸）|
| Hex Grid | `maxHeight` | 0〜8 を Saw 波 → 六角形の地形が波打って盛り上がる |
| Contour | `amplitude` | BPM 同期パルス → 等高線地形が音に合わせて隆起・沈降する |
| Grid Wave | `frequency` | 0.1〜1.0 をゆっくり上昇 → 波が細かくなっていく「高ぶり」表現 |
| Grid Tunnel | `speed` | キックに合わせてパルス → トンネルが突進してくる感覚 |

---

## 4. 映像スタイル別 FX 組み合わせ提案

---

### Style A：「ネオン廃墟」
> テクノ・ダークウェーブ向け。暗闇に光るジオメトリ、色収差、崩壊。

```
Geometry:   Torus Knot（hue=280 紫）
FX:         Bloom（strength=2.5, threshold=0.7）
            RGB Shift（amount=0.008, angle を Sequencer で回転）
            Color Grading（saturation=0.8, contrast=1.3, brightness=0.8）
Sequencer:  RGB Shift.angle → Sine 波 0〜6.28
            Bloom.strength → キックにパルス 1.5 → 3.0
```

---

### Style B：「白昼夢の万華鏡」
> アンビエント・サイケデリック向け。ゆっくり回る光の世界。

```
Geometry:   Icosphere（detail=4, radius=3, hue=180）
FX:         Kaleidoscope（segments=8, angle を Sequencer で線形増加）
            AfterImage（damp=0.95）
            Bloom（strength=1.5, radius=0.8, threshold=0.1）
Sequencer:  Kaleidoscope.angle → Saw 波 0〜6.28（16小節でひと回り）
            AfterImage.damp → 0.90〜0.97 を Sine でゆっくり揺らす
```

---

### Style C：「崩壊するシステム」
> テクノ・インダストリアル向け。制御不能に崩れていく映像。

```
Geometry:   Grid Tunnel（segments=6, speed を Sequencer で加速）
FX:         Glitch（amount=0.02〜0.15, distortion_x を Sequencer で制御）
            Feedback（amount=0.88）
            CRT（scanlineIntensity=0.5）
Sequencer:  Glitch.distortion_x → Sine 波（グリッチが上下にスキャン）
            Glitch.amount → ドロップ時にパルス 0.01 → 0.2
            Grid Tunnel.speed → 4小節でゆっくり加速
```

---

### Style D：「ハーフトーンの夜」
> Lo-Fi・チルアウト向け。印刷物のような平面的な映像。

```
Geometry:   Contour（hue=160, amplitude=4）
FX:         HalftonePass（shape=1, radius=6, rotateR/G/B 微妙にずらす）
            Color Grading（saturation=0.6, contrast=1.1）
            FilmPass（intensity=0.2）
Sequencer:  Contour.amplitude → BPM 同期パルス
            HalftonePass.radius → 4〜10 を Sine 波（点が呼吸する）
```

---

### Style E：「GeoGraffi プロトタイプ」
> No-Texture × エッジ表現。Shader Plugin の前哨戦。

```
Geometry:   任意（Icosphere 推奨）
FX:         FreiChenShader（エッジ抽出）
            Bloom（strength=3.0, threshold=0, radius=0.5）
            Color Grading（saturation=0 → 単色映像）
            ColorifyShader（color=任意色でエッジに色を付ける）
```

---

## 5. 実装優先度まとめ

| 優先度 | 作業 | 理由 |
|---|---|---|
| ★★★ | Glitch 未公開パラメーター公開（`amount`, `distortion_x/y`）| 既存 Plugin 改修のみ・表現が激変する |
| ★★★ | Feedback の `scale` / `rotation` 拡張 | 「渦巻く宇宙」表現が生まれる。独自実装なので改修のみ |
| ★★★ | FilmPass Plugin 化 | 実装が簡単・常時かけて使える汎用性 |
| ★★★ | FreiChenShader Plugin 化 | No-Texture コンセプトとの親和性最高・ShaderPass ラッパーで完結 |
| ★★ | HalftonePass Plugin 化 | `shape` の4種類だけで4通りの見た目 |
| ★★ | BleachBypassShader Plugin 化 | `opacity` 1つで映像の質感が激変 |
| ★★ | ColorifyShader Plugin 化 | `color` のリアルタイム変更が Sequencer の目玉になりえる |
| ★★ | RenderPixelatedPass Plugin 化 | `pixelSize` + `normalEdgeStrength` で No-Texture 表現に新軸 |
| ★ | Mirror の4分割拡張 | 独自実装の改修のみ。万華鏡に近い表現へ |
| ★ | OutlinePass Plugin 化 | Interface 改修が必要だが No-Texture 最終形 |
