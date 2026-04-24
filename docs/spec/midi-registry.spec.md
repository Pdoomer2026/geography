# MIDI Registry Spec

> SSoT: このファイル
> 担当: Claude Desktop（設計）/ Claude Code（実装）
> 状態: Day58 更新（TransportRegistry との役割分担を明記）

---

## 1. 概要

MIDI Registry は「今どの Plugin がどのレイヤーにロードされているか」を管理する動的な状態。
静的な CC 番号定義を管理する `ccMapService`（cc-map.json ベース）とは別物。

Day58 Step4 以降、Registry の実体は `transportRegistry`（コアシングルトン）に移行した。
`MIDIRegistry`（React state）は `transportRegistry` の「鏡」として機能する。

| | ccMapService | TransportRegistry | MIDIRegistry（React state） |
|---|---|---|---|
| 性質 | 静的（起動時固定） | 動的（Plugin Apply のたびに更新） | 鏡（TransportRegistry の購読） |
| 内容 | Plugin × paramId → CC番号 の対応表 | slot→paramId 対応・現在値 | UI 表示用のスナップショット |
| 変更タイミング | cc-mapping.md 編集 + gen:cc-map 実行時 | Plugin Apply / Remove 時 | TransportRegistry.onChanged 発火時 |
| 所在 | src/core/ccMapService.ts | src/core/transportRegistry.ts | App.tsx の useState |

---

## 2. 型定義

```typescript
// Plugin が getParameters() で返す型（layerId / pluginId を持たない）
interface ParameterSchema {
  id: string
  name: string
  min: number
  max: number
  step: number
}

// Phase A: Registry に登録される型
interface RegisteredParameter extends ParameterSchema {
  layerId: string   // どのレイヤーのパラメータか
  pluginId: string  // どの Plugin のパラメータか
}

// Phase B: ccNumber と value が追加される
interface RegisteredParameterWithCC extends RegisteredParameter {
  ccNumber: number  // ccMapService から取得した実効 CC 番号（= slot と同値）
  value: number     // engine の現在値（表示同期用）
}

// UI 用 Registry 全体（App.tsx の React state）
interface MIDIRegistry {
  availableParameters: RegisteredParameterWithCC[]
  bindings: Map<number, string>  // CC番号 → paramId（MacroKnob D&D フェーズで使用）
}
```

---

## 3. 不変性ルール

`MIDIRegistry`（React state）は不変オブジェクトとして扱う。
直接変更（ミューテーション）は禁止。

Day58 以降、`transportRegistry` への更新は engine / App.tsx 経由で行う。
純粋関数（`registerParams` / `clearParams` / `syncValues`）は後方互換のため残しているが、
**新規コードでは `transportRegistry` を直接使うこと。**

```typescript
// src/core/transportRegistry.ts（Day58 新設・推奨）
transportRegistry.register(params, layerId)   // Apply 時
transportRegistry.clear(layerId)              // Remove 時
transportRegistry.syncValue(pluginId, paramId, value)  // flushParameterStore 連動

// src/core/midiRegistry.ts（後方互換・非推奨）
registerParams(registry, params, layerId): MIDIRegistry
clearParams(registry, layerId): MIDIRegistry
syncValues(registry, getEngineValue): MIDIRegistry  // Day58 Step3 で廃止
```

---

## 4. 実装フェーズ

### Phase A：Geometry 選択 → Registry 登録

```
Plugin Apply（GeometrySimpleWindow の onPluginApply）
  → engine.registerPluginToTransportRegistry(layerId, pluginId)
  → plugin.getParameters() → ParameterSchema[]
  → ccMapService.getCcNumber() で ccNumber を付与（engine 内部のみ）
  → transportRegistry.register(enriched, layerId)
  → transportRegistry.onChanged() 発火 → App.tsx が midiRegistry を更新
```

### Phase B：Window 表示 → ParamRow 生成

```
App.tsx が midiRegistry.availableParameters を filter
  → SimpleWindowPlugin / FxWindowPlugin に props として渡す
  → ParamRow を動的生成
  → ユーザーがパラメータを操作できる状態になる
```

---

## 5. 疎結合の原則（Day58 更新版）

```
GeometryPlugin
  → getParameters() → ParameterSchema[]
  （CC番号を知らない / layerId も pluginId も知らない）

engine（Orchestrator）
  → ccMapService.getCcNumber() を呼んで ccNumber を取得（engine.initialize 内のみ）
  → RegisteredParameterWithCC を組み立てて transportRegistry.register() に渡す
  → flushParameterStore() で transportRegistry.getAll() を引いて plugin.params に反映
  → 値変化時に transportRegistry.syncValue() + paramChangedCallback を発火

TransportRegistry（コアシングルトン）
  → 「今の状態」（対応表 + 現在値）だけを持つ
  → ccMapService を知らない（engine が橋渡し）
  → GeometryPlugin を知らない
  → onChanged で UI 層に通知する

App.tsx（鏡）
  → transportRegistry.onChanged() を購読して midiRegistry state を更新するだけ
  → ccMapService を知らない（Day58 Step4 で依存を除去）

WindowPlugin
  → midiRegistry.availableParameters を filter するだけで params を取得できる
  → 特定の Geometry を知らない
  → 表示の min/max 変換は Window 側が担当
```

---

## 6. bindings について

```typescript
bindings: Map<number, string>
// key:   MIDI CC 番号（= slot）
// value: `${layerId}:${paramId}` 形式の一意キー
```

bindings は MacroKnob D&D UI が実装された時点で初めて意味を持つ。
Phase A / Phase B では空 Map のまま運用する。

---

## 7. ファイル構成

| ファイル | 役割 |
|---|---|
| `src/types/midi-registry.ts` | 型定義（ParameterSchema / RegisteredParameter / RegisteredParameterWithCC / MIDIRegistry） |
| `src/core/transportRegistry.ts` | コアシングルトン（Day58 新設・推奨） |
| `src/core/midiRegistry.ts` | 純粋関数（後方互換・非推奨） |
| `src/ui/App.tsx` | MIDIRegistry の React state（鏡）・TransportRegistry を購読 |

---

## 8. References

- `docs/spec/transport-architecture.spec.md` — Transport Architecture 全体仕様
- `docs/spec/cc-mapping.md` — CC マッピング（SSoT・人間が書く）
- `docs/spec/plugin-manager.spec.md` — Plugin Manager 仕様
- `docs/spec/window-plugin.spec.md` — WindowPlugin 定義
- `src/core/ccMapService.ts` — 静的マッピングサービス
- `src/core/transportRegistry.ts` — TransportRegistry（コアシングルトン）
- `src/types/midi-registry.ts` — 型定義
