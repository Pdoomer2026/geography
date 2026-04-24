import type { PluginParam, PluginCatalog } from '../../../../application/schema'
import { catalogToPluginParams } from '../../../../application/catalog/paramCatalog'

/**
 * Torus パラメーターカタログ（静的定義）
 * spec: docs/spec/param-catalog.spec.md
 */
export const catalog: PluginCatalog = {
  radius:      { id: 'radius',      label: 'Radius',           type: 'number', min: 0.5, max: 10,  default: 3.0, step: 0.1, ui: 'slider', requiresRebuild: true },
  tube:        { id: 'tube',        label: 'Tube',             type: 'number', min: 0.1, max: 4.0, default: 1.0, step: 0.1, ui: 'slider', requiresRebuild: true },
  radialSegs:  { id: 'radialSegs',  label: 'Radial Segments',  type: 'number', min: 3,   max: 64,  default: 16,  step: 1,   ui: 'slider', requiresRebuild: true },
  tubularSegs: { id: 'tubularSegs', label: 'Tubular Segments', type: 'number', min: 8,   max: 256, default: 64,  step: 1,   ui: 'slider', requiresRebuild: true },
  speed:       { id: 'speed',       label: 'Speed',            type: 'number', min: 0.0, max: 2.0, default: 0.4, step: 0.01, ui: 'slider' },
  hue:         { id: 'hue',         label: 'Hue',              type: 'number', min: 0,   max: 360, default: 30,  step: 1,   ui: 'slider' },
}

/** catalog から派生する defaultParams（重複定義なし） */
export const defaultParams: Record<string, PluginParam> = catalogToPluginParams(catalog)
