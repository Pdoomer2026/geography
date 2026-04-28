# GeoGraphy Day85 引き継ぎ｜2026-04-28

## プロジェクト概要
- **アプリ名**: GeoGraphy（No-Texture Plugin 駆動 VJ アプリ）
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm / Electron / Zod
- **GitHub**: https://github.com/Pdoomer2026/geography
- **ブランチ**: `feature/inspector-ui`
- **テスト**: 129 tests グリーン・tsc エラーゼロ
- **タグ**: `day85`（終業時に打つこと）

---

## 始業時に必読

```
docs/architecture/ui-event-flow.md
```

---

## Day85 で完了したこと

### 1. MacroKnob D&D アサイン状態の可視化（Inspector Panel）

Inspector の Geometry / Camera / FX Panel の `≡` ハンドルに、MacroKnob アサイン状態を視覚化した。

**実装ファイル：**

| ファイル | 変更内容 |
|---|---|
| `src/ui/store/geoStore.ts` | `removeAssign(knobId, geoParamAddress)` アクション追加 |
| `src/ui/hooks/useStandardDnDParamRow.ts` | `assignedKnobs` + `handleRemoveAssign` を return に追加（geoStore 経由） |
| `src/ui/components/inspector/layer/panels/DnDHandleWithMenu.tsx` | 新規作成 |
| `src/ui/components/inspector/layer/panels/GeometryPanel.tsx` | `≡` div → `DnDHandleWithMenu` に差し替え |
| `src/ui/components/inspector/layer/panels/CameraPanel.tsx` | 同上 |
| `src/ui/components/inspector/layer/panels/FxPanel.tsx` | 同上 |

**DnDHandleWithMenu の仕様：**
- アサインなし → `≡`（グレー）
- アサイン済み → `≡`（青白）+ 右上にオレンジドット
- 右クリック → 左方向展開メニュー（`right: window.innerWidth - e.clientX`・ClipCell と同じ設計）
- 「{Knob名} を解除」→ `geoStore.removeAssign()` → `engine.removeMacroAssign()` + Zustand 同期

**アーキテクチャ原則：**
```
ParamRow 右クリック
  ↓
DnDHandleWithMenu → onRemoveAssign(knobId)
  ↓
useStandardDnDParamRow → useGeoStore.removeAssign()
  ↓
geoStore: engine.removeMacroAssign() + set({ macroKnobs })
  ↓
Zustand 購読コンポーネントが自動再レンダー
```
UI → geoStore → engine の一方通行を厳守。

### 2. Camera / FX Panel の MacroKnob 連動バグ修正

Day84 からの積み残しバグ。`onParamChanged` 購読が CameraPanel / FxPanel に欠落していたため、MacroKnob を動かしてもスライダーが更新されなかった。

- `CameraPanel.tsx`：`engine.onParamChanged()` 購読を追加
- `FxPanel.tsx`：`engine.onParamChanged()` 購読を追加
- GeometryPanel は元々あったため修正不要

### 3. 失敗から学んだこと（Day85 の反省）

- 旧 DnDWindow 群（Simple/StandardDnDWindow）を誤って変更 → `git checkout day84 -- [files]` でリセット
- **教訓**: 実装前に「どのファイルが現在使われているか」を必ず確認する
- Inspector Panel が正しい変更先であり、旧 Window 群は不使用ファイル

---

## 現在の状態（重要）

- **テスト**: 129 passed（15 files）✅
- **tsc**: エラーゼロ ✅
- **ブラウザ確認**:
  - アサイン済み `≡` にオレンジドット表示 ✅
  - 右クリックで左方向メニュー展開 ✅
  - 「解除」でアサイン削除・ドット消滅 ✅
  - Camera / FX の MacroKnob 連動スライダー更新 ✅

---

## 次回やること（Day86）

1. Phase 4: 旧 Window 廃止（Inspector 安定確認後）
2. Sequencer Plugin 設計（`docs/spec/sequencer.spec.md` 作成）
3. MacroKnob D&D アサイン UI（drag parameter slider → MacroKnob、min/max ダイアログ）の残課題確認
4. Preferences Panel CC Map タブ

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| UIイベントフロー設計図 | `docs/architecture/ui-event-flow.md` |
| engine | `src/application/orchestrator/engine.ts` |
| layerManager | `src/application/orchestrator/layerManager.ts` |
| geoStore | `src/ui/store/geoStore.ts` |
| DnDHandleWithMenu | `src/ui/components/inspector/layer/panels/DnDHandleWithMenu.tsx` |
| GeometryPanel | `src/ui/components/inspector/layer/panels/GeometryPanel.tsx` |
| CameraPanel | `src/ui/components/inspector/layer/panels/CameraPanel.tsx` |
| FxPanel | `src/ui/components/inspector/layer/panels/FxPanel.tsx` |
| useStandardDnDParamRow | `src/ui/hooks/useStandardDnDParamRow.ts` |

---

## 環境メモ

- 開発: `pnpm dev` → `open http://localhost:5173`（HMR / hard reload 不可）
- NFC 正規化: `python3 /Users/shinbigan/nfc_normalize.py`（日本語ファイル書き込み後に必須）
- git commit の日本語本文: `.claude/dayN-prompt.md` 経由で `git commit -F`
- 戻す際: `git checkout <commit> -- <filepath>`（edit 積み重ねで戻さない）

---

## 次回スタートプロンプト

```
Day86開始
```
