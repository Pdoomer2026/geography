# src/ui/panels/preferences - CLAUDE.md v1

## 役割

Preferences Panel の実装ルール。
spec: `docs/spec/preferences-panel.spec.md`

---

## ファイル構成

```
src/ui/panels/preferences/
├── CLAUDE.md           ← このファイル
└── PreferencesPanel.tsx
```

---

## コンポーネント構成

```
PreferencesPanel（メイン・export）
  ├── SetupTab          ← Geometry / FX チェックボックス + APPLY
  └── ComingSoonTab     ← Plugins / Audio / MIDI / Output タブ
```

---

## MUST ルール

- MUST: コンポーネント名は `PreferencesPanel`（変更禁止）
- MUST: Props は `{ open: boolean; onClose: () => void }`
- MUST: `open === false` のとき `return null`（アンマウントではなく非表示）
- MUST: `P` キー / `onPreferences` IPC イベントで開閉（App.tsx が制御）
- MUST: `H` キー（全非表示）でも閉じない（⚙ ボタンは常時表示）
  ※ただし現在の実装は `prefsOpen` state を App.tsx が管理しており、H キーは `uiVisible` のみ制御するため OK
- MUST: APPLY ボタン押下で `engine.applyGeometrySetup()` + `engine.applyFxSetup()` を呼ぶ
- MUST: FX デフォルト選択は `fx-stack.spec.md §5` に準拠

---

## import パス（このファイルからの相対パス）

```typescript
import { engine } from '../../../application/orchestrator/engine'
```

---

## タブ一覧

| タブ ID | 表示名 | v1 状態 |
|---|---|---|
| `setup` | Setup | ✅ 実装済み |
| `plugins` | Plugins | ⬜ Coming Soon |
| `audio` | Audio | ⬜ Coming Soon |
| `midi` | MIDI | ⬜ Coming Soon |
| `output` | Output | ⬜ Coming Soon |

---

## 変更履歴

| Day | 変更内容 |
|---|---|
| Day22 | 壁打ち完了・spec 確定 |
| Day38 | `src/ui/` から `src/ui/panels/preferences/` へ移動（Phase 13） |
