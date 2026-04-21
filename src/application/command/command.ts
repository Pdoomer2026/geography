export interface Command {
  execute(): void
  undo(): void
  description: string
}

export class CommandHistory {
  private history: Command[] = []
  private cursor: number = -1
  private maxHistory: number

  constructor(maxHistory: number = 50) {
    this.maxHistory = maxHistory
  }

  execute(command: Command): void {
    // cursor より後ろの履歴を削除（新しい操作で上書き）
    this.history.splice(this.cursor + 1)

    this.history.push(command)
    command.execute()
    this.cursor = this.history.length - 1

    // maxHistory を超えたら古いものを削除
    if (this.history.length > this.maxHistory) {
      this.history.shift()
      this.cursor = this.history.length - 1
    }
  }

  undo(): void {
    if (!this.canUndo()) return
    this.history[this.cursor].undo()
    this.cursor--
  }

  redo(): void {
    if (!this.canRedo()) return
    this.cursor++
    this.history[this.cursor].execute()
  }

  canUndo(): boolean {
    return this.cursor >= 0
  }

  canRedo(): boolean {
    return this.cursor < this.history.length - 1
  }

  clear(): void {
    this.history = []
    this.cursor = -1
  }
}
