# MIDI Registry Spec

> SSoT: このファイル
> 担当: Claude Desktop（設計）/ Claude Code（実装）
> 状態: Day55 設計確定

---

## 1. 概要

MIDI Registry は「今どの Plugin がどのレイヤーにロードされているか」を管理する動的な状態。
静的な CC 番号定義を管理する `ccMapService`（cc-map.json ベース）とは別物。

| | ccMapService | MIDIRegistry |
|---|---|---|
| 性質 | 静的（起動時固定） | 動的（Plugin Apply のたびに更新） |
| 内容 | Plugin × paramId → CC番号 の対応表 | 今ロードされている Plugin のパラメータ一覧 |
| 変更タイミング | cc-mapping.md 編集 + gen:cc-map 実行時 | Plugin Apply / Remove 時 |

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

// Phase A: MIDIRegistry に登録される型
interface RegisteredParameter extends ParameterSchema {
  layerId: string   // どのレイヤーのパラメータか
  pluginId: string  // どの Plugin のパラメータか
}

// Phase B: Window 選択後に ccNumber が追加される
interface RegisteredParameterWithCC extends RegisteredParameter {
  ccNumber: number  // ccMapService から取得した実効 CC 番号
}

// Registry 全体
interface MIDIRegistry {
  availableParameters: RegisteredParameter[]  // 全レイヤー分フラットに保持
  bindings: Map<number, string>               // CC番号 → paramId（bindings フェーズで使用）
}
```

---

## 3. 不変性ルール

Registry の更新は常に新しいオブジェクトを返す純粋関数で行う。
React state として管理するため、直接変更（ミューテーション）は禁止。

```typescript
// src/core/midiRegistry.ts
registerParams(registry, params, layerId): MIDIRegistry  // Apply 時
clearParams(registry, layerId): MIDIRegistry             // Remove 時
```

---

## 4. 実装フェーズ

### Phase A：Geometry 選択 → MIDIRegistry 登録

#### フロー

```
Plugin Manager → GeometryPlugin Apply（ユーザー操作）
  → plugin.getParameters() → ParameterSchema[]
  → App.tsx が layerId / pluginId を付与 → RegisteredParameter[]
  → registerParams() → MIDIRegistry.availableParameters に登録
```

#### 完了条件

- Plugin Apply 時に availableParameters に正しく登録される
- Plugin Remove 時に clearParams() で対象レイヤー分のみ除去される
- 他レイヤーの availableParameters は保持される
- bindings は空 Map のまま（Phase A では触らない）

#### Phase A で対象外

- ccNumber の付与
- WindowPlugin の起動
- bindings の更新

---

### Phase B：Window 選択 → ccNumber 付与 → UI 生成

#### 前提

Phase A が安定稼働していること。

#### フロー

```
Plugin Manager → WindowPlugin Apply（SimpleWindowPlugin / FxWindowPlugin）
  → ccMapService.getCcNumber(pluginId, paramId) を paramId ごとに呼ぶ
  → RegisteredParameter に ccNumber を追加 → RegisteredParameterWithCC[]
  → WindowPlugin が availableParameters を読んで ParamRow を動的生成
  → ユーザーが初めてパラメータを操作できる状態になる
```

#### Plugin Apply の2段階（確定）

```
① Geometry 選択（Phase A）
   → availableParameters に登録
   → MIDIRegistry の責務はここまで

② Window 選択（Phase B）
   → ccNumber を RegisteredParameter に追加
   → WindowPlugin が Registry を読んで UI を生成
```

Geometry と WindowPlugin は常にペアで選ぶ。
Plugin Manager がこのペアを管理する責務を持つ。

#### Phase B の未解決事項（要壁打ち）

1. **cc-mapping.md の整備状況**
   - 全 Plugin 分の CC 番号が定義されているか確認が必要
   - 未定義 param は CC1000〜 自動払い出し（ccMapService 実装済み）で良いか

2. **値域変換の責務**
   - pluginMin / pluginMax（Plugin の実値域）
   - ccMin / ccMax（0.0〜1.0 正規化）
   - この変換を誰が持つか（ccMapService / WindowPlugin / engine）

3. **多重レイヤー問題**
   - 同一 pluginId が複数レイヤーに存在する場合の ccNumber の扱い
   - bindings フェーズ（MacroKnob D&D）と一緒に設計する

---

## 5. 疎結合の原則

```
GeometryPlugin
  → getParameters() → ParameterSchema[]
  （CC番号を知らない / layerId も pluginId も知らない）

App.tsx（Orchestrator）
  → layerId / pluginId を付与
  → Phase B: ccMapService.getCcNumber() を呼んで ccNumber を取得
  → RegisteredParameter を組み立てて registerParams() に渡す

MIDIRegistry
  → 「今の状態」だけを持つ
  → ccMapService を知らない
  → GeometryPlugin を知らない

WindowPlugin
  → Registry を読んで ParamRow を動的生成
  → 特定の Geometry を知らない
```

---

## 6. bindings について

```typescript
bindings: Map<number, string>
// key:   MIDI CC 番号
// value: `${layerId}:${paramId}` 形式の一意キー
```

bindings は MacroKnob D&D UI が実装された時点で初めて意味を持つ。
Phase A / Phase B では空 Map のまま運用する。
Map のシリアライズ（JSON 保存時）は `Object.fromEntries()` で変換する。

---

## 7. ファイル構成

| ファイル | 役割 |
|---|---|
| `src/types/midi-registry.ts` | 型定義（ParameterSchema / RegisteredParameter / MIDIRegistry） |
| `src/core/midiRegistry.ts` | 純粋関数（registerParams / clearParams） |
| `src/ui/App.tsx` | Registry の React state・Orchestrator |

---

## 8. References

- `docs/spec/cc-mapping.spec.md` — CC マッピング仕様（静的定義）
- `docs/spec/plugin-manager.spec.md` — Plugin Manager 仕様（Phase A/B の起動点）
- `docs/spec/window-plugin.spec.md` — WindowPlugin 定義
- `src/core/ccMapService.ts` — 静的マッピングサービス
- `src/types/midi-registry.ts` — 型定義
- `src/core/midiRegistry.ts` — 純粋関数群
