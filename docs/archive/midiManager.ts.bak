/**
 * MidiManager
 * spec: docs/spec/macro-knob.spec.md §3
 *
 * CC入力の唯一の通路。Day50 新設。
 * 全入力源（物理MIDI / SimpleWindow / Sequencer / LFO / AI）が
 * engine.handleMidiCC(MidiCCEvent) 経由でここに流れ込む。
 *
 * MacroKnobManager から handleMidiCC / receiveModulation を移管。
 */

import { rangeMap } from './macroKnob'
import type { MidiManager, MacroKnobManager, TransportEvent } from '../types'
import type { ParameterStore } from './parameterStore'

// ============================================================
// MidiManagerImpl
// ============================================================

class MidiManagerImpl implements MidiManager {
  private store: ParameterStore | null = null
  private knobManager: MacroKnobManager | null = null

  init(store: ParameterStore, knobManager: MacroKnobManager): void {
    this.store = store
    this.knobManager = knobManager
  }

  handleMidiCC(event: TransportEvent): void {
    if (!this.store || !this.knobManager) return

    this.store.set(String(event.slot), event.value)

    const knobs = this.knobManager.getKnobs()

    // midiCC（物理 MIDI CC）でヒットする MacroKnob
    const knobByMidi = knobs.find((k) => k.midiCC === event.slot)
    if (knobByMidi) {
      this.knobManager.setValue(knobByMidi.id, event.value)
      for (const assign of knobByMidi.assigns) {
        const mapped = rangeMap(event.value, assign.min, assign.max)
        this.store.set(assign.paramId, mapped)
      }
    }

    // assign.ccNumber でヒットする MacroKnob → SimpleWindow → MacroKnob 表示を追従
    for (const knob of knobs) {
      for (const assign of knob.assigns) {
        if (assign.ccNumber === event.slot) {
          // event.value は 0.0〜1.0 の正規化値なのでそのままノブ値として使う
          this.knobManager.setValue(knob.id, Math.min(1, Math.max(0, event.value)))
        }
      }
    }
  }

  receiveModulation(knobId: string, value: number): void {
    if (!this.store || !this.knobManager) return

    const knob = this.knobManager.getKnobs().find((k) => k.id === knobId)
    if (!knob) return

    this.knobManager.setValue(knobId, value)

    for (const assign of knob.assigns) {
      // CC番号キーに正規化値を書くのみ（flushParameterStore の統一ルート）
      // paramId キーには書かない（競合防止）
      this.store.set(String(assign.ccNumber), value)
    }
  }
}

// ============================================================
// シングルトン
// ============================================================

export const midiManager = new MidiManagerImpl()
