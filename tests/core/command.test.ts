import { describe, it, expect, vi } from 'vitest'

// Command パターンの Interface と CommandHistory 実装をここで定義・テスト
// （src/core/commandHistory.ts に移植することを前提とした設計確定用テスト）

interface Command {
  execute(): void
  undo(): void
  description: string
}

const MAX_UNDO_HISTORY = 50

class CommandHistory {
  private stack: Command[] = []
  private cursor: number = -1
  readonly maxHistory = MAX_UNDO_HISTORY

  execute(command: Command): void {
    // cursor 以降を削除してから追加（redo バッファをクリア）
    this.stack.splice(this.cursor + 1)
    this.stack.push(command)
    this.cursor++
    command.execute()

    // 上限を超えた分は古いものから削除
    if (this.stack.length > this.maxHistory) {
      this.stack.shift()
      this.cursor--
    }
  }

  undo(): void {
    if (this.cursor < 0) return
    this.stack[this.cursor].undo()
    this.cursor--
  }

  redo(): void {
    if (this.cursor >= this.stack.length - 1) return
    this.cursor++
    this.stack[this.cursor].execute()
  }

  canUndo(): boolean {
    return this.cursor >= 0
  }

  canRedo(): boolean {
    return this.cursor < this.stack.length - 1
  }

  get historyLength(): number {
    return this.stack.length
  }
}

// ---- テスト用 Command ファクトリー ----

function makeCommand(
  label: string,
  onExecute: () => void,
  onUndo: () => void
): Command {
  return {
    description: label,
    execute: onExecute,
    undo: onUndo,
  }
}

// ---- テスト本体 ----

describe('CommandHistory', () => {
  it('execute() でコマンドが実行される', () => {
    const history = new CommandHistory()
    const fn = vi.fn()
    const cmd = makeCommand('test', fn, vi.fn())

    history.execute(cmd)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('undo() で直前のコマンドが取り消される', () => {
    const history = new CommandHistory()
    const undoFn = vi.fn()
    history.execute(makeCommand('test', vi.fn(), undoFn))

    history.undo()
    expect(undoFn).toHaveBeenCalledOnce()
  })

  it('redo() でやり直しができる', () => {
    const history = new CommandHistory()
    const executeFn = vi.fn()
    history.execute(makeCommand('test', executeFn, vi.fn()))

    history.undo()
    history.redo()

    // execute は最初の1回 + redo の1回 = 計2回
    expect(executeFn).toHaveBeenCalledTimes(2)
  })

  it('undo() 後に新しいコマンドを実行すると redo バッファがクリアされる', () => {
    const history = new CommandHistory()

    history.execute(makeCommand('cmd1', vi.fn(), vi.fn()))
    history.execute(makeCommand('cmd2', vi.fn(), vi.fn()))
    history.undo()

    // undo 後に別のコマンドを実行
    history.execute(makeCommand('cmd3', vi.fn(), vi.fn()))

    // redo バッファ（cmd2）がクリアされているので redo できない
    expect(history.canRedo()).toBe(false)
    expect(history.historyLength).toBe(2) // cmd1 + cmd3
  })

  it('canUndo() は履歴がないとき false を返す', () => {
    const history = new CommandHistory()
    expect(history.canUndo()).toBe(false)
  })

  it('canUndo() はコマンドを実行した後 true を返す', () => {
    const history = new CommandHistory()
    history.execute(makeCommand('test', vi.fn(), vi.fn()))
    expect(history.canUndo()).toBe(true)
  })

  it('canRedo() は undo 後に true を返す', () => {
    const history = new CommandHistory()
    history.execute(makeCommand('test', vi.fn(), vi.fn()))
    history.undo()
    expect(history.canRedo()).toBe(true)
  })

  it('全部 undo した後に undo しても何も起きない', () => {
    const history = new CommandHistory()
    const undoFn = vi.fn()
    history.execute(makeCommand('test', vi.fn(), undoFn))

    history.undo()
    history.undo() // 2回目は何も起きない

    expect(undoFn).toHaveBeenCalledOnce()
  })

  it('最大履歴数（MAX_UNDO_HISTORY）を超えると古いコマンドが削除される', () => {
    const history = new CommandHistory()

    // MAX_UNDO_HISTORY + 1 件実行
    for (let i = 0; i <= MAX_UNDO_HISTORY; i++) {
      history.execute(makeCommand(`cmd${i}`, vi.fn(), vi.fn()))
    }

    // 上限を超えた分は削除されて MAX_UNDO_HISTORY 件に収まる
    expect(history.historyLength).toBe(MAX_UNDO_HISTORY)
  })

  it('複数コマンドを順番に undo / redo できる', () => {
    const log: string[] = []
    const history = new CommandHistory()

    history.execute(makeCommand('A', () => log.push('A:do'), () => log.push('A:undo')))
    history.execute(makeCommand('B', () => log.push('B:do'), () => log.push('B:undo')))
    history.execute(makeCommand('C', () => log.push('C:do'), () => log.push('C:undo')))

    history.undo() // C を取り消し
    history.undo() // B を取り消し
    history.redo() // B をやり直し

    expect(log).toEqual(['A:do', 'B:do', 'C:do', 'C:undo', 'B:undo', 'B:do'])
  })
})
