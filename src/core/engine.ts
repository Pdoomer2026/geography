import * as THREE from 'three'
import { registry } from './registry'
import { ParameterStore } from './parameterStore'
import { Clock } from './clock'
import { MAX_LAYERS } from './config'
import { registerGeometryPlugins } from '../plugins/geometry'
import { registerLightPlugins } from '../plugins/lights'
import { registerParticlePlugins } from '../plugins/particles'
import { createFxPlugins } from '../plugins/fx'
import { programBus } from './programBus'
import { previewBus } from './previewBus'
import { layerManager } from './layerManager'
import { macroKnobManager } from './macroKnob'
import type {
  CSSBlendMode,
  FXPlugin,
  GeometryPlugin,
  Layer,
  LayerRouting,
  MacroKnobConfig,
  MidiCCEvent,
  SceneState,
  ScreenAssign,
  ScreenAssignState,
  GeoGraphyProject,
} from '../types'
import { PROJECT_FILE_VERSION } from '../types'

// engine.ts は App.tsx に依存してはいけない・単体で動作できること

export class Engine {
  private animationId: number | null = null
  private container: HTMLElement | null = null
  private threeClock: THREE.Clock = new THREE.Clock()
  readonly clock: Clock = new Clock()
  private prevBeat: number = 0
  activeTransitionId: string = 'beat-cut'

  // Layer Routing / Screen Assign
  private layerRoutings: LayerRouting[] = [
    { layerId: 'layer-1', outputOpacity: 1, editOpacity: 1 },
    { layerId: 'layer-2', outputOpacity: 1, editOpacity: 1 },
    { layerId: 'layer-3', outputOpacity: 1, editOpacity: 1 },
  ]
  private screenAssign: ScreenAssignState = { large: 'output', small: 'edit' }

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
    await registerGeometryPlugins()
    await registerLightPlugins()
    await registerParticlePlugins()

    const allPlugins = registry.list().filter((p) => p.enabled)

    const layers = layerManager.getLayers()

    allPlugins.slice(0, layers.length).forEach((plugin, index) => {
      layerManager.setPlugin(`layer-${index + 1}`, plugin as GeometryPlugin)
    })

    // 未使用レイヤーは mute
    for (let i = allPlugins.length; i < layers.length; i++) {
      layerManager.setMute(`layer-${i + 1}`, true)
    }

    // starfield (layer-2) は加算合成で背景として透過表示
    if (allPlugins.length >= 2) {
      layerManager.setBlendMode('layer-2', 'add')
    }

    // FX は全レイヤーに適用（各レイヤーが独立した FX スタックを持つ）
    for (let i = 1; i <= MAX_LAYERS; i++) {
      layerManager.setupFx(`layer-${i}`, createFxPlugins())
    }

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

    // 初期ルーティングを canvas に反映する（起動時に黒くなるバグを防ぐ）
    for (const routing of this.layerRoutings) {
      const viewOpacity =
        this.screenAssign.large === 'output'
          ? routing.outputOpacity
          : routing.editOpacity
      layerManager.setOpacity(routing.layerId, viewOpacity)
      const layer = layerManager.getLayers().find((l) => l.id === routing.layerId)
      if (layer && layer.plugin !== null) {
        layerManager.setMute(routing.layerId, viewOpacity === 0)
      }
    }

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

  handleMidiCC(event: MidiCCEvent): void {
    macroKnobManager.handleMidiCC(event)
  }

  // --- FX コントロール API（layerId 対応）---

  getFxPlugins(layerId: string = 'layer-1'): FXPlugin[] {
    const layer = layerManager.getLayers().find((l) => l.id === layerId)
    return layer?.fxStack.getOrdered() ?? []
  }

  setFxEnabled(fxId: string, enabled: boolean, layerId: string = 'layer-1'): void {
    const layer = layerManager.getLayers().find((l) => l.id === layerId)
    layer?.fxStack.setEnabled(fxId, enabled)
  }

  setFxParam(fxId: string, paramKey: string, value: number, layerId: string = 'layer-1'): void {
    const layer = layerManager.getLayers().find((l) => l.id === layerId)
    const plugin = layer?.fxStack.getPlugin(fxId)
    if (plugin && paramKey in plugin.params) {
      plugin.params[paramKey].value = value
    }
  }

  /**
   * Setup APPLY 用：Plugin Lifecycle spec §6
   * enabledIds に含まれる FX だけ create()、それ以外は destroy() して composer を再構築。
   * 全レイヤーに対して適用する。
   */
  applyFxSetup(enabledIds: string[]): void {
    layerManager.applyFxSetup(enabledIds)
  }

  /**
   * Setup APPLY 用：選択された Geometry Plugin を各レイヤーに割り当てる。
   * spec: project-file.spec.md §5 Step 1
   *
   * - selectedIds[0] → layer-1、selectedIds[1] → layer-2、selectedIds[2] → layer-3
   * - selectedIds の長さを超えるレイヤーは plugin=null・mute=true
   * - selectedIds が空のとき全レイヤー mute
   */
  applyGeometrySetup(selectedIds: string[]): void {
    const layers = layerManager.getLayers()
    layers.forEach((layer, index) => {
      const pluginId = selectedIds[index] ?? null
      this.setLayerPlugin(layer.id, pluginId)
    })
  }

  // --- SceneState serialize / deserialize ---

  /**
   * 現在の描画状態を SceneState として取得する。
   * spec: project-file.spec.md §3
   */
  getSceneState(): SceneState {
    const layers = layerManager.getLayers()
    return {
      layers: layers
        .filter((layer) => !layer.mute && layer.plugin !== null)
        .map((layer) => {
          const plugin = layer.plugin!
          const fxPlugins = layer.fxStack.getOrdered()
          return {
            geometryId: plugin.id,
            geometryParams: Object.fromEntries(
              Object.entries(plugin.params).map(([k, v]) => [k, v.value])
            ),
            fxStack: fxPlugins.map((fx) => ({
              fxId: fx.id,
              params: Object.fromEntries(
                Object.entries(fx.params).map(([k, v]) => [k, v.value])
              ),
              enabled: fx.enabled,
            })),
            opacity: layer.opacity,
            blendMode: layer.blendMode,
          }
        }),
    }
  }

  /**
   * SceneState を Program バスに適用する。
   * spec: project-file.spec.md §5 Step 2
   */
  loadSceneState(state: SceneState): void {
    programBus.load(state)
    previewBus.update(state)
  }

  /**
   * 現在の状態から GeoGraphyProject オブジェクトを構築する。
   * spec: project-file.spec.md §3
   */
  buildProject(name: string): GeoGraphyProject {
    const layers = layerManager.getLayers()
    const selectedGeometryIds = layers
      .filter((l) => !l.mute && l.plugin !== null)
      .map((l) => l.plugin!.id)

    const enabledFxIds = this.getFxPlugins('layer-1')
      .filter((fx) => fx.enabled)
      .map((fx) => fx.id)

    return {
      version: PROJECT_FILE_VERSION,
      savedAt: new Date().toISOString(),
      name,
      setup: {
        geometry: selectedGeometryIds,
        fx: enabledFxIds,
      },
      sceneState: this.getSceneState(),
      presetRefs: {},
    }
  }

  /**
   * GeoGraphyProject を読み込んで状態を復元する。
   * spec: project-file.spec.md §5
   * - setup.geometry → applyGeometrySetup() でレイヤーを復元
   * - sceneState → loadSceneState() で Program バスに適用
   */
  restoreProject(project: GeoGraphyProject): void {
    this.applyGeometrySetup(project.setup.geometry)
    this.loadSceneState(project.sceneState)
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

  // --- Layer Routing / Screen Assign API ---

  getLayerRoutings(): LayerRouting[] {
    return this.layerRoutings
  }

  setLayerRouting(layerId: string, outputOpacity: number, editOpacity: number): void {
    const routing = this.layerRoutings.find((r) => r.layerId === layerId)
    if (!routing) return
    routing.outputOpacity = outputOpacity
    routing.editOpacity = editOpacity

    // Large screen のアサインに応じて canvas の opacity を反映する
    const viewOpacity =
      this.screenAssign.large === 'output' ? outputOpacity : editOpacity
    layerManager.setOpacity(layerId, viewOpacity)

    // opacity > 0 なら mute を解除・opacity = 0 なら mute にする
    // （mute=true のとき display:none になるため opacity だけでは映像が出ない）
    const shouldMute = viewOpacity === 0
    const layer = layerManager.getLayers().find((l) => l.id === layerId)
    if (layer && layer.plugin !== null) {
      layerManager.setMute(layerId, shouldMute)
    }
  }

  getScreenAssign(): ScreenAssignState {
    return this.screenAssign
  }

  swapScreenAssign(): void {
    const prev = this.screenAssign.large
    this.screenAssign.large = this.screenAssign.small as ScreenAssign
    this.screenAssign.small = prev as ScreenAssign

    // SWAP後に全レイヤーの canvas opacity と mute を新しいアサインに合わせて更新
    for (const routing of this.layerRoutings) {
      const viewOpacity =
        this.screenAssign.large === 'output'
          ? routing.outputOpacity
          : routing.editOpacity
      layerManager.setOpacity(routing.layerId, viewOpacity)
      const layer = layerManager.getLayers().find((l) => l.id === routing.layerId)
      if (layer && layer.plugin !== null) {
        layerManager.setMute(routing.layerId, viewOpacity === 0)
      }
    }
  }

  getLayers(): Layer[] {
    return layerManager.getLayers()
  }

  setLayerMute(layerId: string, mute: boolean): void {
    layerManager.setMute(layerId, mute)
  }

  setLayerOpacity(layerId: string, opacity: number): void {
    layerManager.setOpacity(layerId, opacity)
  }

  setLayerBlendMode(layerId: string, blendMode: CSSBlendMode): void {
    layerManager.setBlendMode(layerId, blendMode)
  }

  /** Registry に登録されている全 Plugin 一覧（プルダウン選択肢用） */
  getRegisteredPlugins(): { id: string; name: string }[] {
    return registry.list().map((p) => ({ id: p.id, name: p.name }))
  }

  // ── 録画 API ──────────────────────────────────────────────────────

  private mediaRecorder: MediaRecorder | null = null
  private recordingChunks: Blob[] = []
  isRecording: boolean = false

  /**
   * Program canvas から captureStream して MediaRecorder を開始する。
   * spec: 要件定義書 §27
   */
  startRecording(): void {
    if (this.isRecording) return

    // layer-1 の canvas（Program の主レイヤー）から stream を取得
    const layers = layerManager.getLayers()
    const programLayer = layers.find((l) => !l.mute) ?? layers[0]
    if (!programLayer) return

    const stream = (programLayer.canvas as HTMLCanvasElement).captureStream(60)
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm'

    this.recordingChunks = []
    this.mediaRecorder = new MediaRecorder(stream, { mimeType })

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.recordingChunks.push(e.data)
    }

    this.mediaRecorder.start(100) // 100ms ごとにチャンクを生成
    this.isRecording = true
  }

  /**
   * 録画を停止して WebM Blob を返す。
   * 呼び出し元が IPC 経由でファイル保存を行う。
   */
  stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve(null)
        return
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordingChunks, { type: 'video/webm' })
        this.recordingChunks = []
        this.isRecording = false
        resolve(blob)
      }

      this.mediaRecorder.stop()
    })
  }

  /**
   * orbit モードのレイヤーの自動周回を切り替える。
   * spec: camera-system.spec.md §9
   * true  → カメラが Geometry 周りを自動周回
   * false → OrbitControls による手動操作に切り替わる
   */
  setAutoRotate(layerId: string, autoRotate: boolean): void {
    layerManager.setAutoRotate(layerId, autoRotate)
  }

  /** レイヤーに Plugin をセット。pluginId が null なら None（plugin=null・mute=true） */
  setLayerPlugin(layerId: string, pluginId: string | null): void {
    if (pluginId === null) {
      layerManager.setPlugin(layerId, null)
      layerManager.setMute(layerId, true)
      return
    }
    const plugin = registry.get(pluginId)
    if (!plugin) return
    layerManager.setPlugin(layerId, plugin as GeometryPlugin)
    layerManager.setMute(layerId, false)
  }
}

export const engine = new Engine()
