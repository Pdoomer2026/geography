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
import { midiManager } from './midiManager'
import { ccMapService } from './ccMapService'
import { getCameraPlugin, listCameraPlugins } from '../plugins/cameras'
import type {
  CameraPlugin,
  CSSBlendMode,
  FXPlugin,
  GeometryPlugin,
  Layer,
  LayerRouting,
  MacroKnobConfig,
  TransportEvent,
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

  /** Plugin → Window 逆流コールバック（Day58 Step3）*/
  private paramChangedCallback: (() => void) | null = null

  constructor() {
    this.parameterStore = new ParameterStore()
  }

  /**
   * Plugin の params.value が変化したとき呼ばれるコールバックを登録する。
   * App.tsx が syncValues() を即時実行するために使う。
   * spec: docs/spec/transport-architecture.spec.md §5 Step3
   */
  onParamChanged(cb: () => void): void {
    this.paramChangedCallback = cb
  }

  // --- 初期化 ---

  async initialize(container: HTMLElement): Promise<void> {
    this.container = container
    layerManager.initialize(container)

    // MidiManager を初期化（Day50: macroKnobManager.init → midiManager.init に変更）
    midiManager.init(this.parameterStore, macroKnobManager)
    await ccMapService.init()

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

  // --- MacroKnob 公開 API（MacroKnobPanel 用・Day50 整備）---

  /** MacroKnob の設定一覧を返す（MacroKnobPanel 表示用） */
  getMacroKnobs(): MacroKnobConfig[] {
    return macroKnobManager.getKnobs()
  }

  /** MacroKnob の設定を更新する（MacroKnobPanel 編集用） */
  setMacroKnob(id: string, config: MacroKnobConfig): void {
    macroKnobManager.setKnob(id, config)
  }

  /** MacroKnob の現在値を返す（MacroKnobPanel 表示用・0.0〜1.0） */
  getMacroKnobValue(knobId: string): number {
    return macroKnobManager.getValue(knobId)
  }

  /** MacroKnob の表示用キャッシュを更新する（MacroKnobPanel UI ドラッグ用・Day52 新設） */
  setMacroKnobValue(knobId: string, value: number): void {
    macroKnobManager.setValue(knobId, value)
  }

  /** MacroKnob にアサインを追加する（D&D アサイン UI 用・Day52 新設） */
  addMacroAssign(knobId: string, assign: import('../types').MacroAssign): void {
    macroKnobManager.addAssign(knobId, assign)
  }

  /** MacroKnob からアサインを解除する（D&D アサイン UI 用・Day52 新設） */
  removeMacroAssign(knobId: string, paramId: string): void {
    macroKnobManager.removeAssign(knobId, paramId)
  }

  /** 指定 paramId にアサインされている全ノブを返す（右クリックメニュー用・Day52 新設） */
  getAssignsForParam(paramId: string): { knobId: string; assign: import('../types').MacroAssign }[] {
    return macroKnobManager.getKnobs().flatMap((k) =>
      k.assigns
        .filter((a) => a.paramId === paramId)
        .map((a) => ({ knobId: k.id, assign: a }))
    )
  }

  /**
   * CC入力の唯一の入り口（Day50 確定）。
   * 全UI（SimpleWindow / MacroKnobPanel）・物理MIDIコントローラーが呼ぶ。
   * MidiManager に委譲する。
   */
  handleMidiCC(event: TransportEvent): void {
    midiManager.handleMidiCC(event)
  }

  /**
   * Sequencer / LFO からの変調値受け取り（将来実装）。
   * MidiManager に委譲する。
   */
  receiveMidiModulation(knobId: string, value: number): void {
    midiManager.receiveModulation(knobId, value)
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

  applyFxSetup(enabledIds: string[]): void {
    layerManager.applyFxSetup(enabledIds)
  }

  applyGeometrySetup(selectedIds: string[]): void {
    const layers = layerManager.getLayers()
    layers.forEach((layer, index) => {
      const pluginId = selectedIds[index] ?? null
      this.setLayerPlugin(layer.id, pluginId)
    })
  }

  // --- SceneState serialize / deserialize ---

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

  loadSceneState(state: SceneState): void {
    programBus.load(state)
    previewBus.update(state)
  }

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
      macroKnobAssigns: macroKnobManager.getKnobs(),
      presetRefs: {},
    }
  }

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
    this.flushParameterStore()
    layerManager.update(delta, beat)
  }

  /**
   * ParameterStore の値を各レイヤーの plugin.params に反映する。（Day51 新設）
   *
   * フォールバック付き2段階解決:
   * 1. ccMapService に mapping あり（Electron 環境・cc-map.json 生成済み）
   *    → CC番号で store を引いて pluginMin/Max で逆変換
   * 2. ccMapService に mapping なし（ブラウザ確認時・cc-map.json 未生成）
   *    → getCcNumber() で CC番号だけ取得し param.min/max で逆変換
   *    （SimpleWindow が normalized = (v - min) / (max - min) で書いた値をそのまま戻す）
   */
  private flushParameterStore(): void {
    const allValues = this.parameterStore.getAll()
    if (allValues.size === 0) return

    const layers = layerManager.getLayers()
    let changed = false

    for (const layer of layers) {
      // --- Geometry Plugin ---
      const geo = layer.plugin
      if (geo) {
        for (const [paramKey, param] of Object.entries(geo.params)) {
          const effective = {
            min: param.rangeMin ?? param.min,
            max: param.rangeMax ?? param.max,
          }
          const actual = this.resolveParamValue(geo.id, paramKey, effective, allValues)
          if (actual === undefined || param.value === actual) continue
          param.value = actual
          changed = true
          if (param.requiresRebuild) {
            layerManager.rebuildPlugin(layer.id)
          }
        }
      }

      // --- Camera Plugin ---
      const cam = layerManager.getCameraPlugin(layer.id)
      if (cam) {
        for (const [paramKey, param] of Object.entries(cam.params)) {
          const effective = {
            min: param.rangeMin ?? param.min,
            max: param.rangeMax ?? param.max,
          }
          const actual = this.resolveParamValue(cam.id, paramKey, effective, allValues)
          if (actual === undefined || param.value === actual) continue
          param.value = actual
          changed = true
        }
      }

      // --- FX Stack ---
      for (const fx of layer.fxStack.getOrdered()) {
        for (const [paramKey, param] of Object.entries(fx.params)) {
          const effective = {
            min: param.rangeMin ?? param.min,
            max: param.rangeMax ?? param.max,
          }
          const actual = this.resolveParamValue(fx.id, paramKey, effective, allValues)
          if (actual === undefined || param.value === actual) continue
          param.value = actual
          changed = true
        }
      }
    }

    if (changed) {
      this.paramChangedCallback?.()
    }
  }

  /**
   * CC番号 → store 値 → 実際値 の解決。
   * ccMapService に mapping があれば pluginMin/Max で逆変換。
   * なければ getCcNumber() + param.min/max でフォールバック。
   */
  private resolveParamValue(
    pluginId: string,
    paramKey: string,
    param: { min: number; max: number },
    allValues: Map<string, number>
  ): number | undefined {
    const mapping = ccMapService.getMapping(pluginId, paramKey)
    if (mapping) {
      const storeValue = allValues.get(String(mapping.ccNumber))
      if (storeValue === undefined) return undefined
      return mapping.pluginMin + storeValue * (mapping.pluginMax - mapping.pluginMin)
    }
    // フォールバック: getCcNumber で CC 番号を出す
    const cc = ccMapService.getCcNumber(pluginId, paramKey)
    const storeValue = allValues.get(String(cc))
    if (storeValue === undefined) return undefined

    // store の値は 0.0〜1.0 の相対値。
    // MacroKnob アサインがあれば assign.min/max で変換。
    // なければ param（= effectiveMin/Max = rangeMin/rangeMax ?? min/max）で変換。
    // 全て同じ変換式: effectiveMin + storeValue * (effectiveMax - effectiveMin)
    const assign = macroKnobManager.getKnobs()
      .flatMap((k) => k.assigns)
      .find((a) => a.ccNumber === cc)
    if (assign) {
      return assign.min + storeValue * (assign.max - assign.min)
    }
    return param.min + storeValue * (param.max - param.min)
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

    const viewOpacity =
      this.screenAssign.large === 'output' ? outputOpacity : editOpacity
    layerManager.setOpacity(layerId, viewOpacity)

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

  getRegisteredPlugins(): { id: string; name: string }[] {
    return registry.list().map((p) => ({ id: p.id, name: p.name }))
  }

  // ── 録画 API ──────────────────────────────────────────────────────

  private mediaRecorder: MediaRecorder | null = null
  private recordingChunks: Blob[] = []
  isRecording: boolean = false

  startRecording(): void {
    if (this.isRecording) return

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

    this.mediaRecorder.start(100)
    this.isRecording = true
  }

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

  applyCameraSetup(cameraPluginIds: string[]): void {
    const layers = layerManager.getLayers()
    layers.forEach((layer, index) => {
      const pluginId = cameraPluginIds[index] ?? 'static-camera'
      const base = getCameraPlugin(pluginId)
      if (!base) return
      const plugin = { ...base, params: structuredClone(base.params) }
      layerManager.setCameraPlugin(layer.id, plugin, undefined, false)
    })
  }

  setCameraPlugin(layerId: string, pluginId: string): void {
    const base = getCameraPlugin(pluginId)
    if (!base) return
    const plugin = { ...base, params: structuredClone(base.params) }
    layerManager.setCameraPlugin(layerId, plugin, undefined, true)
  }

  getCameraPlugin(layerId: string): CameraPlugin | null {
    return layerManager.getCameraPlugin(layerId)
  }

  setCameraParam(layerId: string, paramKey: string, value: number): void {
    const plugin = layerManager.getCameraPlugin(layerId)
    if (plugin && paramKey in plugin.params) {
      plugin.params[paramKey].value = value
    }
  }

  listCameraPlugins(): CameraPlugin[] {
    return listCameraPlugins()
  }

  getGeometryPlugin(layerId: string): GeometryPlugin | null {
    const layer = layerManager.getLayers().find((l) => l.id === layerId)
    return layer?.plugin ?? null
  }

  /** 全レイヤーの { layerId, plugin } を返す（Registry 一括登録用・Day53 新設） */
  getAllLayerPlugins(): { layerId: string; plugin: GeometryPlugin }[] {
    return layerManager.getLayers()
      .filter((l) => l.plugin !== null)
      .map((l) => ({ layerId: l.id, plugin: l.plugin! }))
  }

  setGeometryParam(layerId: string, paramKey: string, value: number): void {
    const layer = layerManager.getLayers().find((l) => l.id === layerId)
    const plugin = layer?.plugin
    if (plugin && paramKey in plugin.params) {
      plugin.params[paramKey].value = value
      if (plugin.params[paramKey].requiresRebuild) {
        layerManager.rebuildPlugin(layerId)
      }
    }
  }

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
