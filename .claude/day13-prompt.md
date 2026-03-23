# Day 13 実装プロンプト｜マクロノブシステム（MacroKnobManager）
# SDD × CDD対応版

---

## ⚠️ 実装前に必ず読むこと（SDD原則）

```bash
cat docs/spec/macro-knob.spec.md
```

---

## 完了条件（両方必須・CDD原則）

```bash
pnpm tsc --noEmit   # 型エラーゼロ
pnpm test --run     # 全テストグリーン
```

**anyによる解決は禁止。型エラーは自律的に修正すること。**

---

## 自律修正ループ

1. 実装 → `pnpm tsc --noEmit` を実行
2. 型エラーが出たら自律修正
3. 型エラーゼロ → `pnpm test --run` を実行
4. 両方通過するまでループ
5. 各ステップ完了ごとに `docs/progress/day13-macro-knob.log.md` に追記

---

## Step 0: プラン提示（実装前に必須）

specを読んだ後、以下を提示してから実装を開始すること：
- 作成・変更するファイル一覧
- specのどのConstraintをどう満たすか
- 型設計（新しいInterfaceが必要か）
- テストケースの対応

**プラン提示なしにコードを書いてはいけない。**

---

## Step 1: 動作確認

```bash
pnpm tsc --noEmit && pnpm test --run 2>&1 | tee .claude/test-latest.txt
```

43 tests グリーン・tsc PASSを確認してから進む。

---

## Step 2: `src/core/config.ts` に定数追加

```typescript
export const MACRO_KNOB_COUNT = 32  // 8ノブ × 4行
export const MACRO_KNOB_MAX_ASSIGNS = 3  // 1ノブの最大割り当て数
```

実装後: `pnpm tsc --noEmit` を実行。

---

## Step 3: `src/types/index.ts` に型追加

spec §3 の Interface に準拠して追加：
- `CurveType`
- `MacroAssign`
- `MacroKnobConfig`
- `MacroKnobManager` interface

実装後: `pnpm tsc --noEmit` を実行。

---

## Step 4: `src/core/macroKnob.ts` を新規作成

spec §3・§4 に準拠して実装：
- `MacroKnobManager` class
- `normalize()` ヘルパー関数（spec §4）
- `handleMidiCC()` → assigns の各パラメーターを Command 経由で更新
- `MACRO_KNOB_MAX_ASSIGNS` を超えるassignsはエラー
- シングルトンで export

実装後: `pnpm tsc --noEmit` を実行。

---

## Step 5: `engine.ts` に MacroKnobManager を接続

1. `import { macroKnobManager } from './macroKnob'` を追加
2. `initialize()` で初期化
3. MIDI入力を受け取ったとき `macroKnobManager.handleMidiCC(cc, value)` を呼ぶ
4. `getMacroKnobs()` メソッドを追加

実装後: `pnpm tsc --noEmit` を実行。

---

## Step 6: テスト追加（spec §5 のTest Casesに準拠）

`tests/core/macroKnob.test.ts` を新規作成。
spec のTC-1〜TC-5 をすべて実装。

---

## Step 7: 完了確認

```bash
pnpm tsc --noEmit && pnpm test --run 2>&1 | tee .claude/test-latest.txt
```

**両方通過するまでStep 2〜6をループする。**

---

## Step 8: ブラウザ目視確認

- 映像が正常に表示される
- コンソールエラーがない

---

## Step 9: コミット

```bash
git add -A && git commit -m "feat: Day13 - macro knob system"
```

---

## 注意点（spec §2 Constraints より）

- ノブ数は32固定・config.tsの `MACRO_KNOB_COUNT` を参照（ハードコード禁止）
- assigns は最大3つ・超えたらエラー
- MIDI値の正規化: `min + (midi / 127) * (max - min)`
- パラメーター変更は Command 経由（直接代入禁止）
- マクロノブパネルは閉じることができない
- anyは使わない・型エラーは自律修正
