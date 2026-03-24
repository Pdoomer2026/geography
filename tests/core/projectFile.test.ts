/**
 * project-file ラウンドトリップテスト
 * spec: docs/spec/project-file.spec.md §3
 *
 * GeoGraphyProject の serialize → deserialize で
 * データが失われないことを検証する。
 * engine.buildProject / engine.restoreProject は Three.js / DOM に
 * 依存するため、ここでは型レベルのラウンドトリップを検証する。
 */

import { describe, it, expect } from 'vitest'
import type { GeoGraphyProject, SceneState } from '../../src/types'
import { PROJECT_FILE_VERSION } from '../../src/types'

// ----------------------------------------------------------------
// テスト用 SceneState ファクトリ
// ----------------------------------------------------------------

function makeSceneState(): SceneState {
  return {
    layers: [
      {
        geometryId: 'grid-wave',
        geometryParams: { speed: 0.5, amplitude: 1.2, gridSize: 20 },
        fxStack: [
          { fxId: 'bloom',  params: { strength: 0.8, radius: 0.4, threshold: 0.1 }, enabled: true },
          { fxId: 'rgb-shift', params: { amount: 0.002 }, enabled: false },
        ],
        opacity: 1,
        blendMode: 'normal',
      },
    ],
  }
}

// ----------------------------------------------------------------
// テスト用 GeoGraphyProject ファクトリ
// ----------------------------------------------------------------

function makeProject(name: string, sceneState: SceneState): GeoGraphyProject {
  return {
    version: PROJECT_FILE_VERSION,
    savedAt: new Date().toISOString(),
    name,
    setup: {
      geometry: ['grid-wave', 'contour'],
      fx: ['bloom', 'rgb-shift'],
    },
    sceneState,
    presetRefs: {},
  }
}

// ----------------------------------------------------------------
// テスト本体
// ----------------------------------------------------------------

describe('GeoGraphyProject ラウンドトリップ', () => {

  it('JSON.stringify → JSON.parse でデータが失われない', () => {
    const original = makeProject('my-scene', makeSceneState())
    const json = JSON.stringify(original)
    const restored = JSON.parse(json) as GeoGraphyProject

    expect(restored.version).toBe(PROJECT_FILE_VERSION)
    expect(restored.name).toBe('my-scene')
    expect(restored.setup.geometry).toEqual(['grid-wave', 'contour'])
    expect(restored.setup.fx).toEqual(['bloom', 'rgb-shift'])
    expect(restored.sceneState.layers).toHaveLength(1)
  })

  it('sceneState の layers が正しくシリアライズされる', () => {
    const sceneState = makeSceneState()
    const project = makeProject('test', sceneState)
    const json = JSON.stringify(project)
    const restored = JSON.parse(json) as GeoGraphyProject

    const layer = restored.sceneState.layers[0]
    expect(layer.geometryId).toBe('grid-wave')
    expect(layer.geometryParams['speed']).toBe(0.5)
    expect(layer.geometryParams['amplitude']).toBe(1.2)
    expect(layer.opacity).toBe(1)
    expect(layer.blendMode).toBe('normal')
  })

  it('fxStack の各エントリーが正しく復元される', () => {
    const project = makeProject('test', makeSceneState())
    const json = JSON.stringify(project)
    const restored = JSON.parse(json) as GeoGraphyProject

    const fxStack = restored.sceneState.layers[0].fxStack
    expect(fxStack).toHaveLength(2)

    const bloom = fxStack.find((f) => f.fxId === 'bloom')
    expect(bloom).toBeDefined()
    expect(bloom?.enabled).toBe(true)
    expect(bloom?.params['strength']).toBe(0.8)
    expect(bloom?.params['radius']).toBe(0.4)

    const rgbShift = fxStack.find((f) => f.fxId === 'rgb-shift')
    expect(rgbShift?.enabled).toBe(false)
  })

  it('presetRefs が空オブジェクトとして保存・復元される', () => {
    const project = makeProject('test', makeSceneState())
    const json = JSON.stringify(project)
    const restored = JSON.parse(json) as GeoGraphyProject

    expect(restored.presetRefs).toEqual({})
  })

  it('PROJECT_FILE_VERSION が "1.0.0" である', () => {
    expect(PROJECT_FILE_VERSION).toBe('1.0.0')
  })

  it('savedAt が ISO 8601 形式の文字列である', () => {
    const project = makeProject('test', makeSceneState())
    const json = JSON.stringify(project)
    const restored = JSON.parse(json) as GeoGraphyProject

    // ISO 8601: YYYY-MM-DDTHH:mm:ss.sssZ
    expect(() => new Date(restored.savedAt)).not.toThrow()
    expect(new Date(restored.savedAt).toString()).not.toBe('Invalid Date')
  })

  it('複数レイヤーを持つ SceneState が正しく復元される', () => {
    const multiLayerState: SceneState = {
      layers: [
        {
          geometryId: 'grid-wave',
          geometryParams: { speed: 1.0 },
          fxStack: [],
          opacity: 1,
          blendMode: 'normal',
        },
        {
          geometryId: 'contour',
          geometryParams: { speed: 0.5 },
          fxStack: [],
          opacity: 0.7,
          blendMode: 'add',
        },
      ],
    }
    const project = makeProject('multi-layer', multiLayerState)
    const json = JSON.stringify(project)
    const restored = JSON.parse(json) as GeoGraphyProject

    expect(restored.sceneState.layers).toHaveLength(2)
    expect(restored.sceneState.layers[1].geometryId).toBe('contour')
    expect(restored.sceneState.layers[1].opacity).toBe(0.7)
    expect(restored.sceneState.layers[1].blendMode).toBe('add')
  })
})
