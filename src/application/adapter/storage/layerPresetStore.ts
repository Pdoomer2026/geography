/**
 * layerPresetStore — LayerPreset / ScenePreset の CRUD SSoT
 *
 * Application 層のストア。UI 層・Electron・ブラウザすべてからの
 * Preset 操作はここを経由する。
 *
 * Electron 環境: window.geoAPI 経由でファイル保存
 * ブラウザ環境: localStorage にフォールバック
 *
 * UI 層・Electron は「薄い鏡」として機能し、
 * ロジックはすべてこのファイルに集約する。
 *
 * spec: docs/spec/layer-window.spec.md §5
 */

import type { LayerPreset, ScenePreset } from '../../schema'
import { parseLayerPresetSafe } from '../../schema/zod/layerPreset.schema'
import { parseScenePresetSafe } from '../../schema/zod/scenePreset.schema'

// ============================================================
// 型定義（SSoT）
// ============================================================

export interface PresetFolder {
  /** Geometry Plugin ID（例: 'icosphere'）または 'uncategorized' */
  folder: string
  presets: LayerPreset[]
}

// ============================================================
// ストレージキー（ブラウザ環境用）
// ============================================================

const LAYER_KEY = 'geography:layer-presets-v2'
const SCENE_KEY = 'geography:scene-presets-v2'

// ============================================================
// LayerPreset
// ============================================================

/**
 * 保存済み LayerPreset を Geometry 名フォルダ単位で返す。
 * Electron: geoAPI 経由でファイルから読む
 * ブラウザ: localStorage から読み、geometryPluginId でグループ化
 */
export async function loadLayerPresetFolders(): Promise<PresetFolder[]> {
  if (window.geoAPI) {
    const folders = await window.geoAPI.presetList('layer') as Array<{
      folder: string
      presets: Array<{ name: string; data: string }>
    }>
    return folders
      .map((f) => ({
        folder: f.folder,
        presets: f.presets
          .map((p) => parseLayerPresetSafe(JSON.parse(p.data)))
          .filter((p): p is LayerPreset => p !== null),
      }))
      .filter((f) => f.presets.length > 0)
  }

  // ブラウザ: localStorage から geometryPluginId でグループ化
  try {
    const raw = localStorage.getItem(LAYER_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const presets = Object.values(parsed)
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

/**
 * LayerPreset を保存する。
 * subfolder は自動的に preset.geometryPluginId を使う。
 */
export async function saveLayerPreset(name: string, preset: LayerPreset): Promise<void> {
  const subfolder = preset.geometryPluginId || undefined
  const data = JSON.stringify({ ...preset, name, id: `preset-${Date.now()}` }, null, 2)

  if (window.geoAPI) {
    await window.geoAPI.presetSave('layer', name, data, subfolder)
    return
  }

  try {
    const raw = localStorage.getItem(LAYER_KEY)
    const prev = raw ? JSON.parse(raw) as Record<string, unknown> : {}
    const updated = { ...preset, name, id: `preset-${Date.now()}` }
    localStorage.setItem(LAYER_KEY, JSON.stringify({ ...prev, [name]: updated }))
  } catch { /* ignore */ }
}

/**
 * LayerPreset を削除する。
 * subfolder は preset.geometryPluginId から自動解決する。
 */
export async function deleteLayerPreset(name: string, subfolder?: string): Promise<void> {
  if (window.geoAPI) {
    await window.geoAPI.presetDelete('layer', name, subfolder)
    return
  }

  try {
    const raw = localStorage.getItem(LAYER_KEY)
    if (!raw) return
    const prev = JSON.parse(raw) as Record<string, unknown>
    delete prev[name]
    localStorage.setItem(LAYER_KEY, JSON.stringify(prev))
  } catch { /* ignore */ }
}

// ============================================================
// ScenePreset
// ============================================================

/**
 * 保存済み ScenePreset の一覧を返す。
 */
export async function loadScenePresets(): Promise<ScenePreset[]> {
  if (window.geoAPI) {
    const files = await window.geoAPI.presetList('scene') as Array<{ name: string; data: string }>
    return files
      .map((f) => parseScenePresetSafe(JSON.parse(f.data)))
      .filter((p): p is ScenePreset => p !== null)
  }

  try {
    const raw = localStorage.getItem(SCENE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return Object.values(parsed)
      .map((v) => parseScenePresetSafe(v))
      .filter((p): p is ScenePreset => p !== null)
  } catch {
    return []
  }
}

/**
 * ScenePreset を保存する。
 */
export async function saveScenePreset(name: string, preset: ScenePreset): Promise<void> {
  const data = JSON.stringify(preset, null, 2)

  if (window.geoAPI) {
    await window.geoAPI.presetSave('scene', name, data)
    return
  }

  try {
    const raw = localStorage.getItem(SCENE_KEY)
    const prev = raw ? JSON.parse(raw) as Record<string, unknown> : {}
    localStorage.setItem(SCENE_KEY, JSON.stringify({ ...prev, [name]: preset }))
  } catch { /* ignore */ }
}

/**
 * ScenePreset を削除する。
 */
export async function deleteScenePreset(name: string): Promise<void> {
  if (window.geoAPI) {
    await window.geoAPI.presetDelete('scene', name)
    return
  }

  try {
    const raw = localStorage.getItem(SCENE_KEY)
    if (!raw) return
    const prev = JSON.parse(raw) as Record<string, unknown>
    delete prev[name]
    localStorage.setItem(SCENE_KEY, JSON.stringify(prev))
  } catch { /* ignore */ }
}
