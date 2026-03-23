import * as THREE from 'three'
import { registry } from './registry'
import { ParameterStore } from './parameterStore'
import { Clock } from './clock'
import { registerGeometryPlugins } from '../plugins/geometry'
import { registerLightPlugins } from '../plugins/lights'
import { registerParticlePlugins } from '../plugins/particles'
import { createFxPlugins } from '../plugins/fx'
import { programBus } from './programBus'
import { previewBus } from './previewBus'
import { layerManager } from './layerManager'
import { macroKnobManager } from './macroKnob'
import type { FXPlugin, GeometryPlugin, Layer, MacroKnobConfig, SceneState } from '../types'

// engine.ts は App.tsx に依存してはいけない・単体で動作できること

export class Engine {
  private animationId: number | null = null
  private container: HTMLElement | null = null
  private threeClock: THREE.Clock = new THREE.Clock()
  readonly clock: Clock = new Clock()
  private prevBeat: number = 0
  activeTransitionId: string = 'beat-cut'

  readonly parameterStore: ParameterStore

  constructor() {
    this.parameterStore = new ParameterStore()
  }

  // --- 初期化 ---

  async initialize(container: HTMLElement): Promise<void> {
    this.container = container
    layerManager.initialize(container)

    macroKnobManager.init(this.parameterStore)

    // Plugin 自動登録
    // 登録順（Map の insert order）: geometry → lights(enabled=false) → particles
    // → registry.list().filter(enabled) = [grid-wave, starfield]
    await registerGeometryPlugins()
    await registerLightPlugins()
    await registerParticlePlugins()

    const allPlugins = registry.list().filter((p) => p.enabled)
    // allPlugins[0] = grid-wave (geometry) → layer-1 + FX
    // allPlugins[1] = starfield (particle)  → layer-2 + blendMode: add（背景として透過合成）
    // allPlugins[2以降] → mute

    const layers = layerManager.getLayers()

    allPlugins.slice(0, layers.length).forEach((plugin, index) => {
      layerManager.setPlugin(`layer-${index + 1}`, plugin as GeometryPlugin)
    })

    // 未使用レイヤーは mute
    for (let i = allPlugins.length; i < layers.length; i++) {
      layerManager.setMute(`layer-${i + 1}`, true)
    }

    // starfield (layer-2) は加算合成で背景として透過表示
    // → 黒い部分は透過、星の光の粒だけが前面に重なる
    if (allPlugins.length >= 2) {
      layerManager.setBlendMode('layer-2', 'add')
    }

    // FX は geometry レイヤー（layer-1）のみに適用
    layerManager.setupFx('layer-1', createFxPlugins())

    // 初期 SceneState
    const fxPlugins = layers[0]?.fxStack.getOrdered() ?? []
    const initialState: SceneState = {
      layers: allPlugins.slice(0, 1).map((p) => ({
        geometryId: p.id,
        geometryParams: Object.fromEntries(
          Object.entries(p.params).map(([k, v]) => [k, v.value])
        ),
        fxStack: fxPlugins.map((fx) => ({
          fxId: fx.id,
          params: Object.fromEntries(
            Object.entries(fx.params).map(([k, v]) => [k, v.value])
          ),
          enabled: fx.enabled,
        })),
        opacity: 1,
        blendMode: 'normal',
      })),
    }
    programBus.load(initialState)
    previewBus.update(initialState)

    window.addEventListener('resize', this.onResize)
  }

  // --- Transition 選択 ---

  setTransition(id: string): void {
    this.activeTransitionId = id
  }

  // --- MacroKnob ---

  getMacroKnobs(): MacroKnobConfig[] {
    return macroKnobManager.getKnobs()
  }

  handleMidiCC(cc: number, value: number): void {
    macroKnobManager.handleMidiCC(cc, value)
  }

  // --- FX コントロール API（layer-1 = geometry レイヤー対象）---

  getFxPlugins(): FXPlugin[] {
    return layerManager.getLayers()[0]?.fxStack.getOrdered() ?? []
  }

  setFxEnabled(fxId: string, enabled: boolean): void {
    layerManager.getLayers()[0]?.fxStack.setEnabled(fxId, enabled)
  }

  setFxParam(fxId: string, paramKey: string, value: number): void {
    const plugin = layerManager.getLayers()[0]?.fxStack.getPlugin(fxId)
    if (plugin && paramKey in plugin.params) {
      plugin.params[paramKey].value = value
    }
  }

  // --- レンダーループ ---

  start(): void {
    if (this.animationId !== null) return
    this.threeClock.start()
    this.clock.start()
    this.loop()
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    this.clock.stop()
  }

  private loop = (): void => {
    this.animationId = requestAnimationFrame(this.loop)
    const delta = this.threeClock.getDelta()
    this.update(delta)
  }

  private update(delta: number): void {
    const beat = this.clock.getBeat()

    if (this.activeTransitionId === 'beat-cut') {
      if (this.prevBeat > 0.8 && beat < 0.2) {
        const programState = programBus.getState()
        const previewState = previewBus.getState()
        if (programState && previewState) {
          programBus.load(previewState)
          previewBus.update(programState)
        }
      }
    }

    this.prevBeat = beat
    layerManager.update(delta, beat)
  }

  // --- リサイズ ---

  private onResize = (): void => {
    if (!this.container) return
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    layerManager.resize(w, h)
  }

  // --- クリーンアップ ---

  dispose(): void {
    this.stop()
    window.removeEventListener('resize', this.onResize)
    layerManager.dispose()
    this.container = null
  }

  getLayers(): Layer[] {
    return layerManager.getLayers()
  }
}

export const engine = new Engine()
