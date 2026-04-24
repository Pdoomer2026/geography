/**
 * useParam / useAllParams
 * spec: SDK v2.2 §3.3 Minimal Glue Hooks
 *
 * TransportRegistry の購読ロジックを Hook に集約する。
 * Window Plugin は engine を直接触らず、この Hook 経由で params を得る。
 *
 * Day62: engine ファサード確定に伴い新設。
 *
 * 使用例:
 *   // 単一 plugin のパラメータを購読する
 *   const params = useParam('layer-1', 'icosphere')
 *
 *   // 全パラメータを購読する（GeoMonitor 用）
 *   const all = useAllParams()
 */

import { useEffect, useState } from 'react'
import { engine } from '../../application/orchestrator/engine'
import type { RegisteredParameterWithCC } from '../../application/schema/midi-registry'

// ============================================================
// useParam — 単一 plugin のパラメータを購読する
// ============================================================

/**
 * 指定 layerId + pluginId のパラメータ一覧をリアルタイムで返す。
 * Registry が変化するたびに再レンダリングされる。
 *
 * @param layerId   対象レイヤー ID（'layer-1' 等）
 * @param pluginId  対象 Plugin ID（'icosphere' 等）
 */
export function useParam(
  layerId: string,
  pluginId: string
): RegisteredParameterWithCC[] {
  const [params, setParams] = useState<RegisteredParameterWithCC[]>(() =>
    engine.getParameters(layerId).filter((p) => p.pluginId === pluginId)
  )

  useEffect(() => {
    // activeLayer / pluginId が変わったとき即時同期
    setParams(engine.getParameters(layerId).filter((p) => p.pluginId === pluginId))

    // Registry 変化を購読（unsubscribe を return して cleanup）
    return engine.onRegistryChanged(() => {
      setParams(engine.getParameters(layerId).filter((p) => p.pluginId === pluginId))
    })
  }, [layerId, pluginId])

  return params
}

// ============================================================
// useAllParams — 全パラメータを購読する（GeoMonitor 用）
// ============================================================

/**
 * TransportRegistry に登録されている全パラメータをリアルタイムで返す。
 * 値の変化は 100ms ポーリングで検知する（毎フレーム notify を避けるため）。
 * 構造変化（register/clear）は onRegistryChanged で即時反映する。
 *
 * @param layerId  省略時は全レイヤー。指定するとそのレイヤーのみ。
 */
export function useAllParams(layerId?: string): RegisteredParameterWithCC[] {
  const [params, setParams] = useState<RegisteredParameterWithCC[]>(() =>
    engine.getParametersLive(layerId)
  )

  // 構造変化（register / clear）は即時反映
  useEffect(() => {
    setParams(engine.getParametersLive(layerId))
    return engine.onRegistryChanged(() => {
      setParams(engine.getParametersLive(layerId))
    })
  }, [layerId])

  // 値の変化は 100ms ポーリング（plugin.params を直接読むので常に最新値）
  useEffect(() => {
    const timer = window.setInterval(() => {
      setParams(engine.getParametersLive(layerId))
    }, 100)
    return () => window.clearInterval(timer)
  }, [layerId])

  return params
}
