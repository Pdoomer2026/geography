# GeoGraphy 引き継ぎメモ｜Day15完了→Day16へ｜2026-03-23

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応のブラウザベース映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160(0.170) / pnpm / shadcn/ui / Framer Motion
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **開発サーバー**: `pnpm dev`（ポート5173〜5176）
- **プロジェクトルート**: `/Users/shinbigan/geography`

## 重要ファイルパス

| ファイル | パス |
|---|---|
| CLAUDE.md（全体方針） | `CLAUDE.md` |
| 引き継ぎメモ | `HANDOVER.md` |
| 型定義 | `src/types/index.ts` |
| エンジン本体 | `src/core/engine.ts` |
| FxStack コア | `src/core/fxStack.ts` ← Day15新規 |
| LayerManager | `src/core/layerManager.ts` |
| FX Plugins（全10個） | `src/plugins/fx/` ← Day15新規 |
| FX バレルエクスポート | `src/plugins/fx/index.ts` |
| FX spec | `docs/spec/fx-stack.spec.md` |
| Day15進捗ログ | `docs/progress/day15-fx-stack.log.md` |

## 今回のセッション（Day15）で完了したこと

- `src/core/fxStack.ts` 作成（FxStack クラス・FX_STACK_ORDER 定数）
- FX Plugin 10個を全て実装（after-image / feedback / bloom / kaleidoscope / mirror / zoom-blur / rgb-shift / crt / glitch / color-grading）
- `src/plugins/fx/index.ts` バレルエクスポート + `getAllFxPlugins()`
- `tests/core/fxStack.test.ts` 11テスト（TC-1順序・TC-2 enabled・TC-3 dispose）
- git push 完了（1431c40）

## 現在の状態（重要）

- **ブランチ**: main / 最終コミット: 1431c40
- **tsc**: エラーゼロ
- **tests**: 61 passed（50 → +11）
- **FxStack**: 実装済みだが engine.ts への統合はまだ（映像にFXはかかっていない）
- **ブラウザ表示**: グリッドウェーブ背景 + MacroKnobPanel + SimpleMixer 正常動作中

## 発生した問題と解決策

- 問題: `create_file` ツールがプロジェクトに書き込めなかった → 解決: `filesystem:write_file` を使う
- 問題: `AfterImagePass` が型エラー → 解決: three 0.170 では `AfterimagePass`（小文字 i）が正しい
- 問題: `feedback/index.ts` で未使用の `composerRef` フィールドが残存 → 解決: フィールドごと削除

## 次回やること（Day16）

1. **engine.ts への FxStack 統合**（最優先）
   - `layerManager` の各レイヤーに `EffectComposer` を生成・紐付け
   - `layerManager.update()` 内で `fxStack.update(delta, beat)` を呼ぶ
   - `RenderPass` → FX passes → 画面出力のパイプライン構築
   - spec: `docs/spec/fx-stack.spec.md`

2. **FX コントロール UI**（engine統合後）
   - ON/OFF パネル・パラメータースライダー

3. **カメラシステム**（spec未存在・別途）
   - `docs/spec/camera-system.spec.md` の作成から

## 環境メモ

- `filesystem:write_file` を使う（`create_file` はプロジェクトに書き込めない）
- `AfterimagePass` は小文字 i（three 0.170 の正式クラス名）
- `FX_STACK_ORDER` は変更禁止・ColorGrading は必ず最後
- `pnpm` 必須（npm / yarn 不可）
- 完了条件は必ず両方: `pnpm tsc --noEmit` AND `pnpm test --run`
- `engine.ts` の `threeClock`（THREE.Clock）と `clock`（BPM Clock）は別物・混同しないこと
