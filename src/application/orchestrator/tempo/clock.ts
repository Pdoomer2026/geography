import * as Tone from 'tone'
import { DEFAULT_BPM } from '../../schema/config'
import type { IClock } from './IClock'

export class Clock implements IClock {
  constructor() {
    Tone.getTransport().bpm.value = DEFAULT_BPM
  }

  start(): void {
    Tone.getTransport().start()
  }

  /**
   * 累積拍数を保持したまま停止（pause 相当）。
   * 再開すると続きから再生される。
   * 完全リセットが必要な場合は reset() を使う。
   */
  stop(): void {
    Tone.getTransport().pause()
  }

  /**
   * Transport をゼロにリセットして停止。
   * 再開すると頭から再生される。
   */
  reset(): void {
    Tone.getTransport().stop()
  }

  /**
   * BPM を変更する。
   * Tone.Transport が累積 tick を保持するため、
   * BPM 変更時に getTotalBeats() はリセットされない。
   */
  setTempo(bpm: number): void {
    if (bpm <= 0) return
    Tone.getTransport().bpm.value = bpm
  }

  getBpm(): number {
    return Tone.getTransport().bpm.value
  }

  /** beat 値: 0.0〜1.0 の繰り返し小数（1拍の中の位置） */
  getBeat(): number {
    return this.getTotalBeats() % 1
  }

  /**
   * 累積拍数（モノトニック増加）。
   * BPM 変更・一時停止をまたいでもリセットされない。
   * Sequencer・LFO が「今何ステップ目か」を計算する唯一の源。
   */
  getTotalBeats(): number {
    return Tone.getTransport().ticks / Tone.getTransport().PPQ
  }

  isRunning(): boolean {
    return Tone.getTransport().state === 'started'
  }
}
