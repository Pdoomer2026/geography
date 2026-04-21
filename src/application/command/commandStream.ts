/**
 * CommandStream
 * spec: docs/spec/param-catalog.spec.md（将来: command-stream.spec.md）
 *
 * UI → Application への Command ストリーム（RxJS Subject）。
 * UI は engine を直接呼ばず、このストリームに流すだけ。
 * App.tsx が throttle をかけて engine.handleMidiCC() に接続する。
 *
 * 使い方（UI 側）:
 *   paramCommand$.next({ slot: ccNumber, value: normalized, source: 'window', layerId })
 *
 * 使い方（App.tsx 側）:
 *   paramCommand$.pipe(throttleTime(16)).subscribe((e) => engine.handleMidiCC(e))
 *
 * Sequencer もこのストリームに BPM tick を流す（将来）。
 */

import { Subject } from 'rxjs'
import type { TransportEvent } from '../schema'

/**
 * パラメーター変更 Command ストリーム
 * - スライダー操作: UI が next() を呼ぶ
 * - Sequencer tick: Sequencer が next() を呼ぶ（将来）
 * - App.tsx が throttle → engine.handleMidiCC() に接続
 */
export const paramCommand$ = new Subject<TransportEvent>()
