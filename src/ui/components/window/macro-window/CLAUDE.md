# src/plugins/windows/macro-window - CLAUDE.md

## 役割

MacroKnob の Window Plugin。32ノブ（8×4）固定。
spec: `docs/spec/macro-knob.spec.md`

Day61: `src/ui/panels/macro-knob/MacroKnobPanel` から格下げ。
他の Window Plugin（simple-window / fx-window / camera-window）と同じ場所に統合。

---

## ファイル構成

```
src/plugins/windows/macro-window/
├── CLAUDE.md       ← このファイル
├── index.ts
└── MacroWindow.tsx
```

---

## コンポーネント構成

```
MacroWindow（メイン・export）
  ├── KnobCell       ← 1ノブの SVG UI・現在値（0.0〜1.0）・MIDI アサイン表示
  ├── EditDialog     ← ノブ名・MIDI CC 編集ダイアログ
  └── AssignDialog   ← D&D ドロップ後の min/max 設定ダイアログ
```

---

## MUST ルール

- MUST: engine を import しない（macroKnobManager / transportManager に直接アクセス）
- MUST: ノブ数は 32 固定（8列 × 4行）
- MUST: ノブ値の polling は 200ms 間隔（`setInterval(sync, 200)`）
- MUST: `useDraggable` でフローティング・ドラッグ可能
- MUST: ノブ値取得は `macroKnobManager.getValue(id)`
- MUST: ノブ設定変更は `macroKnobManager.setKnob(id, config)`
- MUST: ノブ一覧は `macroKnobManager.getKnobs()`
- MUST: UI ドラッグ操作は `transportManager.receiveModulation(knobId, val)`

---

## import パス

```typescript
import { macroKnobManager } from '../../../core/macroKnob'
import { transportManager } from '../../../core/transportManager'
import { useDraggable } from '../../../ui/useDraggable'
import type { DragPayload, MacroAssign, MacroKnobConfig } from '../../../types'
```

---

## データフロー

```
MacroWindow
  ↓ 200ms ポーリング
macroKnobManager.getKnobs()       → ノブ設定一覧
macroKnobManager.getValue(id)     → 現在値（0.0〜1.0）
  ↓ ノブ編集（EditDialog SAVE）
macroKnobManager.setKnob(id, config)
  ↓ ノブ UI ドラッグ
macroKnobManager.setValue(knobId, val)
transportManager.receiveModulation(knobId, val)
```

---

## 変更履歴

| Day | 変更内容 |
|---|---|
| Day13 | MacroKnob UI 初期実装 |
| Day35 | Panel 化・Simple Window から分離 |
| Day50 | macroKnobManager 直接参照 → engine 経由に変更 |
| Day52 | D&D アサイン UI・AssignDialog 追加 |
| Day61 | plugins/windows/macro-window に格下げ・engine 依存を除去 |
