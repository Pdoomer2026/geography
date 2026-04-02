# Shader Plugin Spec

> SSoT: このファイル
> 対応実装: `src/plugins/shaders/**`（未実装）
> 担当エージェント: Claude Code（実装時）
> 状態: ⬜ 設計記録済み・実装はシーケンサー完成後
> 策定日: Day34（2026-03-31）
> 最終更新: Day39（2026-04-03）— ModulatablePlugin 継承・疎結合/密結合分類・Block 8xx 連携を追加

---

## 1. Purpose（目的）

透明化した Geometry（位置データ専用）を骨格として、
Shader Plugin がその構造をリアルタイムで「描いていく」様子を可視化する。

**コアコンセプト**:
- Geometry は `material.opacity = 0`（透明）で位置データとして機能する
- Shader Plugin は `engine.getGeometryData(layerId)` で頂点・エッジ・面を受け取る
- Shader がその骨格をなぞることで「今まさに描いている」ように見える

**Graffiti ビジョン**:
- 多角形のエッジを一筆書きでトレース → ストリートアートの「一発描き」
- 面をスプレーノイズで塗りつぶす → スプレー缶のリアルな質感
- Geometry と Shader の組み合わせが N×M にならない疎結合設計

---

## 2. Constraints（不変条件・MUSTルール）

- MUST: Shader Plugin は `GeometryPlugin` とは**独立した型**として定義する
- MUST: Geometry の頂点・エッジ・面データは `engine.getGeometryData(layerId)` 経由で取得する（Geometry Plugin に直接依存しない）
- MUST: `renderer: 'threejs'` を必ず設定する
- MUST: `enabled: boolean` フィールドを持つ
- MUST: Plugin Lifecycle（`plugin-lifecycle.spec.md`）に従う（Setup でインスタンス化・Play 中は enabled 切り替えのみ）
- MUST: `destroy()` で Three.js リソース（geometry / material / mesh）を dispose する
- MUST: `uProgress (0.0〜1.0)` を PluginParam として公開する（シーケンサー・MIDI・LFO から制御可能にするため）
- MUST: `update()` 内で新規オブジェクトをアロケートしない
- MUST: FX Plugin（EffectComposer）とは**別レイヤー**で動作する。スクリーン空間ではなく Three.js シーン空間で描画する
- MUST: Geometry Plugin の `material` には触れない（透明化は Geometry Plugin 側の責務）

---

## 3. Interface（型・APIシグネチャ）

### 3-1. ShaderPlugin 型

```typescript
/**
 * ShaderPlugin は ModulatablePlugin を継承する。
 * params（uProgress 等）を持ち、CC Standard Block 8xx 経由で MacroKnob から外部制御される。
 * spec: docs/spec/cc-standard.spec.md §3 Block 8xx
 */
interface ShaderPlugin extends ModulatablePlugin {
  /** シーンに Three.js オブジェクトを追加する。GeometryData は engine 経由で取得 */
  create(scene: THREE.Scene): void
  /** 毎フレーム呼ばれる。uTime・uProgress を更新する */
  update(delta: number, beat: number): void
  /** Three.js リソースを破棄してシーンから除去する */
  destroy(scene: THREE.Scene): void
  // params: Record<string, PluginParam> ← ModulatablePlugin から継承（uProgress 必須）
}

// ModulatablePlugin → PluginBase（必須フィールド）
// renderer: 'threejs'  ← 必ず指定
// enabled: boolean     ← ON/OFF は create()/destroy() で制御（plugin-lifecycle.spec.md 準拠）
```

**疎結合 ShaderPlugin の create() について：**

```typescript
// ✅ 疎結合デフォルト（推奨）
// create() 内で engine.getGeometryData(layerId) を呼んで GeometryData を取得する
create(scene: THREE.Scene): void {
  const data = engine.getGeometryData(this.targetLayerId)
  if (!data) return
  // data.vertices / data.edges / data.faces を使って THREE.js オブジェクトを構築
}
```

### 3-2. GeometryData 型（新設・engine.ts に追加）

```typescript
/**
 * Shader Plugin に渡す Geometry の標準フォーマット。
 * Geometry Plugin の実装詳細に依存しない疎結合設計。
 */
interface GeometryData {
  /** 頂点座標の配列（THREE.Vector3） */
  vertices: THREE.Vector3[]
  /**
   * エッジ定義。各エッジは頂点インデックスのペア。
   * 例: [[0,1],[1,2],[2,0]] は三角形の3辺
   */
  edges: [number, number][]
  /**
   * 面定義。各面は頂点インデックスの配列。
   * 例: [[0,1,2]] は三角形の1面
   */
  faces: number[][]
  /** ジオメトリの種類（Shader Plugin の挙動最適化に使う） */
  type: 'polygon' | 'polyhedron' | 'terrain' | 'tunnel'
  /** バウンディングボックス（Shader の描画範囲計算用） */
  boundingBox: THREE.Box3
}
```

### 3-3. engine.getGeometryData() API（新設）

```typescript
// src/core/engine.ts に追加
getGeometryData(layerId: string): GeometryData | null
```

- 指定レイヤーの `GeometryPlugin` から頂点・エッジ・面データを取得して返す
- GeometryPlugin が未設定の場合は `null` を返す
- 実装時は各 GeometryPlugin に `getGeometryData(): GeometryData` メソッドを追加する

---

## 3-A. 疎結合 vs 密結合（カップリング分類）

Shader Plugin のカップリング方針は**ディレクトリ構造で分類**する。
Preferences 設定ではなく、Plugin の置き場所がそのまま設計意図を示す。

### 疎結合（デフォルト・推奨）

```
src/plugins/shaders/graffiti/
src/plugins/shaders/scan/
src/plugins/shaders/growth/
```

- `engine.getGeometryData(layerId)` 経由で標準 `GeometryData` を受け取る
- Geometry Plugin の実装詳細（内部クラス・UV 構造等）を**一切知らない**
- 任意の Geometry Plugin と組み合わせ可能（N×M 爆発なし）
- GeoGraphy コアビジョン（一筆書き・スプレー塗り）は疎結合で 9 割カバーできる

**疎結合で実現できること（主要ユースケース）：**

| ユースケース | 疎結合で可能か |
|---|---|
| エッジをなぞる一筆書きアニメーション | ✅ `edges` を `uProgress` に沿って描画 |
| 面をスプレーノイズで塗りつぶす | ✅ `faces` の頂点を PointCloud で描画 |
| `uTime` に連動した発光 | ✅ uniform で制御 |
| 任意の Geometry に適用 | ✅ `GeometryData` は共通フォーマット |
| シーケンサーで `uProgress` を時間制御 | ✅ `params.uProgress` 経由 |

### 密結合（例外・Geometry 専用 Shader）

```
src/plugins/shaders/native/
  icosphere/   ← Icosphere 専用
  hex-grid/    ← HexGrid 専用
  torusknot/   ← TorusKnot 専用
```

- Geometry Plugin クラスを直接 import して内部構造にアクセスする
- `src/plugins/shaders/native/` 配下にのみ配置する（他のカテゴリと混在禁止）
- `ShaderPlugin` ではなく `NativeShaderPlugin` として別型を定義する（実装時に検討）
- 使用する場面は以下の 3 ケースに限定する：

**密結合が必要な 3 ケース（Day39 壁打ちで確定）：**

| ケース | 説明 | 例 |
|---|---|---|
| **意味的部位アクセス** | 「特定の六角形だけ光らせる」など Geometry 固有の意味でアクセスしたい | HexGrid の 3 番目のセル |
| **毎フレーム変形データ同期** | 頂点が毎フレーム変わる Geometry のリアルタイム同期が必要 | Contour の地形変形中 |
| **Geometry 固有 UV 構造** | Torus の「穴の部分だけ」など固有の UV 知識が必要 | Torus の内側リング |

**密結合 Shader は `native/` に置く以外の制約：**
- ルート `index.ts` の `import.meta.glob` に `native/` を**含めない**（通常 Shader と分離）
- LayerManager は密結合 Shader の存在を知らない（Plugin Store の責務）
- `destroy()` 時は Geometry Plugin の dispose とタイミングを合わせること

---

## 4. Behavior（振る舞いの定義）

### 4-1. Effect Type（描画モード）

`uEffectType` パラメーターで描画モードを切り替える。

| 値 | 名前 | 内容 |
|---|---|---|
| 0 | Fill（面塗り） | ノイズ混じりの粒子で面を徐々に塗りつぶす |
| 1 | Outline（一筆書き） | エッジを `uProgress` に沿って光の粒子がなぞる |
| 2 | Detail（ディテール） | 液だれ・ハイライト・飛沫などの仕上げエフェクト |

### 4-2. 標準 Uniforms セット

全 Shader Plugin が共通で持つべき Uniforms：

```glsl
uniform float uTime;          // 経過時間（秒）
uniform float uProgress;      // 描画進捗 0.0〜1.0（PluginParam として公開）
uniform int   uEffectType;    // 描画モード（0=Fill / 1=Outline / 2=Detail）
uniform vec3  uColor;         // 描画色（Hue から変換）
uniform float uSprayRadius;   // スプレー半径（Fill モード用）
uniform float uLineWidth;     // ライン幅（Outline モード用）
uniform float uNoiseStrength; // ノイズ強度（スプレー質感）
uniform float uResolution;    // 解像度スケール
```

### 4-3. uProgress の制御元

`uProgress` は以下から供給される（シーケンサー完成後に全対応）：

| Trigger | 説明 |
|---|---|
| Manual | スライダー手動操作（v1 実装対象） |
| Clock/Beat | テンポ同期（シーケンサー完成後） |
| LFO | 自動ループ（シーケンサー完成後） |
| MIDI/OSC | 外部コントローラー（MacroKnob 経由） |

### 4-4. Graffiti 3-State シーケンス（将来実装）

同一の `GeometryData` を共有し、3つの ShaderPlugin を連続実行することで
「塗り → 縁取り → 仕上げ」が一体の作品として見える。

```
0%  ──── 70%:  [ShaderPlugin: graffiti-fill]     Outline が始まる直前まで塗る
60% ──── 90%:  [ShaderPlugin: graffiti-outline]  塗りが乾く前から縁取りを開始
85% ──── 100%: [ShaderPlugin: graffiti-detail]   縁取りが頂点を通過した瞬間に液だれ
```

この時間的オーバーラップ制御はシーケンサーのキーフレームとして保存・再利用する。

---

## 5. ディレクトリ構成

```
src/plugins/shaders/
├── index.ts                         ← import.meta.glob で自動登録
├── CLAUDE.md                        ← Shader Agent 向け実装ガイド
└── [category]/[name]/
    ├── index.ts                     ← ShaderPlugin export（default export）
    ├── [Name]Shader.ts              ← Three.js / GLSL ロジック
    ├── [name].config.ts             ← パラメーター定義
    ├── vert.glsl                    ← Vertex Shader
    ├── frag.glsl                    ← Fragment Shader
    ├── README.md                    ← ユーザー向け説明
    └── CLAUDE.md                    ← 実装ガイド
```

**カテゴリ（初期案）:**

| カテゴリ | 内容 |
|---|---|
| `graffiti/` | Graffiti コンセプト（fill / outline / detail） |
| `scan/` | Scan Wave・スペーススキャン系 |
| `growth/` | 成長・展開アニメーション系 |

---

## 6. Layer との関係

```
Layer
├── GeometryPlugin（alpha=0 で透明・位置データ専用）
├── ShaderPlugin   （GeometryData を受け取り描画）← 今回新設
└── FX Stack       （ポストプロセッシング・スクリーン空間）
```

- Shader Plugin は Geometry Plugin の**後**に Three.js シーンに追加する
- FX Stack はさらにその後（EffectComposer がシーン全体をポスト処理）
- 1レイヤーに Shader Plugin は複数設定可能（Graffiti 3-State など）

---

## 7. Test Cases（検証可能な条件）

```typescript
// TC-1: renderer / enabled フィールドが存在する
expect(plugin.renderer).toBe('threejs')
expect(plugin.enabled).toBeDefined()

// TC-2: uProgress が PluginParam として公開されている
expect(plugin.params.uProgress).toBeDefined()
expect(plugin.params.uProgress.min).toBe(0)
expect(plugin.params.uProgress.max).toBe(1)

// TC-3: create() 後にシーンにオブジェクトが追加される
const geoData = mockGeometryData()
plugin.create(scene, geoData)
expect(scene.children.length).toBeGreaterThan(0)

// TC-4: destroy() 後にシーンからオブジェクトが除去される
plugin.create(scene, geoData)
plugin.destroy(scene)
expect(scene.children.length).toBe(0)

// TC-5: update() は例外を投げない
expect(() => plugin.update(0.016, 0.5)).not.toThrow()

// TC-6: engine.getGeometryData() が GeometryData を返す
const data = engine.getGeometryData('layer-1')
expect(data).not.toBeNull()
expect(data!.vertices.length).toBeGreaterThan(0)
expect(data!.edges.length).toBeGreaterThan(0)
```

---

## 8. 実装時の注意事項

### CLAUDE.md への追記が必要なファイル（実装開始時）

- `src/types/index.ts` に `ShaderPlugin` / `GeometryData` 型を追加
- `src/core/engine.ts` に `getGeometryData()` メソッドを追加
- `src/plugins/geometry/*/index.ts` に `getGeometryData()` メソッドを追加
- `src/core/layerManager.ts` に ShaderPlugin のライフサイクル管理を追加
- `src/plugins/shaders/index.ts` を新規作成（import.meta.glob 自動登録）

### 実装前に読むべきファイル

1. このファイル（`docs/spec/shader-plugin.spec.md`）
2. `docs/spec/plugin-lifecycle.spec.md`
3. `docs/spec/geometry-plugin.spec.md`
4. `src/core/engine.ts`
5. `src/types/index.ts`
6. 既存 Geometry Plugin の実装例（`src/plugins/geometry/solid/icosphere/`）

---

## 9. 実装保留の理由（Day39 時点）

以下が完成するまで実装を保留する：

1. **シーケンサー**（`uProgress` の時間制御の主体）
   - Shader Plugin の本来の表現力は `uProgress` をシーケンサーで制御して初めて発揮される
   - シーケンサーなしで実装すると「手動スライダーで動かすだけ」になる
   - Graffiti コンセプトの核心（リアルタイム描画感）が実現できない

2. **Scene State Preset 保存**
   - Graffiti 3-State（fill → outline → detail）をプリセットとして保存・再利用するため

**Day39 時点の追加確認事項（保留を継続する根拠）：**
- 疎結合 / 密結合の分類方針が確定（Preferences トグルではなくディレクトリ分類）
- `ShaderPlugin` は `ModulatablePlugin` を継承することが確定
- Block 8xx（Shader Plugin 専用 CC）が `cc-standard.spec.md` に定義済み
- これらは実装時に反映する（spec が先行して整備済みの状態）

---

## 10. References

- `docs/spec/plugin-lifecycle.spec.md`
- `docs/spec/geometry-plugin.spec.md`
- `docs/spec/fx-stack.spec.md`
- `docs/spec/cc-standard.spec.md`（Block 8xx — Shader Plugin 専用 CC）
- `docs/spec/macro-knob.spec.md`（ModulatablePlugin → CC Standard → MacroKnob 制御フロー）
- `docs/spec/SDD-OVERVIEW.md`
- `src/types/index.ts`（ModulatablePlugin・PluginParam 型定義）
- Day33 壁打ち（Shader Plugin アーキテクチャ決定）
- Day34 壁打ち（Graffiti コンセプト・GeoGraffi ビジョン）
- Day37 壁打ち（ModulatablePlugin 確立・Plugin 二分類）
- Day39 壁打ち（疎結合 vs 密結合の分類方針確定・native/ ディレクトリ方式）
