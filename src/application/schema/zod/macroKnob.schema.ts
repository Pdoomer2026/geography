/**
 * MacroKnob Zod スキーマ
 *
 * MacroAssign / MacroKnobConfig の Zod SSoT。
 * LayerPresetSchema が macroKnobs フィールドで参照する。
 *
 * spec: docs/spec/layer-macro-preset.spec.md
 * spec: docs/spec/macro-knob.spec.md
 */

import { z } from 'zod'

/** MacroAssign の Zod スキーマ */
export const MacroAssignSchema = z.object({
  geoParamAddress: z.string(),
  ccNumber: z.number().int().min(0),
  layerId: z.string(),
  min: z.number(),
  max: z.number(),
  curve: z.literal('linear'),
})

/** MacroKnobConfig の Zod スキーマ */
export const MacroKnobConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  midiCC: z.number().int().min(-1),
  assigns: z.array(MacroAssignSchema),
})

export type MacroAssignZod = z.infer<typeof MacroAssignSchema>
export type MacroKnobConfigZod = z.infer<typeof MacroKnobConfigSchema>
