import { DEFAULT_BPM } from './config'

export class Clock {
  private bpm: number = DEFAULT_BPM
  private startTime: number = 0
  private running: boolean = false

  start(): void {
    if (this.running) return
    this.startTime = performance.now()
    this.running = true
  }

  stop(): void {
    this.running = false
  }

  setTempo(bpm: number): void {
    if (bpm <= 0) return
    // テンポ変更時は位相をリセット（beat が急ジャンプしないように）
    this.startTime = performance.now()
    this.bpm = bpm
  }

  getBpm(): number {
    return this.bpm
  }

  /** beat 値: 0.0〜1.0 の繰り返し小数（1拍の中の位置） */
  getBeat(): number {
    if (!this.running) return 0
    const elapsed = (performance.now() - this.startTime) / 1000
    const beatDuration = 60 / this.bpm
    return (elapsed / beatDuration) % 1
  }
}
