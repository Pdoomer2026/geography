import * as THREE from 'three'
import { registry } from './registry'
import { ParameterStore } from './parameterStore'
import { Clock } from './clock'
import { MAX_LAYERS } from './config'
import { registerGeometryPlugins } from '../engine/geometry'
import { registerLightPlugins } from '../engine/lights'
import { registerParticlePlugins } from '../engine/particles'
import { createFxPlugins } from '../engine/fx'
import { programBus } from './programBus'
import { previewBus } from './previewBus'
import { layerManager } from './layerManager'
import { assignRegistry } from './assignRegistry'
import { transportManager } from './transportManager'
import { transportRegistry } from './transportRegistry'
import { ccMapService } from './ccMapService'
import { getCameraPlugin, listCameraPlugins } from '../engine/cameras'
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
} from '../application/schema'
import { PROJECT_FILE_VERSION } from '../application/schema'

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
  /** FX enabled 変化コールバック（Day59 新設・Sequencer 対応前倒し）*/
  private fxChangedCallback: (() => void) | null = null

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

  /**
   * FX の enabled 状態が変化したとき呼ばれるコールバックを登録する。
   * FxWindowPlugin が購読するために使う。
   * 将来の Sequencer / LFO からの FX ON/OFF にも対応する。
   */
  onFxChanged(cb: () => void): void {
    this.fxChangedCallback = cb
  }

  // --- 初期化 ---

  async initialize(container: HTMLElement): Promise<void> {
    this.container = container
    layerManager.initialize(container)

    // TransportManager を初期化（Day58 Step4: midiManager → transportManager に昇格）
    transportManager.init(this.parameterStore, assignRegistry)
    // ccMapService は engine.initialize 内でのみ使用（App.tsx から完全に分離）
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
      layers: allPlugins.slice(0, 1).map((p) => {
        const cam = layerManager.getCameraPlugin('layer-1')
        return {
          geometryId: p.id,
          geometryParams: Object.fromEntries(
            Object.entries(p.params).map(([k, v]) => [k, v.value])
          ),
          cameraId: cam?.id ?? 'static-camera',
          cameraParams: cam
            ? Object.fromEntries(Object.entries(cam.params).map(([k, v]) => [k, v.value]))
            : {},
          fxStack: fxPlugins.map((fx) => ({
            fxId: fx.id,
            params: Object.fromEntries(
              Object.entries(fx.params).map(([k, v]) => [k, v.value])
            ),
            enabled: fx.enabled,
          })),
          opacity: 1,
          blendMode: 'normal',
        }
      }),
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

    // 起動時に Registry を一括登録（Day58 Step4: engine が ccMapService を使う唯一の場所）
    this.initTransportRegistry()
    // 初期化完了を FxWindowPlugin に通知（enabled の初期状態を反映）
    this.fxChangedCallback?.()
  }

  /**
   * Camera Plugin を TransportRegistry に登録する
   * setCameraPlugin() 時・initTransportRegistry() 時に呼ばれる
   */
  registerCameraToTransportRegistry(layerId: string): void {
    const cam = layerManager.getCameraPlugin(layerId)
    if (!cam) return
    const enriched = cam.getParameters().map((p) => ({
      ...p,
      layerId,
      pluginId: cam.id,
      ccNumber: ccMapService.getCcNumber(cam.id, p.id),
      value: cam.params[p.id]?.value ?? p.min,
    }))
    transportRegistry.register(enriched, `${layerId}:camera`)
  }

  /**
   * Plugin 切り替え時に展開先から呼ばれる Registry 登録 API
   * GeometrySimpleWindow の onPluginApply から履歴する。
   * ccMapService を使う唯一の公開 API。
   */
  registerPluginToTransportRegistry(layerId: string, _pluginId: string): void {
    const plugin = this.getGeometryPlugin(layerId)
    if (!plugin) return
    const enriched = plugin.getParameters().map((p) => ({
      ...p,
      layerId,
      pluginId: plugin.id,
      ccNumber: ccMapService.getCcNumber(plugin.id, p.id),
      value: plugin.params[p.id]?.value ?? p.min,
    }))
    transportRegistry.register(enriched, `${layerId}:geometry`)
  }

  /**
   * 起動時に全 Plugin を TransportRegistry に登録する。
   * ccMapService を使う唯一の場所。App.tsx は ccMapService を知らない。
   */
  private initTransportRegistry(): void {
    // Geometry: 'layer-N:geometry' をキーに登録
    this.getAllLayerPlugins().forEach(({ layerId, plugin }) => {
      const enriched = plugin.getParameters().map((p) => ({
        ...p,
        layerId,
        pluginId: plugin.id,
        ccNumber: ccMapService.getCcNumber(plugin.id, p.id),
        value: plugin.params[p.id]?.value ?? p.min,
      }))
      transportRegistry.register(enriched, `${layerId}:geometry`)
    })
    // Camera: 'layer-N:camera' をキーに登録
    const layerIds = ['layer-1', 'layer-2', 'layer-3'] as const
    layerIds.forEach((layerId) => {
      this.registerCameraToTransportRegistry(layerId)
    })
    // FX: 'layer-N:fx' をキーに登録（Geometry と共存できる）
    layerIds.forEach((layerId) => {
      const fxPlugins = layerManager.getLayers()
        .find((l) => l.id === layerId)?.fxStack.getOrdered() ?? []
      if (fxPlugins.length === 0) return
      const allFxParams = fxPlugins.flatMap((fx) =>
        Object.entries(fx.params).map(([paramId, param]) => ({
          id: paramId,
          name: param.label,
          min: param.min,
          max: param.max,
          step: (param.max - param.min) / 200,
          layerId,
          pluginId: fx.id,
          ccNumber: ccMapService.getCcNumber(fx.id, paramId),
          value: param.value,
        }))
      )
      transportRegistry.register(allFxParams, `${layerId}:fx`)
    })
  }

  // --- Transition 選択 ---

  setTransition(id: string): void {
    this.activeTransitionId = id
  }

  // --- AssignRegistry 公開 API ---

  // --- TransportRegistry ファサード API（Day62: SDK 境界確定）---

  /**
   * 登録済みパラメータ一覧を返す（Window が transportRegistry を直接触らないための窓口）
   * layerId を指定するとそのレイヤーのみにフィルタする。
   * value は Registry のスナップショット（syncValue で更新された値）。
   */
  getParameters(layerId?: string): import('../application/schema/midi-registry').RegisteredParameterWithCC[] {
    const all = transportRegistry.getAll()
    return layerId ? all.filter((p) => p.layerId === layerId) : all
  }

  /**
   * 登録済みパラメータを plugin.params の生値付きで返す（GeoMonitor 専用）
   * Registry は構造（CC番号・min・max・layerId）のみ提供。
   * value は毎回 plugin.params から直接読むため常に最新値を返す。
   * Window が plugin に直接アクセスせず、engine 経由で取得する。
   */
  getParametersLive(layerId?: string): import('../application/schema/midi-registry').RegisteredParameterWithCC[] {
    const all = transportRegistry.getAll()
    const filtered = layerId ? all.filter((p) => p.layerId === layerId) : all
    return filtered.map((entry) => {
      const liveValue = this._readLiveValue(entry)
      return liveValue !== undefined ? { ...entry, value: liveValue } : entry
    })
  }

  /**
   * entry に対応する plugin.params の現在値を読む（getParametersLive の内部ヘルパー）
   * Geometry / Camera / FX の順で探す。
   */
  private _readLiveValue(
    entry: import('../application/schema/midi-registry').RegisteredParameterWithCC
  ): number | undefined {
    const layer = layerManager.getLayers().find((l) => l.id === entry.layerId)
    if (!layer) return undefined
    // Geometry
    if (layer.plugin?.id === entry.pluginId) {
      return layer.plugin.params[entry.id]?.value
    }
    // Camera
    const cam = layerManager.getCameraPlugin(entry.layerId)
    if (cam?.id === entry.pluginId) {
      return cam.params[entry.id]?.value
    }
    // FX
    const fx = layer.fxStack.getPlugin(entry.pluginId)
    if (fx) return fx.params[entry.id]?.value
    return undefined
  }

  /**
   * Registry が変化したときのコールバックを登録する（Window 購読用ファサード）
   * transportRegistry.onChanged() のパススルー。unsubscribe 関数を返す。
   */
  onRegistryChanged(cb: () => void): () => void {
    return transportRegistry.onChanged(cb)
  }

  /**
   * Geometry Plugin の Registry エントリを削除する（Plugin Remove 時）
   * App.tsx が transportRegistry を直接触らないための窓口。
   */
  removePluginFromRegistry(layerId: string): void {
    transportRegistry.clear(`${layerId}:geometry`)
  }

  // --- AssignRegistry 公開 API ---

  /** アサイン設定一覧を返す（MacroWindow 表示用） */
  getMacroKnobs(): MacroKnobConfig[] {
    return assignRegistry.getKnobs()
  }

  /** アサイン設定を更新する（MacroWindow 編集用） */
  setMacroKnob(id: string, config: MacroKnobConfig): void {
    assignRegistry.setKnob(id, config)
  }

  /** 現在値を返す（MacroWindow 表示用・0.0〜1.0） */
  getMacroKnobValue(knobId: string): number {
    return assignRegistry.getValue(knobId)
  }

  /** 現在値キャッシュを更新する（MacroWindow UI ドラッグ用） */
  setMacroKnobValue(knobId: string, value: number): void {
    assignRegistry.setValue(knobId, value)
  }

  /** アサインを追加する（MacroWindow D&D 用） */
  addMacroAssign(knobId: string, assign: import('../application/schema').MacroAssign): void {
    assignRegistry.addAssign(knobId, assign)
  }

  /** アサインを解除する（MacroWindow D&D 用） */
  removeMacroAssign(knobId: string, paramId: string): void {
    assignRegistry.removeAssign(knobId, paramId)
  }

  /** 指定 paramId にアサインされている全ノブを返す（右クリックメニュー用・Day52 新設） */
  getAssignsForParam(paramId: string): { knobId: string; assign: import('../application/schema').MacroAssign }[] {
    return assignRegistry.getKnobs().flatMap((k) =>
      k.assigns
        .filter((a) => a.paramId === paramId)
        .map((a) => ({ knobId: k.id, assign: a }))
    )
  }

  /**
   * CC入力の唯一の入り口（Day50 確定）。
   * 全 Window・物理 MIDI コントローラーが呼ぶ。TransportManager に委譲する。
   */
  handleMidiCC(event: TransportEvent): void {
    transportManager.handle(event)
  }

  /**
   * Sequencer / LFO からの変調値受け取り（将来実装）。
   * TransportManager に委譲する。
   */
  receiveMidiModulation(knobId: string, value: number): void {
    transportManager.receiveModulation(knobId, value)
  }

  // --- FX コントロール API（layerId 対応）---

  getFxPlugins(layerId: string = 'layer-1'): FXPlugin[] {
    const layer = layerManager.getLayers().find((l) => l.id === layerId)
    return layer?.fxStack.getOrdered() ?? []
  }

  setFxEnabled(fxId: string, enabled: boolean, layerId: string = 'layer-1'): void {
    const layer = layerManager.getLayers().find((l) => l.id === layerId)
    layer?.fxStack.setEnabled(fxId, enabled)
    this.fxChangedCallback?.()
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

  applyFxSetupPerLayer(fxPerLayer: Record<string, string[]>): void {
    layerManager.applyFxSetupPerLayer(fxPerLayer)
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
          const cam = layerManager.getCameraPlugin(layer.id)
          return {
            geometryId: plugin.id,
            geometryParams: Object.fromEntries(
              Object.entries(plugin.params).map(([k, v]) => [k, v.value])
            ),
            cameraId: cam?.id ?? 'static-camera',
            cameraParams: cam
              ? Object.fromEntries(Object.entries(cam.params).map(([k, v]) => [k, v.value]))
              : {},
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
    // カメラ params を engine で直接復元（programBus は camera を知らない）
    state.layers.forEach((layerState, index) => {
      const layerId = `layer-${index + 1}`
      if (layerState.cameraId) {
        const base = getCameraPlugin(layerState.cameraId)
        if (base) {
          const plugin = { ...base, params: structuredClone(base.params) }
          // cameraParams で値を上書き
          for (const [key, val] of Object.entries(layerState.cameraParams ?? {})) {
            if (key in plugin.params) plugin.params[key].value = val
          }
          layerManager.setCameraPlugin(layerId, plugin, undefined, false)
          this.registerCameraToTransportRegistry(layerId)
        }
      }
    })
    programBus.load(state)
    previewBus.update(state)
  }

  buildProject(name: string): GeoGraphyProject {
    const layers = layerManager.getLayers()
    const selectedGeometryIds = layers
      .filter((l) => !l.mute && l.plugin !== null)
      .map((l) => l.plugin!.id)

    const cameraIds: [string, string, string] = [
      layerManager.getCameraPlugin('layer-1')?.id ?? 'static-camera',
      layerManager.getCameraPlugin('layer-2')?.id ?? 'static-camera',
      layerManager.getCameraPlugin('layer-3')?.id ?? 'static-camera',
    ]

    // FX: レイヤー別に enabled FX を保存
    const fxPerLayer: Record<string, string[]> = {}
    for (const layer of layers) {
      fxPerLayer[layer.id] = layer.fxStack.getOrdered()
        .filter((fx) => fx.enabled)
        .map((fx) => fx.id)
    }

    return {
      version: PROJECT_FILE_VERSION,
      savedAt: new Date().toISOString(),
      name,
      setup: {
        geometry: selectedGeometryIds,
        camera: cameraIds,
        fx: fxPerLayer,
      },
      sceneState: this.getSceneState(),
      assignRegistryState: assignRegistry.getKnobs(),
      presetRefs: {},
    }
  }

  restoreProject(project: GeoGraphyProject): void {
    // 1. Geometry 差し替え
    this.applyGeometrySetup(project.setup.geometry)

    // 2. Camera 差し替え
    if (project.setup.camera) {
      this.applyCameraSetup(project.setup.camera)
    }

    // 3. FX セットアップ（レイヤー別・旧形式互換性あり）
    if (project.setup.fx) {
      if (Array.isArray(project.setup.fx)) {
        // 旧形式（string[]）: 全レイヤーに同じ FX を適用
        this.applyFxSetup(project.setup.fx as unknown as string[])
      } else {
        // 新形式（Record<string, string[]>）: レイヤー別に適用
        this.applyFxSetupPerLayer(project.setup.fx)
      }
    }

    // 4. sceneState の完全反映
    this.applySceneState(project.sceneState)

    const restoreAssigns = project.assignRegistryState ?? (project as unknown as { macroKnobAssigns?: MacroKnobConfig[] }).macroKnobAssigns ?? []
    restoreAssigns.forEach((config) => assignRegistry.setKnob(config.id, config))

    // 5. programBus / previewBus を更新
    programBus.load(project.sceneState)
    previewBus.update(project.sceneState)
  }

  /**
   * SceneState を layerManager に完全反映する（Day60 新設）
   * Geometry params / Camera params / FX params+enabled / opacity / blendMode
   */
  private applySceneState(state: SceneState): void {
    state.layers.forEach((layerState, index) => {
      const layerId = `layer-${index + 1}`
      const layer = layerManager.getLayers().find((l) => l.id === layerId)
      if (!layer) return

      // Geometry params
      if (layer.plugin?.id === layerState.geometryId) {
        for (const [key, val] of Object.entries(layerState.geometryParams)) {
          if (key in layer.plugin.params) {
            layer.plugin.params[key].value = val
          }
        }
      }

      // Camera params
      if (layerState.cameraId) {
        const cam = layerManager.getCameraPlugin(layerId)
        if (cam?.id === layerState.cameraId) {
          for (const [key, val] of Object.entries(layerState.cameraParams ?? {})) {
            if (key in cam.params) cam.params[key].value = val
          }
          this.registerCameraToTransportRegistry(layerId)
        }
      }

      // FX params + enabled
      for (const fxState of layerState.fxStack) {
        const fx = layer.fxStack.getPlugin(fxState.fxId)
        if (!fx) continue
        fx.enabled = fxState.enabled
        for (const [key, val] of Object.entries(fxState.params)) {
          if (key in fx.params) fx.params[key].value = val
        }
      }

      // opacity / blendMode
      layerManager.setOpacity(layerId, layerState.opacity)
      layerManager.setBlendMode(layerId, layerState.blendMode as import('../application/schema').CSSBlendMode)
    })
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
   * ParameterStore の値を各 plugin.params に反映する（Day58 Step4 改訂）
   *
   * TransportRegistry から slot → param の対応を取得し、
   * ccMapService に依存せず純粋に値を流す。
   * engine は CC番号の意味を知らない。
   */
  private flushParameterStore(): void {
    const allValues = this.parameterStore.getAll()
    if (allValues.size === 0) return

    const entries = transportRegistry.getAll()
    if (entries.length === 0) return

    let changed = false

    for (const entry of entries) {
      // layerId:ccNumber をキーに読む（Day59: レイヤー衝突解消）
      const storeValue = allValues.get(`${entry.layerId}:${entry.ccNumber}`)
      if (storeValue === undefined) continue

      const actual = entry.min + storeValue * (entry.max - entry.min)

      const layer = layerManager.getLayers().find((l) => l.id === entry.layerId)
      if (!layer) continue

      // Geometry
      if (layer.plugin?.id === entry.pluginId) {
        const param = layer.plugin.params[entry.id]
        if (!param || Math.abs(param.value - actual) < 0.0001) continue
        param.value = actual
        changed = true
        if (param.requiresRebuild) layerManager.rebuildPlugin(entry.layerId)
        transportRegistry.syncValue(entry.pluginId, entry.id, actual)
        continue
      }

      // Camera
      const cam = layerManager.getCameraPlugin(entry.layerId)
      if (cam?.id === entry.pluginId) {
        const param = cam.params[entry.id]
        if (!param || Math.abs(param.value - actual) < 0.0001) continue
        param.value = actual
        changed = true
        transportRegistry.syncValue(entry.pluginId, entry.id, actual)
        continue
      }

      // FX
      const fx = layer.fxStack.getPlugin(entry.pluginId)
      if (fx) {
        const param = fx.params[entry.id]
        if (!param || Math.abs(param.value - actual) < 0.0001) continue
        param.value = actual
        changed = true
        transportRegistry.syncValue(entry.pluginId, entry.id, actual)
      }
    }

    if (changed) {
      this.paramChangedCallback?.()
    }
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
    // Registry を更新（ccMapService 依存は engine 内のみ）
    this.registerCameraToTransportRegistry(layerId)
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
      // Registry をクリア（Day60: Plugin 差し替えの唯一経路で Registry も更新）
      transportRegistry.clear(`${layerId}:geometry`)
      return
    }
    const plugin = registry.get(pluginId)
    if (!plugin) return
    layerManager.setPlugin(layerId, plugin as GeometryPlugin)
    layerManager.setMute(layerId, false)
    // Registry を更新（Day60: Plugin 差し替えの唯一経路で Registry も更新）
    this.registerPluginToTransportRegistry(layerId, plugin.id)
  }
}

export const engine = new Engine()
