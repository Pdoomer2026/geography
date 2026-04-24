/**
 * CcMapService
 * spec: docs/spec/cc-mapping.spec.md §6
 *
 * settings/cc-map.json（Layer 1）と cc-overrides.json（Layer 2）をマージして
 * runtime で CC 番号を lookup するサービス。
 *
 * 優先順位: Layer 2（ユーザー上書き）→ Layer 1（デフォルト）
 * geoAPI の型定義: src/types/geoAPI.d.ts（window.geoAPI は optional）
 */

// ============================================================
// 公開型定義（spec §6-3）
// ============================================================

export interface ParamMapping {
  pluginId: string
  pluginType: 'geometry' | 'fx' | 'particle'
  paramId: string
  /** ユーザー上書き後の実効 CC 番号 */
  ccNumber: number
  /** cc-map.json のデフォルト CC 番号 */
  defaultCcNumber: number
  block: string
  blockName: string
  pluginMin: number
  pluginMax: number
  ccMin: number
  ccMax: number
  note: string
  /** ユーザーが上書きしているか */
  isOverridden: boolean
}

export interface CcMapService {
  init(): Promise<void>
  getCcNumber(pluginId: string, paramId: string): number
  getMapping(pluginId: string, paramId: string): ParamMapping | null
  getAllMappings(): ParamMapping[]
  applyOverride(pluginId: string, paramId: string, ccNumber: number): Promise<void>
  resetOverride(pluginId: string, paramId: string): Promise<void>
  resetAllOverrides(): Promise<void>
}

// ============================================================
// cc-map.json の内部スキーマ（generate-cc-map.ts が生成する形式）
// ============================================================

interface RawParamEntry {
  paramId: string
  ccNumber: number
  block: string
  blockName: string
  pluginMin: number
  pluginMax: number
  ccMin: number
  ccMax: number
  note: string
}

interface RawPluginMapping {
  pluginId: string
  pluginType: 'geometry' | 'fx' | 'particle'
  params: RawParamEntry[]
}

interface RawCcMap {
  version: string
  generatedAt: string
  generatedFrom: string
  mappings: RawPluginMapping[]
}

// ============================================================
// cc-overrides.json のスキーマ（spec §5）
// ============================================================

interface OverrideEntry {
  pluginId: string
  paramId: string
  ccNumber: number
}

interface RawOverrides {
  version: string
  updatedAt: string
  overrides: OverrideEntry[]
}

// ============================================================
// CcMapServiceImpl
// ============================================================

class CcMapServiceImpl implements CcMapService {
  private mappings: ParamMapping[] = []
  private overrides: OverrideEntry[] = []
  /** cc-mapping.md 未定義 param への自動払い出し（CC1000〜）*/
  private autoAssignedCc: Map<string, number> = new Map()
  private nextAutoCc: number = 1000

  // ----------------------------------------------------------------
  // init（起動時に engine.initialize() から呼ぶ）
  // ----------------------------------------------------------------

  async init(): Promise<void> {
    await this.loadCcMap()
    await this.loadOverrides()
    this.applyOverridesToMappings()
  }

  /**
   * cc-map.json をパースして mappings に展開する（共通処理）
   */
  private parseCcMap(raw: string): void {
    const parsed: RawCcMap = JSON.parse(raw)
    this.mappings = parsed.mappings.flatMap((plugin) =>
      plugin.params.map((p): ParamMapping => ({
        pluginId: plugin.pluginId,
        pluginType: plugin.pluginType,
        paramId: p.paramId,
        ccNumber: p.ccNumber,
        defaultCcNumber: p.ccNumber,
        block: p.block,
        blockName: p.blockName,
        pluginMin: p.pluginMin,
        pluginMax: p.pluginMax,
        ccMin: p.ccMin,
        ccMax: p.ccMax,
        note: p.note,
        isOverridden: false,
      }))
    )
  }

  /**
   * cc-map.json を読み込む
   * Electron 環境: window.geoAPI.loadCcMap()（IPC 経由）
   * ブラウザ環境（開発時）: fetch('/cc-map.json')（vite 静的配信）
   */
  private async loadCcMap(): Promise<void> {
    if (window.geoAPI) {
      try {
        const raw = await window.geoAPI.loadCcMap()
        if (!raw) {
          console.warn('[CcMapService] cc-map.json が見つかりません。pnpm gen:cc-map を実行してください。')
          return
        }
        this.parseCcMap(raw)
      } catch (e) {
        console.error('[CcMapService] cc-map.json の読み込みに失敗しました:', e)
      }
    } else {
      try {
        const res = await fetch('/cc-map.json')
        if (!res.ok) {
          console.warn('[CcMapService] fetch /cc-map.json 失敗。pnpm gen:cc-map を実行してください。')
          return
        }
        const raw = await res.text()
        this.parseCcMap(raw)
      } catch (e) {
        console.warn('[CcMapService] fetch /cc-map.json エラー:', e)
      }
    }
  }

  /** cc-overrides.json を読み込む（なければ空配列） */
  private async loadOverrides(): Promise<void> {
    if (!window.geoAPI) return
    try {
      const raw = await window.geoAPI.loadCcOverrides()
      if (!raw) return
      const parsed: RawOverrides = JSON.parse(raw)
      this.overrides = parsed.overrides
    } catch {
      this.overrides = []
    }
  }

  /** overrides を mappings に適用する */
  private applyOverridesToMappings(): void {
    for (const mapping of this.mappings) {
      const override = this.overrides.find(
        (o) => o.pluginId === mapping.pluginId && o.paramId === mapping.paramId
      )
      if (override) {
        mapping.ccNumber = override.ccNumber
        mapping.isOverridden = true
      } else {
        mapping.ccNumber = mapping.defaultCcNumber
        mapping.isOverridden = false
      }
    }
  }

  /** overrides を cc-overrides.json に保存する */
  private async saveOverrides(): Promise<void> {
    if (!window.geoAPI) return
    const data: RawOverrides = {
      version: '0.2',
      updatedAt: new Date().toISOString(),
      overrides: this.overrides,
    }
    await window.geoAPI.saveCcOverrides(JSON.stringify(data, null, 2))
  }

  // ----------------------------------------------------------------
  // 公開 API
  // ----------------------------------------------------------------

  getCcNumber(pluginId: string, paramId: string): number {
    const mapping = this.getMapping(pluginId, paramId)
    if (mapping) return mapping.ccNumber

    const key = `${pluginId}:${paramId}`
    if (!this.autoAssignedCc.has(key)) {
      console.warn(
        `[CcMapService] 未定義 param: ${pluginId}.${paramId} → CC${this.nextAutoCc} を自動割り当て。cc-mapping.md への追記を検討してください。`
      )
      this.autoAssignedCc.set(key, this.nextAutoCc++)
    }
    return this.autoAssignedCc.get(key)!
  }

  getMapping(pluginId: string, paramId: string): ParamMapping | null {
    return (
      this.mappings.find((m) => m.pluginId === pluginId && m.paramId === paramId) ?? null
    )
  }

  getAllMappings(): ParamMapping[] {
    return [...this.mappings]
  }

  async applyOverride(pluginId: string, paramId: string, ccNumber: number): Promise<void> {
    const existing = this.overrides.find(
      (o) => o.pluginId === pluginId && o.paramId === paramId
    )
    if (existing) {
      existing.ccNumber = ccNumber
    } else {
      this.overrides.push({ pluginId, paramId, ccNumber })
    }
    this.applyOverridesToMappings()
    await this.saveOverrides()
  }

  async resetOverride(pluginId: string, paramId: string): Promise<void> {
    this.overrides = this.overrides.filter(
      (o) => !(o.pluginId === pluginId && o.paramId === paramId)
    )
    this.applyOverridesToMappings()
    await this.saveOverrides()
  }

  async resetAllOverrides(): Promise<void> {
    this.overrides = []
    this.applyOverridesToMappings()
    await this.saveOverrides()
  }
}

// ============================================================
// シングルトン
// ============================================================

export const ccMapService = new CcMapServiceImpl()
