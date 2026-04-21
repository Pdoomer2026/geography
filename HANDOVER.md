# GeoGraphy 引き継ぎメモ｜Day71｜2026-04-21

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応の映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / Electron 41 / RxJS 7.8.2 / Zustand 5.0.12 / Zod 4.3.6
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **ブランチ**: `refactor/day53-design`
- **プロジェクトルート**: `/Users/shinbigan/geography`

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| CLAUDE.md（全体方針） | `CLAUDE.md` |
| useSimpleParamRow | `src/ui/hooks/useSimpleParamRow.ts` |
| useDnDParamRow | `src/ui/hooks/useDnDParamRow.ts` |
| useStandardParamRow | `src/ui/hooks/useStandardParamRow.ts` |
| useStandardDnDParamRow | `src/ui/hooks/useStandardDnDParamRow.ts` |
| CommandStream（RxJS） | `src/application/command/commandStream.ts` |
| GeoStore（Zustand） | `src/ui/store/geoStore.ts` |
| Engine | `src/application/orchestrator/engine.ts` |
| FxStack | `src/application/orchestrator/fxStack.ts` |
| App.tsx | `src/ui/App.tsx` |
| FX index | `src/engine/fx/index.ts` |

---

## 現在の状態

- **ブランチ**: `refactor/day53-design`
- **タグ**: `day71`（最新コミット: `4d8b7db`）
- **テスト**: 127 tests グリーン・tsc エラーゼロ
- **Day71 コミット一覧**:
  ```
  4d8b7db fix: add film and frei-chen to FX_STACK_ORDER (Day71)
  99ef972 refactor: replace setInterval polling with event-driven callbacks (Day71)
  ```

---

## Day71 で完了したこと

### SimpleWindow 系の paramCommand$ 統一
- `useSimpleParamRow` フック新設（`src/ui/hooks/useSimpleParamRow.ts`）
- `GeometrySimpleWindow` / `FxSimpleWindow` / `CameraSimpleWindow` の ParamRow 内インライン実装を `useSimpleParamRow` に置き換え
- `engine.handleMidiCC()` 直呼びを全廃止 → `paramCommand$.next()` に統一

### setInterval ポーリング全廃止（イベント駆動化）
- `engine.onParamChanged` を単一CB → `Set<listener>` 複数購読対応に変更（unsubscribe 返却）
- `App.tsx` の cleanup で `unsubParam()` を追加
- Geometry/Camera Simple/Standard Window（4本）: `setInterval` → `onRegistryChanged`
- DnD 系 3 Window（GeometrySimpleDnD / GeometryStandardDnD / CameraSimpleDnD）: `setInterval` → `onRegistryChanged`（構造変化）+ `onParamChanged`（値変化）の2本立て
- **設計方針**: 変化がない時は一切コードが動かない。AIがコードを読む際に余計な処理で迷わない

### film / frei-chen を FX_STACK_ORDER に追加
- `fxStack.ts` の `FX_STACK_ORDER` に `film` / `frei-chen` を追加（glitch の直後・color-grading の直前）
- `fxStack.ts` コメント・`fx/CLAUDE.md` スタック順序・`fxStack.test.ts` を同期更新

---

## アーキテクチャ確定事項（Day71）

### イベント駆動の2本立て設計
```
onRegistryChanged  → プラグイン構造変化（Plugin切り替え・登録/解除）
onParamChanged     → パラメーター値変化（MacroKnob 操作・スライダー操作）
```

### paramCommand$ フロー（全Window統一済み）
```
UI スライダー操作
  → useSimpleParamRow / useDnDParamRow / useStandardParamRow 等
  → paramCommand$.next({ slot, value, source: 'window', layerId })
  → App.tsx の throttleTime(16ms)
  → engine.handleMidiCC()
  → flushParameterStore()
  → onParamChanged 発火 → Window 再描画
```

### FX_STACK_ORDER（12本・確定）
```
after-image → feedback → bloom → kaleidoscope → mirror
→ zoom-blur → rgb-shift → crt → glitch → film → frei-chen → color-grading（最後）
```

---

## 次回やること

### 優先度 高
1. **Sequencer Window spec 検討**（Phase 16）
   - `docs/spec/` に `sequencer-window.spec.md` を新規作成
   - BPM クロックとの連携設計

### 優先度 中
2. **ParamCatalog 移行**（`ccMapService` → `paramCatalog`）
   - `docs/spec/param-catalog.spec.md` を読んで移行方針を確認

---

## 環境メモ

- **ブラウザ確認**: `pnpm dev` → `open http://localhost:5173`（毎回再起動が必要）
- **e2e テスト**: `pnpm exec playwright test --headed`（pnpm dev 起動中に実行）
- **実装ルール**: 実装前に必ず提案 → 確認 → 実装の順で進める
- **git commit**: 日本語長文は `.claude/dayN-commit.sh` に書いて `bash` で実行
- **NFC 正規化**: 日本語ファイル編集後は `python3 /Users/shinbigan/nfc_normalize.py`

---

## 次回チャット用スタートプロンプト

```
Day72開始
```
