import type { SceneState } from '../schema'

// PreviewBus は SceneState（JSON）のみ保持する。Three.js Scene は持たない。

const PREVIEW_WIDTH = 320
const PREVIEW_HEIGHT = 180

export class PreviewBus {
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private state: SceneState | null = null

  // --- マウント ---

  mount(container: HTMLElement): void {
    const canvas = document.createElement('canvas')
    canvas.width = PREVIEW_WIDTH
    canvas.height = PREVIEW_HEIGHT
    canvas.style.width = `${PREVIEW_WIDTH}px`
    canvas.style.height = `${PREVIEW_HEIGHT}px`
    canvas.style.display = 'block'

    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    container.appendChild(canvas)

    this.drawPlaceholder()
  }

  // --- SceneState 更新 ---

  /**
   * SceneState を受け取りサムネイルを再描画する。
   * v1 は 2D Canvas でプレースホルダー描画。
   * Phase 7 で offscreen Three.js Scene に切り替える。
   */
  update(state: SceneState): void {
    this.state = state
    this.drawThumbnail(state)
  }

  getState(): SceneState | null {
    return this.state
  }

  getCanvas(): HTMLCanvasElement | null {
    return this.canvas
  }

  // --- 描画（2D Canvas プレースホルダー） ---

  private drawPlaceholder(): void {
    if (!this.ctx) return
    const { ctx } = this
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT)
    ctx.fillStyle = '#4a4a6e'
    ctx.font = '13px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('PREVIEW', PREVIEW_WIDTH / 2, PREVIEW_HEIGHT / 2)
  }

  private drawThumbnail(state: SceneState): void {
    if (!this.ctx) return
    const { ctx } = this
    ctx.fillStyle = '#0f0f1e'
    ctx.fillRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT)

    const label = state.layers.length > 0
      ? state.layers[0].geometryId
      : 'empty'

    ctx.fillStyle = '#7878aa'
    ctx.font = '12px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(label, PREVIEW_WIDTH / 2, PREVIEW_HEIGHT / 2 - 8)

    ctx.fillStyle = '#4a4a7e'
    ctx.font = '10px monospace'
    ctx.fillText(`${state.layers.length} layer(s)`, PREVIEW_WIDTH / 2, PREVIEW_HEIGHT / 2 + 10)
  }

  // --- クリーンアップ ---

  dispose(): void {
    this.canvas?.remove()
    this.canvas = null
    this.ctx = null
    this.state = null
  }
}

export const previewBus = new PreviewBus()
