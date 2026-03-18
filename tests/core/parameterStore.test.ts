import { describe, it, expect, beforeEach } from 'vitest'
import { ParameterStore } from '../../src/core/parameterStore'

describe('ParameterStore', () => {
  let store: ParameterStore

  beforeEach(() => {
    store = new ParameterStore()
  })

  // --- 基本操作 ---

  it('set した値を get で取得できる', () => {
    store.set('brightness', 0.8)
    expect(store.get('brightness')).toBe(0.8)
  })

  it('存在しないキーは undefined を返す', () => {
    expect(store.get('nonexistent')).toBeUndefined()
  })

  it('複数のキーを独立して管理できる', () => {
    store.set('brightness', 0.8)
    store.set('speed', 1.5)
    expect(store.get('brightness')).toBe(0.8)
    expect(store.get('speed')).toBe(1.5)
  })

  // --- undo ---

  it('set の後に undo すると元の値に戻る', () => {
    store.set('brightness', 0.5)
    store.set('brightness', 0.8)
    store.undo()
    expect(store.get('brightness')).toBe(0.5)
  })

  it('初期値なしで set した後に undo すると同じ値のまま（prevValue = value）', () => {
    // prev が undefined の場合 prevValue = value になるため undo しても値は変わらない
    store.set('brightness', 0.8)
    store.undo()
    expect(store.get('brightness')).toBe(0.8)
  })

  // --- redo ---

  it('undo の後に redo すると値が戻る', () => {
    store.set('brightness', 0.8)
    store.undo()
    store.redo()
    expect(store.get('brightness')).toBe(0.8)
  })

  // --- canUndo / canRedo ---

  it('初期状態では canUndo は false', () => {
    expect(store.canUndo()).toBe(false)
  })

  it('set 後は canUndo が true になる', () => {
    store.set('brightness', 0.8)
    expect(store.canUndo()).toBe(true)
  })

  it('初期状態では canRedo は false', () => {
    expect(store.canRedo()).toBe(false)
  })

  it('undo 後は canRedo が true になる', () => {
    store.set('brightness', 0.8)
    store.undo()
    expect(store.canRedo()).toBe(true)
  })

  it('redo 後は canRedo が false になる', () => {
    store.set('brightness', 0.8)
    store.undo()
    store.redo()
    expect(store.canRedo()).toBe(false)
  })

  // --- setDirect ---

  it('setDirect は値をセットするが undo 履歴に残らない', () => {
    store.setDirect('brightness', 0.9)
    expect(store.get('brightness')).toBe(0.9)
    expect(store.canUndo()).toBe(false)
  })

  it('setDirect の後に set して undo すると setDirect の値に戻る', () => {
    store.setDirect('brightness', 0.5)
    store.set('brightness', 0.9)
    store.undo()
    expect(store.get('brightness')).toBe(0.5)
  })
})
