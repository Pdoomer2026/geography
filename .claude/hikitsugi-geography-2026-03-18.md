# GeoGraphy 引き継ぎメモ｜Day10｜2026-03-18

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
| エンジン本体 | `src/core/engine.ts` |
| BPM クロック | `src/core/clock.ts` ← 今回新規作成 |
| Program バス | `src/core/programBus.ts` |
| Preview バス | `src/core/previewBus.ts` |
| SimpleMixer | `src/plugins/windows/simple-mixer/SimpleMixer.tsx` ← 今回変更 |
| Beat Cut Plugin | `src/plugins/transitions/beat-cut/index.ts` ← stub・次回実装 |
| Day10 実装プロンプト | `.claude/day10-prompt.md` |

---

## 今回のセッションで完了したこと

### Day 10
- `src/core/clock.ts` 新規作成（BPM クロック）
  - `start()` / `stop()` / `setTempo(bpm)` / `getBeat()` / `getBpm()` を実装
  - beat 値は 0.0〜1.0 の繰り返し小数（1拍の中の位置）
  - `setTempo(0)` は無視（DEFAULT_BPM = 128 を維持）
- `src/core/engine.ts` 修正
  - `private clock: THREE.Clock` → `threeClock` にリネーム
  - `readonly clock: Clock = new Clock()` を追加（外部からアクセス可）
  - `update()` の `beat = 0` 固定を `this.clock.getBeat()` に変更
  - `stop()` に `this.clock.stop()` を追加
- `src/plugins/windows/simple-mixer/SimpleMixer.tsx` 修正
  - `engine` を import し `engine.clock.setTempo(bpm)` に接続
  - TAP ボタンと BPM 表示（`displayBpm` state）を追加
  - Tap Tempo ロジック：2秒でリセット・2回以上で BPM 計算
- `tests/clock.test.ts` 新規作成（4 テスト）
- テスト: 34 → 38 tests グリーン ✅
- コミット: `feat: Day10 - BPM clock + tap tempo`（1e8d490）

---

## 現在の状態（重要）

- **ブランチ**: `main`
- **最後のコミット**: `feat: Day10 - BPM clock + tap tempo`（1e8d490）
- **テスト**: 38 tests グリーン ✅
- **ブラウザ目視**: 未確認（次回セッションで確認）
- **期待される表示**: SimpleMixer に TAP ボタンと「128 BPM」テキストが表示される

### clock.ts の現在の構造（要点）
```typescript
class Clock {
  private bpm = DEFAULT_BPM   // 128
  private startTime = 0
  private running = false

  getBeat(): number   // running でなければ 0・running なら 0.0〜1.0
  setTempo(bpm): void // bpm <= 0 は無視・変更時は startTime リセット
}
```

### engine.ts の clock 関連（要点）
```
threeClock: THREE.Clock  → getDelta() 用（レンダーループのみ）
clock: Clock（readonly） → getBeat() / setTempo() / 外部アクセス可
```

---

## 発生した問題と解決策

- **問題**: `engine.ts` の既存 `clock` フィールドが THREE.Clock と名前衝突
  → **解決**: `threeClock` にリネームし、BPM クロックを `clock` として追加

---

## 次回やること（Day 11）

1. **ブラウザ目視確認**（最優先）
   - `pnpm dev` で起動
   - SimpleMixer に TAP ボタンと BPM 表示が出ているか確認
   - TAP を複数回押すと BPM 表示が更新されるか確認

2. **Beat Cut Transition Plugin の完成**
   - ファイル: `src/plugins/transitions/beat-cut/index.ts`（現在 stub）
   - `execute(from, to, progress)` で beat に同期したカット演出を実装
   - beat 値が 0 を通過した瞬間に Program/Preview を瞬時切り替え

3. **engine.ts に Beat Cut の beat 連携を確認**
   - `clock.getBeat()` が Beat Cut Plugin に正しく渡っているか確認

4. **コミット**: `feat: Day11 - beat cut transition`

---

## 環境メモ

- pnpm 必須（npm / yarn 不可）
- Three.js r160+ 使用（それ以前は API が異なる）
- `engine.ts` の `threeClock`（THREE.Clock）と `clock`（BPM Clock）は別物・混同しないこと
- `engine.clock` は `readonly` で外部（SimpleMixer 等）からアクセス可能
- **Claude Desktop MCP は `/Users/shinbigan` 全体に権限拡張済み**
- CLAUDE.md 群・docs/ の更新は Claude Desktop から直接行う
- Git 操作は Claude Code から行う
- テスト結果の保存: `pnpm test --run 2>&1 | tee .claude/test-latest.txt`
- Claude Code へのプロンプト渡し: `.claude/day{N}-prompt.md` に保存 → `cat` で読み込む
- grid-wave の実際のパス: `src/plugins/geometry/wave/grid-wave/index.ts`（`wave/` サブフォルダ以下）
