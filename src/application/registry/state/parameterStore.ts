import { Command, CommandHistory } from '../../command/command'

class SetParameterCommand implements Command {
  description: string

  constructor(
    private store: ParameterStore,
    private key: string,
    private prevValue: number,
    private nextValue: number,
  ) {
    this.description = `Set ${key}: ${prevValue} → ${nextValue}`
  }

  execute(): void {
    this.store['values'].set(this.key, this.nextValue)
  }

  undo(): void {
    this.store['values'].set(this.key, this.prevValue)
  }
}

export class ParameterStore {
  private values: Map<string, number> = new Map()
  private history: CommandHistory

  constructor() {
    this.history = new CommandHistory()
  }

  get(key: string): number | undefined {
    return this.values.get(key)
  }

  set(key: string, value: number): void {
    const prev = this.values.get(key)
    const command = new SetParameterCommand(this, key, prev ?? value, value)
    this.history.execute(command)
  }

  setDirect(key: string, value: number): void {
    this.values.set(key, value)
  }

  undo(): void {
    this.history.undo()
  }

  redo(): void {
    this.history.redo()
  }

  canUndo(): boolean {
    return this.history.canUndo()
  }

  canRedo(): boolean {
    return this.history.canRedo()
  }

  getAll(): Map<string, number> {
    return this.values
  }
}
