# LayerMacroPreset Spec

> SSoT: このファイル
> 担当: Claude Desktop（設計） / Claude Code（実装）
> ブランチ: `feature/layer-macro-preset`
> 状態: Day87 設計完了・実装待ち

---

## 1. 概要

GeoGraphy の MacroKnob を2種類に分離し、レイヤー単位で
Macro + Geometry + Camera + FX を一括保存・ロードできる仕組みを実装する。

### 2種類の MacroKnob

| 種別 | ID 形式 | 用途 | APC40 |
|---|---|---|---|
| **Global Macro**（既存） | `macro-1` 〜 `macro-8` | 複数レイヤーを横断して同時制御 | Track Knobs（CC48〜55, ch0）|
| **Layer Macro**（新設） | `layer-1:macro-1` 等 | レイヤー専用・Preset に含める | Device Banks（CC16〜23, ch0/1/2）|

**既存の Global Macro は一切変更しない。Layer Macro は追加のみ。**

---

## 2. UI レイアウト

### Inspector Layer タブ

```
┌─────────────────────────────┐
│ MIXER │ LAYER               │
├─────────────────────────────┤
│  ▼ MACRO (Global)           │  ← L1/L2/L3 共通・常にここ
│    ○ ○ ○ ○                 │    全レイヤー横断アサイン可
│    ○ ○ ○ ○                 │
│                             │
│ [L1] [L2] [L3]              │  ← タブを右クリック → Save/Load
├─────────────────────────────┤
│  ▼ MACRO (Layer)            │  ← activeLayer で切り替わる
│    ○ ○ ○ ○                 │    このレイヤー専用ノブ
│    ○ ○ ○ ○                 │
│                             │
│  ▼ GEOMETRY                 │
│  ▼ CAMERA                   │
│  ▼ FX                       │
└─────────────────────────────┘
```

### L1/L2/L3 タブ右クリックメニュー

```
┌───────────────────────┐
│ L1 LayerPreset        │
│───────────────────────│
│ Save as...            │
│ Load                  │
│   > PresetA           │
│   > PresetB           │
│───────────────────────│
│ Reset to default      │
└───────────────────────┘
```

- **Save as...** → 名前入力 → `engine.captureLayerMacroPreset(layerId, name)` を呼ぶ
- **Load > PresetX** → `engine.replaceLayerMacroPreset(layerId, preset)` を呼ぶ
- **Reset to default** → Layer Macro アサインを全クリア・Geometry/Camera/FX はそのまま

---

## 3. LayerMacroPreset スキーマ

既存の `LayerPreset` を拡張する形で定義する。

```typescript
// zod/layerPreset.schema.ts に macroKnobs を追加

const MacroKnobConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  midiCC: z.number(),
  assigns: z.array(MacroAssignSchema),
})

export const LayerPresetSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  geometryPluginId: z.string(),
  cameraPluginId: z.string(),
  fxPluginIds: z.array(z.string()),
  geometryParams: z.record(z.string(), z.number()).optional(),
  cameraParams: z.record(z.string(), z.number()).optional(),
  createdAt: z.string().datetime(),
  // ↓ 新規追加（optional = 既存プロジェクトの後方互換を保持）
  macroKnobs: z.array(MacroKnobConfigSchema).optional(),
})
```

---

## 4. LayerAssignRegistryManager（新設）

既存の `assignRegistry`（Global）は**一切変更しない**。

```typescript
// src/application/registry/layerAssignRegistry.ts（新規作成）

class LayerAssignRegistryManager {
  private registries: Map<string, AssignRegistryImpl> = new Map()

  forLayer(layerId: string): AssignRegistryImpl {
    if (!this.registries.has(layerId)) {
      this.registries.set(layerId, new AssignRegistryImpl(`${layerId}:macro`))
    }
    return this.registries.get(layerId)!
  }

  getAll(): { layerId: string; registry: AssignRegistryImpl }[] {
    return Array.from(this.registries.entries())
      .map(([layerId, registry]) => ({ layerId, registry }))
  }
}

export const layerAssignRegistry = new LayerAssignRegistryManager()
```

### Knob ID の名前空間

```
Global:     macro-1 〜 macro-8          （既存・変更なし）
Layer L1:   layer-1:macro-1 〜 layer-1:macro-8  （新設）
Layer L2:   layer-2:macro-1 〜 layer-2:macro-8  （新設）
Layer L3:   layer-3:macro-1 〜 layer-3:macro-8  （新設）
```

---

## 5. Engine API 拡張

**既存メソッドは一切変更しない。** Layer Macro 用メソッドを追加のみ。

```typescript
// engine.ts に追加するメソッド

// Layer Macro の取得
getLayerMacroKnobs(layerId: string): MacroKnobConfig[]

// Layer Macro の値操作
getLayerMacroKnobValue(knobId: string, layerId: string): number
setLayerMacroKnobValue(knobId: string, value: number, layerId: string): void
receiveMidiLayerModulation(knobId: string, value: number, layerId: string): void

// Layer Macro のアサイン操作
addLayerMacroAssign(knobId: string, assign: MacroAssign, layerId: string): void
removeLayerMacroAssign(knobId: string, geoParamAddress: string, layerId: string): void

// Layer Macro MIDI Learn
startLayerMacroMidiLearn(knobId: string, layerId: string): void
getLayerMacroLearnedCC(knobId: string, layerId: string): number
clearLayerMacroLearnedCC(knobId: string, layerId: string): void

// LayerMacroPreset の capture / restore
captureLayerMacroPreset(layerId: string, name: string): LayerPreset
  // LayerPreset + macroKnobs[8] を一括取得

replaceLayerMacroPreset(layerId: string, preset: LayerPreset): void
  // Geometry + Camera + FX + macroKnobs を一括差し替え
  // macroKnobs が undefined の場合は Geometry/Camera/FX のみ差し替え（後方互換）
```

---

## 6. TransportManager 拡張

MIDI 受信時に Layer Macro を経由させる経路を追加する。

```
MIDI 受信（APC40 Device Bank ch0〜2）
  → slot = ch * 128 + cc（cc16〜23）
  → ch0 = L1, ch1 = L2, ch2 = L3 に対応
  → layerAssignRegistry.forLayer(layerId) でアサインを解決
  → assign.geoParamAddress に値を書く
```

既存の Global Macro 経路（`assignRegistry`）はそのまま保持する。

```typescript
// TransportManager に追加
receiveLayerModulation(knobId: string, value: number, layerId: string): void
```

---

## 7. GeoStore 拡張

既存の `macroKnobs` / `macroValues` は**そのまま保持**。Layer Macro 用を追加。

```typescript
// geoStore.ts に追加
macroKnobsByLayer: Record<string, MacroKnobConfig[]>
macroValuesByLayer: Record<string, number[]>
syncLayerMacroKnobs: (layerId: string) => void
removeLayerAssign: (knobId: string, geoParamAddress: string, layerId: string) => void
```

---

## 8. MacroPanel 拡張

`MacroPanel` に `layerId` prop を追加する（optional）。

```typescript
// 変更前
export function MacroPanel() { ... }

// 変更後
interface MacroPanelProps {
  layerId?: string  // 渡されなければ Global Macro を表示（既存動作）
}
export function MacroPanel({ layerId }: MacroPanelProps) { ... }
```

`LayerTab.tsx` の変更：

```tsx
// Global Macro セクション（タブ外・L1/L2/L3 共通）
<LayerAccordion title="MACRO (Global)" ...>
  <MacroPanel />  // layerId なし → Global
</LayerAccordion>

// L1/L2/L3 タブ
<LayerAccordion title="MACRO (Layer)" ...>
  <MacroPanel layerId={activeLayer} />  // layerId あり → Per-layer
</LayerAccordion>
```

---

## 9. L1/L2/L3 タブの右クリックメニュー

`LayerTab.tsx` の L1/L2/L3 タブボタンに `onContextMenu` を追加。

```typescript
// LayerTabContextMenu コンポーネント（新規）
// props: layerId, presets, onSave, onLoad, onReset, onClose
```

Preset の永続化は既存の `layerPresetStore`（localStorage）を拡張して使う。

---

## 10. APC40 mk2 推奨マッピング（Layer Macro 用）

```
Device Bank 1（ch0, CC16〜23 → slot 16〜23）  → L1 Layer Macro #1〜#8
Device Bank 2（ch1, CC16〜23 → slot 144〜151）→ L2 Layer Macro #1〜#8
Device Bank 3（ch2, CC16〜23 → slot 272〜279）→ L3 Layer Macro #1〜#8
```

Bank 選択は APC40 のバンク切替ボタンで切り替える。
8バンク × 8ノブの設計が Layer Macro とそのまま対応する。

---

## 11. 実装フェーズ

| Phase | 内容 | リスク | 完了条件 |
|---|---|---|---|
| 1 | `LayerPresetSchema` に `macroKnobs` 追加 | 低 | tsc + test |
| 2 | `layerAssignRegistry.ts` 新規作成 | 中 | tsc + test |
| 3 | `engine.ts` に Layer Macro API 追加 | 中 | tsc + test |
| 4 | `transportManager.ts` に Layer 経路追加 | 低 | tsc + test |
| 5 | `geoStore.ts` に per-layer 状態追加 | 低 | tsc + test |
| 6 | `MacroPanel` に `layerId` prop 追加 | 低 | ブラウザ確認 |
| 7 | `LayerTab` の構造変更（Global上部・Layer下部） | 低 | ブラウザ確認 |
| 8 | L1/L2/L3 タブ右クリックメニュー | 低 | ブラウザ確認 |
| 9 | `captureLayerMacroPreset` / `replaceLayerMacroPreset` | 低 | ブラウザ確認 |

---

## 12. 設計上の制約

- **Global Macro の破壊禁止**: 既存 `assignRegistry` / `getMacroKnobs()` 等は無変更
- **後方互換**: `macroKnobs` は optional → 既存 LayerPreset ファイルが壊れない
- **Knob ID 名前空間分離**: `layer-1:macro-1` 形式で Global と衝突しない
- **Sequencer への道**: `replaceLayerMacroPreset` が Sequencer の自動切替のターゲットになる

---

## 13. 将来の拡張

```
Sequencer（実装予定）
  Timeline
    Bar 1: engine.replaceLayerMacroPreset('layer-1', PresetA)
    Bar 5: engine.replaceLayerMacroPreset('layer-1', PresetD)
                ↑
    Geometry + Camera + FX + Layer Macro アサインが一括で入れ替わる
    APC40 の Device Bank がそのレイヤーのノブセットとして機能し続ける
```

---

## 14. References

- `docs/spec/macro-knob.spec.md` — MacroKnob システム全体仕様
- `docs/spec/layer-window.spec.md` — LayerPreset / ClipGrid 仕様
- `docs/spec/midi-learn.spec.md` — MIDI Learn / slot エンコーディング
- `docs/spec/devices/apc40mk2.md` — APC40 mk2 実機確認済みマッピング
- `src/application/registry/assignRegistry.ts` — Global AssignRegistry 実装
- `src/application/schema/zod/layerPreset.schema.ts` — LayerPreset スキーマ
- `src/ui/components/inspector/tabs/LayerTab.tsx` — Inspector Layer タブ
- `src/ui/components/inspector/layer/panels/MacroPanel.tsx` — MacroPanel 実装
