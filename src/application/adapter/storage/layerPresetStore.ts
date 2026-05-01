/**
 * layerPresetStore — LayerPreset / ScenePreset の CRUD SSoT
 *
 * Application 層のストア。UI 層・Electron・ブラウザすべてからの
 * Preset 操作はここを経由する。
 *
 * 保存先: ~/Documents/GeoGraphy/presets/（fileStore 経由）
 *   Electron: geoAPI.saveFile / loadFile
 *   ブラウザ: File System Access API
 *
 * localStorage は使用しない。
 * spec: docs/spec/layer-window.spec.md §5
 */

import type { LayerPreset, ScenePreset } from '../../schema'
import { parseLayerPresetSafe } from '../../schema/zod/layerPreset.schema'
import { parseScenePresetSafe } from '../../schema/zod/scenePreset.schema'
import { readJson, writeJson } from './fileStore'

// ============================================================
// 型定義
// ============================================================

export interface PresetFolder {
  folder:  string
  presets: LayerPreset[]
}

// ============================================================
// ファイルパス（~/Documents/GeoGraphy/ からの相対パス）
// ============================================================

const LAYER_FILE = 'presets/layer-presets.json'
const SCENE_FILE = 'presets/scene-presets.json'

// ============================================================
// LayerPreset
// ============================================================

export async function loadLayerPresetFolders(): Promise<PresetFolder[]> {
  try {
    const data = await readJson(LAYER_FILE)
    if (!data || typeof data !== 'object') return []
    const presets = Object.values(data as Record<string, unknown>)
      .map((v) => parseLayerPresetSafe(v))
      .filter((p): p is LayerPreset => p !== null)
    const folderMap = new Map<string, LayerPreset[]>()
    for (const p of presets) {
      const key = p.geometryPluginId || 'uncategorized'
      if (!folderMap.has(key)) folderMap.set(key, [])
      folderMap.get(key)!.push(p)
    }
    return Array.from(folderMap.entries()).map(([folder, presets]) => ({ folder, presets }))
  } catch {
    return []
  }
}

export async function saveLayerPreset(name: string, preset: LayerPreset): Promise<void> {
  try {
    const existing = await readJson(LAYER_FILE)
    const prev = (existing && typeof existing === 'object') ? existing as Record<string, unknown> : {}
    const updated = { ...preset, name, id: `preset-${Date.now()}` }
    await writeJson(LAYER_FILE, { ...prev, [name]: updated })
  } catch { /* ignore */ }
}

export async function deleteLayerPreset(name: string): Promise<void> {
  try {
    const existing = await readJson(LAYER_FILE)
    if (!existing || typeof existing !== 'object') return
    const prev = { ...(existing as Record<string, unknown>) }
    delete prev[name]
    await writeJson(LAYER_FILE, prev)
  } catch { /* ignore */ }
}

// ============================================================
// ScenePreset
// ============================================================

export async function loadScenePresets(): Promise<ScenePreset[]> {
  try {
    const data = await readJson(SCENE_FILE)
    if (!data || typeof data !== 'object') return []
    return Object.values(data as Record<string, unknown>)
      .map((v) => parseScenePresetSafe(v))
      .filter((p): p is ScenePreset => p !== null)
  } catch {
    return []
  }
}

export async function saveScenePreset(name: string, preset: ScenePreset): Promise<void> {
  try {
    const existing = await readJson(SCENE_FILE)
    const prev = (existing && typeof existing === 'object') ? existing as Record<string, unknown> : {}
    await writeJson(SCENE_FILE, { ...prev, [name]: preset })
  } catch { /* ignore */ }
}

export async function deleteScenePreset(name: string): Promise<void> {
  try {
    const existing = await readJson(SCENE_FILE)
    if (!existing || typeof existing !== 'object') return
    const prev = { ...(existing as Record<string, unknown>) }
    delete prev[name]
    await writeJson(SCENE_FILE, prev)
  } catch { /* ignore */ }
}

// ============================================================
// localStorage からの移行（一度だけ呼ぶ）
// ============================================================

export async function migrateFromLocalStorage(): Promise<void> {
  try {
    const layerRaw = localStorage.getItem('geography:layer-presets-v2')
    if (layerRaw) {
      await writeJson(LAYER_FILE, JSON.parse(layerRaw))
      localStorage.removeItem('geography:layer-presets-v2')
      console.info('[layerPresetStore] localStorage → fileStore 移行完了 (layer)')
    }
    const sceneRaw = localStorage.getItem('geography:scene-presets-v2')
    if (sceneRaw) {
      await writeJson(SCENE_FILE, JSON.parse(sceneRaw))
      localStorage.removeItem('geography:scene-presets-v2')
      console.info('[layerPresetStore] localStorage → fileStore 移行完了 (scene)')
    }
  } catch { /* ignore */ }
}
