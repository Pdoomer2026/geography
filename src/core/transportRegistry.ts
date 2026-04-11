/**
 * TransportRegistry
 * spec: docs/spec/transport-architecture.spec.md
 *
 * Registry をコアシングルトンとして独立させる（Day58 Step4）。
 * 従来は App.tsx の React state として管理されていたが、
 * コア層に降ろすことで engine / TransportManager が直接参照できるようになる。
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
 */

import type { RegisteredParameterWithCC } from '../types/midi-registry'

// ============================================================
// TransportRegistry
// ============================================================

class TransportRegistryImpl {
  private params: RegisteredParameterWithCC[] = []
  private onChangedCallback: (() => void) | null = null

  /**
   * 指定 layerId のパラメータを登録する（Plugin Apply 時）
   * 他レイヤーのパラメータはそのまま保持する
   */
  register(params: RegisteredParameterWithCC[], layerId: string): void {
    const others = this.params.filter((p) => p.layerId !== layerId)
    this.params = [...others, ...params]
    this.onChangedCallback?.()
  }

  /**
   * 指定 layerId のパラメータを削除する（Plugin Remove 時）
   */
  clear(layerId: string): void {
    this.params = this.params.filter((p) => p.layerId !== layerId)
    this.onChangedCallback?.()
  }

  /**
   * slot 番号から対応する RegisteredParameterWithCC を返す
   * engine の flushParameterStore() が使う核心 API
   */
  resolve(slot: number): RegisteredParameterWithCC | undefined {
    return this.params.find((p) => p.ccNumber === slot)
  }

  /**
   * 全パラメータを返す（UI 購読・flushParameterStore 用）
   */
  getAll(): RegisteredParameterWithCC[] {
    return this.params
  }

  /**
   * Registry が変化したときのコールバックを登録する
   * App.tsx が React state を更新するために使う
   */
  onChanged(cb: () => void): void {
    this.onChangedCallback = cb
  }

  /**
   * engine の現在値で value を同期する（Step3 の syncValues 相当）
   * flushParameterStore が呼んだ後に UI へ通知する
   */
  syncValue(pluginId: string, paramId: string, value: number): boolean {
    const idx = this.params.findIndex(
      (p) => p.pluginId === pluginId && p.id === paramId
    )
    if (idx === -1) return false
    const prev = this.params[idx]
    if (Math.abs(prev.value - value) < 0.0001) return false
    this.params = [
      ...this.params.slice(0, idx),
      { ...prev, value },
      ...this.params.slice(idx + 1),
    ]
    return true
  }
}

// ============================================================
// シングルトン
// ============================================================

export const transportRegistry = new TransportRegistryImpl()
