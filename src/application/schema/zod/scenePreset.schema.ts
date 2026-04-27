/**
 * ScenePreset Zod スキーマ
 *
 * 3レイヤー分の LayerPreset をまとめたシーン全体の構成定義。
 * GeoGraphyProject（.geography ファイル）とは完全に別管理。
 *
 * 保存先: localStorage `geography:scene-presets-v2`
 * 旧: `geography:presets-v1`（廃棄・マイグレーションなし）
 *
 * spec: docs/spec/layer-window.spec.md §2
 */

import { z } from 'zod'
import { LayerPresetSchema } from './layerPreset.schema'

export const ScenePresetSchema = z.object({
  /** 一意な ScenePreset ID（`scene-${Date.now()}` 等） */
  id: z.string(),

  /** ユーザーが付けた名前 */
  name: z.string().min(1),

  /**
   * 3レイヤー分の LayerPreset。
   * tuple で固定長（L1 / L2 / L3）を保証する。
   * 要素数が 3 でない JSON は parse 時に弾かれる。
   */
  layerPresets: z.tuple([
    LayerPresetSchema,
    LayerPresetSchema,
    LayerPresetSchema,
  ]),

  /** 作成日時（ISO 8601） */
  createdAt: z.string().datetime(),
})

export type ScenePreset = z.infer<typeof ScenePresetSchema>

/**
 * ScenePreset の安全な parse ヘルパー。
 * 失敗時は null を返す（クラッシュしない）。
 * Sequencer のリアルタイム処理など、例外を出せない文脈で使う。
 */
export function parseScenePresetSafe(raw: unknown): ScenePreset | null {
  const result = ScenePresetSchema.safeParse(raw)
  if (!result.success) {
    console.warn('[ScenePreset] 無効なデータをスキップ:', result.error.flatten())
    return null
  }
  return result.data
}

/**
 * localStorage から全 ScenePreset を安全に読み込む。
 * 壊れたエントリは個別にスキップし、正常なものだけ返す。
 */
export const SCENE_PRESET_STORAGE_KEY = 'geography:scene-presets-v2'

export function loadScenePresetsFromStorage(): Record<string, ScenePreset> {
  try {
    const raw = localStorage.getItem(SCENE_PRESET_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const result: Record<string, ScenePreset> = {}
    for (const [key, value] of Object.entries(parsed)) {
      const preset = parseScenePresetSafe(value)
      if (preset) result[key] = preset
    }
    return result
  } catch {
    console.warn('[ScenePreset] localStorage の読み込みに失敗しました')
    return {}
  }
}

/**
 * localStorage から全 LayerPreset を安全に読み込む。
 * 壊れたエントリは個別にスキップし、正常なものだけ返す。
 */
import { parseLayerPresetSafe } from './layerPreset.schema'
import type { LayerPreset } from './layerPreset.schema'

export const LAYER_PRESET_STORAGE_KEY = 'geography:layer-presets-v2'

export function loadLayerPresetsFromStorage(): Record<string, LayerPreset> {
  try {
    const raw = localStorage.getItem(LAYER_PRESET_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const result: Record<string, LayerPreset> = {}
    for (const [key, value] of Object.entries(parsed)) {
      const preset = parseLayerPresetSafe(value)
      if (preset) result[key] = preset
    }
    return result
  } catch {
    console.warn('[LayerPreset] localStorage の読み込みに失敗しました')
    return {}
  }
}
