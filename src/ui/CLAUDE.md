# src/ui - CLAUDE.md v2

## 役割

React + Tailwind CSS で GeoGraphy の UI を実装する。
Three.js Canvas の上に React UI をオーバーレイする。

---

## Window / Panel 命名原則

| 名称 | 定義 | 例 |
|---|---|---|
| **Window** | Plugin エコシステムの UI・コントリビューターがデザインできる | Mixer Simple Window / FX Simple Window |
| **Panel** | アプリ固定の小窓・コントリビューターが触れない | Preferences Panel |
| **Simple Window** | 各 Plugin のデフォルト最小 UI・カスタム Window Plugin がないときのフォールバック | Mixer Simple Window |

すべての Window は **View メニュー**から表示/非表示を切り替えられる。

---

## Simple Window 命名原則

Simple Window のファイル名は `[Name]SimpleWindow.tsx`。

### Simple Window 一覧（v1）

| Simple Window 名 | 対応 Plugin / Manager | ファイル |
|---|---|---|
| Mixer Simple Window | MixerPlugin | `src/plugins/mixers/simple-mixer/MixerSimpleWindow.tsx` |
| FX Simple Window | FX Plugin | `src/ui/FxSimpleWindow.tsx` |

---

## Panel 命名原則（Day35 確定）

Panel のファイル名は `[Name]Panel.tsx`。`src/ui/panels/` に配置。各 Panel は固有の CLAUDE.md を持つ。

### Panel 一覧（v1）

| Panel 名 | 内容 | ファイル |
|---|---|---|
| Preferences Panel | Setup / Plugins / MIDI / Output 等 | `src/ui/panels/preferences/PreferencesPanel.tsx` |
| MacroKnob Panel | MacroKnob 32個・MIDI 2.0 アサイン・MIDI Learn | `src/ui/panels/macro-knob/MacroKnobPanel.tsx` |

---

## View メニューとの連携

すべての Window ・ Panel は View メニューから表示/非表示を切り替えられる。

| キー / メニュー | 対象 |
|---|---|
| `1` / View > MacroKnob Panel（⌘1） | MacroKnobPanel |
| `2` / View > FX Simple Window（⌘2） | FxSimpleWindow |
| `3` / View > Mixer Simple Window（⌘3） | MixerSimpleWindow |
| `H` / View > Hide All Windows | 全 Window / Panel 非表示 |
| `S` / View > Show All Windows | 全 Window / Panel 表示 |
| `F` | 全 Window / Panel 非表示 + フルスクリーン |
| `P` | Preferences Panel 開閉 |

View メニューのイベントは `electron/main.js` → IPC → `electron/preload.js` → `geoAPI.onMenuEvents` → `App.tsx` の流れで受け取る。

---

## コンポーネント一覧

```
src/ui/
├── App.tsx                    ← Canvas + Window / Panel 群のルートレイアウト
├── FxSimpleWindow.tsx         ← FX Simple Window
├── useAutosave.ts             ← 終了時保存・起動時復元
├── useDraggable.ts            ← フローティングウィンドウのドラッグ
└── panels/                    ← Panel 専用ディレクトリ（Day35 確定）
    ├── CLAUDE.md                ← Panel 共通ルール
    ├── preferences/
    │   ├── CLAUDE.md            ← Preferences 固有
    │   └── PreferencesPanel.tsx ← 移動予定（現在 src/ui/ にあり）
    └── macro-knob/
        ├── CLAUDE.md            ← MacroKnob + MIDI 2.0 固有（最重要）
        └── MacroKnobPanel.tsx   ← リネーム予定（現在 MacroKnobSimpleWindow.tsx）

※ Mixer Simple Window は src/plugins/mixers/simple-mixer/MixerSimpleWindow.tsx
※ panels/ の実装は Phase 13 以降
```

---

## レイアウト構造

```
┌─────────────────────────────────────┐
│ Electron titleBar（hiddenInset）     │
├─────────────────────────────────────┤
│                                     │
│  Canvas エリア（Three.js 全レイヤー）│
│  Mixer Simple Window（フローティング）│
│  FX Simple Window（フローティング）  │
│  MacroKnob Panel（フローティング）          │  ← Phase 13 以降（現在は MacroKnobSimpleWindow）
│  Preferences Panel（フローティング）         │
│                                     │
└─────────────────────────────────────┘
```

---

## デザインルール

- **カラーパレット**: 暗背景（`#0a0a14`）+ 発光ライン（`#a0c4ff`）
- **フォント**: monospace 系（UI）
- **ドラッグ**: `useDraggable.ts` で統一

---

## 注意事項

- `<form>` タグは使用しない（onClick / onChange で代替）
- localStorage は使用しない（Claude.ai 環境では動作しない）
- React state（useState / useReducer）でセッション内状態を管理
- Preferences Panel は Panel（アプリ固定）であり Window ではない
