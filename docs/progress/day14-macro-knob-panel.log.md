# Day14 MacroKnobPanel UI 進捗ログ

> spec: `docs/spec/macro-knob.spec.md`
> 担当: Claude Code
> 開始: 2026-03-23

---

## ステップ完了記録

### [DONE] Step 0: プラン提示
- HANDOVER.md / CLAUDE.md 読み込み完了
- day14-prompt.md 未存在 → HANDOVER.md の「Day14候補」最優先（MacroKnobPanel UI）を選択
- 作成・変更ファイル一覧:
  - `src/ui/MacroKnobPanel.tsx`（新規）
  - `src/ui/App.tsx`（変更）
  - `docs/progress/day14-macro-knob-panel.log.md`（新規）

### [DONE] Step 1: spec 確認
- `docs/spec/macro-knob.spec.md` §2 Constraints 確認
  - MUST: ノブ数 32 固定（8×4）
  - MUST: マクロノブパネルは閉じることができない（閉じるボタン実装禁止）
  - MUST: MIDI CC値（0〜127）を min/max に正規化
  - MUST: パラメーター変更は Command 経由

### [DONE] Step 2: MacroKnobPanel 実装（src/ui/MacroKnobPanel.tsx）
- `KnobCell` コンポーネント
  - SVG arc で 0.0〜1.0 の値を -135°〜+135° で可視化
  - MIDI CC 割り当て済みは赤ドットで表示
  - assigns 割り当て済みは紫 arc で強調
  - ホバーでノブ名・CC番号・ID を tooltip 表示
- `EditDialog` コンポーネント（v1 簡易版）
  - ノブ名（最大8文字・大文字変換）
  - MIDI CC（0〜127 入力）
  - assigns 読み取り表示（v1: 追加 UI は次フェーズ）
- `MacroKnobPanel` メインコンポーネント
  - `macroKnobManager.getKnobs()` + `getValue()` を 200ms ポーリング
  - 8列 × 4行 CSS Grid
  - **閉じるボタンなし**（spec §2 MUST 遵守）
  - `top-4 left-1/2 -translate-x-1/2` で画面上部中央に固定

### [DONE] Step 3: App.tsx に MacroKnobPanel 統合
- `import { MacroKnobPanel } from './MacroKnobPanel'` 追加
- `<MacroKnobPanel />` を `<SimpleMixer />` の上に配置
- 既存 App.tsx の構造・ロジックは一切変更なし

### [DONE] Step 4: tsc + test 通過確認
- `pnpm tsc --noEmit` → PASS（型エラーゼロ）
- `pnpm test --run` → 50 tests passed（全グリーン）

### [DONE] Step 5: ブラウザ目視確認（http://localhost:5174/）
- MacroKnobPanel が画面上部中央に固定表示 ✅
- 32ノブ（8×4グリッド）が正しく表示 ✅
- #2ノブをクリック → EditDialog が表示 ✅
- 名前「FILTER」・MIDI CC「42」を入力してSAVE → ノブに反映 ✅
- MIDI CC割り当て済みノブに赤ドットが表示 ✅
- 閉じるボタンなし（spec §2 MUST 遵守） ✅
- SimpleMixer が画面下部に引き続き表示 ✅

---

## 次のステップ

- [ ] Step 6: git commit
- [ ] Day15候補: FXスタック実装 or カメラシステム spec 作成

---

## 設計メモ

- `macroKnobManager` は `src/core/macroKnob.ts` からシングルトン import
  → `engine.ts` を経由しない直接アクセス（UI層からの read-only 参照なので許容）
  → `setKnob()` は `macroKnobManager` に直接呼ぶ（name/midiCC 変更のみ・パラメーター値変更は Command 必須）
- `getValue()` は 0.0〜1.0 正規化済みの値を返す（macroKnob.ts §4 確認済み）
- SVG arc パス: `-135°〜+135°` の範囲を `value * 270°` でマッピング
- `any` 一切不使用・型は MacroKnobConfig interface で完全型付け
- 閉じるボタン: 実装禁止（spec §2 MUST・CLAUDE.md MUST 確認済み）
