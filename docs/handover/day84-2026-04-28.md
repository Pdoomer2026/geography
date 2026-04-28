# GeoGraphy Day84 引き継ぎ｜2026-04-28

## プロジェクト概要
- **アプリ名**: GeoGraphy（No-Texture Plugin 駆動 VJ アプリ）
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm / Electron / Zod
- **GitHub**: https://github.com/Pdoomer2026/geography
- **ブランチ**: `feature/inspector-ui`
- **テスト**: 129 tests グリーン・tsc エラーゼロ
- **タグ**: `day84`（終業時に打つこと）

---

## 始業時に必読

```
docs/architecture/ui-event-flow.md
```

Day84 で確立した UI イベントフローの設計図。次回以降の実装時に必ず参照すること。

---

## Day84 で完了したこと

### 1. UI 薄い鏡アーキテクチャの統一

| コンポーネント | Before | After |
|---|---|---|
| MacroPanel / Macro8Window | 200ms setInterval（全データ） | Zustand + 100ms（視覚データのみ） |
| MixerTab | 200ms setInterval | Zustand + onRegistryChanged |
| CameraPanel | 200ms setInterval | onRegistryChanged + onCameraChanged |
| FxPanel | 200ms setInterval（重複） | onRegistryChanged + onFxChanged |

- geoStore に `layers` / `routings` / `syncLayers()` を追加
- MacroPanel / Macro8Window / MacroWindow の mutation 後に `syncMacroKnobs()` を追加

### 2. Inspector Panel の初期化バグ修正

- engine.ts に `onGeometryChanged` / `onCameraChanged` を新設
- FxPanel の設計を手本に GeometryPanel / CameraPanel を同一構成に統一
- アプリ起動時・タブ切り替え時に全レイヤーで正常表示を確認

### 3. Clip プリセット適用後のスライダー消失バグ修正

- layerManager に `onPresetApplied(layerId)` コールバックを新設
- engine が購読し Registry + UI コールバックを同期する仕組みを実装
- `_applyPresetToLayer` は render loop 内で実行されるため疎結合を維持

### 4. UIイベントフロー設計図を文書化

- リポジトリ: `docs/architecture/ui-event-flow.md`
- Obsidian: `GeoGraphy Vault/dev-log/ui-event-flow.md`

---

## 現在の状態（重要）

- **テスト**: 129 passed（15 files）✅
- **tsc**: エラーゼロ ✅
- **ブラウザ確認**: L1・L2 Geometry/Camera/FX スライダー正常表示 ✅
- **Clip 差し替え後**: スライダー消失バグ修正済み ✅

---

## Day84 で判明した重要な知見

### UI イベントフローの 4 パターン

| パターン | 用途 | 例 |
|---|---|---|
| A: Zustand | 構造データのミラー | macroKnobs / layers |
| B: 単一コールバック | 初期化・plugin 変化 | onGeometryChanged / onFxChanged |
| C: Set コールバック | 汎用購読（複数） | onRegistryChanged / onParamChanged |
| D: 意図的 polling | ライブ視覚データのみ | assignValuesList |

### onPresetApplied の設計
render loop 内（`_applyPresetToLayer`）から engine を直接呼べないため、`layerManager.onPresetApplied` コールバックで疎結合を維持。

### 反省点
- 承認なしで実装してしまった場面が複数回あった
- 戻す際に `git checkout` を使わず edit の積み重ねで戻そうとした（リスク大）
- **今後**: 必ず承認後に実装・戻す際は `git checkout <commit> -- <filepath>` を使う

---

## 次回やること（Day85）

1. **始業時**: `docs/architecture/ui-event-flow.md` を読む
2. **MacroKnob D&D アサイン状態の可視化**（Day84 積み残し）
   - `≡` ハンドルにアサイン済みドット表示
   - 右クリックでアサイン削除コンテキストメニュー
   - `useDnDParamRow.ts` に `useGeoStore.macroKnobs` 購読を追加
   - `DnDHandleWithMenu.tsx` 新規作成
   - Geometry / Camera / FX の SimpleDnDWindow・StandardDnDWindow に組み込み
3. Phase 4: 旧 Window 廃止（Inspector 安定後）
4. Sequencer Plugin 設計

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| UIイベントフロー設計図 | `docs/architecture/ui-event-flow.md` |
| engine | `src/application/orchestrator/engine.ts` |
| layerManager | `src/application/orchestrator/layerManager.ts` |
| geoStore | `src/ui/store/geoStore.ts` |
| GeometryPanel | `src/ui/components/inspector/layer/panels/GeometryPanel.tsx` |
| CameraPanel | `src/ui/components/inspector/layer/panels/CameraPanel.tsx` |
| FxPanel | `src/ui/components/inspector/layer/panels/FxPanel.tsx` |

---

## 環境メモ

- 開発: `pnpm dev` → `open http://localhost:5173`（HMR / hard reload 不可）
- NFC 正規化: `python3 /Users/shinbigan/nfc_normalize.py`（日本語ファイル書き込み後に必須）
- git commit の日本語本文: `.claude/dayN-prompt.md` 経由で `git commit -F`
- 戻す際: `git checkout <commit> -- <filepath>`（edit 積み重ねで戻さない）

---

## 次回スタートプロンプト

```
Day85開始
```
