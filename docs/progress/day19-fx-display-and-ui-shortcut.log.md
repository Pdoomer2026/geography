# Day19 進捗ログ｜FxControlPanel小数表示バグ修正 + 個別UIショートカット

## 日付
2026-03-23

## 完了タスク

### タスク1: FxControlPanel 小数表示バグ修正
- **対象**: `src/ui/FxControlPanel.tsx`
- **問題**: `param.value.toFixed(param.max <= 0.01 ? 4 : 2)` の判定では
  RGB Shift の Amount（max=0.05）が `.toFixed(2)` → `0.00` と表示されていた
- **修正**: `formatParamValue(value, min, max)` 関数を追加し、`range = max - min` の大きさで桁数を判定
  - range < 0.1  → `.toFixed(4)`  例: 0.0010
  - range < 1.0  → `.toFixed(3)`  例: 0.050
  - range < 10.0 → `.toFixed(2)`  例: 0.80
  - range < 100  → `.toFixed(1)`  例: 1.0
  - それ以上     → 整数           例: 60
- **結果**: RGB Shift Amount が `0.05` と正しく表示されるようになった

### タスク2: 個別UI表示/非表示ショートカット
- **対象**: `src/ui/App.tsx`
- **変更**:
  - `uiVisible: boolean` → `uiVisible: { macro: boolean, fx: boolean, mixer: boolean }` に拡張
  - `1` キー → Macro パネル個別トグル
  - `2` キー → FX パネル個別トグル
  - `3` キー → Mixer パネル個別トグル
  - `F` キー → 全パネル非表示 + フルスクリーン（本番モード）
  - `H` キー → 全パネル非表示のみ（Hide）
  - `S` キー → 全パネル表示（Show）
  - ESC → フルスクリーン解除のみ（ブラウザ標準に任せる）
  - ヒント表示を `1:Macro 2:FX 3:Mixer | H:Hide S:Show F:全非表示+全画面` に更新

## 検証結果
- `pnpm tsc --noEmit` → PASS
- `pnpm test --run` → 71 tests グリーン
- ブラウザ手動確認 → 全ショートカット正常動作
- コミット: `50ccf0e`

## 副次的調査（実装なし）
- 全FX OFFでもモヤがかかる問題を調査
- 原因: EffectComposerのRenderPassによる自然な出力（バグではなく仕様）
- layer-1/layer-2を個別に非表示にしてモヤの原因を特定
