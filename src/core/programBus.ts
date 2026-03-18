import * as THREE from 'three'
import type { SceneState } from '../types'

// engine.ts に依存しない・単体で動作できること

export class ProgramBus {
  private renderer: THREE.WebGLRenderer | null = null
  private scene: THREE.Scene | null = null
  private camera: THREE.PerspectiveCamera | null = null
  private animationId: number | null = null
  private container: HTMLElement | null = null
  private clock: THREE.Clock = new THREE.Clock()

  /** 現在適用されている SceneState（JSON のメモ） */
  private currentState: SceneState | null = null

  // --- マウント ---

  mount(container: HTMLElement): void {
    this.container = container

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

    window.addEventListener('resize', this.onResize)
  }

  // --- SceneState 適用 ---

  /**
   * SceneState を Program バスに適用する。
   * v1 では JSON のメモとして保持するのみ。
   * Phase 7 で Plugin ごとの実際の描画切り替えを実装する。
   */
  load(state: SceneState): void {
    this.currentState = state
    // TODO: Phase 7 — Plugin を state.layers に基づいて生成・配置する
  }

  getState(): SceneState | null {
    return this.currentState
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
    this.clock.getDelta() // delta は Phase 7 で Plugin に渡す
    this.render()
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
    this.currentState = null
  }
}

export const programBus = new ProgramBus()
