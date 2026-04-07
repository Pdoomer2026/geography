import type { PluginParam } from '../../../../types'

export const defaultParams: Record<string, PluginParam> = {
  speed:     { value: 0.5,  min: 0.1, max: 2.0,  label: 'Speed' },
  amplitude: { value: 2.0,  min: 0.1, max: 2.0,  label: 'Amplitude' },
  frequency: { value: 0.3,  min: 0.1, max: 1.0,  label: 'Frequency' },
  segments:  { value: 60,   min: 10,  max: 100,   label: 'Segments',  requiresRebuild: true },
  size:      { value: 80,   min: 1,   max: 500,   label: 'Size',       requiresRebuild: true },
}
