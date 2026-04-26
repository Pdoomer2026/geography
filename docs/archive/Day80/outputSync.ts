/**
 * outputSync.ts
 * BroadcastChannel を使った App ↔ OutputPage リアルタイム同期
 *
 * メッセージ種別:
 *   REQUEST_STATE   : OutputPage → App  「現在の状態をくれ」
 *   STATE_SNAPSHOT  : App → OutputPage  「現在の project を渡す」
 *   PARAM_EVENT     : App → OutputPage  「param 変更イベント（リアルタイム）」
 */

import type { GeoGraphyProject } from '../schema'
import type { TransportEvent } from '../schema'

export const OUTPUT_CHANNEL_NAME = 'geography-output-sync'

export type OutputSyncMessage =
  | { type: 'REQUEST_STATE' }
  | { type: 'STATE_SNAPSHOT'; project: GeoGraphyProject }
  | { type: 'PARAM_EVENT'; event: TransportEvent }
