/**
 * Output Manager
 * spec: docs/spec/output-manager.spec.md
 *
 * Three.js の canvas 映像を外部モニター / プロジェクターにリアルタイム送出する。
 *
 * 核心: canvas.captureStream() -> MediaStream -> popup <video>.srcObject
 *
 * 環境差分:
 *   Electron: window.geoAPI.getDisplays() / moveOutputWindow() でセカンダリモニターに自動配置
 *   React dev: window.open() のみ。手動でドラッグして外部モニターへ移動する
 */

import { engine } from './engine'

/** popup に書き込む HTML（about:blank 同一オリジン） */
const OUTPUT_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>GeoGraphy Output</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
</style>
</head>
<body>
<video id="output" autoplay playsinline muted></video>
<script>
  // 親ウィンドウから stream を受け取る
  window.__setStream = function(stream) {
    const video = document.getElementById('output');
    video.srcObject = stream;
    video.play().catch(function(e) { console.warn('[GeoGraphy Output] play failed:', e); });
  };
</script>
</body>
</html>`

class OutputManager {
  private popup: Window | null = null

  /**
   * Output ウィンドウを開いて映像を送出する。
   *
   * 処理フロー:
   * 1. engine.getOutputCanvas() で canvas 取得
   * 2. captureStream(60) で MediaStream 生成
   * 3. window.open() で popup 開く
   * 4. popup に HTML を書き込み <video> を配置
   * 5. popup.__setStream(stream) で映像を注入
   * 6. Electron 環境: geoAPI でセカンダリモニターに自動配置
   */
  async openOutput(): Promise<void> {
    // 既に開いている場合はフォーカスするだけ
    if (this.popup && !this.popup.closed) {
      this.popup.focus()
      return
    }

    const canvas = engine.getOutputCanvas()
    if (!canvas) {
      console.warn('[OutputManager] canvas が取得できませんでした。engine が初期化済みか確認してください。')
      return
    }

    // MediaStream を生成
    const stream = canvas.captureStream(60)

    // popup を開く（about:blank で同一オリジン扱いにして srcObject 代入を可能にする）
    const popup = window.open(
      'about:blank',
      'GeoGraphy Output',
      'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no'
    )

    if (!popup) {
      console.warn('[OutputManager] popup がブロックされました。ブラウザのポップアップ許可を確認してください。')
      return
    }

    this.popup = popup

    // HTML を書き込む
    popup.document.open()
    popup.document.write(OUTPUT_HTML)
    popup.document.close()

    // document が準備されるのを待ってから stream を注入
    await new Promise<void>((resolve) => {
      const check = () => {
        if (popup.document.readyState === 'complete') {
          resolve()
        } else {
          popup.document.addEventListener('DOMContentLoaded', () => resolve(), { once: true })
        }
      }
      check()
    })

    // stream を注入
    const win = popup as Window & { __setStream?: (s: MediaStream) => void }
    if (typeof win.__setStream === 'function') {
      win.__setStream(stream)
    }

    // popup が閉じられたときに内部状態をリセット
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        this.popup = null
        clearInterval(checkClosed)
      }
    }, 500)

    // Electron 環境: セカンダリディスプレイに自動配置
    if (window.geoAPI && 'getDisplays' in window.geoAPI) {
      await this._moveToSecondaryDisplay()
    }
  }

  /**
   * Output ウィンドウを閉じる。
   */
  closeOutput(): void {
    if (this.popup && !this.popup.closed) {
      this.popup.close()
    }
    this.popup = null
  }

  /**
   * Output ウィンドウが現在開いているか返す。
   */
  isOpen(): boolean {
    return this.popup !== null && !this.popup.closed
  }

  /**
   * Output ウィンドウをトグル（開閉）する。
   */
  async toggleOutput(): Promise<void> {
    if (this.isOpen()) {
      this.closeOutput()
    } else {
      await this.openOutput()
    }
  }

  /**
   * Electron 環境でセカンダリディスプレイに popup を移動する。
   * geoAPI.getDisplays() / moveOutputWindow() を使用。
   */
  private async _moveToSecondaryDisplay(): Promise<void> {
    const geoAPI = window.geoAPI as (typeof window.geoAPI & {
      getDisplays: () => Promise<Array<{
        id: number
        label: string
        bounds: { x: number; y: number; width: number; height: number }
        isPrimary: boolean
      }>>
      moveOutputWindow: (x: number, y: number, w: number, h: number) => Promise<void>
    }) | undefined

    if (!geoAPI?.getDisplays || !geoAPI?.moveOutputWindow) return

    try {
      const displays = await geoAPI.getDisplays()
      const secondary = displays.find((d) => !d.isPrimary)
      if (!secondary) {
        console.info('[OutputManager] セカンダリディスプレイが見つかりません。手動でドラッグしてください。')
        return
      }
      const { x, y, width, height } = secondary.bounds
      await geoAPI.moveOutputWindow(x, y, width, height)
    } catch (e) {
      console.warn('[OutputManager] セカンダリディスプレイへの移動に失敗しました:', e)
    }
  }
}

export const outputManager = new OutputManager()
