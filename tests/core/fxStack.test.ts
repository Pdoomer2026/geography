import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FxStack, FX_STACK_ORDER } from '../../src/core/fxStack'
import type { FXPlugin, PluginParam } from '../../src/types'

// ---- テスト用 MockPass ----

type MockPass = {
  enabled: boolean
  dispose: () => void
}

const makePass = (): MockPass => ({
  enabled: true,
  dispose: vi.fn(),
})

// ---- テスト用 FXPlugin モック ----

const makeFxPlugin = (id: string, enabled = true): FXPlugin & { _pass: MockPass } => {
  const pass = makePass()
  return {
    id,
    name: id,
    renderer: 'threejs',
    enabled,
    params: {} as Record<string, PluginParam>,
    _pass: pass,
    create(composer: unknown) {
      const c = composer as { addPass: (p: MockPass) => void }
      pass.enabled = this.enabled
      c.addPass(pass)
    },
    update(_delta: number, _beat: number) {
      // 実際のプラグインと同様に pass.enabled を this.enabled に同期する
      pass.enabled = this.enabled
    },
    destroy() {
      pass.dispose()
    },
  }
}

// ---- モック EffectComposer ----

type ComposerMock = {
  passes: MockPass[]
  addPass: (pass: MockPass) => void
}

const makeComposer = (): ComposerMock => {
  const passes: MockPass[] = []
  return {
    passes,
    addPass(pass: MockPass) {
      passes.push(pass)
    },
  }
}

// ---- テスト本体 ----

describe('FxStack', () => {
  let stack: FxStack

  beforeEach(() => {
    stack = new FxStack()
  })

  // TC-1: FX スタックの順序が正しい
  it('TC-1: FX_STACK_ORDER の順序が仕様通りである', () => {
    expect(FX_STACK_ORDER[0]).toBe('after-image')
    expect(FX_STACK_ORDER[1]).toBe('feedback')
    expect(FX_STACK_ORDER[2]).toBe('bloom')
    expect(FX_STACK_ORDER[3]).toBe('kaleidoscope')
    expect(FX_STACK_ORDER[4]).toBe('mirror')
    expect(FX_STACK_ORDER[5]).toBe('zoom-blur')
    expect(FX_STACK_ORDER[6]).toBe('rgb-shift')
    expect(FX_STACK_ORDER[7]).toBe('crt')
    expect(FX_STACK_ORDER[8]).toBe('glitch')
    expect(FX_STACK_ORDER[9]).toBe('color-grading')
  })

  it('TC-1: getOrdered() は FX_STACK_ORDER 順でプラグインを返す（逆順登録でも正しい）', () => {
    const bloom        = makeFxPlugin('bloom')
    const afterImage   = makeFxPlugin('after-image')
    const colorGrading = makeFxPlugin('color-grading')

    // 逆順で登録
    stack.register(bloom)
    stack.register(afterImage)
    stack.register(colorGrading)

    const ordered = stack.getOrdered()
    expect(ordered[0].id).toBe('after-image')
    expect(ordered[1].id).toBe('bloom')
    expect(ordered[2].id).toBe('color-grading')
  })

  it('TC-1: buildComposer() は FX_STACK_ORDER 順で addPass を呼ぶ', () => {
    const composer = makeComposer()
    const plugins = [...FX_STACK_ORDER].reverse().map((id) => makeFxPlugin(id))
    plugins.forEach((p) => stack.register(p))

    stack.buildComposer(composer)

    expect(composer.passes).toHaveLength(FX_STACK_ORDER.length)
    const ids = stack.getOrdered().map((p) => p.id)
    expect(ids.indexOf('after-image')).toBeLessThan(ids.indexOf('bloom'))
    expect(ids.indexOf('bloom')).toBeLessThan(ids.indexOf('color-grading'))
    expect(ids[ids.length - 1]).toBe('color-grading')
  })

  // TC-2: enabled フラグと pass.enabled の同期
  it('TC-2: setEnabled(false) で plugin.enabled が false になる', () => {
    const bloom = makeFxPlugin('bloom', true)
    stack.register(bloom)

    stack.setEnabled('bloom', false)
    expect(stack.getPlugin('bloom')?.enabled).toBe(false)
  })

  it('TC-2: enabled=false の plugin でも update() は呼ばれ、pass.enabled が false に反映される', () => {
    // 修正理由: fxStack.update() で enabled=false をスキップすると
    // 各プラグインの update() 内の pass.enabled = this.enabled が実行されず、
    // Three.js の pass.enabled が true のまま残りエフェクトがOFFにならないバグを修正。
    // enabled に関わらず常に update() を呼び、pass.enabled を毎フレーム同期させる。
    const bloom = makeFxPlugin('bloom', false)
    const updateSpy = vi.spyOn(bloom, 'update')
    stack.register(bloom)

    stack.update(0.016, 0)

    expect(updateSpy).toHaveBeenCalledOnce()
    expect(bloom._pass.enabled).toBe(false)
  })

  it('TC-2: enabled=true の plugin は update() が呼ばれ、pass.enabled が true のまま', () => {
    const bloom = makeFxPlugin('bloom', true)
    const updateSpy = vi.spyOn(bloom, 'update')
    stack.register(bloom)

    stack.update(0.016, 0)

    expect(updateSpy).toHaveBeenCalledOnce()
    expect(bloom._pass.enabled).toBe(true)
  })

  // TC-3: destroy() 後に pass.dispose() が呼ばれる
  it('TC-3: dispose() で全 plugin の destroy() が呼ばれる', () => {
    const bloom        = makeFxPlugin('bloom')
    const afterImage   = makeFxPlugin('after-image')
    const colorGrading = makeFxPlugin('color-grading')

    const spyBloom        = vi.spyOn(bloom, 'destroy')
    const spyAfterImage   = vi.spyOn(afterImage, 'destroy')
    const spyColorGrading = vi.spyOn(colorGrading, 'destroy')

    stack.register(bloom)
    stack.register(afterImage)
    stack.register(colorGrading)
    stack.dispose()

    expect(spyBloom).toHaveBeenCalledOnce()
    expect(spyAfterImage).toHaveBeenCalledOnce()
    expect(spyColorGrading).toHaveBeenCalledOnce()
  })

  it('TC-3: dispose() 後に getOrdered() は空になる', () => {
    stack.register(makeFxPlugin('bloom'))
    stack.dispose()
    expect(stack.getOrdered()).toHaveLength(0)
  })

  // --- 追加テスト ---

  it('不明な id を register するとコンソール警告してスキップする', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    stack.register(makeFxPlugin('unknown-fx'))
    expect(stack.getOrdered()).toHaveLength(0)
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('getPlugin() は登録済みプラグインを返す', () => {
    const bloom = makeFxPlugin('bloom')
    stack.register(bloom)
    expect(stack.getPlugin('bloom')).toBe(bloom)
  })

  it('getPlugin() は未登録 id に undefined を返す', () => {
    expect(stack.getPlugin('glitch')).toBeUndefined()
  })
})
