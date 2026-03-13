import { describe, it, expect, beforeEach } from 'vitest'
import type { GeometryPlugin, ParticlePlugin, LightPlugin } from '../../src/types'

// テスト用にクリーンな Registry を作るためにクラスを直接インスタンス化する
// registry.ts の PluginRegistry クラスを export してテストしやすくする想定だが、
// まずは同じ実装をここに複製してテスト設計を確定する

class PluginRegistry {
  private plugins = new Map<string, GeometryPlugin | LightPlugin | ParticlePlugin>()

  register(plugin: GeometryPlugin | LightPlugin | ParticlePlugin): void {
    this.plugins.set(plugin.id, plugin)
  }

  get(id: string): GeometryPlugin | LightPlugin | ParticlePlugin | undefined {
    return this.plugins.get(id)
  }

  list(): Array<GeometryPlugin | LightPlugin | ParticlePlugin> {
    return Array.from(this.plugins.values())
  }

  clear(): void {
    this.plugins.clear()
  }
}

// ---- テスト用 Plugin モック ----

const makeGeometryPlugin = (id: string): GeometryPlugin => ({
  id,
  name: `Geometry ${id}`,
  renderer: 'threejs',
  enabled: true,
  params: {},
  create: () => {},
  update: () => {},
  destroy: () => {},
})

const makeParticlePlugin = (id: string): ParticlePlugin => ({
  id,
  name: `Particle ${id}`,
  renderer: 'threejs',
  enabled: true,
  params: {},
  create: () => {},
  update: () => {},
  destroy: () => {},
})

const makeLightPlugin = (id: string): LightPlugin => ({
  id,
  name: `Light ${id}`,
  renderer: 'threejs',
  enabled: true,
  params: {},
  create: () => {},
  update: () => {},
  destroy: () => {},
})

// ---- テスト本体 ----

describe('PluginRegistry', () => {
  let registry: PluginRegistry

  beforeEach(() => {
    registry = new PluginRegistry()
  })

  it('Plugin を登録できる', () => {
    const plugin = makeGeometryPlugin('grid-wave')
    registry.register(plugin)
    expect(registry.get('grid-wave')).toBe(plugin)
  })

  it('複数の Plugin を登録できる', () => {
    registry.register(makeGeometryPlugin('grid-wave'))
    registry.register(makeParticlePlugin('starfield'))
    registry.register(makeLightPlugin('ambient'))

    expect(registry.list()).toHaveLength(3)
  })

  it('id で Plugin を取得できる', () => {
    const plugin = makeParticlePlugin('starfield')
    registry.register(plugin)

    const found = registry.get('starfield')
    expect(found?.id).toBe('starfield')
    expect(found?.name).toBe('Particle starfield')
  })

  it('存在しない id を get すると undefined を返す', () => {
    expect(registry.get('not-exist')).toBeUndefined()
  })

  it('同じ id で再登録すると上書きされる', () => {
    const v1 = makeGeometryPlugin('grid-wave')
    const v2 = { ...makeGeometryPlugin('grid-wave'), name: 'Grid Wave v2' }

    registry.register(v1)
    registry.register(v2)

    expect(registry.list()).toHaveLength(1)
    expect(registry.get('grid-wave')?.name).toBe('Grid Wave v2')
  })

  it('list() は登録された全 Plugin の配列を返す', () => {
    registry.register(makeGeometryPlugin('a'))
    registry.register(makeGeometryPlugin('b'))
    registry.register(makeGeometryPlugin('c'))

    const ids = registry.list().map(p => p.id)
    expect(ids).toContain('a')
    expect(ids).toContain('b')
    expect(ids).toContain('c')
  })

  it('Plugin の renderer フィールドが保持される', () => {
    const plugin = makeGeometryPlugin('grid-wave')
    registry.register(plugin)

    expect(registry.get('grid-wave')?.renderer).toBe('threejs')
  })

  it('Plugin の enabled フィールドが保持される', () => {
    const plugin = { ...makeGeometryPlugin('grid-wave'), enabled: false }
    registry.register(plugin)

    expect(registry.get('grid-wave')?.enabled).toBe(false)
  })
})
