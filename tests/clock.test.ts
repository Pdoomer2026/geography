import { describe, it, expect, beforeEach, vi } from 'vitest'

// Tone.js は Web Audio API を必要とするため jsdom 環境ではモックする
vi.mock('tone', () => {
  let bpmValue = 128
  const transport = {
    bpm: {
      get value() { return bpmValue },
      set value(v: number) { bpmValue = v },
    },
    ticks: 0,
    PPQ: 192,
    state: 'stopped' as 'started' | 'stopped' | 'paused',
    start()  { this.state = 'started' },
    pause()  { this.state = 'paused' },
    stop()   { this.state = 'stopped'; this.ticks = 0 },
  }
  return { getTransport: () => transport }
})

import { Clock } from '../src/application/orchestrator/tempo/clock'

describe('Clock', () => {
  let clock: Clock

  beforeEach(() => {
    clock = new Clock()
    clock.reset() // モックの transport state をリセット
  })

  it('停止中は getBeat() が 0 を返す', () => {
    expect(clock.getBeat()).toBe(0)
  })

  it('start() 直後は getBeat() が 0〜1 の範囲内', () => {
    clock.start()
    const beat = clock.getBeat()
    expect(beat).toBeGreaterThanOrEqual(0)
    expect(beat).toBeLessThan(1)
  })

  it('setTempo() で BPM が変わる', () => {
    clock.setTempo(120)
    expect(clock.getBpm()).toBe(120)
  })

  it('setTempo(0) は無視される', () => {
    clock.setTempo(0)
    expect(clock.getBpm()).toBe(128) // DEFAULT_BPM
  })

  it('isRunning() が start/stop に連動する', () => {
    expect(clock.isRunning()).toBe(false)
    clock.start()
    expect(clock.isRunning()).toBe(true)
    clock.stop()
    expect(clock.isRunning()).toBe(false)
  })

  it('getTotalBeats() が数値を返す', () => {
    const beats = clock.getTotalBeats()
    expect(typeof beats).toBe('number')
    expect(beats).toBeGreaterThanOrEqual(0)
  })
})
