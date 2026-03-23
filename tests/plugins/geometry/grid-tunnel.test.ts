import { beforeEach, describe, expect, it } from 'vitest'
import * as THREE from 'three'
import gridTunnelPlugin from '../../../src/plugins/geometry/tunnel/grid-tunnel'
import { defaultParams } from '../../../src/plugins/geometry/tunnel/grid-tunnel/grid-tunnel.config'

describe('Grid Tunnel Plugin', () => {
  let scene: THREE.Scene

  beforeEach(() => {
    scene = new THREE.Scene()
    gridTunnelPlugin.params = structuredClone(defaultParams)
  })

  // TC-1: renderer と enabled フィールドが存在する
  it('renderer が threejs である', () => {
    expect(gridTunnelPlugin.renderer).toBe('threejs')
  })

  it('enabled が true である', () => {
    expect(gridTunnelPlugin.enabled).toBe(true)
  })

  // TC-2: create() 後に scene にオブジェクトが追加される
  it('create() 後に scene.children が増える', () => {
    gridTunnelPlugin.create(scene)
    expect(scene.children.length).toBeGreaterThan(0)
    gridTunnelPlugin.destroy(scene)
  })

  // TC-3: destroy() 後に scene からオブジェクトが除去される
  it('destroy() 後に scene.children が空になる', () => {
    gridTunnelPlugin.create(scene)
    gridTunnelPlugin.destroy(scene)
    expect(scene.children.length).toBe(0)
  })

  // TC-4: update() は例外を投げない
  it('update() が例外を投げない（create前）', () => {
    expect(() => gridTunnelPlugin.update(0.016, 0.5)).not.toThrow()
  })

  it('update() が例外を投げない（create後）', () => {
    gridTunnelPlugin.create(scene)
    expect(() => gridTunnelPlugin.update(0.016, 0.5)).not.toThrow()
    gridTunnelPlugin.destroy(scene)
  })

  // TC-5: 必須パラメーターが全て存在する
  it('必須パラメーターが存在する', () => {
    const keys = ['speed', 'radius', 'segments', 'rings', 'length', 'hue']
    for (const key of keys) {
      expect(gridTunnelPlugin.params[key]).toBeDefined()
    }
  })
})
