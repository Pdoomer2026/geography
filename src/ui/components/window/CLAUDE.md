# src/plugins/windows - CLAUDE.md v3

## 役割

GeoGraphy の全 Window を管理する。
Simple Window（複雑な機構を持たないデフォルト UI）から将来のカスタム Window まで、全てここに集約される。

spec: `docs/spec/window-plugin.spec.md`

---

## Window 分類体系（Day61 確定）

| 分類 | 定義 | 状態 |
|---|---|---|
| **Simple Window** | 複雑な機構を持たないデフォルト最小 UI | ✅ 実装済み |
| **Macro Window** | AssignRegistry へのノブ UI | ✅ 実装済み |
| **Standard Window** | スライダーの稼働幅を持つ Window | 将来 |
| **DnD Window** | D&D 機能を持つ Window | 将来 |

---

## ディレクトリ構成（Day61 確定）

```
src/plugins/windows/
├── CLAUDE.md
├── simple-window/               ← Simple Window の格納場所
│   ├── GeometrySimpleWindow.tsx   ← Geometry 用（旧 SimpleWindowPlugin）
│   ├── CameraSimpleWindow.tsx     ← Camera 用（旧 CameraWindowPlugin）
│   ├── FxSimpleWindow.tsx         ← FX 用（旧 FxWindowPlugin）
│   └── index.ts
├── macro-window/                ← AssignRegistry のノブ UI
│   ├── MacroWindow.tsx
│   ├── index.ts
│   └── CLAUDE.md
├── standard-window/             ← 将来（スライダー稼働幅あり）
└── dnd-window/                  ← 将来（D&D 機能あり）
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
- MUST: MacroWindow は engine を import しない（assignRegistry / transportManager に直接アクセス）
- MUST: Simple Window は engine 経由でパラメータ変更（engine.handleMidiCC）
- MUST: `<form>` タグを使用しないこと
- MUST: App.tsx の import は全て `plugins/windows/` 配下から
