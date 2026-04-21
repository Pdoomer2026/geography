/**
 * TransportManager
 * spec: docs/spec/transport-architecture.spec.md
 *
 * Day58 Step4: プロトコル非依存の TransportManager
 *
 * 責務:
 *   - TransportEvent を受け取って ParameterStore に書く
 *   - AssignRegistry を参照してアサイン解決（midiCC / assign.ccNumber でヒット検索）
 *   - Sequencer / LFO からの変調値受け取り（receiveModulation）
 *
 * 責務外:
 *   - プロトコル知識（MIDI / OSC は InputWrapper が担当）
 *   - slot → paramId の意味解決（TransportRegistry が担当）
 *   - plugin.params への書き込み（engine.flushParameterStore が担当）
 */

import { rangeMap } from './assignRegistry'
import { transportRegistry } from './transportRegistry'
import type { AssignRegistry, TransportEvent } from '../application/schema'
import type { ParameterStore } from './parameterStore'

// ============================================================
// TransportManager interface
// ============================================================

export interface TransportManager {
  init(store: ParameterStore, knobManager: AssignRegistry): void
  handle(event: TransportEvent): void
  receiveModulation(knobId: string, value: number): void
}

// ============================================================
// TransportManagerImpl
// ============================================================

class TransportManagerImpl implements TransportManager {
  private store: ParameterStore | null = null
  private knobManager: AssignRegistry | null = null

  init(store: ParameterStore, knobManager: AssignRegistry): void {
    this.store = store
    this.knobManager = knobManager
  }

  handle(event: TransportEvent): void {
    if (!this.store || !this.knobManager) return

    // layerId がある（source:'window'）→ そのレイヤーのみに書く
    // layerId がない（source:'midi'）→ Registry で全マッチに書く
    if (event.layerId) {
      this.store.set(`${event.layerId}:${event.slot}`, event.value)
    } else {
      const entries = transportRegistry.getAll().filter((p) => p.ccNumber === event.slot)
      if (entries.length > 0) {
        for (const entry of entries) {
          this.store.set(`${entry.layerId}:${event.slot}`, event.value)
        }
      } else {
        this.store.set(String(event.slot), event.value)
      }
    }

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

    // assign.ccNumber でヒットする MacroKnob → MacroKnob 表示を追従
    for (const knob of knobs) {
      for (const assign of knob.assigns) {
        if (assign.ccNumber === event.slot) {
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
      const mapped = rangeMap(value, assign.min, assign.max)
      // assign.layerId で絞り込み（全レイヤー同時書き込みを防ぐ）
      const entries = transportRegistry.getAll().filter(
        (p) => p.ccNumber === assign.ccNumber && p.layerId === assign.layerId
      )
      if (entries.length > 0) {
        for (const entry of entries) {
          this.store.set(`${entry.layerId}:${assign.ccNumber}`, mapped)
        }
      } else {
        this.store.set(String(assign.ccNumber), mapped)
      }
    }
  }
}

// ============================================================
// シングルトン
// ============================================================

export const transportManager = new TransportManagerImpl()
