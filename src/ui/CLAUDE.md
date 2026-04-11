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

## Simple Window 命名原則

Simple Window のファイル名は `[Name]SimpleWindow.tsx`。

### Simple Window 一覧（v1・実装済み）

| Simple Window 名 | 対応 Plugin | ファイル |
|---|---|---|
| Mixer Simple Window | MixerPlugin | `src/plugins/mixers/simple-mixer/MixerSimpleWindow.tsx` |
| FX Simple Window | FX Plugin | `src/ui/FxSimpleWindow.tsx` |
| Geometry Simple Window | Geometry Plugin | `src/ui/GeometrySimpleWindow.tsx` |
| Camera Simple Window | Camera Plugin | `src/ui/CameraSimpleWindow.tsx` |

---

## Panel 命名原則（Day35 確定）

Panel のファイル名は `[Name]Panel.tsx`。`src/ui/panels/` に配置。各 Panel は固有の CLAUDE.md を持つ。

### Panel 一覧（v1・実装済み）

| Panel 名 | 内容 | ファイル |
|---|---|---|
| Preferences Panel | Setup / Plugins / MIDI / Output 等 | `src/ui/panels/preferences/PreferencesPanel.tsx` |
| MacroKnob Panel | MacroKnob 32個・MIDI 2.0 アサイン・MIDI Learn | `src/ui/panels/macro-knob/MacroKnobPanel.tsx` |

---

## View メニューとの連携

すべての Window・Panel は View メニューから表示/非表示を切り替えられる。

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

View メニューのイベントは `electron/main.js` → IPC → `electron/preload.js` → `geoAPI.onMenuEvents` → `App.tsx` の流れで受け取る。

---

## コンポーネント一覧

```
src/ui/
├── App.tsx                    ← Canvas + Window / Panel 群のルートレイアウト
├── FxSimpleWindow.tsx         ← FX Simple Window
├── GeometrySimpleWindow.tsx   ← Geometry Simple Window（Day45新設）
├── CameraSimpleWindow.tsx     ← Camera Simple Window（Day45新設）
├── useAutosave.ts             ← 終了時保存・起動時復元
├── useDraggable.ts            ← フローティングウィンドウのドラッグ
└── panels/
    ├── CLAUDE.md              ← Panel 共通ルール
    ├── preferences/
    │   ├── CLAUDE.md          ← Preferences 固有
    │   └── PreferencesPanel.tsx
    └── macro-knob/
        ├── CLAUDE.md          ← MacroKnob + MIDI 2.0 固有（最重要）
        └── MacroKnobPanel.tsx

※ Mixer Simple Window は src/plugins/mixers/simple-mixer/MixerSimpleWindow.tsx
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
│  Geometry Simple Window（フローティング）│
│  Camera Simple Window（フローティング）│
│  MacroKnob Panel（フローティング）   │
│  Preferences Panel（フローティング） │
│                                     │
└─────────────────────────────────────┘
```

---

## MUST ルール（Day50 追加・Day52 更新）

- MUST: パラメーター変更は `engine.handleMidiCC(TransportEvent)` 経由で行うこと（source: 'window' を付与）
- MUST: `macroKnobManager` を直接 import しないこと・`engine` 経由のみ許可
- MUST: `<form>` タグは使用しない（onClick / onChange で代替）
- MUST: Preferences Panel は Panel（アプリ固定）であり Window ではない

## localStorage 使用方針（Day52 確定）

**原則**: localStorage は使用しない（React state で管理）

**例外: Preset の永続化に限り localStorage を使用する（便宜的・将来移行予定）**

理由:
- `geoAPI`（Electron ファイル保存）はブラウザ確認時に使えない
- localStorage はブラウザ・Electron 両環境で同じ操作感を保証できる
- コントリビューターがブラウザで開発・確認する際に Preset が消えない

将来の移行先: `GeoGraphyProject`（`.geography` ファイル）に統合する
- Preferences Preset（`geography:presets-v1`）と Geometry Preset（`geography:geo-presets-v1`）を**同時に移行**する
- 移行タイミング: Project File の Save/Load 実装時

**localStorage を使ってよい箇所:**
| キー | 用途 | 実装場所 |
|---|---|---|
| `geography:presets-v1` | Preferences Preset | `PreferencesPanel.tsx` |
| `geography:geo-presets-v1` | Geometry Param Preset | `GeometrySimpleWindow.tsx`（Day52 新設予定） |

上記以外で localStorage を使う場合は必ずこの CLAUDE.md に追記すること。

---

## デザインルール

- **カラーパレット**: 暗背景（`#0a0a14`）+ 発光ライン（`#a0c4ff`）
- **フォント**: monospace 系（UI）
- **ドラッグ**: `useDraggable.ts` で統一
