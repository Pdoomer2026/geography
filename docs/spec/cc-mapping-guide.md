# GeoGraphy CC Mapping ガイド

> バージョン: v1.0（Day63・2026-04-15）
> 対象ファイル: docs/spec/cc-mapping.md（SSoT）
> CC Standard: docs/spec/cc-standard.spec.md

このファイルは `cc-mapping.md` の **読み方・ルール・拡張手順** を解説する仕様書です。
CC番号自体の定義は `cc-mapping.md` が SSoT です。このファイルは変更しないでください。

---

## 1. CC番号の読み方

### 構造

```
CC [L] [T] [S] [X] [P]
    ↑   ↑   ↑   ↑   ↑
    │   │   │   │   └── P: パラメータ連番（1桁・1〜9）
    │   │   │   └────── X: プラグイン内識別番号（1桁・0〜9）
    │   │   └────────── S: セマンティック分類（1桁・1〜9）
    │   └────────────── T: プラグイン種別（1桁・1〜5）
    └────────────────── L: ライブラリ（1桁・1〜2）
```

### 各桁の値一覧

#### L: ライブラリ

| 値 | 意味 |
|---|---|
| 1 | Three.js（現行） |
| 2 | 将来（Pixi.js 等） |

#### T: プラグイン種別

| 値 | 意味 |
|---|---|
| 1 | Geometry |
| 2 | Camera |
| 3 | Particle |
| 4 | FX |
| 5 | Shader（将来） |

#### S: セマンティック分類

| 値 | Block名 | 意味の領域 |
|---|---|---|
| 1 | EXISTENCE | 存在・量・透明度 |
| 2 | FORM | 形・密度・対称・複雑さ |
| 3 | MOTION | 動き・変形・周波数・位相 |
| 4 | COLOR | 色・明暗・彩度 |
| 5 | SPACE | 空間・位置・視点 |
| 6 | EDGE | 輪郭・境界・鮮鋭度 |
| 7 | BLEND | 混合・時間的蓄積・合成 |
| 8 | SHADER | Shader Plugin 専用 |
| 9 | SCENE | シーン全体のエネルギー |

#### X: プラグイン内識別番号

| 種別 | X の使い方 |
|---|---|
| Geometry | X=0 固定（同一レイヤーに1つのみ） |
| Camera | X=0 固定（同一レイヤーに1つのみ） |
| Particle | X=0 固定（同一レイヤーに1つのみ） |
| Shader | X=0 固定（同一レイヤーに1つのみ） |
| FX | X=1〜9（FX種別ごとに割り当て） |

FX の X桁割り当て（詳細は §3 参照）:

| X | FX名 |
|---|---|
| 0 | crt / film / frei-chen（セマンティック帯分離により衝突なし） |
| 1 | bloom |
| 2 | after-image |
| 3 | feedback |
| 4 | color-grading |
| 5 | glitch |
| 6 | kaleidoscope |
| 7 | rgb-shift |
| 8 | zoom-blur |
| 9 | mirror |

#### P: パラメータ連番

同一 `[L][T][S][X]` 内でパラメータを区別する番号（1〜9）。
意味の近いパラメータには近い番号を振る（例: Position X=1, Position Y=2, Position Z=3）。

---

### 読み方の具体例

```
CC11101
  L=1 → Three.js
  T=1 → Geometry
  S=1 → EXISTENCE
  X=0 → Geometry固定（インスタンス識別不要）
  P=1 → Primary Amount（radius, size, hexSize など）
  → Three.js Geometry の「主要な大きさ」パラメータ

CC14111
  L=1 → Three.js
  T=4 → FX
  S=1 → EXISTENCE
  X=1 → bloom
  P=1 → Primary Amount（strength）
  → bloom FX の「強さ」パラメータ

CC14151
  L=1 → Three.js
  T=4 → FX
  S=1 → EXISTENCE
  X=5 → glitch
  P=1 → Primary Amount（goWild）
  → glitch FX の「強さ」パラメータ

CC12502
  L=1 → Three.js
  T=2 → Camera
  S=5 → SPACE
  X=0 → Camera固定
  P=2 → Position Y（height）
  → Camera の「Y軸位置」パラメータ
```

---

## 2. cc-mapping.md の列の意味

各プラグインのマッピングテーブルは以下の列で構成されます。

| 列名 | 意味 | 例 |
|---|---|---|
| `paramId` | プラグイン内部のパラメータ名（TypeScript の params キー） | `radius`, `strength` |
| `CC#` | GeoGraphy CC番号（SSoT） | `CC11101` |
| `Block` | セマンティック分類名 | `EXISTENCE` |
| `blockName` | Block 内の具体的な役割名（cc-standard.spec.md で定義） | `Primary Amount` |
| `pluginMin` | プラグインが受け取る値の最小値 | `0.5` |
| `pluginMax` | プラグインが受け取る値の最大値 | `10.0` |
| `ccMin` | CC値の最小値（常に `0.0`） | `0.0` |
| `ccMax` | CC値の最大値（常に `1.0`） | `1.0` |
| `備考` | 特記事項（int変換・中心値・意味の補足など） | `int値`, `中心=0.5` |

### 値の変換式

CC値（0.0〜1.0）からプラグイン値への変換:

```typescript
pluginValue = pluginMin + ccValue * (pluginMax - pluginMin)

// 例: CC11101（radius）ccValue=0.5 の場合
// radius = 0.5 + 0.5 * (10.0 - 0.5) = 5.25
```

int値の場合は変換後に `Math.round()` を適用する。

中心=0.5 の場合（位置系パラメータ）:

```typescript
// CC12501（posX, pluginMin=-50, pluginMax=50）
// ccValue=0.5 → posX = -50 + 0.5 * 100 = 0（原点）
// ccValue=1.0 → posX = 50（右端）
// ccValue=0.0 → posX = -50（左端）
```

---

## 3. X桁ルールと衝突防止の考え方

### なぜ X桁が必要か

Geometry / Camera / Particle は同一レイヤーに1つしか存在しないため、同じセマンティック・同じ P 番号でも衝突しません。

しかし **FX は同一レイヤーに複数同時に有効になります**。X桁なしでは以下のような衝突が発生します:

```
bloom/strength    → CC14101  ← 衝突！
glitch/goWild     → CC14101  ← 衝突！
rgb-shift/amount  → CC14101  ← 衝突！
```

X桁でFX種別を識別することで:

```
bloom/strength    → CC14111（X=1）
glitch/goWild     → CC14151（X=5）
rgb-shift/amount  → CC14171（X=7）
```

衝突が解消されます。

### X=0 グループの衝突なし保証

crt / film / frei-chen は X=0 に共存していますが、使用するセマンティック帯が完全に分離しています:

```
crt:       EDGE帯（S=6）のみ → CC14601, CC14604
film:      EXISTENCE帯（S=1）+ COLOR帯（S=4） → CC14101, CC14401
frei-chen: EDGE帯（S=6）のみ → CC14601, CC14602
```

⚠️ **例外**: `crt`（CC14601）と `frei-chen`（CC14601）は同一 CC番号を持ちます。
これらは **同一レイヤーへの同時適用を禁止** することで衝突を回避しています。
将来的に同時適用が必要になった場合は、crt または frei-chen に X=1〜9 の空き番号を割り当てて解決してください。

---

## 4. MIDI 2.0 AC 空間の上限と枯渇防止ルール

### 上限

MIDI 2.0 Assignable Controllers（AC）空間: **0 〜 32,767**（32,768個）

### 現行体系の最大値

```
最大ありうる CC番号:
  L=2（Pixi.js）/ T=5（Shader）/ S=9（SCENE）/ X=9 / P=9
  → CC25999 = 25,999  ✅ 上限以内（余裕: 6,768）
```

### 枯渇防止のための設計原則

1. **L（ライブラリ）は 1〜3 まで**
   - L=3 の最大値: CC35999 = 35,999 → 上限超過 ❌
   - L は 1〜2 のみとし、第3ライブラリ追加時は設計を見直す

2. **T（種別）は 1〜5 まで**（現行: 5種）
   - T=6 の最大値: CC26999 = 26,999 ✅ ただしL=2と組み合わせて CC26999 まで
   - 種別追加は慎重に行う

3. **新しい種別で「同一レイヤーに複数」が起きうる場合は X桁を必ず活用する**

4. **CC番号追加前に必ず以下を確認する（§6 チェックリスト参照）**

---

## 5. 新 Plugin 追加時の手順

### ステップ1: L と T を決める

既存の種別に収まるか確認する。新種別が必要な場合は T の空き番号を割り当て。

### ステップ2: 同一レイヤーへの複数インスタンス有無を確認する

- 1つだけ → X=0 固定
- 複数ありうる → X桁割り当て表に新エントリを追加

### ステップ3: 各パラメータを S（セマンティック）に割り当てる

```
「このパラメータは何を制御しているか？」
  存在・量・透明度   → S=1（EXISTENCE）
  形・密度・対称     → S=2（FORM）
  動き・変形・周波数 → S=3（MOTION）
  色・明暗・彩度     → S=4（COLOR）
  空間・位置・視点   → S=5（SPACE）
  輪郭・境界・鮮鋭度 → S=6（EDGE）
  混合・時間的蓄積   → S=7（BLEND）
  Shader専用        → S=8（SHADER）
  シーン全体        → S=9（SCENE）※Plugin内部では使わない
```

### ステップ4: P（パラメータ連番）を決める

同一 `[L][T][S][X]` 内で既存番号と被っていないか確認し、空き番号を割り当てる。

### ステップ5: cc-mapping.md に追記する

```markdown
## FX: my-new-fx（X=N）

| paramId | CC#     | Block     | blockName      | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|---------|-----------|----------------|-----------|-----------|-------|-------|------|
| amount  | CC14N11 | EXISTENCE | Primary Amount | 0         | 1         | 0.0   | 1.0   |      |
```

### ステップ6: 自動生成物を再生成する

```bash
pnpm gen:all
```

生成物:
- `settings/cc-map.json`
- `src/types/geo-types.generated.d.ts`
- `src/types/geo-cc-map.generated.ts`

### ステップ7: ベースラインを確認する

```bash
pnpm tsc --noEmit && pnpm test --run
```

---

## 6. 衝突チェックリスト

新しい CC番号を追加・変更する前に以下を確認してください。

```
□ 追加する CC番号は 32,767 以下か？
□ 同じ CC番号が cc-mapping.md に既に存在しないか？（grep で確認）
□ X=0 グループに追加する場合、同一 [L][T][S] の番号が既存と被っていないか？
□ X=0 グループで EDGE帯（S=6）を使う場合、crt / frei-chen と P番号が被っていないか？
□ pnpm gen:all を実行して警告が出ないか？
□ pnpm tsc --noEmit でエラーが出ないか？
□ pnpm test --run で既存テストが全てグリーンか？
```

---

## 7. クイックリファレンス

### CC番号の分解

```
CC14613
  L=1  Three.js
  T=4  FX
  S=6  EDGE
  X=1  bloom
  P=3  3番目のパラメータ（radius = Sharpness/Blur）
```

### 種別別 X桁ルール早見表

```
Geometry  → X=0 固定
Camera    → X=0 固定
Particle  → X=0 固定
Shader    → X=0 固定
FX        → X=1〜9（種別別）, X=0（crt/film/frei-chen・帯分離保証）
```

### 上限チェック早見表

```
現行最大: CC25999 = 25,999  ✅
AC上限:              32,767
余裕:                 6,768
```
