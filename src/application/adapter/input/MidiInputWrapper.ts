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

import type { TransportEvent } from '../../../application/schema'
import type { MidiMonitorEvent } from '../../../application/schema'

// ============================================================
// MidiInputWrapper
// ============================================================

export class MidiInputWrapper {
  private midiAccess: MIDIAccess | null = null
  private onEvent: ((event: TransportEvent) => void) | null = null
  private onMonitorEvent: ((event: MidiMonitorEvent) => void) | null = null

  /**
   * Web MIDI API を初期化し、CC メッセージの受信を開始する。
   * @param onEvent TransportEvent を受け取るコールバック（通常は engine.handleMidiCC）
   * @param onMonitorEvent MidiMonitorEvent を受け取るコールバック（MidiMonitorWindow 用・省略可）
   */
  async init(
    onEvent: (event: TransportEvent) => void,
    onMonitorEvent?: (event: MidiMonitorEvent) => void,
  ): Promise<void> {
    this.onEvent = onEvent
    this.onMonitorEvent = onMonitorEvent ?? null

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

  /** CC メッセージをパースして TransportEvent と MidiMonitorEvent を生成する */
  private onMidiMessage = (event: MIDIMessageEvent): void => {
    const data = event.data
    if (!data || data.length < 3) return

    const statusType = data[0] & 0xf0
    const channel = data[0] & 0x0f
    const number = data[1]
    const rawValue = data[2]
    const deviceName = (event.target as MIDIInput).name ?? 'Unknown'

    // CC メッセージ（0xB0）→ TransportEvent + MonitorEvent
    if (statusType === 0xb0) {
      const slot = number
      const value = rawValue / 127

      this.onEvent?.({ slot, value, source: 'midi' })
      this.onMonitorEvent?.({
        type: 'cc', number, value, rawValue, channel, deviceName,
        timestamp: Date.now(),
      })
      return
    }

    // Note-On（0x90）→ MonitorEvent のみ
    if (statusType === 0x90) {
      this.onMonitorEvent?.({
        type: 'note-on', number, value: rawValue / 127, rawValue,
        channel, deviceName, timestamp: Date.now(),
      })
      return
    }

    // Note-Off（0x80）→ MonitorEvent のみ
    if (statusType === 0x80) {
      this.onMonitorEvent?.({
        type: 'note-off', number, value: 0, rawValue,
        channel, deviceName, timestamp: Date.now(),
      })
    }
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
