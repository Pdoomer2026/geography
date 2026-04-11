/**
 * MidiInputWrapper
 * spec: docs/spec/transport-architecture.spec.md §3
 *
 * Web MIDI API の受信・正規化・TransportEvent 生成を担当する Input Wrapper。
 * App.tsx から MIDI プロトコル解析ロジックを隔離する。
 *
 * 責務:
 *   - navigator.requestMIDIAccess の取得
 *   - CC メッセージのパース（status byte 0xB0 のみ）
 *   - CC番号 → Slot 変換（現在は同値。将来 OSC 等に対応するとき分離）
 *   - rawValue(0〜127) → 0.0〜1.0 正規化
 *   - TransportEvent を生成して onEvent コールバックを呼ぶ
 *
 * 責務外:
 *   - MacroKnob 解決（midiManager の責務）
 *   - ParameterStore への書き込み（midiManager の責務）
 */

import type { TransportEvent } from '../../types'

// ============================================================
// MidiInputWrapper
// ============================================================

export class MidiInputWrapper {
  private midiAccess: MIDIAccess | null = null
  private onEvent: ((event: TransportEvent) => void) | null = null

  /**
   * Web MIDI API を初期化し、CC メッセージの受信を開始する。
   * @param onEvent TransportEvent を受け取るコールバック（通常は engine.handleMidiCC）
   */
  async init(onEvent: (event: TransportEvent) => void): Promise<void> {
    this.onEvent = onEvent

    if (!navigator.requestMIDIAccess) {
      console.warn('[MidiInputWrapper] Web MIDI API is not supported in this environment.')
      return
    }

    try {
      const access = await navigator.requestMIDIAccess({ sysex: false })
      this.midiAccess = access
      this.attachListeners(access)

      access.onstatechange = () => {
        this.attachListeners(access)
      }
    } catch (err) {
      console.warn('[MidiInputWrapper] Web MIDI API アクセス失敗:', err)
    }
  }

  /** 全 MIDI 入力デバイスにリスナーをアタッチする */
  private attachListeners(access: MIDIAccess): void {
    access.inputs.forEach((input) => {
      input.onmidimessage = this.onMidiMessage
    })
  }

  /** CC メッセージをパースして TransportEvent を生成する */
  private onMidiMessage = (event: MIDIMessageEvent): void => {
    const data = event.data
    if (!data || data.length < 3) return

    // CC メッセージ（status byte の上位4bit が 0xB）のみ処理
    const statusType = data[0] & 0xf0
    if (statusType !== 0xb0) return

    const cc = data[1]
    const rawValue = data[2]

    // CC番号 → Slot（現在は同値。将来 OSC 等対応時に変換ロジックを追加）
    const slot = cc

    // rawValue(0〜127) → 0.0〜1.0 正規化
    const value = rawValue / 127

    const transportEvent: TransportEvent = {
      slot,
      value,
      source: 'midi',
    }

    this.onEvent?.(transportEvent)
  }

  /** MIDI 受信を停止し、リスナーを解除する */
  dispose(): void {
    if (this.midiAccess) {
      this.midiAccess.inputs.forEach((input) => {
        input.onmidimessage = null
      })
      this.midiAccess = null
    }
    this.onEvent = null
  }
}

// ============================================================
// シングルトン
// ============================================================

export const midiInputWrapper = new MidiInputWrapper()
