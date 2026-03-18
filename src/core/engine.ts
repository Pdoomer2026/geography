import * as THREE from 'three'
import { registry } from './registry'
import { ParameterStore } from './parameterStore'
import { registerGeometryPlugins } from '../plugins/geometry'
import { registerLightPlugins } from '../plugins/lights'
import { registerParticlePlugins } from '../plugins/particles'

// engine.ts は App.tsx に依存してはいけない・単体で動作できること

export class Engine {
  private renderer: THREE.WebGLRenderer | null = null
  private scene: THREE.Scene | null = null
  private camera: THREE.PerspectiveCamera | null = null
  private animationId: number | null = null
  private container: HTMLElement | null = null
  private clock: THREE.Clock = new THREE.Clock()

  readonly parameterStore: ParameterStore

  constructor() {
    this.parameterStore = new ParameterStore()
  }

  // --- 初期化 ---

  async initialize(container: HTMLElement): Promise<void> {
    this.container = container

    // Three.js 基盤セットアップ
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    this.camera.position.z = 5

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    container.appendChild(this.renderer.domElement)

    // Plugin 自動登録（各 index.ts に実装済みの関数を利用）
    await registerGeometryPlugins()
    await registerLightPlugins()
    await registerParticlePlugins()

    // リサイズ対応
    window.addEventListener('resize', this.onResize)
  }

  // --- レンダーループ ---

  start(): void {
    if (this.animationId !== null) return
    this.clock.start()
    this.loop()
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private loop = (): void => {
    this.animationId = requestAnimationFrame(this.loop)
    const delta = this.clock.getDelta()
    this.update(delta)
    this.render()
  }

  private update(delta: number): void {
    // beat は将来 BPM クロックから取得（v1 では 0 固定）
    const beat = 0
    for (const plugin of registry.list()) {
      if (plugin.enabled && this.scene) {
        plugin.update?.(delta, beat)
      }
    }
  }

  private render(): void {
    if (!this.renderer || !this.scene || !this.camera) return
    this.renderer.render(this.scene, this.camera)
  }

  // --- リサイズ ---

  private onResize = (): void => {
    if (!this.container || !this.renderer || !this.camera) return
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }

  // --- クリーンアップ ---

  dispose(): void {
    this.stop()
    window.removeEventListener('resize', this.onResize)
    this.renderer?.dispose()
    this.renderer?.domElement.remove()
    this.renderer = null
    this.scene = null
    this.camera = null
    this.container = null
  }
}

// シングルトンインスタンス
export const engine = new Engine()
