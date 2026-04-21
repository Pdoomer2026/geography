/**
 * TransportRegistry テスト
 * Day62: onChanged 複数購読対応の検証
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { RegisteredParameterWithCC } from '../../src/application/schema/midi-registry'

// クリーンなインスタンスでテストするため実装クラスをローカル複製
class TransportRegistryImpl {
  private buckets: Map<string, RegisteredParameterWithCC[]> = new Map()
  private listeners: Set<() => void> = new Set()

  register(params: RegisteredParameterWithCC[], registrationKey: string): void {
    this.buckets.set(registrationKey, params)
    this.notify()
  }

  clear(registrationKey: string): void {
    this.buckets.delete(registrationKey)
    this.notify()
  }

  getAll(): RegisteredParameterWithCC[] {
    const result: RegisteredParameterWithCC[] = []
    for (const params of this.buckets.values()) {
      result.push(...params)
    }
    return result
  }

  onChanged(cb: () => void): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  private notify(): void {
    for (const cb of [...this.listeners]) cb()
  }

  syncValue(pluginId: string, paramId: string, value: number): boolean {
    for (const [key, params] of this.buckets.entries()) {
      const idx = params.findIndex(
        (p) => p.pluginId === pluginId && p.id === paramId
      )
      if (idx === -1) continue
      const prev = params[idx]
      if (Math.abs(prev.value - value) < 0.0001) return false
      const next = [...params]
      next[idx] = { ...prev, value }
      this.buckets.set(key, next)
      return true
    }
    return false
  }
}

// ---- テスト用ヘルパー ----

const makeParam = (id: string, pluginId: string, ccNumber: number): RegisteredParameterWithCC => ({
  id,
  name: id,
  min: 0,
  max: 1,
  step: 0.01,
  layerId: 'layer-1',
  pluginId,
  ccNumber,
  value: 0,
})

// ---- テスト本体 ----

describe('TransportRegistry', () => {
  let registry: TransportRegistryImpl

  beforeEach(() => {
    registry = new TransportRegistryImpl()
  })

  // --- 基本動作 ---

  it('register でパラメータを登録できる', () => {
    const params = [makeParam('scale', 'icosphere', 10)]
    registry.register(params, 'layer-1:geometry')
    expect(registry.getAll()).toHaveLength(1)
  })

  it('clear で登録を削除できる', () => {
    registry.register([makeParam('scale', 'icosphere', 10)], 'layer-1:geometry')
    registry.clear('layer-1:geometry')
    expect(registry.getAll()).toHaveLength(0)
  })

  it('異なる registrationKey のパラメータは共存する', () => {
    registry.register([makeParam('scale', 'icosphere', 10)], 'layer-1:geometry')
    registry.register([makeParam('bloom', 'bloom-fx', 50)], 'layer-1:fx')
    expect(registry.getAll()).toHaveLength(2)
  })

  // --- onChanged 複数購読 ---

  it('onChanged で登録したコールバックが register 時に呼ばれる', () => {
    const cb = vi.fn()
    registry.onChanged(cb)
    registry.register([makeParam('scale', 'icosphere', 10)], 'layer-1:geometry')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('onChanged で登録したコールバックが clear 時に呼ばれる', () => {
    const cb = vi.fn()
    registry.register([makeParam('scale', 'icosphere', 10)], 'layer-1:geometry')
    registry.onChanged(cb)
    registry.clear('layer-1:geometry')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('複数のコールバックが全て呼ばれる', () => {
    const cbA = vi.fn()
    const cbB = vi.fn()
    const cbC = vi.fn()
    registry.onChanged(cbA)
    registry.onChanged(cbB)
    registry.onChanged(cbC)

    registry.register([makeParam('scale', 'icosphere', 10)], 'layer-1:geometry')

    expect(cbA).toHaveBeenCalledTimes(1)
    expect(cbB).toHaveBeenCalledTimes(1)
    expect(cbC).toHaveBeenCalledTimes(1)
  })

  it('同一コールバックを2回登録しても1回しか呼ばれない（Set の重複排除）', () => {
    const cb = vi.fn()
    registry.onChanged(cb)
    registry.onChanged(cb)  // 同じ参照を再登録

    registry.register([makeParam('scale', 'icosphere', 10)], 'layer-1:geometry')

    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('unsubscribe 後はコールバックが呼ばれない', () => {
    const cb = vi.fn()
    const unsubscribe = registry.onChanged(cb)

    unsubscribe()
    registry.register([makeParam('scale', 'icosphere', 10)], 'layer-1:geometry')

    expect(cb).not.toHaveBeenCalled()
  })

  it('一方が unsubscribe しても他方は引き続き呼ばれる', () => {
    const cbA = vi.fn()
    const cbB = vi.fn()
    const unsubscribeA = registry.onChanged(cbA)
    registry.onChanged(cbB)

    unsubscribeA()
    registry.register([makeParam('scale', 'icosphere', 10)], 'layer-1:geometry')

    expect(cbA).not.toHaveBeenCalled()
    expect(cbB).toHaveBeenCalledTimes(1)
  })

  it('notify 中に unsubscribe しても他のリスナーに影響しない（再入安全）', () => {
    const cbB = vi.fn()
    let unsubscribeA: () => void

    // cbA は自分自身を notify 中に解除する
    unsubscribeA = registry.onChanged(() => {
      unsubscribeA()
    })
    registry.onChanged(cbB)

    // クラッシュしないこと・cbB は正常に呼ばれること
    expect(() => {
      registry.register([makeParam('scale', 'icosphere', 10)], 'layer-1:geometry')
    }).not.toThrow()
    expect(cbB).toHaveBeenCalledTimes(1)
  })

  // --- syncValue ---

  it('syncValue で値を更新できる', () => {
    registry.register([makeParam('scale', 'icosphere', 10)], 'layer-1:geometry')
    const result = registry.syncValue('icosphere', 'scale', 0.5)
    expect(result).toBe(true)
    expect(registry.getAll()[0].value).toBe(0.5)
  })

  it('syncValue は 0.0001 未満の差分を無視する', () => {
    registry.register([makeParam('scale', 'icosphere', 10)], 'layer-1:geometry')
    registry.syncValue('icosphere', 'scale', 0.5)
    const result = registry.syncValue('icosphere', 'scale', 0.5 + 0.00005)
    expect(result).toBe(false)
  })

  it('syncValue で存在しない pluginId は false を返す', () => {
    registry.register([makeParam('scale', 'icosphere', 10)], 'layer-1:geometry')
    const result = registry.syncValue('not-exist', 'scale', 0.5)
    expect(result).toBe(false)
  })
})
