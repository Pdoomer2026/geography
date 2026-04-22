/**
 * MidiLearnService
 * spec: docs/spec/midi-learn.spec.md
 *
 * 外部 CC と GeoGraphy コントロールのマッピングを管理するシングルトン。
 *
 * 責務:
 *   - Learn モードの状態管理（対象コントロール・タイムアウト）
 *   - 外部CC → コントロール のマッピング定義を保持
 *   - CC受信時にマッチするコントロールを返す
 *
 * 責務外:
 *   - 実際にパラメータへ値を書く（engine の責務）
 *   - MIDI 受信（MidiInputWrapper の責務）
 */

import type { MidiLearnTarget } from '../schema'

const LEARN_TIMEOUT_MS = 10_000

class MidiLearnServiceImpl {
  /** 現在 Learn 待機中のコントロール（null = 通常モード）*/
  private learnTarget: MidiLearnTarget | null = null

  /** タイムアウトタイマー */
  private learnTimer: ReturnType<typeof setTimeout> | null = null

  /** controlId → 外部 CC番号 のマッピング */
  private assigns: Map<string, number> = new Map()

  // ── Learn モード ──────────────────────────────────────

  startLearn(target: MidiLearnTarget): void {
    // 既存の Learn をキャンセルしてから開始
    this.stopLearn()
    this.learnTarget = target
    this.learnTimer = setTimeout(() => {
      this.stopLearn()
    }, LEARN_TIMEOUT_MS)
  }

  stopLearn(): void {
    this.learnTarget = null
    if (this.learnTimer !== null) {
      clearTimeout(this.learnTimer)
      this.learnTimer = null
    }
  }

  getLearnTarget(): MidiLearnTarget | null {
    return this.learnTarget
  }

  // ── CC アサイン管理 ────────────────────────────────────

  assign(controlId: string, cc: number): void {
    this.assigns.set(controlId, cc)
  }

  clearAssign(controlId: string): void {
    this.assigns.delete(controlId)
  }

  getAssignedCC(controlId: string): number {
    return this.assigns.get(controlId) ?? -1
  }

  getAllAssigns(): Record<string, number> {
    return Object.fromEntries(this.assigns)
  }

  restoreAssigns(assigns: Record<string, number>): void {
    this.assigns = new Map(Object.entries(assigns))
  }

  // ── CC ルーティング ────────────────────────────────────

  /**
   * CC受信時に呼ぶ。
   * マッチするコントロールがあれば MidiLearnTarget を返す。
   * engine がこれを使って適切なハンドラを呼ぶ。
   */
  resolve(cc: number): MidiLearnTarget | null {
    // assigns から controlId を探す
    for (const [controlId, assignedCC] of this.assigns) {
      if (assignedCC === cc) {
        // controlId から type を推定（prefix で判定）
        const type = this.inferType(controlId)
        return { id: controlId, type, label: controlId }
      }
    }
    return null
  }

  /** controlId の prefix から MidiLearnTargetType を推定 */
  private inferType(controlId: string): MidiLearnTarget['type'] {
    if (controlId.startsWith('macro-'))    return 'macro'
    if (controlId.startsWith('opacity-'))  return 'layer-opacity'
    if (controlId.startsWith('geo-'))      return 'geometry-param'
    if (controlId.startsWith('cam-'))      return 'camera-param'
    if (controlId.startsWith('fx-'))       return 'fx-param'
    if (controlId.startsWith('seq-'))      return 'sequencer-param'
    return 'macro'
  }
}

// ============================================================
// シングルトン
// ============================================================

export const midiLearnService = new MidiLearnServiceImpl()
