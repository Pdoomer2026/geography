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
 * schema/index.ts の手書き interface は本ファイルに移行済み。
 */

import { z } from 'zod'

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
  /** スライダー可動域 min */
  min: z.number(),
  /** スライダー可動域 max */
  max: z.number(),
  /** StandardD&D からの場合のみ: アサイン初期値 lo */
  lo: z.number().optional(),
  /** StandardD&D からの場合のみ: アサイン初期値 hi */
  hi: z.number().optional(),
})

/**
 * DragPayload 型（Zod スキーマから派生）
 * schema/index.ts から re-export して全体で統一して使う。
 */
export type DragPayload = z.infer<typeof DragPayloadSchema>
