# GeoGraphy Day83 引き継ぎ｜2026-04-28

## プロジェクト概要
- **アプリ名**: GeoGraphy（No-Texture Plugin 駆動 VJ アプリ）
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm / Electron / Zod
- **GitHub**: https://github.com/Pdoomer2026/geography
- **ブランチ**: `feature/inspector-ui`
- **最終コミット**: `1d1547b`
- **テスト**: 129 tests グリーン・tsc エラーゼロ
- **タグ**: `day83` 未打（終業時に打つこと）

---

## Day83 で完了したこと

### Clip D&D 移動・コピー機能（ClipGrid.tsx のみ変更）

ClipGrid の ClipCell 単位でドラッグ＆ドロップ移動を実装。

| 操作 | 動作 |
|---|---|
| 通常 D&D → 空セル | Move（元セルが null になる）|
| 通常 D&D → 有りセル | Swap（互いのPresetが入れ替わる）|
| Option+D&D → 任意セル | Copy（元セルを残してコピー）|

---

## Day83 で判明した重要な学び

### HTML5 D&D のブラウザ挙動（重要・今後の D&D 実装すべてに適用）

1. **draggable な要素は Drop ターゲットとして機能しない**
   - 有りセルのラッパーが `draggable={true}` のままだと、別セルをドロップできない
   - 修正: `draggable={!!preset && dragSource === null}`（ドラッグ中は全セルを non-draggable に）

2. **effectAllowed = 'move' のとき Option キー（copy）でドロップが拒否される**
   - `effectAllowed = 'move'` → Option 時にブラウザが 'copy' を要求 → drop イベント不発火
   - 修正: `effectAllowed = 'copyMove'`

3. **e.metaKey / e.altKey は onDrop では信頼できない場合がある**
   - onDrop の e.altKey は Chrome on macOS で取れないことがある
   - 修正: `onDragOver`（連続発火）で `isCopyModeRef.current = e.altKey` を更新し、onDrop で ref を読む

4. **keydown/keyup リスナーで modifier を追跡すると keyup がリセットしてしまう**
   - Option を離した瞬間に ref が false になり、drop 前にリセットされる
   - 修正: keydown/keyup リスナーを削除し、dragOver + dragEnd でのみ管理

---

## 重要ファイルパス（Day83 変更分）

| ファイル | 状態 |
|---|---|
| `src/ui/components/inspector/mixer/ClipGrid.tsx` | ✅ D&D 実装済み |

---

## アーキテクチャ原則（Day83 確認）

### Clip D&D の設計方針
- D&D は「どこに置くか」の操作 → engine を呼ばない
- `saveGrid(next)` のみ（localStorage 書き込み）
- Application 層への新規依存ゼロ
- activeCells は移動に関わったセルのみリセット（再生状態の引き継ぎなし）

---

## 次回以降の実装候補

1. **MacroKnob D&D 割り当て UI**（Day83 未着手）
   - アサイン状態の可視化（≡ ハンドルにドット表示）
   - 右クリックでアサイン削除（spec §4-3 ④）
   - 変更ファイル: `useDnDParamRow.ts` / `GeometrySimpleDnDWindow.tsx`
2. **Phase 4: 旧 Window 廃止**（Inspector 安定後）
3. **Sequencer Plugin**

---

## 環境メモ

- 開発: `pnpm dev` → `open http://localhost:5173`（または 5174）
- NFC 正規化: `python3 /Users/shinbigan/nfc_normalize.py`
- localStorage クリア（DevTools `Cmd+Option+J`）:
  - `localStorage.removeItem('geography:clip-grid-v1')`
  - `localStorage.removeItem('geography:layer-presets-v2')`
  - `localStorage.removeItem('geography:scene-presets-v2')`

---

## 次回スタートプロンプト

```
Day84開始
```
