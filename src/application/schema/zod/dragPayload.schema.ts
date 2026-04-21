/**
 * DragPayload Schema
 * spec: docs/spec/param-catalog.spec.md
 *
 * UI（D&D Window）→ Application（MacroWindow）間の
 * ドラッグペイロードを Zod で実行時検証する。
 *
 * - 開発段階: 不正な payload を即座にコンソールで検出できる
 * - Plugin Store フェーズ: 外部 Plugin の payload 検証にもそのまま拡張できる
 *
 * TypeScript 型（DragPayload）は Zod スキーマから派生させる。
 *
 * ## proposal について
 *   StandardDnDWindow からのドラッグ時のみ付与される。
 *   RangeSlider で設定した lo/hi を MacroKnob アサインダイアログの
 *   初期値として引き渡すための AssignProposal。
 *   詳細: zod/assignProposal.schema.ts
 */

import { z } from 'zod'
import { AssignProposalSchema } from './assignProposal.schema'

export const DragPayloadSchema = z.object({
  /** ドラッグ元の種別 */
  type: z.enum(['param', 'macroKnob']),
  /** paramId or knobId */
  id: z.string().min(1),
  /** アサイン元のレイヤー ID（'layer-1' 等） */
  layerId: z.string().min(1),
  /** アサイン元の Plugin ID（表示用） */
  pluginId: z.string().min(1),
  /**
   * CC Standard の番号
   * MIDI 2.0 拡張 CC（CC500 台等）を許容するため上限なし
   */
  ccNumber: z.number().int().min(0),
  /** Plugin の物理限界値 min */
  min: z.number(),
  /** Plugin の物理限界値 max */
  max: z.number(),
  /**
   * StandardDnDWindow からのドラッグ時のみ付与される。
   * RangeSlider の lo/hi を MacroKnob アサインダイアログの初期値として引き渡す。
   * 詳細: zod/assignProposal.schema.ts
   */
  proposal: AssignProposalSchema.optional(),
})

export type DragPayload = z.infer<typeof DragPayloadSchema>
