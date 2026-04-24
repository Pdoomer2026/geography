/**
 * generate-geo-types.ts
 * spec: SDK v2.2 §3.2 Dynamic Type Definition (Manifest System)
 *
 * settings/cc-map.json を読み取り、TypeScript 型定義ファイルを自動生成する。
 *
 * 生成物: src/types/geo-types.generated.d.ts
 * 実行:   pnpm gen:types
 * 両方:   pnpm gen:all  (gen:cc-map && gen:types)
 *
 * Day62: コントリビューター向け開発環境整備として新設。
 *
 * 生成される型:
 *   - GeometryPluginId / FxPluginId / ParticlePluginId / PluginId
 *   - ParamIdOf<T>  : pluginId → 有効な paramId のユニオン型
 *   - CcNumberOf    : { [pluginId]: { [paramId]: ccNumber } } の定数型
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

// ============================================================
// cc-map.json の型
// ============================================================

interface ParamEntry {
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

interface PluginMapping {
  pluginId: string
  pluginType: 'geometry' | 'fx' | 'particle'
  params: ParamEntry[]
}

interface CcMapJson {
  version: string
  generatedAt: string
  generatedFrom: string
  mappings: PluginMapping[]
}

// ============================================================
// 型文字列生成ヘルパー
// ============================================================

/** 文字列配列を TypeScript のユニオン型文字列に変換 */
function toUnion(ids: string[]): string {
  if (ids.length === 0) return 'never'
  return ids.map((id) => `'${id}'`).join(' | ')
}

// ============================================================
// メイン生成ロジック
// ============================================================

function main(): void {
  const ccMapPath = join(ROOT, 'settings', 'cc-map.json')
  const outPath = join(ROOT, 'src', 'types', 'geo-types.generated.d.ts')

  if (!existsSync(ccMapPath)) {
    console.error(`cc-map.json が見つかりません: ${ccMapPath}`)
    console.error('先に pnpm gen:cc-map を実行してください')
    process.exit(1)
  }

  const ccMap: CcMapJson = JSON.parse(readFileSync(ccMapPath, 'utf-8'))
  const mappings = ccMap.mappings

  // pluginType 別に分類
  const byType: Record<string, PluginMapping[]> = {
    geometry: [],
    fx: [],
    particle: [],
  }
  for (const m of mappings) {
    byType[m.pluginType]?.push(m)
  }

  // pluginId の重複排除
  const geometryIds = [...new Set(byType.geometry.map((m) => m.pluginId))]
  const fxIds = [...new Set(byType.fx.map((m) => m.pluginId))]
  const particleIds = [...new Set(byType.particle.map((m) => m.pluginId))]

  // pluginId → paramId[] マップ（重複排除）
  const paramIdMap: Record<string, string[]> = {}
  for (const m of mappings) {
    if (!paramIdMap[m.pluginId]) paramIdMap[m.pluginId] = []
    for (const p of m.params) {
      if (!paramIdMap[m.pluginId].includes(p.paramId)) {
        paramIdMap[m.pluginId].push(p.paramId)
      }
    }
  }

  // pluginId → { paramId: ccNumber } マップ（重複時は最初の値を採用）
  const ccNumberMap: Record<string, Record<string, number>> = {}
  for (const m of mappings) {
    if (!ccNumberMap[m.pluginId]) ccNumberMap[m.pluginId] = {}
    for (const p of m.params) {
      if (!(p.paramId in ccNumberMap[m.pluginId])) {
        ccNumberMap[m.pluginId][p.paramId] = p.ccNumber
      }
    }
  }

  // ============================================================
  // 型定義文字列の組み立て
  // ============================================================

  const lines: string[] = []

  lines.push(`/**`)
  lines.push(` * geo-types.generated.d.ts`)
  lines.push(` * ⚠️  自動生成ファイル — 手動編集禁止`)
  lines.push(` *`)
  lines.push(` * 生成元: ${ccMap.generatedFrom}`)
  lines.push(` * 生成日: ${new Date().toISOString()}`)
  lines.push(` * 生成コマンド: pnpm gen:types`)
  lines.push(` *`)
  lines.push(` * このファイルを再生成するには:`)
  lines.push(` *   pnpm gen:all   (cc-map.json + geo-types.generated.d.ts を同時更新)`)
  lines.push(` *   pnpm gen:types (このファイルのみ更新)`)
  lines.push(` */`)
  lines.push(``)

  // PluginId ユニオン型
  lines.push(`// ============================================================`)
  lines.push(`// Plugin ID ユニオン型`)
  lines.push(`// ============================================================`)
  lines.push(``)
  lines.push(`/** Geometry Plugin の ID */`)
  lines.push(`export type GeometryPluginId = ${toUnion(geometryIds)}`)
  lines.push(``)
  lines.push(`/** FX Plugin の ID */`)
  lines.push(`export type FxPluginId = ${toUnion(fxIds)}`)
  lines.push(``)
  lines.push(`/** Particle Plugin の ID */`)
  lines.push(`export type ParticlePluginId = ${toUnion(particleIds)}`)
  lines.push(``)
  lines.push(`/** 全 Plugin ID のユニオン */`)
  lines.push(`export type PluginId = GeometryPluginId | FxPluginId | ParticlePluginId`)
  lines.push(``)

  // ParamIdOf<T> 条件型
  lines.push(`// ============================================================`)
  lines.push(`// ParamIdOf<T> — pluginId から有効な paramId を取得`)
  lines.push(`// ============================================================`)
  lines.push(``)
  lines.push(`/**`)
  lines.push(` * useParam / useAllParams の結果を絞り込む条件型。`)
  lines.push(` * IDE 補完で「このプラグインのどのパラメータか」を確認できる。`)
  lines.push(` *`)
  lines.push(` * @example`)
  lines.push(` *   type IcoParams = ParamIdOf<'icosphere'>`)
  lines.push(` *   // => 'radius' | 'detail' | 'speed' | 'hue'`)
  lines.push(` */`)
  lines.push(`export type ParamIdOf<T extends PluginId> =`)

  const allPluginIds = [...geometryIds, ...fxIds, ...particleIds]
  allPluginIds.forEach((pluginId, i) => {
    const paramIds = paramIdMap[pluginId] ?? []
    const isLast = i === allPluginIds.length - 1
    const union = toUnion(paramIds)
    const suffix = isLast ? `string` : `ParamIdOf<Exclude<T, '${pluginId}'>>`
    lines.push(`  T extends '${pluginId}' ? ${union} :`)
    if (isLast) lines.push(`  ${suffix}`)
  })
  lines.push(``)

  // CcNumberOf 定数型
  lines.push(`// ============================================================`)
  lines.push(`// CcNumberOf — pluginId + paramId から CC番号を取得`)
  lines.push(`// ============================================================`)
  lines.push(``)
  lines.push(`/**`)
  lines.push(` * pluginId と paramId から CC番号を型安全に取得する定数オブジェクトの型。`)
  lines.push(` * Sequencer / LFO のレーン設定でハードコードを避けるために使う。`)
  lines.push(` *`)
  lines.push(` * @example`)
  lines.push(` *   const cc = GEO_CC_MAP['icosphere']['radius']  // => 11101`)
  lines.push(` */`)
  lines.push(`export interface GeoParamMeta {`)
  lines.push(`  ccNumber: number`)
  lines.push(`  pluginMin: number`)
  lines.push(`  pluginMax: number`)
  lines.push(`  block: string`)
  lines.push(`  blockName: string`)
  lines.push(`}`)
  lines.push(``)
  lines.push(`export type GeoParamMap = {`)
  for (const pluginId of allPluginIds) {
    const params = ccNumberMap[pluginId] ?? {}
    const entries = Object.entries(params)
    if (entries.length === 0) continue
    lines.push(`  '${pluginId}': {`)
    for (const [paramId] of entries) {
      lines.push(`    '${paramId}': GeoParamMeta`)
    }
    lines.push(`  }`)
  }
  lines.push(`}`)
  lines.push(``)

  // ============================================================
  // 実行時定数（.d.ts ではなく .ts として別ファイルにする案もあるが
  // ここでは型定義と分離して geo-cc-map.ts を別途生成する）
  // ============================================================

  const dts = lines.join('\n')
  writeFileSync(outPath, dts, 'utf-8')
  console.log(`geo-types.generated.d.ts を生成しました`)
  console.log(`  Geometry: ${geometryIds.length} plugins`)
  console.log(`  FX:       ${fxIds.length} plugins`)
  console.log(`  Particle: ${particleIds.length} plugins`)
  console.log(`  合計:     ${allPluginIds.length} plugins`)
  console.log(`出力先: ${outPath}`)

  // ============================================================
  // 実行時定数マップも生成（geo-cc-map.generated.ts）
  // ============================================================

  const runtimePath = join(ROOT, 'src', 'types', 'geo-cc-map.generated.ts')
  const runtimeLines: string[] = []

  runtimeLines.push(`/**`)
  runtimeLines.push(` * geo-cc-map.generated.ts`)
  runtimeLines.push(` * ⚠️  自動生成ファイル — 手動編集禁止`)
  runtimeLines.push(` *`)
  runtimeLines.push(` * 生成元: ${ccMap.generatedFrom}`)
  runtimeLines.push(` * 生成日: ${new Date().toISOString()}`)
  runtimeLines.push(` * 生成コマンド: pnpm gen:types`)
  runtimeLines.push(` *`)
  runtimeLines.push(` * pluginId + paramId → CC番号・min/max を実行時に参照するための定数マップ。`)
  runtimeLines.push(` * Sequencer / LFO でハードコードを避けるために使う。`)
  runtimeLines.push(` */`)
  runtimeLines.push(``)
  runtimeLines.push(`import type { GeoParamMap } from './geo-types.generated'`)
  runtimeLines.push(``)
  runtimeLines.push(`export const GEO_CC_MAP = {`)

  for (const pluginId of allPluginIds) {
    const mapping = mappings.find((m) => m.pluginId === pluginId)
    if (!mapping) continue
    runtimeLines.push(`  '${pluginId}': {`)
    // 重複 paramId は最初のエントリを採用
    const seen = new Set<string>()
    for (const p of mapping.params) {
      if (seen.has(p.paramId)) continue
      seen.add(p.paramId)
      runtimeLines.push(`    '${p.paramId}': {`)
      runtimeLines.push(`      ccNumber: ${p.ccNumber},`)
      runtimeLines.push(`      pluginMin: ${p.pluginMin},`)
      runtimeLines.push(`      pluginMax: ${p.pluginMax},`)
      runtimeLines.push(`      block: '${p.block}',`)
      runtimeLines.push(`      blockName: '${p.blockName}',`)
      runtimeLines.push(`    },`)
    }
    runtimeLines.push(`  },`)
  }

  runtimeLines.push(`} satisfies GeoParamMap`)
  runtimeLines.push(``)

  writeFileSync(runtimePath, runtimeLines.join('\n'), 'utf-8')
  console.log(`geo-cc-map.generated.ts を生成しました`)
  console.log(`出力先: ${runtimePath}`)
}

main()
