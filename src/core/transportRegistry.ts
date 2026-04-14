/**
 * TransportRegistry
 * spec: docs/spec/transport-architecture.spec.md
 *
 * Registry をコアシングルトンとして独立させる（Day58 Step4）。
 * Day59: registrationKey 導入（layerId 単位の上書き問題を解消）
 *
 * 責務:
 *   - slot → pluginId:paramId の対応表を保持
 *   - availableParameters の実体を管理
 *   - Plugin Apply / Remove 時に更新される
 *   - UI 層は onChanged コールバックで変化を購読する（鏡）
 *
 * 責務外:
 *   - 値の変換（transform は UI の責務）
 *   - プロトコル知識（slot は抽象 ID）
 *
 * registrationKey の命名規則（呼び出し側が決める）:
 *   Geometry: `${layerId}:geometry`  例: 'layer-1:geometry'
 *   FX:       `${layerId}:fx`        例: 'layer-1:fx'
 *   将来:     `${layerId}:pixi` 等、自由に追加できる
 *   Registry はキーの意味を知らない。
 */

import type { RegisteredParameterWithCC } from '../types/midi-registry'

// ============================================================
// TransportRegistry
// ============================================================

class TransportRegistryImpl {
  /** registrationKey → params の対応表 */
  private buckets: Map<string, RegisteredParameterWithCC[]> = new Map()
  private onChangedCallback: (() => void) | null = null

  /**
   * 指定 registrationKey のパラメータを登録する（Plugin Apply 時）
   * 他の registrationKey のパラメータはそのまま保持する
   *
   * @param params 登録するパラメータ一覧
   * @param registrationKey 登録単位を識別する任意キー（例: 'layer-1:geometry'）
   */
  register(params: RegisteredParameterWithCC[], registrationKey: string): void {
    this.buckets.set(registrationKey, params)
    this.onChangedCallback?.()
  }

  /**
   * 指定 registrationKey のパラメータを削除する（Plugin Remove 時）
   *
   * @param registrationKey 削除する登録単位のキー（例: 'layer-1:geometry'）
   */
  clear(registrationKey: string): void {
    this.buckets.delete(registrationKey)
    this.onChangedCallback?.()
  }

  /**
   * slot 番号から対応する RegisteredParameterWithCC を返す
   * engine の flushParameterStore() が使う核心 API
   */
  resolve(slot: number): RegisteredParameterWithCC | undefined {
    for (const params of this.buckets.values()) {
      const found = params.find((p) => p.ccNumber === slot)
      if (found) return found
    }
    return undefined
  }

  /**
   * 全パラメータをフラットに返す（UI 購読・flushParameterStore 用）
   */
  getAll(): RegisteredParameterWithCC[] {
    const result: RegisteredParameterWithCC[] = []
    for (const params of this.buckets.values()) {
      result.push(...params)
    }
    return result
  }

  /**
   * Registry が変化したときのコールバックを登録する
   * App.tsx / WindowPlugin が購読するために使う
   */
  onChanged(cb: () => void): void {
    this.onChangedCallback = cb
  }

  /**
   * engine の現在値で value を同期する
   * flushParameterStore が呼んだ後に UI へ通知する
   */
  syncValue(pluginId: string, paramId: string, value: number): boolean {
    for (const [key, params] of this.buckets.entries()) {
      const idx = params.findIndex(
        (p) => p.pluginId === pluginId && p.id === paramId
      )
      if (idx === -1) continue
      const prev = params[idx]
      if (Math.abs(prev.value - value) < 0.0001) return false
      const next = [...params]
      next[idx] = { ...prev, value }
      this.buckets.set(key, next)
      return true
    }
    return false
  }
}

// ============================================================
// シングルトン
// ============================================================

export const transportRegistry = new TransportRegistryImpl()
