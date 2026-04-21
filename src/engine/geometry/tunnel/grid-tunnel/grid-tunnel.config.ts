import type { PluginParam } from '../../../../application/schema'

export const defaultParams: Record<string, PluginParam> = {
  speed:    { value: 0.8,  min: 0.0, max: 3.0,  label: 'Speed' },
  radius:   { value: 4.0,  min: 1.0, max: 10.0, label: 'Radius',   requiresRebuild: true },
  segments: { value: 8,    min: 3,   max: 24,   label: 'Segments', requiresRebuild: true },
  rings:    { value: 20,   min: 5,   max: 40,   label: 'Rings',    requiresRebuild: true },
  length:   { value: 40,   min: 10,  max: 100,  label: 'Length',   requiresRebuild: true },
  hue:      { value: 280,  min: 0,   max: 360,  label: 'Hue' },
}
