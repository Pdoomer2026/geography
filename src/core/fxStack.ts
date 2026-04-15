/**
 * FxStack
 * EffectComposer に対して 10 個の FX Pass を固定順で管理する。
 * 固定順（変更禁止）:
 *   AfterImage → Feedback → Bloom → Kaleidoscope → Mirror
 *   → ZoomBlur → RGBShift → CRT → Glitch → ColorGrading（必ず最後）
 *
 * spec: docs/spec/fx-stack.spec.md
 * spec: docs/spec/plugin-lifecycle.spec.md §6
 */

import type { FXPlugin, IFxStack } from '../types'

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

export class FxStack implements IFxStack {
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
      // enabled に関わらず常に update() を呼ぶ。
      // 各プラグインの update() 内で this.pass.enabled = this.enabled を設定するため、
      // ここで skip すると pass.enabled が true のまま残りエフェクトが切れない。
      plugin.update(delta, beat)
    }
  }

  dispose(): void {
    for (const plugin of this.plugins.values()) {
      plugin.destroy()
    }
    this.plugins.clear()
  }

  setEnabled(fxId: string, enabled: boolean): void {
    const plugin = this.plugins.get(fxId as FxId)
    if (plugin) {
      plugin.enabled = enabled
    }
  }

  getPlugin(fxId: string): FXPlugin | undefined {
    return this.plugins.get(fxId as FxId)
  }

  /**
   * Setup APPLY 用：Plugin Lifecycle spec §6 の実装。
   *
   * 処理フロー:
   * 1. 全プラグインを destroy()（Pass.dispose() で VRAM 解放）
   * 2. composer の passes から RenderPass 以外を全削除
   * 3. enabledIds のプラグインだけ FX_STACK_ORDER 順で create(composer)
   * 4. 各プラグインの enabled フラグを更新
   *
   * 描画が数十ms 止まることは許容済み（spec §4 APPLY の動作）。
   */
  applySetup(enabledIds: string[], composer: unknown): void {
    // 型エイリアス（循環参照を避けるため EffectComposer を直接 import しない）
    type ComposerLike = {
      passes: { dispose?: () => void; constructor: { name: string } }[]
      addPass: (pass: unknown) => void
    }
    const c = composer as ComposerLike

    // Step 1: 全プラグインを destroy()（VRAM 解放）
    for (const plugin of this.plugins.values()) {
      plugin.destroy()
    }

    // Step 2: composer の passes をリセット（RenderPass だけ残す）
    // passes 配列を直接操作（EffectComposer に removePass がない場合の fallback）
    const passesToKeep = c.passes.filter(
      (p) => p.constructor.name === 'RenderPass'
    )
    c.passes.length = 0
    for (const p of passesToKeep) {
      c.passes.push(p)
    }

    // Step 3 & 4: 全FXをcreate()して pass を維持し、enabled だけ制御
    const enabledSet = new Set(enabledIds)
    for (const id of FX_STACK_ORDER) {
      const plugin = this.plugins.get(id)
      if (!plugin) continue
      plugin.create(composer)
      plugin.enabled = enabledSet.has(id)
    }

    console.debug(
      `[FxStack] applySetup: ${enabledIds.length} FX enabled (${enabledIds.join(', ')})`
    )
  }
}
