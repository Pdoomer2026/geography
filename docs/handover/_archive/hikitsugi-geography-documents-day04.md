# GeoGraphy 引き継ぎメモ｜Day 4｜2026-03-11

## プロジェクト概要
- **アプリ名**: GeoGraphy
- **目的**: Three.js ブラウザベースのリアルタイム VJ プラットフォーム（レトロフューチャー・シンセウェーブ）
- **技術スタック**: TypeScript / Vite / React 18 / Three.js r160+ / pnpm / shadcn/ui / Framer Motion
- **開発スタイル**: Claude.ai でブラッシュアップ → Warp の `claude` コマンドに指示文を貼り付ける方式・1ステップずつ確認しながら進める
- **GitHub**: https://github.com/Pdoomer2026/geography
- **開発サーバー**: `pnpm dev`（ポート 5173〜5176 自動割り当て）

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| プロジェクトルート | `~/geography/` |
| 定数管理 | `~/geography/src/core/config.ts` |
| Interface 定義 | `~/geography/src/types/index.ts` |
| Command パターン | `~/geography/src/core/command.ts` |
| パラメーター管理 | `~/geography/src/core/parameterStore.ts` |
| Plugin Registry | `~/geography/src/core/registry.ts` |
| メインコンポーネント | `~/geography/src/ui/App.tsx` |
| grid-wave Plugin | `~/geography/src/plugins/geometry/wave/grid-wave/` |
| Ambient Light Plugin | `~/geography/src/plugins/lights/ambient/` |
| Starfield Plugin | `~/geography/src/plugins/particles/starfield/` |
| CLAUDE.md 原本 | `~/geography/CLAUDE.md` |

---

## 今回のセッション（Day 4）で完了したこと

- `src/core/config.ts` 作成（MAX_LAYERS=3 / MAX_UNDO_HISTORY=50 / DEFAULT_BPM=128 / LERP_FACTOR=0.05）
- `src/plugins/lights/ambient/` 実装（ambient.config.ts / AmbientLight.ts / index.ts）
- `src/plugins/particles/starfield/` 実装（starfield.config.ts / StarfieldParticle.ts / index.ts）
- `src/core/registry.ts` 型拡張（AnyPlugin = GeometryPlugin | LightPlugin | ParticlePlugin）
- `src/ui/App.tsx` に starfield + ambient を統合（create / update / destroy の3箇所）
- ブラウザで「grid-wave + 星空」の動作確認 ✅
- GitHub push 済み（commit: feat: Day4 - config, AmbientLight plugin, Starfield particle plugin）

---

## 現在の状態（重要）

- **ブラウザ表示**: シアンのグリッド波（grid-wave）の背後に青白い星（starfield）が Z 軸方向に流れている
- **starfield パラメーター初期値**: count=5000 / depth=50 / speed=0.3 / size=0.05 / opacity=0.6
- **ambient パラメーター初期値**: intensity=0.3
- **ライン カラー**: `#a0c4ff`（青白）
- **App.tsx の Plugin 起動順**: gridWavePlugin → starfieldPlugin → ambientPlugin

---

## 発生した問題と解決策

- **問題**: Day 4 開始時に Claude Code が `#Day4` 入力でプランモードを無視して即実装を開始した
  → **解決**: 一旦 No で止めて、改めてプランモード指示文を送り直した
- **特になし**: TypeScript コンパイルエラーはすべてのステップでゼロ

---

## 次回やること（Day 5 候補）

1. **`src/plugins/geometry/index.ts` を作成する**
   - `import.meta.glob('./*/index.ts', { eager: true })` で Geometry Plugin を自動登録
   - registry.register(m.default) でまとめて登録

2. **`src/plugins/particles/index.ts` を作成する**
   - 同様に Particle Plugin を自動登録

3. **`src/plugins/lights/index.ts` を作成する**
   - 同様に Light Plugin を自動登録

4. **テスト基盤を整備する（実装計画書 §4.6）**
   - `tests/core/registry.test.ts`（register / get / list の動作確認）
   - `tests/core/command.test.ts`（execute / undo / redo の動作確認）
   - `pnpm test` が緑になることを確認

5. **GitHub push**
   - commit: `feat: Day5 - auto-registration, test foundation`

---

## 環境メモ

- Claude Code 起動: `cd ~/geography && claude`
- `pnpm dev` は別タブ（⌘T）で起動したまま維持する
- `#Day5` と入力すると Claude Code が関連 CLAUDE.md を自動読み込みしてくれる
- プランモードを使いたい場合は「プランモードで考えてください。コードは書かないでください。」を明示する
- ポートは 5173〜5176 を順に試す（複数セッション起動時）
- `npx tsc --noEmit` でコンパイルエラー確認を各ステップで必ず行う

---

## 次回チャットの始め方

1. 新しいチャットを開く
2. `GeoGraphy_実装計画書_v2_2.docx` / `GeoGraphy_要件定義書_v1_4.docx` をアップロード
3. このファイルをアップロード
4. 以下を伝える：

```
2026年3月11日に Day 4（config / AmbientLight Plugin / Starfield Plugin）まで完了しました。
添付の引き継ぎメモを読んで、Day 5 の実装を一緒に進めてください。
開発フローは Claude.ai でブラッシュアップ → Warp の claude コマンドに指示文を貼り付ける方式です。
```
