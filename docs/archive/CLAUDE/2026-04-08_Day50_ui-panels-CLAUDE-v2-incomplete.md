# src/ui/panels - CLAUDE.md v2

## 役割

GeoGraphy のアプリ固定パネル（Panel）群を管理するディレクトリ。
コントリビューターが触れない・アプリの一部として固定された UI コンポーネント。

---

## Panel 定義

| 用語 | 定義 |
|---|---|
| **Panel** | アプリ固定の小窓。コントリビューターがデザインできない。View メニューから開閉できる |
| **Window** | Plugin エコシステムの UI。コントリビューターがデザインできる |
| **Simple Window** | 各 Plugin のデフォルト最小 UI |

---

## ディレクトリ構造

```
src/ui/panels/
├── CLAUDE.md
├── preferences/
│   ├── CLAUDE.md
│   └── PreferencesPanel.tsx
└── macro-knob/
    ├── CLAUDE.md
    └── MacroKnobPanel.tsx
```

---

## Panel 共通ルール（MUST）

- MUST: ファイル名は `[Name]Panel.tsx`
- MUST: コンポーネント名は `[Name]Panel`
- MUST: 各 Panel ディレクトリに固有の `CLAUDE.md` を必ず置く
- MUST: Panel は `src/ui/App.tsx` から直接 import する
- MUST: Panel は Plugin 化しない・`src/plugins/` には置かない
- MUST: View メニュー / キーボードショートカットで開閉できること
- MUST: `<form>` タグは使用しない（onClick / onChange で代替）
- MUST: localStorage は使用しない（React state で管理）
- MUST: `macroKnobManager` を直接 import しないこと・`engine` 経由のみ（Day50確定）

---

## デザインルール（全 Panel 共通）

| 項目 | 値 |
|---|---|
| 背景色 | `#0f0f1e` |
| ボーダー | `#2a2a4e` |
| テキスト（主） | `#aaaacc` |
| テキスト（薄） | `#4a4a6e` |
| アクセント | `#5a5aaa` / `#7878ff` |
| フォント | `font-mono` |
| z-index | 50〜200（Panel ごとに調整） |

---

## Panel 一覧

| Panel 名 | キー | ファイル | spec |
|---|---|---|---|
| Preferences Panel | `P` | `preferences/PreferencesPanel.tsx` | `docs/spec/preferences-panel.spec.md` |
| MacroKnob Panel | `1` / `⌘1` | `macro-knob/MacroKnobPanel.tsx` | `docs/spec/macro-knob.spec.md` |
