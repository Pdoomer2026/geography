/**
 * FxStack
 * EffectComposer に対して 10 個の FX Pass を固定順で管理する。
 * 固定順（変更禁止）:
 *   AfterImage → Feedback → Bloom → Kaleidoscope → Mirror
 *   → ZoomBlur → RGBShift → CRT → Glitch → ColorGrading（必ず最後）
 */

import type { FXPlugin } from '../types'

export const FX_STACK_ORDER = [
  'after-image',
  'feedback',
  'bloom',
  'kaleidoscope',
  'mirror',
  'zoom-blur',
  'rgb-shift',
  'crt',
  'glitch',
  'color-grading',
] as const

export type FxId = (typeof FX_STACK_ORDER)[number]

export class FxStack {
  private plugins: Map<FxId, FXPlugin> = new Map()

  register(plugin: FXPlugin): void {
    const id = plugin.id as FxId
    if (!FX_STACK_ORDER.includes(id)) {
      console.warn(`[FxStack] Unknown FX id: ${id}`)
      return
    }
    this.plugins.set(id, plugin)
  }

  getOrdered(): FXPlugin[] {
    return FX_STACK_ORDER.flatMap((id) => {
      const p = this.plugins.get(id)
      return p ? [p] : []
    })
  }

  buildComposer(composer: unknown): void {
    for (const plugin of this.getOrdered()) {
      plugin.create(composer)
    }
  }

  update(delta: number, beat: number): void {
    for (const plugin of this.getOrdered()) {
      if (!plugin.enabled) continue
      plugin.update(delta, beat)
    }
  }

  dispose(): void {
    for (const plugin of this.plugins.values()) {
      plugin.destroy()
    }
    this.plugins.clear()
  }

  setEnabled(fxId: FxId, enabled: boolean): void {
    const plugin = this.plugins.get(fxId)
    if (plugin) {
      plugin.enabled = enabled
    }
  }

  getPlugin(fxId: FxId): FXPlugin | undefined {
    return this.plugins.get(fxId)
  }
}
