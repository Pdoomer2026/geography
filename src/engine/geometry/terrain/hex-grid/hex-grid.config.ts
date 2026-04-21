import type { PluginParam, PluginCatalog } from '../../../../application/schema'
import { catalogToPluginParams } from '../../../../application/catalog/paramCatalog'

/**
 * HexGrid パラメーターカタログ（静的定義）
 * spec: docs/spec/param-catalog.spec.md
 */
export const catalog: PluginCatalog = {
  cols:      { id: 'cols',      label: 'Columns',    type: 'number', min: 4,   max: 30,   default: 12,  step: 1,    ui: 'slider', requiresRebuild: true },
  rows:      { id: 'rows',      label: 'Rows',       type: 'number', min: 4,   max: 30,   default: 12,  step: 1,    ui: 'slider', requiresRebuild: true },
  hexSize:   { id: 'hexSize',   label: 'Hex Size',   type: 'number', min: 0.5, max: 5.0,  default: 2.0, step: 0.1,  ui: 'slider', requiresRebuild: true },
  maxHeight: { id: 'maxHeight', label: 'Max Height', type: 'number', min: 0.0, max: 10.0, default: 3.0, step: 0.1,  ui: 'slider', requiresRebuild: true },
  speed:     { id: 'speed',     label: 'Speed',      type: 'number', min: 0.0, max: 2.0,  default: 0.5, step: 0.01, ui: 'slider' },
  hue:       { id: 'hue',       label: 'Hue',        type: 'number', min: 0,   max: 360,  default: 120, step: 1,    ui: 'slider' },
}

/** catalog から派生する defaultParams（重複定義なし） */
export const defaultParams: Record<string, PluginParam> = catalogToPluginParams(catalog)
