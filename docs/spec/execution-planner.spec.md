# ExecutionPlanner Spec

> SSoT: このファイル
> 対応実装: `src/application/orchestrator/executionPlanner.ts`
> 担当: Claude Desktop（設計） / Claude Code（実装）
> 状態: Day72 設計確定・Phase 1 実装待ち

---

## 1. 目的と役割

ExecutionPlanner は「この Command を Sync で処理するか Async で処理するか」を決定する**門番**。

GeoGraphy はリアルタイム VJ ツールであり、処理の大半は Sync（即時・毎フレーム）で行われる。
しかし一部の処理（Shader コンパイル・重いメッシュ生成・AI 推論・DB 書き込み）は
レンダーループをブロックしてはならず、Async キューに逃す必要がある。

```
Command
  ↓
ExecutionPlanner.plan(command)
  ↓
'sync'  → Orchestrator が即時処理
'async' → Queue（BullMQ）に投げる → Worker → Engine → 結果反映
```

---

## 2. 設計思想：なぜ BullMQ か

GeoGraphy は将来以下の構成に拡張される：

```
Electron VJ ツール（現在）
  ↓
Next.js（Web UI）
  + Supabase（ローカル DB → クラウド DB）
  + Google AI Studio（パラメーター生成・AI 提案）
  + BullMQ（非同期キュー統一管理）
  ↓
Application / Orchestrator（OS）
  ↓
Engine（純粋計算）
```

BullMQ を採用する理由：
- **Next.js との親和性** — API Route → BullMQ への投げ方が定番パターン
- **Supabase との連携** — Job 完了後の DB 書き込みが自然に繋がる
- **Google AI Studio** — AI 推論は重く待てる処理 → Async の典型ユースケース
- **統一キュー** — Shader コンパイル / AI 生成 / DB 保存を同じパスで扱える
- **リトライ・永続化** — worker_threads にはない信頼性が必要なユースケースがある

Phase 1 では BullMQ を導入しない。「場所」と「インターフェース」だけ確保する。

---

## 3. 型定義

```typescript
/** Command の実行戦略 */
export type ExecutionStrategy = 'sync' | 'async'

/** ExecutionPlanner インターフェース */
export interface IExecutionPlanner {
  plan(command: Command): ExecutionStrategy
}
```

---

## 4. catalog への execution フラグ（Phase 2 で活用）

`ParamCatalogEntry` に `execution` フィールドを追加する（Phase 2）。

```typescript
export interface ParamCatalogEntry {
  // 既存フィールド（省略）
  requiresRebuild?: boolean

  // Phase 2 で追加
  /**
   * この param の変更が引き起こす処理の実行戦略。
   * 省略時は 'sync'（デフォルト）。
   * 'async' を指定すると ExecutionPlanner が BullMQ へ投げる。
   */
  execution?: 'sync' | 'async'
}
```

**'async' を立てるべき処理の基準：**
- Shader コンパイル（GLSL → GPU）
- segments が 100 を超えるような重いメッシュ再生成
- Google AI Studio への推論リクエスト
- Supabase への書き込み

---

## 5. Phase 別ロードマップ

### Phase 1（現在）— Shell を置く

```typescript
// src/application/orchestrator/executionPlanner.ts
import type { Command } from '../command/command'

export type ExecutionStrategy = 'sync' | 'async'

export interface IExecutionPlanner {
  plan(command: Command): ExecutionStrategy
}

/**
 * ExecutionPlanner Phase 1
 * 全 Command を Sync として扱う。
 * Phase 2 で catalog の execution フラグを読むように拡張する。
 */
export class ExecutionPlanner implements IExecutionPlanner {
  plan(_command: Command): ExecutionStrategy {
    return 'sync'
  }
}

export const executionPlanner = new ExecutionPlanner()
```

**完了条件:** `pnpm tsc --noEmit` 通過のみ（テスト不要・shell なので）

---

### Phase 2（Shader Plugin 実装前）— catalog 連携

```typescript
// catalog の execution フラグを読んで判断
plan(command: Command): ExecutionStrategy {
  if (command.type === 'UPDATE_PARAM') {
    const entry = paramCatalog.get(command.payload.paramId)
    return entry?.execution ?? 'sync'
  }
  return 'sync'
}
```

---

### Phase 3（Next.js 導入時）— BullMQ 本格導入

```
adapter/
  queue/
    bullmq.ts        BullMQ 接続・Queue 定義
    worker.ts        Worker 定義（Engine 呼び出し）
    jobTypes.ts      Job 型定義
```

```typescript
// Phase 3 の Orchestrator フロー
const strategy = executionPlanner.plan(command)

if (strategy === 'sync') {
  engine.execute(command)
} else {
  await queue.add('geo-job', command)
}
```

---

### Phase 4（Google AI Studio 導入時）— AI Job 統合

```typescript
// AI 推論も同じキューで管理
await queue.add('ai-inference', {
  type: 'SUGGEST_PARAMS',
  pluginId: 'icosphere',
  context: currentSceneState,
})
// Worker が AI Studio に投げ → 結果を Supabase に保存 → UI に反映
```

---

## 6. Orchestrator での利用（Phase 3 以降）

```
UI 操作
  ↓
Command
  ↓
ExecutionPlanner.plan()
  ↓
'sync'           'async'
  ↓                ↓
engine.ts      BullMQ Queue
  ↓                ↓
即時反映         Worker
                  ↓
               Engine（純粋計算）
                  ↓
               結果 → Registry 更新 → UI 反映
```

---

## 7. 配置

```
src/application/orchestrator/
  engine.ts              （既存）
  layerManager.ts        （既存）
  fxStack.ts             （既存）
  executionPlanner.ts    ← Phase 1 で新設
  tempo/
    clock.ts             （既存）
```

---

## 8. 完了条件（CDD 原則）

### Phase 1
```bash
pnpm tsc --noEmit   # 型エラーゼロ
# テスト不要（shell のみ・ロジックなし）
```

### Phase 2 以降
```bash
pnpm tsc --noEmit
pnpm test --run
```

- `ExecutionPlanner` が `IExecutionPlanner` を実装している
- `executionPlanner` シングルトンが export されている
- Phase 2: `plan()` が catalog の `execution` フラグを参照している
- Phase 3: `adapter/queue/` に BullMQ 接続が実装されている

---

## 9. 関連 spec

| spec | 関係 |
|---|---|
| `docs/spec/param-catalog.spec.md` | `execution` フラグの追加先 |
| `docs/spec/command-pattern.spec.md` | `Command` 型の定義元 |
| `docs/spec/shader-plugin.spec.md` | Phase 2 の最初の Async ユースケース |
