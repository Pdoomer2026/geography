# src/ui - CLAUDE.md v5

> Day79 更新：Window 一覧・キーバインドを現行実装に合わせて修正

## 役割

React + Tailwind CSS で GeoGraphy の UI を実装する。
Three.js Canvas の上に React UI をオーバーレイする。

---

## Window / Panel 命名原則

| 名称 | 定義 | 例 |
|---|---|---|
| **Window** | Plugin エコシステムの UI・コントリビューターがデザインできる | Mixer Simple Window / FX Standard D&D Window |
| **Panel** | アプリ固定の小窓・コントリビューターが触れない | Preferences Panel |

---

## Window 種別体系（Day65 全層完成・12コンポーネント）

各種別に Geometry / Camera / FX の 3 ドメインが存在する（計 12 コンポーネント）。

| 種別 | lo/hi | D&D | 説明 |
|---|---|---|---|
| Simple Window | No | No | min〜max フル範囲・デフォルト起動時の状態 |
| Standard Window | Yes | No | RangeSlider で lo/hi 稼働幅を設定可能 |
| Simple D&D Window | No | Yes | D&D ハンドル付き・MacroKnob アサイン対応 |
| Standard D&D Window | Yes | Yes | lo/hi + D&D 両方対応・最多機能 |

デフォルトの WindowMode: `geometry/camera/fx: 'standard-dnd'` / `macro: 'macro-8-window'`（Day74 確定）

---

## Window 一覧（Day75 時点）

| Window 名 | 種別 | キー | ファイル |
|---|---|---|---|
| Mixer Simple Window | Mixer | `3` | `src/ui/components/mixers/simple-mixer/MixerSimpleWindow.tsx` |
| Macro 8 Window | Macro | `1` | `src/ui/components/window/macro-8-window/Macro8Window.tsx` |
| Macro 8 MIDI Window | Macro | `1`と同時 | `src/ui/components/window/macro-8-window/Macro8MidiWindow.tsx` |
| GeoMonitor Window | Monitor | `6` | `src/ui/components/window/geo-monitor/GeoMonitorWindow.tsx` |
| MIDI Monitor Window | Monitor | `M` | `src/ui/components/window/midi-monitor/MidiMonitorWindow.tsx` |
| Geometry Simple Window | Simple | Prefs | `src/ui/components/window/simple-window/GeometrySimpleWindow.tsx` |
| Camera Simple Window | Simple | Prefs | `src/ui/components/window/simple-window/CameraSimpleWindow.tsx` |
| FX Simple Window | Simple | Prefs | `src/ui/components/window/simple-window/FxSimpleWindow.tsx` |
| Geometry Standard Window | Standard | Prefs | `src/ui/components/window/standard-window/GeometryStandardWindow.tsx` |
| Camera Standard Window | Standard | Prefs | `src/ui/components/window/standard-window/CameraStandardWindow.tsx` |
| FX Standard Window | Standard | Prefs | `src/ui/components/window/standard-window/FxStandardWindow.tsx` |
| Geometry Simple D&D Window | Simple D&D | Prefs | `src/ui/components/window/simple-dnd-window/GeometrySimpleDnDWindow.tsx` |
| Camera Simple D&D Window | Simple D&D | Prefs | `src/ui/components/window/simple-dnd-window/CameraSimpleDnDWindow.tsx` |
| FX Simple D&D Window | Simple D&D | Prefs | `src/ui/components/window/simple-dnd-window/FxSimpleDnDWindow.tsx` |
| Geometry Standard D&D Window | Standard D&D | Prefs | `src/ui/components/window/standard-dnd-window/GeometryStandardDnDWindow.tsx` |
| Camera Standard D&D Window | Standard D&D | Prefs | `src/ui/components/window/standard-dnd-window/CameraStandardDnDWindow.tsx` |
| FX Standard D&D Window | Standard D&D | Prefs | `src/ui/components/window/standard-dnd-window/FxStandardDnDWindow.tsx` |

---

## Panel 一覧（Day61 確定）

| Panel 名 | キー | ファイル |
|---|---|---|
| Preferences Panel | `P` | `src/ui/panels/preferences/PreferencesPanel.tsx` |

> MacroKnob Panel は Day61 で MacroWindow（Window）に格下げ済み。Panel は Preferences Panel のみ。

---

## キーボードショートカット（Day74 確定）

| キー | 動作 |
|---|---|
| `1` | Macro 8 Window トグル |
| `3` | Mixer Simple Window トグル |
| `6` | GeoMonitor Window トグル |
| `M` | MIDI Monitor Window トグル |
| `O` | Output Window トグル（Day79 追加） |
| `H` | 全 Window 非表示 |
| `S` | 全 Window 表示 |
| `F` | 全 Window 非表示 + フルスクリーン |
| `P` | Preferences Panel 開閉 |

> キー `2` `4` `5` は Day63 で廃止済み。Window 種別切り替えは Preferences Panel のドロップダウンで行う。

---

## View メニューとの連携

View メニューのイベントは `electron/main.js` → IPC → `electron/preload.js` → `geoAPI.onMenuEvents` → `App.tsx` の流れで受け取る。

---

## コンポーネント一覧

```
src/ui/
├── App.tsx                    <- Canvas + Window / Panel 群のルートレイアウト
├── useAutosave.ts             <- 終了時保存・起動時復元
├── useDraggable.ts            <- フローティングウィンドウのドラッグ
├── store/
│   └── geoStore.ts            <- Zustand store（MacroKnob UI ミラー）
├── hooks/
│   ├── useParam.ts            <- TransportRegistry 購読 Hook
│   ├── useSimpleParamRow.ts   <- Simple Window 用
│   ├── useDnDParamRow.ts      <- Simple D&D Window 用
│   ├── useStandardParamRow.ts <- Standard Window 用
│   └── useStandardDnDParamRow.ts  <- Standard D&D Window 用
├── components/
│   ├── window/                <- Window コンポーネント群（Day67 移動済み）
│   │   ├── simple-window/
│   │   ├── standard-window/
│   │   ├── simple-dnd-window/
│   │   ├── standard-dnd-window/
│   │   ├── macro-8-window/
│   │   ├── geo-monitor/
│   │   └── midi-monitor/
│   └── mixers/
│       └── simple-mixer/
└── panels/
    ├── CLAUDE.md
    └── preferences/
        ├── CLAUDE.md
        └── PreferencesPanel.tsx
```

---

## MUST ルール（Day71 更新）

- MUST: パラメーター変更は `paramCommand$.next(TransportEvent)` 経由（source: 'window' を付与）→ throttleTime(16ms) → engine.handleMidiCC()
- MUST: `engine` 直接 import は許可（MacroWindow・GeoMonitor 等）
- MUST: `transportRegistry` / `assignRegistry` / `transportManager` の直接 import は禁止（engine 経由のみ）
- MUST: `<form>` タグは使用しない（onClick / onChange で代替）
- MUST: setInterval ポーリングは使用しない（engine.onParamChanged / engine.onRegistryChanged で購読）
- MUST: App.tsx の Window import は全て `src/ui/components/` 配下から行うこと

## localStorage 使用方針（Day52 確定）

**原則**: localStorage は使用しない（React state で管理）

**例外: Preset の永続化に限り localStorage を使用する（便宜的・将来移行予定）**

| キー | 用途 | 実装場所 |
|---|---|---|
| `geography:presets-v1` | Preferences Preset | `PreferencesPanel.tsx` |
| `geography:geo-presets-v1` | Geometry Param Preset | `GeometrySimpleWindow.tsx` |

---

## デザインルール

- **カラーパレット**: 暗背景（`#0a0a14`）+ 発光ライン（`#a0c4ff`）
- **フォント**: monospace 系（UI）
- **ドラッグ**: `useDraggable.ts` で統一
