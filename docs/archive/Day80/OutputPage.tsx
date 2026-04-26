import { useEffect, useRef } from 'react'
import { engine } from '../application/orchestrator/engine'
import { OUTPUT_CHANNEL_NAME } from '../application/sync/outputSync'
import type { OutputSyncMessage } from '../application/sync/outputSync'

/**
 * OutputPage — /output ルート
 * - App タブから BroadcastChannel 経由でプロジェクト状態を受け取り engine を同期初期化
 * - 以後リアルタイムで param 変更を受信し engine に適用
 * - UI パネル類は一切なし。カーソルも非表示。
 */
export default function OutputPage() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return
    const container = mountRef.current
    const ch = new BroadcastChannel(OUTPUT_CHANNEL_NAME)
    let engineStarted = false

    ch.onmessage = async (e: MessageEvent<OutputSyncMessage>) => {
      const msg = e.data

      // 1. App からスナップショットが届いたら engine を同じ状態で起動
      if (msg.type === 'STATE_SNAPSHOT' && !engineStarted) {
        engineStarted = true
        await engine.initialize(container)
        engine.restoreProject(msg.project)
        engine.start()
      }

      // 2. リアルタイム param 変更を適用
      if (msg.type === 'PARAM_EVENT' && engineStarted) {
        engine.handleMidiCC(msg.event)
      }
    }

    // App に現在の状態をリクエスト
    ch.postMessage({ type: 'REQUEST_STATE' } satisfies OutputSyncMessage)

    return () => {
      ch.close()
      engine.dispose()
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000',
        overflow: 'hidden',
        cursor: 'none',
      }}
    />
  )
}
