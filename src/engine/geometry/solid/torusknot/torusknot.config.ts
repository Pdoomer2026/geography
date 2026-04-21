import type { PluginParam } from '../../../../application/schema'

export const defaultParams: Record<string, PluginParam> = {
  radius:      { value: 2.5,  min: 0.5, max: 8.0,  label: 'Radius',           requiresRebuild: true },
  tube:        { value: 0.6,  min: 0.1, max: 2.0,  label: 'Tube',             requiresRebuild: true },
  tubularSegs: { value: 128,  min: 32,  max: 512,  label: 'Tubular Segments', requiresRebuild: true },
  radialSegs:  { value: 8,    min: 3,   max: 32,   label: 'Radial Segments',  requiresRebuild: true },
  p:           { value: 2,    min: 1,   max: 8,    label: 'P',                requiresRebuild: true },
  q:           { value: 3,    min: 1,   max: 8,    label: 'Q',                requiresRebuild: true },
  speed:       { value: 0.3,  min: 0.0, max: 2.0,  label: 'Speed' },
  hue:         { value: 280,  min: 0,   max: 360,  label: 'Hue' },
}
