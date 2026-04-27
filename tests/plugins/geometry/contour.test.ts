import { beforeEach, describe, expect, it } from 'vitest'
import * as THREE from 'three'
import createContourPlugin from '../../../src/engine/geometry/terrain/contour'
import type { GeometryPlugin } from '../../../src/application/schema'
import { defaultParams } from '../../../src/engine/geometry/terrain/contour/contour.config'

describe('Contour Plugin', () => {
  let scene: THREE.Scene
  let contourPlugin: GeometryPlugin

  beforeEach(() => {
    scene = new THREE.Scene()
    // factory を呼んで独立したインスタンスを生成
    contourPlugin = createContourPlugin()
    contourPlugin.params = structuredClone(defaultParams)
  })

  // TC-1: renderer と enabled フィールドが存在する
  it('renderer が threejs である', () => {
    expect(contourPlugin.renderer).toBe('threejs')
  })

  it('enabled が true である', () => {
    expect(contourPlugin.enabled).toBe(true)
  })

  // TC-2: create() 後に scene にオブジェクトが追加される
  it('create() 後に scene.children が増える', () => {
    contourPlugin.create(scene)
    expect(scene.children.length).toBeGreaterThan(0)
    contourPlugin.destroy(scene)
  })

  // TC-3: destroy() 後に scene からオブジェクトが除去される
  it('destroy() 後に scene.children が空になる', () => {
    contourPlugin.create(scene)
    contourPlugin.destroy(scene)
    expect(scene.children.length).toBe(0)
  })

  // TC-4: update() は例外を投げない
  it('update() が例外を投げない（create前）', () => {
    expect(() => contourPlugin.update(0.016, 0.5)).not.toThrow()
  })

  it('update() が例外を投げない（create後）', () => {
    contourPlugin.create(scene)
    expect(() => contourPlugin.update(0.016, 0.5)).not.toThrow()
    contourPlugin.destroy(scene)
  })

  // TC-5: 必須パラメーターが全て存在する
  it('必須パラメーターが存在する', () => {
    const keys = ['speed', 'scale', 'amplitude', 'segments', 'size', 'hue']
    for (const key of keys) {
      expect(contourPlugin.params[key]).toBeDefined()
    }
  })
})
