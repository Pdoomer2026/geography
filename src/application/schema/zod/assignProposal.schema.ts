/**
 * AssignProposal Schema
 * spec: docs/spec/param-catalog.spec.md
 *
 * MacroKnob アサイン時の初期提案値を表す型。
 *
 * ## なぜこの型が存在するか
 *   StandardWindow の RangeSlider で設定した lo/hi（操作範囲）を
 *   MacroKnob アサインダイアログの初期値として引き渡すための型。
 *
 *   この型があることで「StandardWindow の lo/hi が なぜ MacroKnob の
 *   min/max に反映されるのか」がコードを読むだけでわかる。
 *
 * ## RangeConstraint との違い
 *   - RangeConstraint: Window 側の概念（ユーザーがスライダーで設定した操作範囲）
 *   - AssignProposal:  Macro 側の概念（アサインダイアログへの初期提案値）
 *
 *   構造は同じだが意味が異なるため、別の型として定義する。
 *
 * ## データフロー
 *   RangeConstraint（StandardWindow の lo/hi）
 *       ↓ DragPayload に AssignProposal として乗る
 *       ↓ AssignDialog が初期値として表示
 *       ↓ ユーザーが確認・調整
 *   MacroAssign.min / max（0〜1 の正規化済み確定値）
 *
 * ## SDK への展望
 *   外部 Plugin が MacroKnob アサインを提案するとき、
 *   このスキーマで実行時検証する。
 */

import { z } from 'zod'

export const AssignProposalSchema = z.object({
  /** MacroKnob アサインダイアログの MIN 初期値（生値・payload.min 以上） */
  lo: z.number(),
  /** MacroKnob アサインダイアログの MAX 初期値（生値・payload.max 以下） */
  hi: z.number(),
})

export type AssignProposal = z.infer<typeof AssignProposalSchema>
