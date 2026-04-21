# Day73 実装依頼｜Clock → Tone.js 移行

## 作業前に必ず読むこと

```
docs/spec/clock.spec.md          ← 今回の SSoT（必読）
src/application/orchestrator/tempo/clock.ts  ← 現在の実装
src/application/schema/config.ts             ← DEFAULT_BPM
```

---

## 作業内容

### Step 1: Tone.js インストール

```bash
cd /Users/shinbigan/geography && pnpm add tone
```

### Step 2: IClock インターフェース新設

新規ファイル作成:
`src/application/orchestrator/tempo/IClock.ts`

```typescript
export interface IClock {
  start(): void
  stop(): void
  reset(): void
  setTempo(bpm: number): void
  getBpm(): number
  getBeat(): number
  getTotalBeats(): number
  isRunning(): boolean
}
```

### Step 3: clock.ts を Tone.js ベースに移行

`src/application/orchestrator/tempo/clock.ts` を spec §4 の実装に置き換える。

- `performance.now()` ベースの実装を削除
- `Tone.getTransport()` ベースに移行
- `IClock` を implements する
- `stop()` は `Transport.pause()`（累積保持）
- `reset()` は `Transport.stop()`（ゼロリセット）

### Step 4: 既存コードへの影響を修正

`clock` を使用している箇所を確認し、型エラーがあれば修正する。
（`getTotalBeats` / `isRunning` / `reset` の追加による影響のみのはず）

---

## 完了条件（CDD 原則）

```bash
pnpm tsc --noEmit   # 型エラーゼロ
pnpm test --run     # 127 tests グリーン（既存テストが壊れていないこと）
```

---

## 注意事項

- `any` 型禁止
- 既存テストを壊さない
- `stop()` と `reset()` の使い分けを spec §4 で確認すること
- コミットは実装完了・tsc + test 両通過後に行う
