/**
 * MidiLearnTarget Zod スキーマ
 *
 * UI → Application 境界を越える MidiLearnTarget の実行時検証。
 * spec: docs/spec/midi-learn.spec.md
 * Day76: 手書き interface から Zod 派生型に移行
 */

import { z } from 'zod'

export const MidiLearnTargetTypeSchema = z.enum([
  'macro',
  'geometry-param',
  'camera-param',
  'fx-param',
  'layer-opacity',
  'sequencer-param',
])

export const MidiLearnTargetSchema = z.object({
  /** コントロールの一意 ID（例: 'macro-1', 'opacity-L1'）*/
  id: z.string(),
  /** コントロールの種類 */
  type: MidiLearnTargetTypeSchema,
  /** UI 表示用ラベル */
  label: z.string(),
})

export type MidiLearnTargetType = z.infer<typeof MidiLearnTargetTypeSchema>
export type MidiLearnTarget = z.infer<typeof MidiLearnTargetSchema>
