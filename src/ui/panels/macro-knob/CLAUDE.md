# src/ui/panels/macro-knob - CLAUDE.md v1

## 役割

MacroKnob Panel の実装ルール。
MacroKnob Manager のデフォルト UI。32ノブ（8×4）固定。
spec: `docs/spec/macro-knob.spec.md`

---

## ファイル構成

```
src/ui/panels/macro-knob/
├── CLAUDE.md           ← このファイル
└── MacroKnobPanel.tsx
```

---

## コンポーネント構成

```
MacroKnobPanel（メイン・export）
  ├── KnobCell          ← 1ノブの SVG UI・現在値（0.0〜1.0）・MIDI アサイン表示
  └── EditDialog        ← ノブ名・MIDI CC 編集ダイアログ（v1 簡易版）
```

---

## MUST ルール

- MUST: コンポーネント名は `MacroKnobPanel`（旧名 `MacroKnobSimpleWindow` から変更）
- MUST: export は `export function MacroKnobPanel()`
- MUST: `1` キー / `⌘1` / `onToggleMacroKnobWindow` IPC で表示/非表示（App.tsx が制御）
- MUST: ノブ数は 32 固定（8列 × 4行）
- MUST: ノブ値の polling は 200ms 間隔（`setInterval(sync, 200)`）
- MUST: `useDraggable` でフローティング・ドラッグ可能
- MUST: ノブ値は `macroKnobManager.getValue(id)` で取得（0.0〜1.0）
- MUST: ノブ設定変更は `macroKnobManager.setKnob(id, config)` で行う

---

## MIDI 2.0 設計（Phase 14 実装対象）

### 制御経路（疎結合・コア固定）

```
【入力層】                        【MacroKnob 層】            【出力層】
MIDI 2.0 Controller
  → electron/main.js
  → IPC 'geo:midi-cc'        →  macroKnobManager            → ParameterStore
MIDI 1.0 Controller                handleMidiCC(event)             ↓
  → Web MIDI API（main.js内）→  handleMidiCC(event)        Plugin.params
  → IPC 'geo:midi-cc'
Sequencer Plugin               →  receiveModulation(knobId, 0〜1)
```

### MidiCCEvent（MIDI 1.0 / 2.0 共通フォーマット）

```typescript
interface MidiCCEvent {
  cc: number           // CC番号: MIDI 1.0 = 0〜127 / MIDI 2.0 = 0〜32767
  value: number        // 正規化済み値: 0.0〜1.0（main.js 側で正規化）
  protocol: 'midi1' | 'midi2'
  resolution: 128 | 4294967296
}
```

### midiCC の3状態

```typescript
midiCC: number
// 0〜127    = MIDI 1.0 CC 番号
// 0〜32767  = MIDI 2.0 AC 番号
// -1        = 未割り当て
```

### MIDI Learn（Phase 14 実装対象）

1. ノブを右クリック → Learn モード（ノブがハイライト）
2. MIDI コントローラーのノブを動かす → CC番号を自動取得
3. 既存アサインがあれば上書き確認ダイアログ

### CC Standard v0.1 対応（Phase 14 実装対象）

`MacroAssign.defaultCC` に CC Standard の CC 番号を設定する。
詳細: `docs/spec/cc-standard.spec.md §3`

| CC 番号 | 抽象概念 | 例 |
|---|---|---|
| CC101 | Primary Amount | radius・size・strength |
| CC300 | Temporal Speed | speed・rate |
| CC302 | Deformation | amplitude・twist・distortion |
| CC400 | Hue | hue |

---

## import パス（このファイルからの相対パス）

```typescript
import { macroKnobManager } from '../../core/macroKnob'
import { useDraggable } from '../useDraggable'
import type { MacroKnobConfig } from '../../types'
```

---

## 変更履歴

| Day | 変更内容 |
|---|---|
| Day13 | MacroKnob UI 初期実装（MacroKnobPanel として） |
| Day35 | Panel 化・Simple Window から分離・コア固定確定 |
| Day37 | MIDI 2.0 設計・MidiCCEvent・CC Standard 統合 |
| Day38 | `src/ui/MacroKnobSimpleWindow.tsx` → `src/ui/panels/macro-knob/MacroKnobPanel.tsx` へ移動・リネーム（Phase 13） |
