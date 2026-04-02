# Day38 - Phase 13: UI パネルディレクトリ整理

## 概要

`src/ui/panels/` ディレクトリを新設し、Panel 系コンポーネントを移動・リネームした。

---

## 完了ステップ

### Step 1〜3: CLAUDE.md 新規作成
- `src/ui/panels/CLAUDE.md` — Panel 共通ルール・Panel 一覧・追加手順
- `src/ui/panels/preferences/CLAUDE.md` — Preferences Panel 固有ルール
- `src/ui/panels/macro-knob/CLAUDE.md` — MacroKnob Panel 固有ルール（MIDI 2.0 設計含む）

### Step 4〜5: PreferencesPanel 移動
- `src/ui/PreferencesPanel.tsx` → `src/ui/panels/preferences/PreferencesPanel.tsx`
- import パス: `../core/engine` → `../../../core/engine`
- コンポーネント名: 変更なし（`PreferencesPanel`）

### Step 6〜7: MacroKnobSimpleWindow → MacroKnobPanel リネーム・移動
- `src/ui/MacroKnobSimpleWindow.tsx` → `src/ui/panels/macro-knob/MacroKnobPanel.tsx`
- import パス: `../../core/macroKnob` → `../../../core/macroKnob` 等
- コンポーネント名: `MacroKnobSimpleWindow` → `MacroKnobPanel`
- ヘッダーテキスト: `MACRO KNOB SIMPLE WINDOW` → `MACRO KNOB PANEL`

### Step 8: App.tsx import 更新
- `'./MacroKnobSimpleWindow'` → `'./panels/macro-knob/MacroKnobPanel'`
- `'./PreferencesPanel'` → `'./panels/preferences/PreferencesPanel'`
- JSX: `<MacroKnobSimpleWindow />` → `<MacroKnobPanel />`

### Step 9〜10: 型エラー修正
- `FXPlugin` / `GeometryPlugin` の明示的型注釈が逆に型不一致を引き起こすケース
  → 型推論に任せる（型注釈を除去）で解決
- import パスの深さが `../../` ではなく `../../../` だったミスを修正

### Step 11: 旧ファイル削除（git rm）
- `src/ui/MacroKnobSimpleWindow.tsx` 削除
- `src/ui/PreferencesPanel.tsx` 削除

---

## 完了条件

- [x] `pnpm tsc --noEmit` — エラーゼロ
- [x] `pnpm test --run` — 104 tests グリーン

---

## 学び

- コールバック引数への明示的型注釈は、戻り値型が `{ id: string; name: string }[]` のような
  簡略型の場合に逆に型不一致エラーを起こす。型推論に任せるのが正解。
- `panels/macro-knob/` は `src/ui/` から3階層深いため `../../../` が正しい相対パス。
