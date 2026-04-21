import type { PluginParam } from '../../../../application/schema'

export const defaultParams: Record<string, PluginParam> = {
  radius:      { value: 3.0,  min: 0.5, max: 10,   label: 'Radius',           requiresRebuild: true },
  tube:        { value: 1.0,  min: 0.1, max: 4.0,  label: 'Tube',             requiresRebuild: true },
  radialSegs:  { value: 16,   min: 3,   max: 64,   label: 'Radial Segments',  requiresRebuild: true },
  tubularSegs: { value: 64,   min: 8,   max: 256,  label: 'Tubular Segments', requiresRebuild: true },
  speed:       { value: 0.4,  min: 0.0, max: 2.0,  label: 'Speed' },
  hue:         { value: 30,   min: 0,   max: 360,  label: 'Hue' },
}
