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
import type { MidiManager, MacroKnobManager, MidiCCEvent } from '../types'
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

  handleMidiCC(event: MidiCCEvent): void {
    if (!this.store || !this.knobManager) return

    // CC番号を key に ParameterStore へ直接書く（MacroKnob アサイン有無に関わらず）
    // SimpleWindow のスライダー操作も物理MIDIも同じ経路を通る
    this.store.set(String(event.cc), event.value)

    // MacroKnob アサインがあれば追加で rangeMap して assigns の paramId にも書く
    const knobs = this.knobManager.getKnobs()
    const knob = knobs.find((k) => k.midiCC === event.cc)
    if (knob) {
      // 現在値を MacroKnobManager 側にキャッシュ（表示用）
      this.knobManager.setValue(knob.id, event.value)

      for (const assign of knob.assigns) {
        const mapped = rangeMap(event.value, assign.min, assign.max)
        this.store.set(assign.paramId, mapped)
      }
    }
  }

  receiveModulation(knobId: string, value: number): void {
    if (!this.store || !this.knobManager) return

    const knob = this.knobManager.getKnobs().find((k) => k.id === knobId)
    if (!knob) return

    this.knobManager.setValue(knobId, value)

    for (const assign of knob.assigns) {
      const mapped = rangeMap(value, assign.min, assign.max)
      this.store.set(assign.paramId, mapped)
    }
  }
}

// ============================================================
// シングルトン
// ============================================================

export const midiManager = new MidiManagerImpl()
