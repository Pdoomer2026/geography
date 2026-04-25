# src/ui/components/window - CLAUDE.md v3

## 役割

GeoGraphy の全 Window を管理する。
Simple Window（複雑な機構を持たないデフォルト UI）から将来のカスタム Window まで、全てここに集約される。

spec: `docs/spec/window-plugin.spec.md`

---

## Window 分類体系（Day65 全層完成）

| 分類 | 定義 | 状態 |
|---|---|---|
| **Simple Window** | 最小 UI・ min～max フル範囲 | ✅ Day59 実装済み |
| **Standard Window** | RangeSlider で lo/hi 稼働幅を設定可能 | ✅ Day63 実装済み |
| **Simple D&D Window** | D&D ハンドル付き・MacroKnob アサイン対応 | ✅ Day64 実装済み |
| **Standard D&D Window** | lo/hi + D&D 両方対応・最多機能 | ✅ Day65 実装済み |
| **Macro 8 Window** | 8ノブ・3重リング SVG | ✅ Day64 実装済み |
| **GeoMonitor Window** | 全パラメーターリアルタイム表示 | ✅ Day62 実装済み |
| **MIDI Monitor Window** | MIDI 信号リアルタイム表示 | ✅ Day75 実装済み |

---

## ディレクトリ構成（Day65 全層完成）

```
src/ui/components/window/
├── CLAUDE.md
├── simple-window/               <- 全てデフォルト OFF・min～max フル範囲
│   ├── GeometrySimpleWindow.tsx
│   ├── CameraSimpleWindow.tsx
│   ├── FxSimpleWindow.tsx
│   └── index.ts
├── standard-window/             <- RangeSlider（lo/hi）付き
│   ├── RangeSlider.tsx
│   ├── GeometryStandardWindow.tsx
│   ├── CameraStandardWindow.tsx
│   ├── FxStandardWindow.tsx
│   └── index.ts
├── simple-dnd-window/           <- D&D ハンドル付き
│   ├── GeometrySimpleDnDWindow.tsx
│   ├── CameraSimpleDnDWindow.tsx
│   ├── FxSimpleDnDWindow.tsx
│   └── index.ts
├── standard-dnd-window/         <- lo/hi + D&D 両方対応
│   ├── GeometryStandardDnDWindow.tsx
│   ├── CameraStandardDnDWindow.tsx
│   ├── FxStandardDnDWindow.tsx
│   └── index.ts
├── macro-8-window/              <- 8ノブ・3重リング SVG
│   ├── Macro8Window.tsx
│   ├── Macro8MidiWindow.tsx
│   └── index.ts
├── geo-monitor/                 <- 全パラメーターリアルタイム表示
│   ├── GeoMonitorWindow.tsx
│   └── index.ts
└── midi-monitor/                <- MIDI 信号リアルタイム表示
    ├── MidiMonitorWindow.tsx
    └── index.ts
```

---

## Simple Window の命名規則

```
[Domain]SimpleWindow.tsx
  Geometry・Camera・FX などドメイン名をプレフィックスに付ける
  例: GeometrySimpleWindow / CameraSimpleWindow / FxSimpleWindow
```

---

## MUST ルール

- MUST: Simple Window は `simple-window/` に置くこと
- MUST: MacroWindow は engine を import する（MacroWindow は例外となくなった・Day61 改訂）
- MUST: Simple Window は engine 経由でパラメータ変更（engine.handleMidiCC）
- MUST: `<form>` タグを使用しないこと
- MUST: App.tsx の import は全て `src/ui/components/` 配下から
