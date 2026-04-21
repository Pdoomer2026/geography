import type { PluginParam, PluginCatalog } from '../../../../application/schema'
import { catalogToPluginParams } from '../../../../application/catalog/paramCatalog'

/**
 * GridTunnel パラメーターカタログ（静的定義）
 * spec: docs/spec/param-catalog.spec.md
 */
export const catalog: PluginCatalog = {
  speed:    { id: 'speed',    label: 'Speed',    type: 'number', min: 0.0, max: 3.0,  default: 0.8, step: 0.01, ui: 'slider' },
  radius:   { id: 'radius',   label: 'Radius',   type: 'number', min: 1.0, max: 10.0, default: 4.0, step: 0.1,  ui: 'slider', requiresRebuild: true },
  segments: { id: 'segments', label: 'Segments', type: 'number', min: 3,   max: 24,   default: 8,   step: 1,    ui: 'slider', requiresRebuild: true },
  rings:    { id: 'rings',    label: 'Rings',    type: 'number', min: 5,   max: 40,   default: 20,  step: 1,    ui: 'slider', requiresRebuild: true },
  length:   { id: 'length',   label: 'Length',   type: 'number', min: 10,  max: 100,  default: 40,  step: 1,    ui: 'slider', requiresRebuild: true },
  hue:      { id: 'hue',      label: 'Hue',      type: 'number', min: 0,   max: 360,  default: 280, step: 1,    ui: 'slider' },
}

/** catalog から派生する defaultParams（重複定義なし） */
export const defaultParams: Record<string, PluginParam> = catalogToPluginParams(catalog)
