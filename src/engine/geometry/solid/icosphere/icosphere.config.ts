import type { PluginParam, PluginCatalog } from '../../../../application/schema'
import { catalogToPluginParams } from '../../../../application/catalog/paramCatalog'

/**
 * Icosphere パラメーターカタログ（静的定義）
 * spec: docs/spec/param-catalog.spec.md
 */
export const catalog: PluginCatalog = {
  detail: { id: 'detail', label: 'Detail', type: 'number', min: 0,   max: 5,   default: 2,   step: 1,    ui: 'slider', requiresRebuild: true },
  radius: { id: 'radius', label: 'Radius', type: 'number', min: 0.5, max: 10,  default: 3,   step: 0.1,  ui: 'slider', requiresRebuild: true },
  speed:  { id: 'speed',  label: 'Speed',  type: 'number', min: 0.0, max: 2.0, default: 0.3, step: 0.01, ui: 'slider' },
  hue:    { id: 'hue',   label: 'Hue',    type: 'number', min: 0,   max: 360, default: 180, step: 1,    ui: 'slider' },
}

/** catalog から派生する defaultParams（重複定義なし） */
export const defaultParams: Record<string, PluginParam> = catalogToPluginParams(catalog)
