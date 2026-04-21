# ParamCatalog Spec

> SSoT: このファイル
> 対応実装: `src/application/catalog/paramCatalog.ts`
> 担当: Claude Desktop（設計） / Claude Code（実装）
> 状態: Day69 設計・基本実装完了 / Day72 execution フラグ追加

---

## 1. 目的

Plugin パラメーターの「静的定義」を管理するカタログシステム。

### 解決する問題

現在の `PluginParam` は「静的定義」と「実行時状態」が混在している：

```typescript
// 現状（混在）
interface PluginParam {
  value: number       // 実行時状態（毎フレーム変わる）
  min: number         // 静的定義（変わらない）
  max: number         // 静的定義
  label: string       // 静的定義
  requiresRebuild?    // 静的定義
  rangeMin?           // UI 状態
  rangeMax?           // UI 状態
}
```

`ParamCatalog` はこれを分離し、静的定義を一元管理する：

```
ParamCatalogEntry  = 静的定義（何が存在するか・変わらない）
PluginParam        = 実行時状態（現在値・UI 可動域）
```

### UI 生成への道筋

将来的に UI はカタログを読むだけでスライダーを自動生成できる：

```typescript
// 将来の UI
createSlider(paramCatalog.opacity)
// → type / min / max / default / ui ヒントが全てカタログに揃っている
```

---

## 2. 型定義

### 2-1. ParamCatalogEntry

```typescript
export interface ParamCatalogEntry {
  /** paramId（Record のキーと一致・明示的に保持） */
  id: string
  /** UI 表示名 */
  label: string
  /** パラメーター型（v1 は number / boolean のみ） */
  type: 'number' | 'boolean'
  /** 最小値（type: 'number' のみ有効） */
  min: number
  /** 最大値（type: 'number' のみ有効） */
  max: number
  /** デフォルト値（Plugin リセット時に参照） */
  default: number
  /** UI スライダーのステップ（省略時 0.001） */
  step?: number
  /** UI ヒント（将来: 'select' / 'color' 等を追加） */
  ui: 'slider' | 'toggle'
  /**
   * true のとき、この param の変更で Geometry Plugin の destroy→create が発生する。
   * 頂点数・形状が変わる param（segments / detail / radius 等）に設定。
   * spec: docs/spec/geometry-plugin.spec.md §9
   */
  requiresRebuild?: boolean
  /**
   * この param の変更が引き起こす処理の実行戦略。
   * 省略時は 'sync'（デフォルト・リアルタイム即時反映）。
   * 'async' を指定すると ExecutionPlanner が BullMQ キューに投げる。
   *
   * 'async' を立てるべき処理の基準:
   *   - Shader コンパイル（GLSL → GPU）
   *   - segments が大きい重いメッシュ再生成
   *   - Google AI Studio への推論リクエスト
   *   - Supabase への書き込み
   *
   * spec: docs/spec/execution-planner.spec.md §4
   */
  execution?: 'sync' | 'async'
}
```

### 2-2. PluginCatalog

```typescript
export type PluginCatalog = Record<string, ParamCatalogEntry>
```

---

## 3. ヘルパー関数

### catalogEntryToPluginParam

カタログエントリから `PluginParam` の初期値を生成する。
Plugin 初期化時に `defaultParams` を生成するために使う。

```typescript
export function catalogEntryToPluginParam(entry: ParamCatalogEntry): PluginParam
```

### catalogToPluginParams

`PluginCatalog` 全体から `defaultParams` を一括生成する。
Plugin の `config.ts` でこれを呼ぶことで `defaultParams` の重複定義がなくなる。

```typescript
export function catalogToPluginParams(catalog: PluginCatalog): Record<string, PluginParam>
```

---

## 4. ModulatablePlugin への統合

`catalog` フィールドを optional で追加する（既存 Plugin を壊さない段階的移行）：

```typescript
export interface ModulatablePlugin extends PluginBase {
  /** 静的定義（optional・段階的移行） */
  catalog?: PluginCatalog
  params: Record<string, PluginParam>
  getParameters(): ParameterSchema[]
}
```

---

## 5. Plugin 実装パターン（Icosphere を基準とする）

```typescript
// [plugin].config.ts
import type { PluginCatalog } from '../../../../application/schema'
import { catalogToPluginParams } from '../../../../application/catalog/paramCatalog'

export const catalog: PluginCatalog = {
  detail: {
    id: 'detail', label: 'Detail', type: 'number',
    min: 0, max: 5, default: 2, step: 1,
    ui: 'slider', requiresRebuild: true,
  },
  speed: {
    id: 'speed', label: 'Speed', type: 'number',
    min: 0.0, max: 2.0, default: 0.3, step: 0.01,
    ui: 'slider',
  },
}

// catalog から defaultParams を派生（重複定義なし）
export const defaultParams = catalogToPluginParams(catalog)
```

```typescript
// index.ts
const plugin: GeometryPlugin = {
  id: 'icosphere',
  catalog,                         // 静的定義を持つ
  params: structuredClone(defaultParams),  // 実行時状態（catalog から派生）
  ...
}
```

---

## 6. 移行戦略

| フェーズ | 内容 |
|---|---|
| Day69 | 型定義 + ヘルパー実装。Icosphere のみ catalog 対応 |
| Day72 | 全 Geometry Plugin（7本）catalog 対応完了。`execution` フラグを型に追加 |
| 段階的 | 他の Plugin を順次 catalog 対応（tsc + test グリーンを維持） |
| Shader Plugin 前 | `execution: 'async'` を重い処理の param に付与。ExecutionPlanner Phase 2 を開通 |
| Plugin Store フェーズ | Zod 導入・外部 Plugin の実行時バリデーションに catalog を活用 |

---

## 7. 完了条件（CDD 原則）

```bash
pnpm tsc --noEmit   # 型エラーゼロ
pnpm test --run     # 全テストグリーン
```

- `ParamCatalogEntry` / `PluginCatalog` が `application/schema/index.ts` に定義されている
- `catalogToPluginParams` が `application/catalog/paramCatalog.ts` に実装されている
- `ModulatablePlugin.catalog` が optional で追加されている
- Icosphere の `defaultParams` が `catalogToPluginParams(catalog)` から派生している
- 既存の全 Plugin が tsc エラーなし

---

## 8. 配置

```
src/application/
  catalog/
    ccMapService.ts      （CC マッピング・既存）
    paramCatalog.ts      （型定義 + ヘルパー・Day69 新設）

src/application/schema/
  index.ts               （ParamCatalogEntry / PluginCatalog 型追加・Day69）
```
