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
import type { FXPlugin, Layer, MacroKnobConfig, SceneState } from '../types'

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

    // MacroKnobManager に ParameterStore を注入
    macroKnobManager.init(this.parameterStore)

    // Plugin 自動登録（各 index.ts に実装済みの関数を利用）
    await registerGeometryPlugins()
    await registerLightPlugins()
    await registerParticlePlugins()

    // タスク 1: 登録済み Plugin の create() を scene に適用
    const enabledPlugins = registry.list().filter((plugin) => plugin.enabled)
    enabledPlugins.slice(0, layerManager.getLayers().length).forEach((plugin, index) => {
      layerManager.setPlugin(`layer-${index + 1}`, plugin)
    })

    // 未使用レイヤーは mute して描画を避ける
    for (let i = enabledPlugins.length; i < layerManager.getLayers().length; i++) {
      layerManager.setMute(`layer-${i + 1}`, true)
    }

    // タスク 2: mute でないレイヤーにのみ FX を構築（GPU 節約）
    for (const layer of layerManager.getLayers()) {
      if (layer.mute) continue
      layerManager.setupFx(layer.id, createFxPlugins())
    }

    // タスク 3: 初期 SceneState を生成して ProgramBus・PreviewBus に渡す
    // SceneState 用に代表 FX インスタンスを 1 セット生成（layer-1 の fxStack から取得）
    const layer1FxPlugins = layerManager.getLayers()[0]?.fxStack.getOrdered() ?? []
    const initialState: SceneState = {
      layers: registry.list()
        .filter((p) => p.enabled)
        .map((p) => ({
          geometryId: p.id,
          geometryParams: Object.fromEntries(
            Object.entries(p.params).map(([k, v]) => [k, v.value])
          ),
          fxStack: layer1FxPlugins.map((fx) => ({
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

    // リサイズ対応
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

  /**
   * MIDI CC を受け取り MacroKnobManager に転送する
   * 将来の MIDI Driver から呼ぶエントリーポイント
   */
  handleMidiCC(cc: number, value: number): void {
    macroKnobManager.handleMidiCC(cc, value)
  }

  // --- FX コントロール API ---

  /**
   * layer-1 の FX プラグイン一覧を FX_STACK_ORDER 順で返す。
   * FxControlPanel の表示用。
   */
  getFxPlugins(): FXPlugin[] {
    return layerManager.getLayers()[0]?.fxStack.getOrdered() ?? []
  }

  /**
   * layer-1 の指定 FX の enabled を切り替える。
   */
  setFxEnabled(fxId: string, enabled: boolean): void {
    layerManager.getLayers()[0]?.fxStack.setEnabled(fxId, enabled)
  }

  /**
   * layer-1 の指定 FX の指定パラメーター値を更新する。
   */
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

    // Beat Cut: beat が 0 を通過した瞬間（ラップアラウンド検出）に Program/Preview を swap
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

// シングルトンインスタンス
export const engine = new Engine()
