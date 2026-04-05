# GeoGraphy 引き継ぎメモ｜Day38｜2026-04-02

## プロジェクト概要
- アプリ名：GeoGraphy（Electron VJ アプリ + Three.js ビジュアルエンジン）
- スタック：Vite / React 18 / TypeScript / Three.js r160+ / Electron / pnpm
- 開発スタイル：SDD × CDD（spec → 実装 → tsc + test グリーン）
- GitHub：https://github.com/Pdoomer2026/geography
- 開発コマンド：`pnpm dev:electron`
- 検証コマンド：`pnpm tsc --noEmit && pnpm test --run`

## 重要ファイルパス
| ファイル | パス |
|---|---|
| エンジン | `src/core/engine.ts` |
| レイヤー管理 | `src/core/layerManager.ts` |
| FX Plugin バレル | `src/plugins/fx/index.ts` |
| FX UI | `src/ui/FxSimpleWindow.tsx` |
| App | `src/ui/App.tsx` |
| 型定義 | `src/types/index.ts` |
| Electron メイン | `electron/main.js` |
| 引き継ぎ | `HANDOVER.md` |

## 今回のセッションで完了したこと

### Phase 13：UI パネルディレクトリ整理
- `src/ui/panels/` ディレクトリ新設
- `PreferencesPanel.tsx` → `src/ui/panels/preferences/PreferencesPanel.tsx` に移動
- `MacroKnobSimpleWindow.tsx` → `src/ui/panels/macro-knob/MacroKnobPanel.tsx` にリネーム移動
- 各ディレクトリに `CLAUDE.md` 新設（panels / preferences / macro-knob）
- `App.tsx` の import パス更新
- import 深さミス（`../../` → `../../../`）・型注釈起因の型不一致を修正
- コミット：`Phase 13: reorganize UI panels directory`、タグ：`day38-phase13`

### FX Plugin 拡張・新規
- **GlitchPlugin**：`interval` パラメーター追加（10〜240フレーム、`randX` を毎フレーム上書き）
- **FeedbackPlugin**：`decay`（0.9〜1.0）/ `offsetX`（-0.05〜0.05）/ `offsetY` 追加、GLSL も更新
- **FilmPlugin**：新規実装（`intensity` / `grayscale`、`FilmPass` 使用）
- **FreiChenPlugin**：新規実装（Frei-Chen エッジ検出、`width` / `height`、`ShaderPass` 使用）
- `src/plugins/fx/index.ts`：全 12 本体制に更新

## 現在の状態（重要）
- **tsc エラー：ゼロ**
- **テスト：104 passed（14 files）**
- **最新タグ：`day38`**
- FX Plugin 総数：12本（after-image / feedback / bloom / kaleidoscope / mirror / zoom-blur / rgb-shift / crt / glitch / color-grading / film / frei-chen）

## 発生した問題と解決策
- 問題：`panels/macro-knob/` の import パスが `../../` で不足 → 解決：`../../../` に修正（3階層上）
- 問題：コールバック引数に `GeometryPlugin` 型注釈を付けたら型不一致 → 解決：型注釈を除去して推論に任せる
- 問題：`FilmPass.uniforms` が `{}` 型で index アクセス不可 → 解決：`as Record<string, { value: number }>` でキャスト
- 問題：チャット途中で入力不能 → 解決：前チャットのログをテキストで貼り付けて新チャットに引き継ぎ

## 次回やること（Day39）
優先度順：

1. **HANDOVER.md 更新**（Day38 完了内容・FX 12本体制を反映）
2. **Shader Plugin spec 執筆**（`docs/spec/shader-plugin.spec.md`）
   - 疎結合デフォルト（`engine.getGeometryData(layerId)` → 標準 `GeometryData` を供給）
   - オプションの密結合「native」モード（Preferences 設定）
   - グラフィティ美学：エッジをシングルストローク、面をスプレー塗りで描く
3. **Orbit カメラシステム**（Icosphere / Torus / Torusknot 用）
4. **Aerial カメラ**（Hex Grid 用）
5. **Plugin Store v1 設計**（手動フォルダ追加方式、v3 in-app store まで rework 不要な設計）

## 環境メモ
- `filesystem:edit_file` は既存ファイルの編集専用（`write_file` は新規作成のみ）
- `write_file` で新規ディレクトリ配下に書く場合は先に `create_directory` が必要
- `ShaderPass` 系の `uniforms` は Three.js 型定義が `{}` になりがち → `as Record<string, { value: T }>` でキャスト
- セッション終了時の必須手順：HANDOVER.md 更新 → `git commit` → `git tag dayN` → `git push origin main --tags`
