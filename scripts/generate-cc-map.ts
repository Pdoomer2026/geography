/**
 * generate-cc-map.ts
 * spec: docs/spec/cc-mapping.spec.md §7
 *
 * docs/spec/cc-mapping.md をパースして settings/cc-map.json を生成する。
 * 未マッピングの paramId を検出して警告を出力する。
 *
 * 実行: pnpm gen:cc-map
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

// ============================================================
// 型定義
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
// cc-mapping.md パーサー
// ============================================================

/**
 * "## Geometry: icosphere" のようなセクションヘッダーをパースする。
 * 戻り値: { pluginType, pluginId } or null
 */
function parseHeader(
  line: string
): { pluginType: 'geometry' | 'fx' | 'particle'; pluginId: string } | null {
  const m = line.match(/^##\s+(Geometry|FX|Particle):\s+(.+)$/i)
  if (!m) return null
  const typeMap: Record<string, 'geometry' | 'fx' | 'particle'> = {
    geometry: 'geometry',
    fx: 'fx',
    particle: 'particle',
  }
  return {
    pluginType: typeMap[m[1].toLowerCase()],
    pluginId: m[2].trim(),
  }
}

/**
 * Markdown テーブルの行をパースして ParamEntry を返す。
 * ヘッダー行・区切り行は null を返す。
 */
function parseTableRow(line: string): ParamEntry | null {
  // | geoParamAddress | paramId | CC# | Block | blockName | pluginMin | pluginMax | ccMin | ccMax | 備考 |
  const cells = line
    .split('|')
    .map((c) => c.trim())
    .filter((_, i, arr) => i > 0 && i < arr.length - 1)
  if (cells.length < 9) return null
  if (cells[0] === 'geoParamAddress' || cells[0].startsWith('-')) return null

  const ccRaw = cells[2].replace('CC', '').trim()
  const ccNumber = parseInt(ccRaw, 10)
  if (isNaN(ccNumber)) return null

  return {
    paramId: cells[1],
    ccNumber,
    block: cells[3],
    blockName: cells[4],
    pluginMin: parseFloat(cells[5]),
    pluginMax: parseFloat(cells[6]),
    ccMin: parseFloat(cells[7]),
    ccMax: parseFloat(cells[8]),
    note: cells[9] ?? '',
  }
}

/**
 * cc-mapping.md をパースして PluginMapping[] を返す。
 */
function parseCcMapping(mdPath: string): PluginMapping[] {
  const content = readFileSync(mdPath, 'utf-8')
  const lines = content.split('\n')

  const mappings: PluginMapping[] = []
  let current: PluginMapping | null = null

  for (const line of lines) {
    const header = parseHeader(line)
    if (header) {
      current = { ...header, params: [] }
      mappings.push(current)
      continue
    }

    if (current && line.startsWith('|')) {
      const entry = parseTableRow(line)
      if (entry) current.params.push(entry)
    }

    // "## 未マッピング" 以降は終了
    if (line.startsWith('##') && line.includes('\u672a\u30de\u30c3\u30d4\u30f3\u30b0')) break
  }

  return mappings
}

// ============================================================
// 未マッピング検出
// ============================================================

/**
 * src/plugins/ 配下の config.ts を再帰的にスキャンして
 * { pluginType, pluginId, paramIds } を返す。
 */
function scanPluginParams(): Array<{
  pluginType: string
  pluginId: string
  paramIds: string[]
}> {
  const results: Array<{ pluginType: string; pluginId: string; paramIds: string[] }> = []
  const pluginsRoot = join(ROOT, 'src', 'engine')
  const types = ['geometry', 'fx', 'particles']

  for (const pType of types) {
    const typeDir = join(pluginsRoot, pType)
    if (!existsSync(typeDir)) continue

    for (const pluginDir of readdirSync(typeDir, { withFileTypes: true })) {
      if (!pluginDir.isDirectory()) continue
      const configPath = join(typeDir, pluginDir.name, 'config.ts')
      if (!existsSync(configPath)) continue

      const src = readFileSync(configPath, 'utf-8')
      // params ブロック内の paramId を抽出（インデント2〜4スペース + 識別子 + ": {" パターン）
      const paramIds = [...src.matchAll(/^\s{2,4}(\w+):\s*\{/gm)]
        .map((m) => m[1])
        .filter(
          (id) =>
            !['params', 'cameraPreset', 'position', 'lookAt', 'mode', 'orbit', 'aerial'].includes(
              id
            )
        )

      const pluginType = pType === 'particles' ? 'particle' : pType
      results.push({ pluginType, pluginId: pluginDir.name, paramIds })
    }
  }

  return results
}

// ============================================================
// メイン
// ============================================================

function main(): void {
  const mdPath = join(ROOT, 'docs', 'spec', 'cc-mapping.md')
  const outPath = join(ROOT, 'settings', 'cc-map.json')

  if (!existsSync(mdPath)) {
    console.error(`cc-mapping.md が見つかりません: ${mdPath}`)
    process.exit(1)
  }

  // パース
  const mappings = parseCcMapping(mdPath)
  const total = mappings.reduce((acc, m) => acc + m.params.length, 0)

  // JSON 生成
  const output: CcMapJson = {
    version: '0.2',
    generatedAt: new Date().toISOString(),
    generatedFrom: 'docs/spec/cc-mapping.md',
    mappings,
  }

  writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8')
  console.log(`cc-map.json を生成しました (${total} mappings)`)
  console.log(`出力先: ${outPath}`)

  // 未マッピング検出
  const pluginParams = scanPluginParams()
  const warnings: string[] = []

  for (const { pluginType, pluginId, paramIds } of pluginParams) {
    const mapped = mappings.find((m) => m.pluginId === pluginId)
    const mappedIds = mapped ? mapped.params.map((p) => p.paramId) : []

    for (const paramId of paramIds) {
      if (!mappedIds.includes(paramId)) {
        warnings.push(`  ${pluginType}/${pluginId}: ${paramId}`)
      }
    }
  }

  if (warnings.length > 0) {
    console.log('')
    console.log('WARNING: 以下の paramId が cc-mapping.md に未記載です:')
    for (const w of warnings) console.log(w)
    console.log('')
    console.log('docs/spec/cc-mapping.md を更新後、再度 pnpm gen:cc-map を実行してください')
  }
}

main()
