# Day50 実装プロンプト：MidiManager 責務分離

## 背景・設計方針（必ず読むこと）

Day50 の壁打ちで以下の設計が確定した。

### 責務分離の核心

現在の `src/core/macroKnob.ts` に2つの責務が混在している。これを分離する。

```
【分離前】
macroKnob.ts
  - 32ノブのUI設定管理（getKnobs / setKnob / addAssign / removeAssign / getValue）
  - CC入力の処理（handleMidiCC / receiveModulation）  ← ここを切り出す

【分離後】
macroKnob.ts     → 32ノブのUI設定管理のみ（getValue / setValue を持つ）
midiManager.ts   → CC入力の唯一の通路（handleMidiCC / receiveModulation）新規作成
```

### アーキテクチャ（全UI同列・MIDI 2.0統一）

```
GeometrySimpleWindow / CameraSimpleWindow / FxSimpleWindow / MacroKnobPanel
  ↓ 全部同じ入り口
engine.handleMidiCC(MidiCCEvent)
  ↓
MidiManager（新設）
  ↓ MacroKnobManager のアサイン設定を参照（読み取りのみ）
  ↓ rangeMap → ParameterStore
Plugin.params.value
```

### 重要：MacroKnobPanel の変更

現在 `MacroKnobPanel.tsx` は `macroKnobManager` を直接 import している。
これを `engine` 経由に変更する。

```typescript
// Before（禁止）
import { macroKnobManager } from '../../../core/macroKnob'
macroKnobManager.getKnobs()
macroKnobManager.getValue(id)
macroKnobManager.setKnob(id, config)

// After（正しい）
import { engine } from '../../../core/engine'
engine.getMacroKnobs()
engine.getMacroKnobValue(id)
engine.setMacroKnob(id, config)
```

---

## 実装ステップ

### Step 1: `src/types/index.ts` を更新

`MacroKnobManager` interface を分割する。

```typescript
// 変更前の MacroKnobManager interface を以下の2つに分割

// UI設定管理（macroKnob.ts が実装）
export interface MacroKnobManager {
  getKnobs(): MacroKnobConfig[]
  setKnob(id: string, config: MacroKnobConfig): void
  addAssign(knobId: string, assign: MacroAssign): void
  removeAssign(knobId: string, paramId: string): void
  getValue(knobId: string): number          // 0.0〜1.0（表示用キャッシュ）
  setValue(knobId: string, value: number): void  // MidiManager から書かれる・新規追加
}

// CC入力の唯一の通路（midiManager.ts が実装）・新規追加
export interface MidiManager {
  init(store: ParameterStore, knobManager: MacroKnobManager): void
  handleMidiCC(event: MidiCCEvent): void
  receiveModulation(knobId: string, value: number): void
}
```

`ParameterStore` は `import type { ParameterStore } from '../core/parameterStore'` で循環参照になる場合は `unknown` で代用してよい。実装ファイル側で具体型を使う。

---

### Step 2: `src/core/macroKnob.ts` を更新

`handleMidiCC` / `receiveModulation` を削除し、`setValue` を追加する。

```typescript
// 削除するメソッド
handleMidiCC(event: MidiCCEvent): void  // MidiManager に移管
receiveModulation(knobId: string, value: number): void  // MidiManager に移管

// 追加するメソッド
setValue(knobId: string, value: number): void {
  this.currentValues.set(knobId, value)
}

// init(store) も削除（MidiManager が store を持つ）
```

`import type { MacroKnobManager, MidiCCEvent }` から `MidiCCEvent` も不要になる場合は削除する。

---

### Step 3: `src/core/midiManager.ts` を新規作成

```typescript
/**
 * MidiManager
 * spec: docs/spec/macro-knob.spec.md
 *
 * CC入力の唯一の通路。
 * 全入力源（物理MIDI / SimpleWindow / Sequencer / LFO / AI）が
 * engine.handleMidiCC(MidiCCEvent) 経由でここに流れ込む。
 */

import { rangeMap } from './macroKnob'
import type { MidiManager, MacroKnobManager, MidiCCEvent } from '../types'
import type { ParameterStore } from './parameterStore'

class MidiManagerImpl implements MidiManager {
  private store: ParameterStore | null = null
  private knobManager: MacroKnobManager | null = null

  init(store: ParameterStore, knobManager: MacroKnobManager): void {
    this.store = store
    this.knobManager = knobManager
  }

  handleMidiCC(event: MidiCCEvent): void {
    if (!this.store || !this.knobManager) return

    const knobs = this.knobManager.getKnobs()
    const knob = knobs.find((k) => k.midiCC === event.cc)
    if (!knob) return

    // 現在値をキャッシュ（MacroKnobManager 側に書く）
    this.knobManager.setValue(knob.id, event.value)

    // 各 assign に対して rangeMap して ParameterStore に書く
    for (const assign of knob.assigns) {
      const mapped = rangeMap(event.value, assign.min, assign.max)
      this.store.set(assign.paramId, mapped)
    }
  }

  receiveModulation(knobId: string, value: number): void {
    if (!this.store || !this.knobManager) return

    const knob = this.knobManager.getKnobs().find((k) => k.id === knobId)
    if (!knob) return

    this.knobManager.setValue(knobId, value)

    for (const assign of knob.assigns) {
      const mapped = rangeMap(value, assign.min, assign.max)
      this.store.set(assign.paramId, mapped)
    }
  }
}

export const midiManager = new MidiManagerImpl()
```

---

### Step 4: `src/core/engine.ts` を更新

```typescript
// import 変更
import { macroKnobManager } from './macroKnob'
import { midiManager } from './midiManager'  // 追加

// initialize() 内の変更
// Before:
macroKnobManager.init(this.parameterStore)

// After:
midiManager.init(this.parameterStore, macroKnobManager)

// handleMidiCC の変更
// Before:
handleMidiCC(event: MidiCCEvent): void {
  macroKnobManager.handleMidiCC(event)
}

// After:
handleMidiCC(event: MidiCCEvent): void {
  midiManager.handleMidiCC(event)
}

// 以下の公開 API を追加（MacroKnobPanel 用）
getMacroKnobs(): MacroKnobConfig[] {
  return macroKnobManager.getKnobs()
}

setMacroKnob(id: string, config: MacroKnobConfig): void {
  macroKnobManager.setKnob(id, config)
}

getMacroKnobValue(knobId: string): number {
  return macroKnobManager.getValue(knobId)
}

receiveMidiModulation(knobId: string, value: number): void {
  midiManager.receiveModulation(knobId, value)
}
```

既存の `getMacroKnobs()` が存在する場合はそのまま活用する。

---

### Step 5: `src/ui/panels/macro-knob/MacroKnobPanel.tsx` を更新

```typescript
// Before
import { macroKnobManager } from '../../../core/macroKnob'

// After
import { engine } from '../../../core/engine'

// useEffect 内の sync 関数
// Before:
const configs = macroKnobManager.getKnobs()
setValues(configs.map((k) => macroKnobManager.getValue(k.id)))

// After:
const configs = engine.getMacroKnobs()
setValues(configs.map((k) => engine.getMacroKnobValue(k.id)))

// handleSave 内
// Before:
const current = macroKnobManager.getKnobs().find((k) => k.id === editingId)
macroKnobManager.setKnob(editingId, { ...current, name, midiCC })

// After:
const current = engine.getMacroKnobs().find((k) => k.id === editingId)
engine.setMacroKnob(editingId, { ...current, name, midiCC })
```

---

### Step 6: `tests/core/macroKnob.test.ts` を更新

`macroKnobManager` の `handleMidiCC` / `receiveModulation` に関するテストを削除または `midiManager` 側に移動する。

既存テスト（TC-1〜TC-11）のうち `handleMidiCC` / `receiveModulation` を直接テストしているものは `engine.test.ts` 側で `engine.handleMidiCC()` 経由でテストする方針（spec §9 参照）。

---

## 完了条件

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit 2>&1 && pnpm test --run 2>&1
```

- `pnpm tsc --noEmit` → 型エラーゼロ
- `pnpm test --run` → 114 tests 全グリーン（テスト数は変わらないはず）
- `any` による型解決は禁止

---

## 参照ファイル（実装前に読むこと）

```
docs/spec/macro-knob.spec.md   ← Day50 更新済み・SSoT
src/core/macroKnob.ts          ← 変更対象
src/core/engine.ts             ← 変更対象
src/types/index.ts             ← 変更対象
src/ui/panels/macro-knob/MacroKnobPanel.tsx  ← 変更対象
tests/core/macroKnob.test.ts   ← 変更対象
```

## コミットメッセージ（完了後）

```bash
git add -A && git commit \
  -m "refactor: separate MidiManager from MacroKnobManager (Day50)" \
  -m "Day50 壁打ちで責務分離を確定。
macroKnob.ts はノブUI設定管理のみに絞り、
handleMidiCC / receiveModulation を midiManager.ts に移管。
全 SimpleWindow と MacroKnobPanel が engine 経由で統一される設計。
MIDI 2.0 内部バスの唯一の通路として MidiManager を新設。"

git tag day50 && git push origin main --tags
```
