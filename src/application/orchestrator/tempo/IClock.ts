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
