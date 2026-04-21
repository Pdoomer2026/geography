import type { Command } from '../command/command'

/**
 * ExecutionPlanner
 * spec: docs/spec/execution-planner.spec.md
 *
 * Command を Sync で処理するか Async で処理するかを決定する門番。
 *
 * Phase 1: 全 Command に対して 'sync' を返すだけの shell。
 * Phase 2: catalog の execution フラグを読んで判断（Shader Plugin 実装前）。
 * Phase 3: BullMQ 本格導入（Next.js 導入時）。
 * Phase 4: Google AI Studio の推論 Job をキューに統合。
 */

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
