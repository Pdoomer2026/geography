/**
 * RangeConstraint Schema
 * spec: docs/spec/param-catalog.spec.md
 *
 * lo / hi はユーザーが UI 上で設定した「変化幅」を表す独自概念。
 *
 * ## min / max との違い
 *   - min / max: Plugin が定義するパラメーターの物理的な限界値
 *   - lo  / hi:  ユーザーが StandardWindow の RangeSlider で設定した操作範囲
 *
 * ## 使われる場所
 *   - useStandardParamRow: RangeSlider の変化幅制約として使用
 *   - useStandardDnDParamRow: 変化幅制約 + D&D payload に lo/hi を乗せる
 *   - DragPayloadSchema: lo/hi フィールドをここから派生させる
 *
 * ## セマンティック
 *   RangeSlider の段2（現在値スライダー）は min={lo} max={hi} で動作する。
 *   つまりユーザーは lo〜hi の範囲内でしかパラメーターを動かせない。
 *   これが「変化幅の制約」の実体。
 *
 * ## SDK への展望
 *   Plugin Store フェーズで外部 Plugin が RangeConstraint を受け取るとき、
 *   このスキーマで実行時検証する。
 */

import { z } from 'zod'

export const RangeConstraintSchema = z.object({
  /** ユーザーが設定した操作範囲の下限（min 以上） */
  lo: z.number(),
  /** ユーザーが設定した操作範囲の上限（max 以下） */
  hi: z.number(),
})

export type RangeConstraint = z.infer<typeof RangeConstraintSchema>
