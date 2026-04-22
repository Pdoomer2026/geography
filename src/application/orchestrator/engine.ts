import * as Tone from 'tone'
import * as THREE from 'three'
import { registry } from '../registry/registry'
import { ParameterStore } from '../registry/state/parameterStore'
import { Clock } from './tempo/clock'
import { MAX_LAYERS } from '../schema/config'
import { registerGeometryPlugins } from '../../engine/geometry'
import { registerLightPlugins } from '../../engine/lights'
import { registerParticlePlugins } from '../../engine/particles'
import { createFxPlugins } from '../../engine/fx'
import { midiLearnService } from '../registry/midiLearnService'
import { programBus } from './programBus'
import { previewBus } from './previewBus'
import { layerManager } from './layerManager'
import { assignRegistry } from '../registry/assignRegistry'
import { transportManager } from '../registry/transportManager'
import { transportRegistry } from '../registry/transportRegistry'
import { ccMapService } from '../catalog/ccMapService'
import { toGeoParamAddress } from '../schema/geoParamAddress'
import { getCameraPlugin, listCameraPlugins } from '../../engine/cameras'
import type {
  CameraPlugin,
  CSSBlendMode,
  FXPlugin,
  GeometryPlugin,
  Layer,
  LayerRouting,
  MacroKnobConfig,
  MidiLearnTarget,
  TransportEvent,
  SceneState,
  ScreenAssign,
  ScreenAssignState,
  GeoGraphyProject,
} from '../schema'
import { PROJECT_FILE_VERSION } from '../schema'

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

  /** Plugin → Window 逆流コールバック（複数購読対応・Day71）*/
  private paramChangedListeners: Set<() => void> = new Set()
  /** FX enabled 変化コールバック（Day59 新設・Sequencer 対応前倒し）*/
  private fxChangedCallback: (() => void) | null = null

  constructor() {
    this.parameterStore = new ParameterStore()
  }

  onParamChanged(cb: () => void): () => void {
    this.paramChangedListeners.add(cb)
    return () => this.paramChangedListeners.delete(cb)
  }

  onFxChanged(cb: () => void): void {
    this.fxChangedCallback = cb
  }

  // --- 初期化 ---

  async initialize(container: HTMLElement): Promise<void> {
    this.container = container
    layerManager.initialize(container)

    transportManager.init(this.parameterStore, assignRegistry)
    await ccMapService.init()

    await registerGeometryPlugins()
    await registerLightPlugins()
    await registerParticlePlugins()

    const allPlugins = registry.list().filter((p) => p.enabled)

    const layers = layerManager.getLayers()

    allPlugins.slice(0, layers.length).forEach((plugin, index) => {
      layerManager.setPlugin(`layer-${index + 1}`, plugin as GeometryPlugin)
    })

    for (let i = allPlugins.length; i < layers.length; i++) {
      layerManager.setMute(`layer-${i + 1}`, true)
    }

    if (allPlugins.length >= 2) {
      layerManager.setBlendMode('layer-2', 'add')
    }

    for (let i = 1; i <= MAX_LAYERS; i++) {
      layerManager.setupFx(`layer-${i}`, createFxPlugins())
    }

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

    this.initTransportRegistry()
    this.fxChangedCallback?.()
  }

  registerCameraToTransportRegistry(layerId: string): void {
    const cam = layerManager.getCameraPlugin(layerId)
    if (!cam) return
    const enriched = cam.getParameters().map((p) => ({
      ...p,
      layerId,
      pluginId: cam.id,
      ccNumber: ccMapService.getCcNumber(cam.id, p.id),
      geoParamAddress: toGeoParamAddress(layerId, cam.id, p.id),
      value: cam.params[p.id]?.value ?? p.min,
    }))
    transportRegistry.register(enriched, `${layerId}:camera`)
  }

  registerPluginToTransportRegistry(layerId: string, _pluginId: string): void {
    const plugin = this.getGeometryPlugin(layerId)
    if (!plugin) return
    const enriched = plugin.getParameters().map((p) => ({
      ...p,
      layerId,
      pluginId: plugin.id,
      ccNumber: ccMapService.getCcNumber(plugin.id, p.id),
      geoParamAddress: toGeoParamAddress(layerId, plugin.id, p.id),
      value: plugin.params[p.id]?.value ?? p.min,
    }))
    transportRegistry.register(enriched, `${layerId}:geometry`)
  }

  private initTransportRegistry(): void {
    this.getAllLayerPlugins().forEach(({ layerId, plugin }) => {
      const enriched = plugin.getParameters().map((p) => ({
        ...p,
        layerId,
        pluginId: plugin.id,
        ccNumber: ccMapService.getCcNumber(plugin.id, p.id),
        geoParamAddress: toGeoParamAddress(layerId, plugin.id, p.id),
        value: plugin.params[p.id]?.value ?? p.min,
      }))
      transportRegistry.register(enriched, `${layerId}:geometry`)
    })
    const layerIds = ['layer-1', 'layer-2', 'layer-3'] as const
    layerIds.forEach((layerId) => {
      this.registerCameraToTransportRegistry(layerId)
    })
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
          geoParamAddress: toGeoParamAddress(layerId, fx.id, paramId),
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

  // --- TransportRegistry ファサード API ---

  getParameters(layerId?: string): import('../schema/midi-registry').RegisteredParameterWithCC[] {
    const all = transportRegistry.getAll()
    return layerId ? all.filter((p) => p.layerId === layerId) : all
  }

  getParametersLive(layerId?: string): import('../schema/midi-registry').RegisteredParameterWithCC[] {
    const all = transportRegistry.getAll()
    const filtered = layerId ? all.filter((p) => p.layerId === layerId) : all
    return filtered.map((entry) => {
      const liveValue = this._readLiveValue(entry)
      return liveValue !== undefined ? { ...entry, value: liveValue } : entry
    })
  }

  private _readLiveValue(
    entry: import('../schema/midi-registry').RegisteredParameterWithCC
  ): number | undefined {
    const layer = layerManager.getLayers().find((l) => l.id === entry.layerId)
    if (!layer) return undefined
    if (layer.plugin?.id === entry.pluginId) {
      return layer.plugin.params[entry.id]?.value
    }
    const cam = layerManager.getCameraPlugin(entry.layerId)
    if (cam?.id === entry.pluginId) {
      return cam.params[entry.id]?.value
    }
    const fx = layer.fxStack.getPlugin(entry.pluginId)
    if (fx) return fx.params[entry.id]?.value
    return undefined
  }

  onRegistryChanged(cb: () => void): () => void {
    return transportRegistry.onChanged(cb)
  }

  removePluginFromRegistry(layerId: string): void {
    transportRegistry.clear(`${layerId}:geometry`)
  }

  // --- AssignRegistry 公開 API ---

  getMacroKnobs(): MacroKnobConfig[] {
    return assignRegistry.getKnobs()
  }

  setMacroKnob(id: string, config: MacroKnobConfig): void {
    assignRegistry.setKnob(id, config)
  }

  getMacroKnobValue(knobId: string): number {
    return assignRegistry.getValue(knobId)
  }

  setMacroKnobValue(knobId: string, value: number): void {
    assignRegistry.setValue(knobId, value)
  }

  addMacroAssign(knobId: string, assign: import('../schema').MacroAssign): void {
    assignRegistry.addAssign(knobId, assign)
  }

  removeMacroAssign(knobId: string, paramId: string): void {
    assignRegistry.removeAssign(knobId, paramId)
  }

  getAssignsForParam(geoParamAddress: string): { knobId: string; assign: import('../schema').MacroAssign }[] {
    return assignRegistry.getKnobs().flatMap((k) =>
      k.assigns
        .filter((a) => a.geoParamAddress === geoParamAddress)
        .map((a) => ({ knobId: k.id, assign: a }))
    )
  }

  // --- MIDI Learn API ---

  startMidiLearn(target: MidiLearnTarget): void {
    midiLearnService.startLearn(target)
  }

  stopMidiLearn(): void {
    midiLearnService.stopLearn()
  }

  getMidiLearnTarget(): MidiLearnTarget | null {
    return midiLearnService.getLearnTarget()
  }

  getLearnedCC(controlId: string): number {
    return midiLearnService.getAssignedCC(controlId)
  }

  clearLearnedCC(controlId: string): void {
    midiLearnService.clearAssign(controlId)
  }

  handleMidiCC(event: TransportEvent): void {
    // MIDI Learn モード中且つ source==='midi' のみ CC を記録して終了
    const learnTarget = midiLearnService.getLearnTarget()
    if (learnTarget && event.source === 'midi') {
      midiLearnService.assign(learnTarget.id, event.slot)
      midiLearnService.stopLearn()
      return
    }

    // Learn 済みコントロールへのルーティング
    const learned = midiLearnService.resolve(event.slot)
    if (learned) {
      this.dispatchToLearned(learned, event.value)
    }

    // 通常の TransportManager 処理
    transportManager.handle(event)
  }

  /** MIDI Learn 済みコントロールへの値を流す */
  private dispatchToLearned(target: MidiLearnTarget, value: number): void {
    switch (target.type) {
      case 'macro':
        assignRegistry.setValue(target.id, value)
        transportManager.receiveModulation(target.id, value)
        break
      case 'layer-opacity': {
        // controlId: 'opacity-L1' / 'opacity-L2' / 'opacity-L3'
        const match = target.id.match(/^opacity-L(\d+)$/)
        if (!match) break
        const layerIndex = parseInt(match[1], 10) - 1
        const layerId = `layer-${layerIndex + 1}`
        const routing = this.layerRoutings.find((r) => r.layerId === layerId)
        if (!routing) break
        this.setLayerRouting(layerId, value, routing.editOpacity)
        break
      }
      case 'geometry-param':
      case 'camera-param':
      case 'fx-param':
      case 'sequencer-param':
        // 将来実装
        break
    }
  }

  receiveMidiModulation(knobId: string, value: number): void {
    transportManager.receiveModulation(knobId, value)
  }

  // --- FX コントロール API ---

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
    state.layers.forEach((layerState, index) => {
      const layerId = `layer-${index + 1}`
      if (layerState.cameraId) {
        const base = getCameraPlugin(layerState.cameraId)
        if (base) {
          const plugin = { ...base, params: structuredClone(base.params) }
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
    this.applyGeometrySetup(project.setup.geometry)

    if (project.setup.camera) {
      this.applyCameraSetup(project.setup.camera)
    }

    if (project.setup.fx) {
      if (Array.isArray(project.setup.fx)) {
        this.applyFxSetup(project.setup.fx as unknown as string[])
      } else {
        this.applyFxSetupPerLayer(project.setup.fx)
      }
    }

    this.applySceneState(project.sceneState)

    const restoreAssigns = project.assignRegistryState ?? (project as unknown as { macroKnobAssigns?: MacroKnobConfig[] }).macroKnobAssigns ?? []
    restoreAssigns.forEach((config) => assignRegistry.setKnob(config.id, config))

    programBus.load(project.sceneState)
    previewBus.update(project.sceneState)
  }

  private applySceneState(state: SceneState): void {
    state.layers.forEach((layerState, index) => {
      const layerId = `layer-${index + 1}`
      const layer = layerManager.getLayers().find((l) => l.id === layerId)
      if (!layer) return

      if (layer.plugin?.id === layerState.geometryId) {
        for (const [key, val] of Object.entries(layerState.geometryParams)) {
          if (key in layer.plugin.params) {
            layer.plugin.params[key].value = val
          }
        }
      }

      if (layerState.cameraId) {
        const cam = layerManager.getCameraPlugin(layerId)
        if (cam?.id === layerState.cameraId) {
          for (const [key, val] of Object.entries(layerState.cameraParams ?? {})) {
            if (key in cam.params) cam.params[key].value = val
          }
          this.registerCameraToTransportRegistry(layerId)
        }
      }

      for (const fxState of layerState.fxStack) {
        const fx = layer.fxStack.getPlugin(fxState.fxId)
        if (!fx) continue
        fx.enabled = fxState.enabled
        for (const [key, val] of Object.entries(fxState.params)) {
          if (key in fx.params) fx.params[key].value = val
        }
      }

      layerManager.setOpacity(layerId, layerState.opacity)
      layerManager.setBlendMode(layerId, layerState.blendMode as import('../schema').CSSBlendMode)
    })
  }

  // --- レンダーループ ---

  start(): void {
    if (this.animationId !== null) return
    this.threeClock.start()
    // Tone.js は AudioContext がユーザージェスチャー後に resume される必要がある
    Tone.start().then(() => { this.clock.start() }).catch(() => { this.clock.start() })
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

  private flushParameterStore(): void {
    const allValues = this.parameterStore.getAll()
    if (allValues.size === 0) return

    const entries = transportRegistry.getAll()
    if (entries.length === 0) return

    let changed = false

    for (const entry of entries) {
      const storeValue = allValues.get(entry.geoParamAddress)
      if (storeValue === undefined) continue

      const actual = entry.min + storeValue * (entry.max - entry.min)

      const layer = layerManager.getLayers().find((l) => l.id === entry.layerId)
      if (!layer) continue

      if (layer.plugin?.id === entry.pluginId) {
        const param = layer.plugin.params[entry.id]
        if (!param || Math.abs(param.value - actual) < 0.0001) continue
        param.value = actual
        changed = true
        if (param.requiresRebuild) layerManager.rebuildPlugin(entry.layerId)
        transportRegistry.syncValue(entry.pluginId, entry.id, actual)
        continue
      }

      const cam = layerManager.getCameraPlugin(entry.layerId)
      if (cam?.id === entry.pluginId) {
        const param = cam.params[entry.id]
        if (!param || Math.abs(param.value - actual) < 0.0001) continue
        param.value = actual
        changed = true
        transportRegistry.syncValue(entry.pluginId, entry.id, actual)
        continue
      }

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
      for (const cb of [...this.paramChangedListeners]) cb()
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
    // 切り替え前に古い GeoParamAddress を ParameterStore から削除
    const oldPlugin = this.getGeometryPlugin(layerId)
    if (oldPlugin) {
      for (const paramId of Object.keys(oldPlugin.params)) {
        this.parameterStore.delete(toGeoParamAddress(layerId, oldPlugin.id, paramId))
      }
    }

    if (pluginId === null) {
      layerManager.setPlugin(layerId, null)
      layerManager.setMute(layerId, true)
      transportRegistry.clear(`${layerId}:geometry`)
      return
    }
    const plugin = registry.get(pluginId)
    if (!plugin) return
    layerManager.setPlugin(layerId, plugin as GeometryPlugin)
    layerManager.setMute(layerId, false)
    this.registerPluginToTransportRegistry(layerId, plugin.id)
  }
}

export const engine = new Engine()
