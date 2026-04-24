import type { PluginParam, PluginCatalog } from '../../../../application/schema'
import { catalogToPluginParams } from '../../../../application/catalog/paramCatalog'

/**
 * TorusKnot パラメーターカタログ（静的定義）
 * spec: docs/spec/param-catalog.spec.md
 */
export const catalog: PluginCatalog = {
  radius:      { id: 'radius',      label: 'Radius',           type: 'number', min: 0.5, max: 8.0,  default: 2.5, step: 0.1, ui: 'slider', requiresRebuild: true },
  tube:        { id: 'tube',        label: 'Tube',             type: 'number', min: 0.1, max: 2.0,  default: 0.6, step: 0.1, ui: 'slider', requiresRebuild: true },
  tubularSegs: { id: 'tubularSegs', label: 'Tubular Segments', type: 'number', min: 32,  max: 512, default: 128,  step: 1,   ui: 'slider', requiresRebuild: true },
  radialSegs:  { id: 'radialSegs',  label: 'Radial Segments',  type: 'number', min: 3,   max: 32,  default: 8,   step: 1,   ui: 'slider', requiresRebuild: true },
  p:           { id: 'p',           label: 'P',                type: 'number', min: 1,   max: 8,   default: 2,   step: 1,   ui: 'slider', requiresRebuild: true },
  q:           { id: 'q',           label: 'Q',                type: 'number', min: 1,   max: 8,   default: 3,   step: 1,   ui: 'slider', requiresRebuild: true },
  speed:       { id: 'speed',       label: 'Speed',            type: 'number', min: 0.0, max: 2.0, default: 0.3, step: 0.01, ui: 'slider' },
  hue:         { id: 'hue',         label: 'Hue',              type: 'number', min: 0,   max: 360, default: 280, step: 1,   ui: 'slider' },
}

/** catalog から派生する defaultParams（重複定義なし） */
export const defaultParams: Record<string, PluginParam> = catalogToPluginParams(catalog)
