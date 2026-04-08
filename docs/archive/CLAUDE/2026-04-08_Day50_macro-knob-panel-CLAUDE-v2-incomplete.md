# src/ui/panels/macro-knob - CLAUDE.md v2

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

- MUST: コンポーネント名は `MacroKnobPanel`
- MUST: export は `export function MacroKnobPanel()`
- MUST: `1` キー / `⌘1` / `onToggleMacroKnobWindow` IPC で表示/非表示（App.tsx が制御）
- MUST: ノブ数は 32 固定（8列 × 4行）
- MUST: ノブ値の polling は 200ms 間隔（`setInterval(sync, 200)`）
- MUST: `useDraggable` でフローティング・ドラッグ可能
- MUST: `macroKnobManager` を直接 import しない（Day50 確定）
- MUST: ノブ値は `engine.getMacroKnobValue(id)` で取得（engine 経由）
- MUST: ノブ設定変更は `engine.setMacroKnob(id, config)` で行う（engine 経由）
- MUST: ノブ一覧は `engine.getMacroKnobs()` で取得（engine 経由）

---

## import パス（このファイルからの相対パス）

```typescript
// Day50 以降: engine 経由のみ（macroKnobManager 直接参照禁止）
import { engine } from '../../../core/engine'
import { useDraggable } from '../../useDraggable'
import type { MacroKnobConfig } from '../../../types'
```

---

## データフロー（Day50 確定）

```
MacroKnobPanel
  ↓ 200ms ポーリング
engine.getMacroKnobs()       → ノブ設定一覧
engine.getMacroKnobValue(id) → 現在値（0.0〜1.0）
  ↓ ノブ編集（EditDialog SAVE）
engine.setMacroKnob(id, config)
```

---

## 変更履歴

| Day | 変更内容 |
|---|---|
| Day13 | MacroKnob UI 初期実装 |
| Day35 | Panel 化・Simple Window から分離・コア固定確定 |
| Day37 | MIDI 2.0 設計・MidiCCEvent・CC Standard 統合 |
| Day38 | `src/ui/MacroKnobSimpleWindow.tsx` → `src/ui/panels/macro-knob/MacroKnobPanel.tsx` へ移動 |
| Day50 | macroKnobManager 直接参照 → engine 経由に変更（責務分離） |
