# GeoGraphy 商用化設計書 v1.0

> 作成日: 2026-04-15（Day62）  
> ステータス: 境界設計・SDK・Debugツール 完成。Build Engineering は OSS 公開直前フェーズ。

---

## 1. 基本思想

### ❌ 間違い
- 難読化すれば守れる
- 全て隠せばコピーされない

### ✅ 正解
- 構造で守る
- 境界で守る
- 再現コストを上げる

### 核心：ホワイト仕様 × ブラック実装

- **仕様（挙動・ルール）は公開する**
- **実装（アルゴリズム・内部構造）は隠す**

---

## 2. レイヤー構造（Day62 時点・確定）

```
[公開レイヤー]
  Plugin SDK         src/types/ の interface 群
  Spec               docs/spec/cc-mapping.md（SSoT）
  型定義             src/types/geo-types.generated.d.ts（自動生成）
  Debugツール        GeoMonitorWindow（キー 6）

[非公開レイヤー（engine 内部に隠蔽済み）]
  Registry Engine    TransportRegistry / AssignRegistry
  State Propagation  TransportManager / flushParameterStore
  Scheduler/Timing   Clock / programBus / previewBus
  最適化層           ParameterStore / ccMapService
```

**Day62 で達成したこと:**  
全 Window / App が `engine` のみを import する状態になった。  
`transportRegistry` / `assignRegistry` / `transportManager` は engine の内側に完全に閉じた。

---

## 3. 境界設計ルール（確定・実装済み）

### ルール①: 結果は見せる・過程は隠す
```typescript
// 公開: パラメータの現在値
engine.getParametersLive(layerId?)

// 非公開: 解決ロジック（engine._readLiveValue）
```

### ルール②: 決定権はコアに持たせる
```typescript
// Window は提案するだけ
engine.handleMidiCC({ slot, value, source: 'window', layerId })

// コアが最終決定（TransportManager → ParameterStore → flushParameterStore）
```

### ルール③: 観測は許す・操作は制限
```typescript
// 観測: GeoMonitor が全パラメータをリアルタイム表示
engine.getParametersLive()  // 読み取り専用

// 操作制限: transportRegistry を外部から直接 register/clear できない
// → engine.removePluginFromRegistry() / registerPluginToTransportRegistry() 経由のみ
```

---

## 4. SDK 設計（Day62 時点・確定）

### 4.1 公開 API（engine ファサード）

```typescript
// 値の送信（Window → コア）
engine.handleMidiCC(event: TransportEvent): void

// 値の購読（構造変化）
engine.onRegistryChanged(cb: () => void): () => void

// パラメータ一覧（Registry スナップショット）
engine.getParameters(layerId?: string): RegisteredParameterWithCC[]

// パラメータ一覧（plugin.params 生値・GeoMonitor 専用）
engine.getParametersLive(layerId?: string): RegisteredParameterWithCC[]

// Plugin 登録・削除
engine.registerPluginToTransportRegistry(layerId, pluginId): void
engine.removePluginFromRegistry(layerId): void

// MacroKnob / AssignRegistry
engine.getMacroKnobs(): MacroKnobConfig[]
engine.setMacroKnob(id, config): void
engine.getMacroKnobValue(knobId): number
engine.setMacroKnobValue(knobId, value): void
engine.addMacroAssign(knobId, assign): void
engine.removeMacroAssign(knobId, paramId): void
engine.receiveMidiModulation(knobId, value): void
```

### 4.2 Minimal Glue Hooks（Day62 新設）

```typescript
// src/ui/hooks/useParam.ts

// 単一 plugin のパラメータを購読（Window 開発の標準パターン）
useParam(layerId: string, pluginId: string): RegisteredParameterWithCC[]

// 全パラメータを購読（GeoMonitor 専用・100ms ポーリング）
useAllParams(layerId?: string): RegisteredParameterWithCC[]
```

### 4.3 Plugin Interface（公開型定義）

```typescript
// src/types/index.ts
PluginBase / ModulatablePlugin
GeometryPlugin / FXPlugin / CameraPlugin / ParticlePlugin
WindowPlugin / TransitionPlugin / MixerPlugin
PluginParam / ParameterSchema
TransportEvent / MacroKnobConfig / MacroAssign
SceneState / LayerState / GeoGraphyProject
```

---

## 5. Dynamic Type Definition（Day62 新設・確定）

### パイプライン

```
docs/spec/cc-mapping.md（人間が編集する唯一の真実）
  ↓ pnpm gen:cc-map
settings/cc-map.json（自動生成・手動編集禁止）
  ↓ pnpm gen:types
src/types/geo-types.generated.d.ts   （型定義・手動編集禁止）
src/types/geo-cc-map.generated.ts    （実行時定数・手動編集禁止）
```

### 生成される型

```typescript
// Plugin ID ユニオン型
type GeometryPluginId = 'icosphere' | 'torus' | ...
type FxPluginId = 'bloom' | 'after-image' | ...
type PluginId = GeometryPluginId | FxPluginId | ParticlePluginId

// pluginId → 有効な paramId
type ParamIdOf<T extends PluginId> = T extends 'icosphere' ? 'radius' | 'detail' | ... : ...

// 実行時定数（CC番号・min/max）
const GEO_CC_MAP = {
  'icosphere': { 'radius': { ccNumber: 11101, pluginMin: 0.5, pluginMax: 10, ... } }
  ...
}
```

### コントリビューターの開発フロー

```
① cc-mapping.md に新 Plugin の paramId を追記
② pnpm gen:all（cc-map.json + 型定義を自動再生成）
③ IDE が即座に補完・タイポは tsc がエラー
④ Window Plugin を型安全に実装
```

---

## 6. Debugツール（Day62 新設・確定）

### GeoMonitorWindow

- キー `6` でトグル表示
- TransportRegistry の全エントリを `engine.getParametersLive()` で取得
- レイヤーフィルタ（ALL / L1 / L2 / L3）+ テキスト検索
- 値バーが 100ms ポーリングでリアルタイム更新
- plugin.params を直接読むため Camera / FX も正確に追従

**発見した問題（Day62）:**  
FX の CC 番号衝突（同一セマンティックの FX が CC14101 を共有）  
→ `cc-mapping.md` の下2桁を FX ごとに一意にすることで解決予定

---

## 7. 現在のディレクトリ構造 vs 将来のモノレポ構成

### 現在（Day62）

```
src/
  core/      → 将来の packages/core（非公開・WASM 化対象）
  ui/        → 将来の packages/app（UI）
  types/     → 将来の packages/sdk の型部分
  plugins/   → 将来の packages/sdk の Plugin 実装部分
  drivers/   → 将来の packages/core（Input Wrapper）
```

### 将来（OSS 公開時）

```
packages/
  core/      非公開・WASM 化（TransportManager / TransportRegistry / flushParameterStore）
  sdk/       公開 API（engine ファサード / useParam Hook / 型定義）
  app/       UI（Window Plugin 群 / App.tsx）
```

**モノレポ分割のタイミング: OSS 公開直前**  
現在の src/ の責務分離がそのまま packages/ に対応するため、分割コストは低い。

---

## 8. Build Engineering（未着手・OSS 公開直前フェーズ）

### ビルドフロー（将来）

```
[開発コード]
  ↓ 構造分離（packages/core → WASM）
  ↓ Rust + wasm-pack（core のロジックを WASM 化）
  ↓ esbuild（TypeScript → JavaScript・依存統合）
  ↓ JS + WASM 統合
  ↓ javascript-obfuscator（識別子変換・制御フロー変換）
  ↓ Terser（Minify・Tree shaking）
  ↓ dist/（配布物・実行専用）
```

### WASM 化対象（確定）

engine 内部に隠蔽済みの以下が対象：

```
TransportManager      CC入力解決・ParameterStore 書き込みロジック
TransportRegistry     slot → pluginId:paramId 対応表
flushParameterStore   値の最終反映ロジック
ParameterStore        値の一時バッファ
Clock                 フレーム同期・BPM 管理
```

**WASM 化の前提条件（Day62 で完成）:**  
全 Window が engine ファサード経由のみでコアにアクセスする構造が確定した。  
Window が直接 `transportRegistry` 等を触る経路が存在しないため、コアを丸ごと WASM に置き換えられる。

### 運用ルール

```
✅ 配布コードは生成物であり編集しない
✅ 難読化コードは Git 管理しない
✅ dev モード: 可読コード / SourceMap あり / Debug ON
✅ prod モード: 難読化 / 最適化 / Debug 制限
```

---

## 9. 既知の課題・TODO

| 課題 | 優先度 | 対応方法 |
|---|---|---|
| FX の CC 番号衝突 | 高 | `cc-mapping.md` の下2桁を FX ごとに一意化 → `pnpm gen:all` |
| Sequencer の `ParamPath` 型 | 中 | Sequencer spec 策定時に `"pluginId.paramId"` フラット型を追加生成するか判断 |
| モノレポ分割 | 低 | OSS 公開直前に実施 |
| WASM 化 | 低 | OSS 公開直前に実施 |
| 難読化・esbuild 設定 | 低 | OSS 公開直前に実施 |
| LICENSE ファイル追加 | 低 | OSS 公開直前に実施 |

---

## 10. 変更履歴

| バージョン | 日付 | 内容 |
|---|---|---|
| v1.0 | 2026-04-15 | Day62 の実装を踏まえて初版作成。境界設計・SDK・Debugツール・型生成パイプラインを確定版として記載 |
