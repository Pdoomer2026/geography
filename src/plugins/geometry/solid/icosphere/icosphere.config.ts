import type { PluginParam } from '../../../../types'

export const defaultParams: Record<string, PluginParam> = {
  detail:  { value: 2,    min: 0,   max: 5,    label: 'Detail', requiresRebuild: true },
  radius:  { value: 3,    min: 0.5, max: 10,   label: 'Radius', requiresRebuild: true },
  speed:   { value: 0.3,  min: 0.0, max: 2.0,  label: 'Speed' },
  hue:     { value: 180,  min: 0,   max: 360,  label: 'Hue' },
}
