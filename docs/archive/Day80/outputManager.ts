/**
 * Output Manager
 * spec: docs/spec/output-manager.spec.md
 *
 * Three.js の canvas 映像を外部モニター / プロジェクターにリアルタイム送出する。
 *
 * 案B（ブラウザ開発用）:
 *   L1〜L3 の canvas それぞれから captureStream() → popup で <video> × 3 を
 *   CSS mixBlendMode で重ねて表示。App と同じ合成方式をブラウザ側で再現する。
 *
 * 案C（Electron 本番用・未実装）:
 *   BrowserWindow で layerManager の canvas を直接レンダリング。遅延なし。
 *   TODO: Electron 実装時に window.geoAPI 判定で分岐する。
 *
 * 環境差分:
 *   Electron: window.geoAPI.getDisplays() / moveOutputWindow() でセカンダリモニターに自動配置
 *   React dev: window.open() のみ。手動でドラッグして外部モニターへ移動する
 */

import { layerManager } from './layerManager'

/** popup への style 同期メッセージ型 */
interface LayerStyleState {
  id: string
  blendMode: string
  opacity: number
  mute: boolean
}

/** CSS blendMode → video の mix-blend-mode スタイル値（そのまま使用可） */
const buildOutputHTML = (layers: { id: string; blendMode: string; opacity: number; mute: boolean }[]) => {
  const videoTags = layers.map(({ id, blendMode, opacity, mute }) => `
    <video
      id="${id}"
      autoplay
      playsinline
      muted
      style="
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        object-fit: contain;
        mix-blend-mode: ${blendMode};
        opacity: ${opacity};
        display: ${mute ? 'none' : 'block'};
        pointer-events: none;
      "
    ></video>`
  ).join('\n')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>GeoGraphy Output</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
  #stage {
    position: relative;
    width: 100%;
    height: 100%;
    background: #000;
  }
</style>
</head>
<body>
<div id="stage">
${videoTags}
</div>
<script>
  // 親ウィンドウから streams を受け取る
  // streams: Array<{ id: string, stream: MediaStream }>
  window.__setStreams = function(streams) {
    streams.forEach(function({ id, stream }) {
      const video = document.getElementById(id);
      if (!video) return;
      video.srcObject = stream;
      video.play().catch(function(e) {
        console.warn('[GeoGraphy Output] play failed for ' + id + ':', e);
      });
    });
  };

  // App から postMessage でスタイル変化を受け取り video に反映
  window.addEventListener('message', function(e) {
    if (!e.data || e.data.type !== 'STYLE_UPDATE') return;
    e.data.styles.forEach(function(layer) {
      const video = document.getElementById(layer.id);
      if (!video) return;
      video.style.opacity = layer.opacity;
      video.style.mixBlendMode = layer.blendMode;
      video.style.display = layer.mute ? 'none' : 'block';
    });
  });
</script>
</body>
</html>`
}

class OutputManager {
  private popup: Window | null = null
  private unsubStyleChanged: (() => void) | null = null

  /**
   * Output ウィンドウを開いて映像を送出する。（案B: ブラウザ開発用）
   *
   * 処理フロー:
   * 1. layerManager.getLayers() で L1〜L3 の canvas を取得
   * 2. 各 canvas から captureStream(60) で MediaStream を生成
   * 3. window.open() で popup を開く
   * 4. popup に <video> × レイヤー数 を CSS blend で重ねた HTML を書き込む
   * 5. popup.__setStreams(streams) で映像を注入
   * 6. Electron 環境: geoAPI でセカンダリモニターに自動配置
   */
  async openOutput(): Promise<void> {
    // 既に開いている場合はフォーカスするだけ
    if (this.popup && !this.popup.closed) {
      this.popup.focus()
      return
    }

    const layers = layerManager.getLayers()
    if (layers.length === 0) {
      console.warn('[OutputManager] レイヤーが存在しません。engine が初期化済みか確認してください。')
      return
    }

    // 各レイヤーの canvas から MediaStream を生成
    const streams = layers.map((layer) => ({
      id: layer.id,
      stream: layer.canvas.captureStream(60),
    }))

    // popup 用の HTML を現在のレイヤー状態で生成
    const layerInfo = layers.map((l) => ({
      id: l.id,
      blendMode: l.blendMode,
      opacity: l.opacity,
      mute: l.mute,
    }))
    const html = buildOutputHTML(layerInfo)

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
    popup.document.write(html)
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

    // streams を注入
    const win = popup as Window & {
      __setStreams?: (s: { id: string; stream: MediaStream }[]) => void
    }
    if (typeof win.__setStreams === 'function') {
      win.__setStreams(streams)
    }

    // popup が閉じられたときに内部状態をリセット
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        this.popup = null
        this.unsubStyleChanged?.()
        this.unsubStyleChanged = null
        clearInterval(checkClosed)
      }
    }, 500)

    // layerManager のスタイル変化を postMessage で popup に同期
    this.unsubStyleChanged = layerManager.onStyleChanged(() => {
      if (!this.popup || this.popup.closed) return
      const styles: LayerStyleState[] = layerManager.getLayers().map((l) => ({
        id: l.id,
        blendMode: l.blendMode,
        opacity: l.opacity,
        mute: l.mute,
      }))
      this.popup.postMessage({ type: 'STYLE_UPDATE', styles }, '*')
    })

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
    this.unsubStyleChanged?.()
    this.unsubStyleChanged = null
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
