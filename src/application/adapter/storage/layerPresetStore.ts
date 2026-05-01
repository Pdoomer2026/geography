/**
 * layerPresetStore — LayerPreset / ScenePreset の CRUD SSoT
 *
 * Application 層のストア。UI 層・Electron・ブラウザすべてからの
 * Preset 操作はここを経由する。
 *
 * 保存先: ~/Documents/GeoGraphy/presets/（fileStore 経由）
 *   1 Preset = 1 ファイル（{name}.geopreset）
 *   Finder から個別に削除・移動・共有が可能。
 *
 * ファイル形式:
 *   presets/{sanitizedName}.geopreset  ← LayerPreset
 *   presets/scenes/{sanitizedName}.geopreset  ← ScenePreset
 *
 * localStorage は使用しない。
 * spec: docs/spec/layer-window.spec.md §5
 */

import type { LayerPreset, ScenePreset } from '../../schema'
import { parseLayerPresetSafe } from '../../schema/zod/layerPreset.schema'
import { parseScenePresetSafe } from '../../schema/zod/scenePreset.schema'
import { readJson, writeJson, deleteFile, listFiles } from './fileStore'

// ============================================================
// 型定義
// ============================================================

export interface PresetFolder {
  folder:  string
  presets: LayerPreset[]
}

// ============================================================
// ファイル名ユーティリティ
// ============================================================

const PRESET_EXT       = '.geopreset'
const LAYER_PRESET_DIR = 'presets'
const SCENE_PRESET_DIR = 'presets/scenes'

/** Preset 名をファイル名として安全な文字列に変換する */
function toFilename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').trim()
}

/** LayerPreset の相対ファイルパス */
function layerPresetPath(name: string): string {
  return `${LAYER_PRESET_DIR}/${toFilename(name)}${PRESET_EXT}`
}

/** ScenePreset の相対ファイルパス */
function scenePresetPath(name: string): string {
  return `${SCENE_PRESET_DIR}/${toFilename(name)}${PRESET_EXT}`
}

// ============================================================
// LayerPreset
// ============================================================

/**
 * 保存済み LayerPreset を geometryPluginId フォルダ単位で返す。
 * presets/ ディレクトリの全 .geopreset ファイルを読み込む。
 */
export async function loadLayerPresetFolders(): Promise<PresetFolder[]> {
  try {
    const files = await listFiles(LAYER_PRESET_DIR)
    const presetFiles = files.filter((f) => f.endsWith(PRESET_EXT))

    const presets: LayerPreset[] = []
    for (const file of presetFiles) {
      const data = await readJson(`${LAYER_PRESET_DIR}/${file}`)
      const preset = parseLayerPresetSafe(data)
      if (preset) presets.push(preset)
    }

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
 * LayerPreset を保存する。1 Preset = 1 ファイル（{name}.geopreset）。
 */
export async function saveLayerPreset(name: string, preset: LayerPreset): Promise<void> {
  try {
    const updated: LayerPreset = { ...preset, name, id: `preset-${Date.now()}` }
    await writeJson(layerPresetPath(name), updated)
  } catch { /* ignore */ }
}

/**
 * LayerPreset を削除する。
 */
export async function deleteLayerPreset(name: string): Promise<void> {
  try {
    await deleteFile(layerPresetPath(name))
  } catch { /* ignore */ }
}

// ============================================================
// ScenePreset
// ============================================================

/**
 * 保存済み ScenePreset の一覧を返す。
 */
export async function loadScenePresets(): Promise<ScenePreset[]> {
  try {
    const files = await listFiles(SCENE_PRESET_DIR)
    const presetFiles = files.filter((f) => f.endsWith(PRESET_EXT))

    const presets: ScenePreset[] = []
    for (const file of presetFiles) {
      const data = await readJson(`${SCENE_PRESET_DIR}/${file}`)
      const preset = parseScenePresetSafe(data)
      if (preset) presets.push(preset)
    }
    return presets
  } catch {
    return []
  }
}

/**
 * ScenePreset を保存する。
 */
export async function saveScenePreset(name: string, preset: ScenePreset): Promise<void> {
  try {
    await writeJson(scenePresetPath(name), preset)
  } catch { /* ignore */ }
}

/**
 * ScenePreset を削除する。
 */
export async function deleteScenePreset(name: string): Promise<void> {
  try {
    await deleteFile(scenePresetPath(name))
  } catch { /* ignore */ }
}

// ============================================================
// localStorage からの移行（一度だけ呼ぶ）
// ============================================================

/**
 * localStorage の旧データを 1-file-per-preset 形式に移行する。
 * App.tsx が fileStore 初期化完了後に一度だけ呼ぶ。
 */
export async function migrateFromLocalStorage(): Promise<void> {
  try {
    // LayerPreset の移行
    const layerRaw = localStorage.getItem('geography:layer-presets-v2')
    if (layerRaw) {
      const parsed = JSON.parse(layerRaw) as Record<string, unknown>
      for (const [name, data] of Object.entries(parsed)) {
        const preset = parseLayerPresetSafe(data)
        if (preset) await saveLayerPreset(name, preset)
      }
      localStorage.removeItem('geography:layer-presets-v2')
      console.info('[layerPresetStore] localStorage → fileStore 移行完了 (layer)')
    }

    // ScenePreset の移行
    const sceneRaw = localStorage.getItem('geography:scene-presets-v2')
    if (sceneRaw) {
      const parsed = JSON.parse(sceneRaw) as Record<string, unknown>
      for (const [name, data] of Object.entries(parsed)) {
        const preset = parseScenePresetSafe(data)
        if (preset) await saveScenePreset(name, preset)
      }
      localStorage.removeItem('geography:scene-presets-v2')
      console.info('[layerPresetStore] localStorage → fileStore 移行完了 (scene)')
    }

    // 旧 layer-presets.json の移行（今日の fileStore 版から）
    const oldFile = await readJson('presets/layer-presets.json')
    if (oldFile && typeof oldFile === 'object') {
      for (const [name, data] of Object.entries(oldFile as Record<string, unknown>)) {
        const preset = parseLayerPresetSafe(data)
        if (preset) await saveLayerPreset(name, preset)
      }
      await deleteFile('presets/layer-presets.json')
      console.info('[layerPresetStore] layer-presets.json → 個別ファイルに移行完了')
    }
  } catch { /* ignore */ }
}
