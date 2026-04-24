# Day72 タスク: ExecutionPlanner Phase 1 実装

## 必須: 最初に読むこと

```
docs/spec/execution-planner.spec.md  ← 今回の spec（必ず全文読む）
docs/spec/command-pattern.spec.md    ← Command 型の定義元
```

## タスク概要

`src/application/orchestrator/executionPlanner.ts` を新規作成する。
Phase 1 は「全 Command に対して 'sync' を返すだけの shell」。
BullMQ は触らない。型定義とシングルトン export だけ確保する。

## 実装内容

spec §5 Phase 1 のコードをそのまま実装する：

```typescript
// src/application/orchestrator/executionPlanner.ts
import type { Command } from '../command/command'

export type ExecutionStrategy = 'sync' | 'async'

export interface IExecutionPlanner {
  plan(command: Command): ExecutionStrategy
}

export class ExecutionPlanner implements IExecutionPlanner {
  plan(_command: Command): ExecutionStrategy {
    return 'sync'
  }
}

export const executionPlanner = new ExecutionPlanner()
```

## 完了条件

```bash
pnpm tsc --noEmit   # 型エラーゼロ（これだけでOK）
pnpm test --run     # 既存 127 テストがグリーンのまま
```

- テストファイルは不要（shell のみ・ロジックなし）
- 既存ファイルは一切変更しない
- Command 型の import パスは実際のファイル構造を確認してから書くこと

## 注意

- `any` 禁止
- 既存テストを壊さないこと
- 実装後に必ず tsc + test を実行して結果を確認すること
