import { describe, it, expect, beforeEach } from 'vitest'
import { Clock } from '../src/application/orchestrator/tempo/clock'

describe('Clock', () => {
  let clock: Clock

  beforeEach(() => {
    clock = new Clock()
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
})
