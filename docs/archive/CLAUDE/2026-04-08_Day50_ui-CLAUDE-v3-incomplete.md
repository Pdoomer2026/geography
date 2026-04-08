# src/ui - CLAUDE.md v3

## 役割

React + Tailwind CSS で GeoGraphy の UI を実装する。
Three.js Canvas の上に React UI をオーバーレイする。

---

## Window / Panel 命名原則

| 名称 | 定義 | 例 |
|---|---|---|
| **Window** | Plugin エコシステムの UI・コントリビューターがデザインできる | Mixer Simple Window / FX Simple Window |
| **Panel** | アプリ固定の小窓・コントリビューターが触れない | Preferences Panel / MacroKnob Panel |
| **Simple Window** | 各 Plugin のデフォルト最小 UI・カスタム Window Plugin がないときのフォールバック | Mixer Simple Window |

すべての Window は **View メニュー**から表示/非表示を切り替えられる。

---

## Simple Window 一覧（v1・実装済み）

| Simple Window 名 | 対応 Plugin | ファイル |
|---|---|---|
| Mixer Simple Window | MixerPlugin | `src/plugins/mixers/simple-mixer/MixerSimpleWindow.tsx` |
| FX Simple Window | FX Plugin | `src/ui/FxSimpleWindow.tsx` |
| Geometry Simple Window | Geometry Plugin | `src/ui/GeometrySimpleWindow.tsx` |
| Camera Simple Window | Camera Plugin | `src/ui/CameraSimpleWindow.tsx` |

---

## Panel 一覧（v1・実装済み）

Panel のファイル名は `[Name]Panel.tsx`。`src/ui/panels/` に配置。各 Panel は固有の CLAUDE.md を持つ。

| Panel 名 | 内容 | ファイル |
|---|---|---|
| Preferences Panel | Setup / Plugins / MIDI / Output 等 | `src/ui/panels/preferences/PreferencesPanel.tsx` |
| MacroKnob Panel | MacroKnob 32個・MIDI 2.0 アサイン・MIDI Learn | `src/ui/panels/macro-knob/MacroKnobPanel.tsx` |

---

## View メニューとの連携

| キー / メニュー | 対象 |
|---|---|
| `1` / View > MacroKnob Panel（⌘1） | MacroKnobPanel |
| `2` / View > FX Simple Window（⌘2） | FxSimpleWindow |
| `3` / View > Mixer Simple Window（⌘3） | MixerSimpleWindow |
| `4` / View > Camera Simple Window（⌘4） | CameraSimpleWindow |
| `5` / View > Geometry Simple Window（⌘5） | GeometrySimpleWindow |
| `H` / View > Hide All Windows | 全 Window / Panel 非表示 |
| `S` / View > Show All Windows | 全 Window / Panel 表示 |
| `F` | 全 Window / Panel 非表示 + フルスクリーン |
| `P` | Preferences Panel 開閉 |

---

## MUST ルール（Day50 追加）

- MUST: パラメーター変更は `engine.handleMidiCC(MidiCCEvent)` 経由で行うこと
- MUST: `macroKnobManager` を直接 import しないこと・`engine` 経由のみ許可
- MUST: `<form>` タグは使用しない（onClick / onChange で代替）
- MUST: localStorage は使用しない（React state で管理）

---

## コンポーネント一覧

```
src/ui/
├── App.tsx                    ← Canvas + Window / Panel 群のルートレイアウト
├── FxSimpleWindow.tsx         ← FX Simple Window
├── GeometrySimpleWindow.tsx   ← Geometry Simple Window
├── CameraSimpleWindow.tsx     ← Camera Simple Window
├── useAutosave.ts             ← 終了時保存・起動時復元
├── useDraggable.ts            ← フローティングウィンドウのドラッグ
└── panels/
    ├── CLAUDE.md
    ├── preferences/
    │   ├── CLAUDE.md
    │   └── PreferencesPanel.tsx
    └── macro-knob/
        ├── CLAUDE.md
        └── MacroKnobPanel.tsx
```

---

## デザインルール

- **カラーパレット**: 暗背景（`#0a0a14`）+ 発光ライン（`#a0c4ff`）
- **フォント**: monospace 系（UI）
- **ドラッグ**: `useDraggable.ts` で統一
