import * as THREE from 'three'
import { registry } from './registry'
import { ParameterStore } from './parameterStore'
import { Clock } from './clock'
import { registerGeometryPlugins } from '../plugins/geometry'
import { registerLightPlugins } from '../plugins/lights'
import { registerParticlePlugins } from '../plugins/particles'
import { programBus } from './programBus'
import { previewBus } from './previewBus'
import { layerManager } from './layerManager'
import type { Layer, SceneState } from '../types'

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

    // タスク 2: 初期 SceneState を生成して ProgramBus・PreviewBus に渡す
    const initialState: SceneState = {
      layers: registry.list()
        .filter((p) => p.enabled)
        .map((p) => ({
          geometryId: p.id,
          geometryParams: Object.fromEntries(
            Object.entries(p.params).map(([k, v]) => [k, v.value])
          ),
          fxStack: [],
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
    this.render()
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

  private render(): void {
    // LayerManager 側でレンダリング済み（互換性維持のため空実装）
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
