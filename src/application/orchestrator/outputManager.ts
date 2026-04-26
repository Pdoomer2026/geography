/**
 * Output Manager
 * spec: docs/spec/output-manager.spec.md
 *
 * Three.js の canvas 映像を外部モニター / プロジェクターにリアルタイム送出する。
 *
 * 案B（ブラウザ開発用）:
 *   L1〜L3 の canvas それぞれから captureStream() → window.open() popup で
 *   <video> × 3 を CSS mixBlendMode で重ねて表示。
 *   popup はブラウザのウィンドウ chrome あり。手動でドラッグして外部モニターへ移動する。
 *
 * 案C（Electron VJ 本番用）:
 *   window.geoAPI 検出時に使用。window.open() を呼ぶが、main.js の
 *   setWindowOpenHandler が BrowserWindow を frame:false で作成するため
 *   ウィンドウ chrome が最初から存在しない。
 *   geoAPI.moveOutputWindow() でセカンダリディスプレイに自動配置し、
 *   setFullScreen(true) で完全なフルスクリーン出力を実現する。
 *
 * レンダリングパイプライン（案B / 案C 共通）:
 *   captureStream(60) x L1〜L3 → <video> × 3 + CSS mixBlendMode
 *   layerManager.onStyleChanged → postMessage で opacity / blendMode / mute をリアルタイム同期
 *   setAspectMode() → postMessage で object-fit をリアルタイム同期
 */

import { layerManager } from './layerManager'

/** contain: 黒帯あり・映像全体表示 / cover: 黒帯なし・はみ出しクリップ */
export type AspectMode = 'contain' | 'cover'

/** popup へのスタイル同期メッセージ型 */
interface LayerStyleState {
  id: string
  blendMode: string
  opacity: number
  mute: boolean
}

/** 各レイヤーの現在状態から Output Window 用 HTML を生成する */
const buildOutputHTML = (
  layers: { id: string; blendMode: string; opacity: number; mute: boolean }[],
  aspectMode: AspectMode,
) => {
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
        object-fit: ${aspectMode};
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
  // 親ウィンドウから MediaStream を受け取り <video> に注入する
  window.__setStreams = function(streams) {
    streams.forEach(function({ id, stream }) {
      var video = document.getElementById(id);
      if (!video) return;
      video.srcObject = stream;
      video.play().catch(function(e) {
        console.warn('[GeoGraphy Output] play failed for ' + id + ':', e);
      });
    });
  };

  // App から postMessage でスタイル変化を受け取り <video> に反映する
  window.addEventListener('message', function(e) {
    if (!e.data) return;

    // レイヤーごとの opacity / blendMode / mute 同期
    if (e.data.type === 'STYLE_UPDATE') {
      e.data.styles.forEach(function(layer) {
        var video = document.getElementById(layer.id);
        if (!video) return;
        video.style.opacity = layer.opacity;
        video.style.mixBlendMode = layer.blendMode;
        video.style.display = layer.mute ? 'none' : 'block';
      });
    }

    // aspect ratio 同期: 全 <video> の object-fit を一括更新
    if (e.data.type === 'ASPECT_UPDATE') {
      var videos = document.querySelectorAll('video');
      videos.forEach(function(video) {
        video.style.objectFit = e.data.aspectMode;
      });
    }
  });
</script>
</body>
</html>`
}

class OutputManager {
  private popup: Window | null = null
  private unsubStyleChanged: (() => void) | null = null
  private aspectMode: AspectMode = 'contain'

  // ── 公開 API ──────────────────────────────────────────────────────

  /**
   * Output ウィンドウを開く。
   * window.geoAPI が存在する場合は案C（Electron VJ 本番用）、
   * 存在しない場合は案B（ブラウザ開発用）にディスパッチする。
   */
  async openOutput(): Promise<void> {
    if (this.popup && !this.popup.closed) {
      this.popup.focus()
      return
    }

    if (window.geoAPI) {
      await this._openOutputElectron()
    } else {
      await this._openOutputBrowser()
    }
  }

  /** Output ウィンドウを閉じる */
  closeOutput(): void {
    if (this.popup && !this.popup.closed) {
      this.popup.close()
    }
    this.popup = null
    this.unsubStyleChanged?.()
    this.unsubStyleChanged = null
  }

  /** Output ウィンドウが現在開いているか返す */
  isOpen(): boolean {
    return this.popup !== null && !this.popup.closed
  }

  /** Output ウィンドウをトグル（開閉）する */
  async toggleOutput(): Promise<void> {
    if (this.isOpen()) {
      this.closeOutput()
    } else {
      await this.openOutput()
    }
  }

  /** 現在の AspectMode を返す */
  getAspectMode(): AspectMode {
    return this.aspectMode
  }

  /**
   * AspectMode を設定する。
   * Output ウィンドウが開いている場合は postMessage で即時反映する。
   */
  setAspectMode(mode: AspectMode): void {
    this.aspectMode = mode
    if (this.popup && !this.popup.closed) {
      this.popup.postMessage({ type: 'ASPECT_UPDATE', aspectMode: mode }, '*')
    }
    console.info(`[OutputManager] AspectMode: ${mode}`)
  }

  /** AspectMode を contain ↔ cover でトグルする */
  toggleAspectMode(): void {
    this.setAspectMode(this.aspectMode === 'contain' ? 'cover' : 'contain')
  }

  // ── 内部実装 ──────────────────────────────────────────────────────

  /**
   * 案B: ブラウザ開発用
   * window.open() で popup を開く。ブラウザのウィンドウ chrome あり。
   * セカンダリディスプレイへの配置は手動（ドラッグ）。
   */
  private async _openOutputBrowser(): Promise<void> {
    const popup = await this._openPopupWithStreams()
    if (!popup) return
    console.info('[OutputManager] 案B: popup を開きました。外部モニターへ手動でドラッグしてください。')
  }

  /**
   * 案C: Electron VJ 本番用
   * window.open() を呼ぶが、main.js の setWindowOpenHandler が
   * frameName 'GeoGraphy Output' を検出して frame:false の BrowserWindow を作成する。
   * geoAPI.moveOutputWindow() でセカンダリディスプレイに自動配置する。
   */
  private async _openOutputElectron(): Promise<void> {
    const popup = await this._openPopupWithStreams()
    if (!popup) return
    await this._moveToSecondaryDisplay()
    console.info('[OutputManager] 案C: Electron フレームレスウィンドウで出力開始。')
  }

  /**
   * 共通コア: popup 生成 → HTML 書き込み → stream 注入 → style 同期開始
   * 成功時は popup 参照を返す。失敗時は null を返す。
   */
  private async _openPopupWithStreams(): Promise<Window | null> {
    const layers = layerManager.getLayers()
    if (layers.length === 0) {
      console.warn('[OutputManager] レイヤーが存在しません。engine が初期化済みか確認してください。')
      return null
    }

    // 各レイヤーの canvas から MediaStream を生成
    const streams = layers.map((layer) => ({
      id: layer.id,
      stream: layer.canvas.captureStream(60),
    }))

    // 現在のレイヤー状態 + aspectMode で HTML を生成
    const layerInfo = layers.map((l) => ({
      id: l.id,
      blendMode: l.blendMode,
      opacity: l.opacity,
      mute: l.mute,
    }))
    const html = buildOutputHTML(layerInfo, this.aspectMode)

    // popup を開く
    // 案B: ブラウザが通常の popup として作成（chrome あり）
    // 案C: main.js の setWindowOpenHandler が frameName を検出し
    //      frame:false の BrowserWindow として作成する（chrome なし）
    const popup = window.open(
      'about:blank',
      'GeoGraphy Output',
      'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no'
    )

    if (!popup) {
      console.warn('[OutputManager] popup がブロックされました。ブラウザのポップアップ許可を確認してください。')
      return null
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

    // layerManager のスタイル変化を postMessage で popup に同期（イベント駆動）
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

    return popup
  }

  /**
   * 案C 専用: Electron でセカンダリディスプレイに popup を移動する。
   * geoAPI.getDisplays() でセカンダリを特定し、
   * geoAPI.moveOutputWindow() → main.js で setBounds + setFullScreen(true) を実行する。
   */
  private async _moveToSecondaryDisplay(): Promise<void> {
    if (!window.geoAPI) return

    try {
      const displays = await window.geoAPI.getDisplays()
      const secondary = displays.find((d) => !d.isPrimary)
      if (!secondary) {
        console.info('[OutputManager] セカンダリディスプレイが見つかりません。手動でドラッグしてください。')
        return
      }
      const { x, y, width, height } = secondary.bounds
      await window.geoAPI.moveOutputWindow(x, y, width, height)
    } catch (e) {
      console.warn('[OutputManager] セカンダリディスプレイへの移動に失敗しました:', e)
    }
  }
}

export const outputManager = new OutputManager()
