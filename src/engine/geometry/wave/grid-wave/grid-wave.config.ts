import type { PluginParam, PluginCatalog } from '../../../../application/schema'
import { catalogToPluginParams } from '../../../../application/catalog/paramCatalog'

/**
 * GridWave パラメーターカタログ（静的定義）
 * spec: docs/spec/param-catalog.spec.md
 */
export const catalog: PluginCatalog = {
  speed:     { id: 'speed',     label: 'Speed',     type: 'number', min: 0.1, max: 2.0, default: 0.5, step: 0.01, ui: 'slider' },
  amplitude: { id: 'amplitude', label: 'Amplitude', type: 'number', min: 0.1, max: 2.0, default: 2.0, step: 0.01, ui: 'slider' },
  frequency: { id: 'frequency', label: 'Frequency', type: 'number', min: 0.1, max: 1.0, default: 0.3, step: 0.01, ui: 'slider' },
  segments:  { id: 'segments',  label: 'Segments',  type: 'number', min: 10,  max: 100, default: 60,  step: 1,    ui: 'slider', requiresRebuild: true },
  size:      { id: 'size',      label: 'Size',      type: 'number', min: 1,   max: 500, default: 80,  step: 1,    ui: 'slider', requiresRebuild: true },
  hue:       { id: 'hue',       label: 'Hue',       type: 'number', min: 0,   max: 360, default: 180, step: 1,    ui: 'slider' },
}

/** catalog から派生する defaultParams（重複定義なし） */
export const defaultParams: Record<string, PluginParam> = catalogToPluginParams(catalog)
