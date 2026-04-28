/**
 * LayerPreset Zod スキーマ
 *
 * 1レイヤーの Plugin 構成定義。再現可能な構成の保存・共有単位。
 * Zod を SSoT とし、TypeScript 型を自動生成する。
 *
 * 将来の拡張：
 *   ClipSchema = LayerPresetSchema.extend({ duration, timeline, ... })
 *   → Sequencer の Clip はこのスキーマを拡張するだけで実現できる
 *
 * spec: docs/spec/layer-window.spec.md §2.1
 */

import { z } from 'zod'
import { MacroKnobConfigSchema } from './macroKnob.schema'

export const LayerPresetSchema = z.object({
  /** 一意な Preset ID（`preset-${Date.now()}` 等） */
  id: z.string(),

  /** ユーザーが付けた名前 */
  name: z.string().min(1),

  /** Geometry Plugin の ID（例: 'icosphere' / 'torus'） */
  geometryPluginId: z.string(),

  /** Camera Plugin の ID（例: 'orbit-camera' / 'static-camera'） */
  cameraPluginId: z.string(),

  /**
   * 有効化する FX Plugin の ID 一覧。
   * 順序は FX_STACK_ORDER に従う。空配列 = FX なし。
   */
  fxPluginIds: z.array(z.string()),

  /**
   * Geometry Plugin パラメーターの初期値。
   * 省略時は Plugin のデフォルト値を使う。
   * replaceLayerPreset 時は現在のエンジン値を維持する（上書きしない）。
   */
  geometryParams: z.record(z.string(), z.number()).optional(),

  /**
   * Camera Plugin パラメーターの初期値。
   * 省略時は Plugin のデフォルト値を使う。
   * replaceLayerPreset 時は現在のエンジン値を維持する（上書きしない）。
   */
  cameraParams: z.record(z.string(), z.number()).optional(),

  /** 作成日時（ISO 8601） */
  createdAt: z.string().datetime(),

  /**
   * Layer Macro ノブ設定（8個分）。
   * optional = 既存 LayerPreset ファイルの後方互換を保持。
   * spec: docs/spec/layer-macro-preset.spec.md
   */
  macroKnobs: z.array(MacroKnobConfigSchema).optional(),
})

export type LayerPreset = z.infer<typeof LayerPresetSchema>

/**
 * LayerPreset の安全な parse ヘルパー。
 * 失敗時は null を返す（クラッシュしない）。
 * Sequencer のリアルタイム処理など、例外を出せない文脈で使う。
 */
export function parseLayerPresetSafe(raw: unknown): LayerPreset | null {
  const result = LayerPresetSchema.safeParse(raw)
  if (!result.success) {
    console.warn('[LayerPreset] 無効なデータをスキップ:', result.error.flatten())
    return null
  }
  return result.data
}
