import type { PluginParam, PluginCatalog } from '../../../../application/schema'
import { catalogToPluginParams } from '../../../../application/catalog/paramCatalog'

/**
 * Contour パラメーターカタログ（静的定義）
 * spec: docs/spec/param-catalog.spec.md
 */
export const catalog: PluginCatalog = {
  speed:     { id: 'speed',     label: 'Speed',     type: 'number', min: 0.0, max: 2.0,  default: 0.3,  step: 0.01, ui: 'slider' },
  scale:     { id: 'scale',     label: 'Scale',     type: 'number', min: 0.1, max: 2.0,  default: 0.4,  step: 0.01, ui: 'slider' },
  amplitude: { id: 'amplitude', label: 'Amplitude', type: 'number', min: 0.1, max: 8.0,  default: 3.0,  step: 0.1,  ui: 'slider' },
  segments:  { id: 'segments',  label: 'Segments',  type: 'number', min: 10,  max: 150,  default: 80,   step: 1,    ui: 'slider', requiresRebuild: true },
  size:      { id: 'size',      label: 'Size',      type: 'number', min: 10,  max: 500,  default: 100,  step: 1,    ui: 'slider', requiresRebuild: true },
  hue:       { id: 'hue',       label: 'Hue',       type: 'number', min: 0,   max: 360,  default: 160,  step: 1,    ui: 'slider' },
}

/** catalog から派生する defaultParams（重複定義なし） */
export const defaultParams: Record<string, PluginParam> = catalogToPluginParams(catalog)
