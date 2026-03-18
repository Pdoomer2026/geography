# GeoGraphy 引き継ぎメモ｜Day9｜2026-03-18

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応のブラウザベース映像制作プラットフォーム
- **技術スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / shadcn/ui / Framer Motion / Vitest
- **開発スタイル**: Claude Desktop（設計・ドキュメント）＋ Claude Code（実装・Git）＋ Obsidian（ログ）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **開発サーバー**: `pnpm dev`（ポート5173〜5176）

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| ルート CLAUDE.md | `geography/CLAUDE.md` |
| 引き継ぎメモ（累積） | `geography/HANDOVER.md` |
| 型定義 | `src/types/index.ts` |
| エンジン本体 | `src/core/engine.ts` ← 今回変更 |
| Program バス | `src/core/programBus.ts` |
| Preview バス | `src/core/previewBus.ts` |
| SimpleMixer | `src/plugins/windows/simple-mixer/SimpleMixer.tsx` ← Day8 変更 |
| grid-wave Plugin | `src/plugins/geometry/wave/grid-wave/index.ts` |
| CrossFade Plugin | `src/plugins/transitions/crossfade/index.ts` |
| Beat Cut Plugin | `src/plugins/transitions/beat-cut/index.ts` |
| Day9 実装プロンプト | `.claude/day9-prompt.md` |

---

## 今回のセッションで完了したこと

### Day 8
- `SimpleMixer.tsx` に `useEffect` + `useRef` で `previewBus.getCanvas()` を PREVIEW エリアに mount
- クロスフェーダー変化時に選択中の TransitionPlugin の `execute()` を呼び出し `programBus.load()` に渡す
- Transition 切り替え時に `crossfader` を 0 にリセット
- コミット: `feat: Day8 - SimpleMixer ProgramBus/PreviewBus connection`

### Day 9
- `engine.ts` の `initialize()` に Plugin `create()` 呼び出しを追加（登録後に全 Plugin を scene に配置）
- 初期 SceneState を生成して `programBus.load()` / `previewBus.update()` に渡す処理を追加
- `dispose()` に全 Plugin の `destroy()` クリーンアップを追加
- コミット: `feat: Day9 - engine.ts grid-wave create/destroy + initial SceneState`（a394654）

---

## 現在の状態（重要）

- **ブランチ**: `main`
- **最後のコミット**: `feat: Day9 - engine.ts grid-wave create/destroy + initial SceneState`（a394654）
- **テスト**: 34 tests グリーン ✅
- **ブラウザ目視**: 未確認（次回セッションで確認）
- **期待される表示**: grid-wave 波形メッシュ + SimpleMixer PREVIEW に「grid-wave / 1 layer(s)」

### engine.ts の現在の構造（要点）
```
initialize()
  ├── Three.js 基盤セットアップ
  ├── registerGeometryPlugins() / registerLightPlugins() / registerParticlePlugins()
  ├── [NEW] 全 Plugin の create(scene) を呼び出す
  ├── [NEW] 初期 SceneState 生成 → programBus.load() / previewBus.update()
  └── window.addEventListener('resize', this.onResize)

update(delta)
  └── registry.list() を走査して plugin.update(delta, beat) ← beat は 0 固定（Day10 で解消）

dispose()
  ├── stop()
  ├── [NEW] 全 Plugin の destroy?(scene) を呼び出す
  └── renderer・scene・camera のクリーンアップ
```

---

## 発生した問題と解決策

- **問題**: Claude Code へのプロンプトをチャットからコピーできない
  → **解決**: `.claude/day{N}-prompt.md` にファイル保存し、Claude Code で `cat` コマンドで読み込む運用を確立

---

## 次回やること（Day 10）

1. **ブラウザ目視確認**（最優先）
   - `pnpm dev` で起動
   - grid-wave 波形メッシュが画面に表示されるか確認
   - SimpleMixer PREVIEW エリアに「grid-wave / 1 layer(s)」が表示されるか確認
   - クロスフェーダーを動かしてコンソールエラーが出ないか確認

2. **`src/core/clock.ts` の BPM クロック実装**
   - `Clock` クラスに `start()` / `stop()` / `getBeat()` / `setTempo(bpm)` を実装
   - beat 値は小数（0.0〜1.0 を繰り返す）で表現
   - `engine.ts` の `update()` の beat 固定値（0）を Clock から取得するように変更

3. **SimpleMixer に Tap Tempo ボタン追加**
   - ボタン押下ごとに間隔を計測して BPM を推定
   - `clock.setTempo(bpm)` に渡す

4. **コミット**: `feat: Day10 - BPM clock + tap tempo`

---

## 環境メモ

- pnpm 必須（npm / yarn 不可）
- Three.js r160+ 使用（それ以前は API が異なる）
- `import.meta.glob` を使う場合は `tsconfig.json` に `"types": ["vite/client"]` が必要
- **Claude Desktop MCP は `/Users/shinbigan` 全体に権限拡張済み**
- CLAUDE.md 群・docs/ の更新は Claude Desktop から直接行う
- Git 操作は Claude Code から行う
- テスト結果の保存: `pnpm test --run 2>&1 | tee .claude/test-latest.txt`
- Claude Code へのプロンプト渡し: `.claude/day{N}-prompt.md` に保存 → `cat` で読み込む
- grid-wave の実際のパス: `src/plugins/geometry/wave/grid-wave/index.ts`（`wave/` サブフォルダ以下）
