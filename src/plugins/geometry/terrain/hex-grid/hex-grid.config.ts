import type { PluginParam } from '../../../../types'

export const defaultParams: Record<string, PluginParam> = {
  cols:      { value: 12,   min: 4,   max: 30,   label: 'Columns',    requiresRebuild: true },
  rows:      { value: 12,   min: 4,   max: 30,   label: 'Rows',       requiresRebuild: true },
  hexSize:   { value: 2.0,  min: 0.5, max: 5.0,  label: 'Hex Size',   requiresRebuild: true },
  maxHeight: { value: 3.0,  min: 0.0, max: 10.0, label: 'Max Height', requiresRebuild: true },
  speed:     { value: 0.5,  min: 0.0, max: 2.0,  label: 'Speed' },
  hue:       { value: 120,  min: 0,   max: 360,  label: 'Hue' },
}
