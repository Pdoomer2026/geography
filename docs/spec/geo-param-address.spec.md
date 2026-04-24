# GeoParamAddress Spec

> SSoT: このファイル
> 担当: Claude Desktop（設計） / Claude Code（実装）
> 状態: Day73 設計確定・実装前にプロジェクトファイル変換が必要

---

## 1. 目的

GeoGraphy 内に複数の ID が混在しており、AI・人間ともに可読性が低い。

```
layerId   → 'layer-1'
pluginId  → 'icosphere'
paramId   → 'scale'
ccNumber  → 110
slot      → (ccNumber と混用)
```

これらを一意に束ねる **GeoParamAddress** を導入し、
ParameterStore のキーおよび MacroAssign の参照をこの ID に統一する。

### 導入で得られるもの

| 改善 | 内容 |
|---|---|
| AI 可読性 | `geo://layer-1/icosphere/scale` → 即読める |
| レイヤー誤作動防止 | layerId が Address に含まれるため CC が別レイヤーに誤作動しない |
| Sequencer target 指定 | `geo://layer-1/icosphere/scale` で直接指定できる |
| エンジン非依存 | PixiJS・WebGPU 等どのエンジンが来ても Address は変わらない |

---

## 2. GeoParamAddress の仕様

### 2-1. フォーマット

```
geo://{layerId}/{pluginId}/{paramId}

例:
  geo://layer-1/icosphere/scale
  geo://layer-2/bloom/strength
  geo://layer-1/static-camera/posY
  geo://layer-2/icosphere/scale  ← 同 plugin でもレイヤーが違えば別 Address
```

### 2-2. 設計原則

- `geo://` プレフィックスにより他の ID と絶対に混同しない
- スラッシュ区切りで階層が一目瞭然
- `ccNumber`（数値）と型レベルで区別できる（string vs number）
- OSC（Open Sound Control）互換 → 将来のネットワーク連携に自然に繋がる

### 2-3. 型定義

```typescript
/** GeoGraphy 固有のパラメーター一意識別子 */
export type GeoParamAddress = string

/** GeoParamAddress を生成する */
export const toGeoParamAddress = (
  layerId: string,
  pluginId: string,
  paramId: string,
): GeoParamAddress => `geo://${layerId}/${pluginId}/${paramId}`

/** GeoParamAddress を分解する */
export const parseGeoParamAddress = (
  addr: GeoParamAddress,
): { layerId: string; pluginId: string; paramId: string } | null => {
  if (!addr.startsWith('geo://')) return null
  const parts = addr.slice(6).split('/')
  if (parts.length !== 3) return null
  const [layerId, pluginId, paramId] = parts
  return { layerId, pluginId, paramId }
}
```

---

## 3. ccNumber / paramId の役割変更

ccNumber と paramId は「玄関（入力の受け口）」として残す。
内部では GeoParamAddress に変換してから処理する。

```
対応表:
  cc-mapping.md  → 3種（geoParamAddress / paramId / ccNumber）+ セマンティック情報
  cc-map.json    → 変更なし（pluginId → paramId → ccNumber のまま）
                   ※ geoParamAddress はランタイムで layerId を加えて生成する

変換が起きる唯一の場所:
  engine.ts の initTransportRegistry() 内
  → toGeoParamAddress(layerId, plugin.id, p.id) で付与
```

```
MIDI CC 110 が来る
  ↓
TransportRegistry.resolve(110)
  → RegisteredParameterWithCC { geoParamAddress: 'geo://layer-1/icosphere/scale', ... }
  ↓
ParameterStore.set('geo://layer-1/icosphere/scale', 0.7)
  ↓
flushParameterStore()
  → allValues.get(entry.geoParamAddress) でそのまま取得
  → plugin.params['scale'].value = rangeMap(0.7, min, max)
```

---

## 4. 実装前の必須作業（⚠️ 実装より先に行うこと）

### 既存プロジェクトファイルの変換

**実装を開始する前に**、既存の `.geo` プロジェクトファイルを
新フォーマットに変換するスクリプトを実行し、
変換済みの状態で実装に入る。

```
変換前（旧フォーマット）:
  MacroAssign { paramId: 'scale', ccNumber: 110, layerId: 'layer-1' }

変換後（新フォーマット）:
  MacroAssign { geoParamAddress: 'geo://layer-1/icosphere/scale', ccNumber: 110 }
```

変換スクリプトの実行 → 変換済みファイルの確認・保存 → 実装開始。
マイグレーションレイヤーは**コードに含めない**。

---

## 5. 影響範囲

### 5-1. 新規ファイル

```
src/application/schema/geoParamAddress.ts   ← 型 + ユーティリティ
```

### 5-2. `src/application/schema/midi-registry.ts`

`RegisteredParameterWithCC` に `geoParamAddress` フィールドを追加。

```typescript
export interface RegisteredParameterWithCC extends RegisteredParameter {
  ccNumber: number
  value: number
  geoParamAddress: GeoParamAddress  // ← 追加
}
```

### 5-3. `src/application/orchestrator/engine.ts`

**① initTransportRegistry() — geoParamAddress を付与**

```typescript
const enriched = plugin.getParameters().map((p) => ({
  ...p,
  layerId,
  pluginId: plugin.id,
  ccNumber: ccMapService.getCcNumber(plugin.id, p.id),
  geoParamAddress: toGeoParamAddress(layerId, plugin.id, p.id),  // ← 追加
  value: plugin.params[p.id]?.value ?? p.min,
}))
```

**② flushParameterStore() — lookup キーを変更**

```typescript
// 変更前
const storeValue = allValues.get(`${entry.layerId}:${entry.ccNumber}`)

// 変更後
const storeValue = allValues.get(entry.geoParamAddress)
```

**③ setLayerPlugin() — Plugin 切り替え時のクリーンアップ**

Plugin を切り替えるとき、古い GeoParamAddress が ParameterStore に残り続ける問題を防ぐ。

```typescript
setLayerPlugin(layerId: string, pluginId: string | null): void {
  // 既存 plugin の GeoParamAddress を ParameterStore から削除
  const oldPlugin = this.getGeometryPlugin(layerId)
  if (oldPlugin) {
    for (const paramId of Object.keys(oldPlugin.params)) {
      this.parameterStore.delete(toGeoParamAddress(layerId, oldPlugin.id, paramId))
    }
  }
  // ... 既存の処理
}
```

※ `ParameterStore.delete()` メソッドの追加が必要。

### 5-4. `src/application/registry/transportManager.ts`

**store.set() のキーを GeoParamAddress に変更（3箇所）**

```typescript
// 変更前
this.store.set(`${event.layerId}:${event.slot}`, event.value)

// 変更後
const entries = transportRegistry.getAll().filter(
  (p) => p.ccNumber === event.slot && p.layerId === event.layerId
)
for (const entry of entries) {
  this.store.set(entry.geoParamAddress, event.value)
}
```

### 5-5. `src/application/schema`（MacroAssign 型）

```typescript
// 変更前
interface MacroAssign {
  paramId: string
  ccNumber: number
  layerId?: string
  // ...
}

// 変更後
interface MacroAssign {
  geoParamAddress: GeoParamAddress  // ← paramId の代わり
  ccNumber: number
  // ...
}
```

---

## 6. 変更しないもの

| ファイル | 理由 |
|---|---|
| `ParameterStore` 本体 | キーは `string` のまま（delete メソッド追加のみ） |
| `TransportRegistry` | `resolve()` は ccNumber ベースのまま |
| `cc-map.json` | ランタイムで layerId を加えて geoParamAddress を生成するため変更不要 |
| `plugin.params` への書き込み | entry の id / layerId / pluginId をそのまま使う |

---

## 7. 実装ステップ（実装前変換完了後）

```
Step 0: 既存 .geo プロジェクトファイルを変換スクリプトで新フォーマットに変換（実装前）

Step 1: geoParamAddress.ts 新規作成（型 + ユーティリティ）
Step 2: ParameterStore に delete() メソッド追加
Step 3: midi-registry.ts に geoParamAddress フィールド追加
Step 4: MacroAssign 型を geoParamAddress ベースに変更
Step 5: engine.ts の initTransportRegistry() で geoParamAddress を付与
Step 6: engine.ts の flushParameterStore() の lookup を変更
Step 7: engine.ts の setLayerPlugin() にクリーンアップ追加
Step 8: transportManager.ts の store.set() を GeoParamAddress に変更
Step 9: pnpm tsc --noEmit + pnpm test --run 両通過確認
```

---

## 8. 完了条件（CDD 原則）

```bash
pnpm tsc --noEmit   # 型エラーゼロ
pnpm test --run     # 129 tests グリーン
```

- `GeoParamAddress` が `geo://` で始まる
- `parseGeoParamAddress()` が不正な入力で `null` を返す
- `flushParameterStore()` が GeoParamAddress で正しく値を取得できる
- Plugin 切り替え時に古い GeoParamAddress が ParameterStore から削除される
- MacroAssign が geoParamAddress を持つ
- 既存のパラメーター操作（スライダー・MIDI CC）が正常動作する

---

## 9. 関連ファイル

| ファイル | 関係 |
|---|---|
| `src/application/schema/geoParamAddress.ts` | 新規（型 + ユーティリティ） |
| `src/application/schema/midi-registry.ts` | `RegisteredParameterWithCC` に追加 |
| `src/application/orchestrator/engine.ts` | initTransportRegistry / flushParameterStore / setLayerPlugin |
| `src/application/registry/transportManager.ts` | `store.set()` キー変更 |
| `docs/spec/cc-mapping.md` | 3種対応表に更新（geoParamAddress 列追加） |
| `docs/spec/sequencer-window.spec.md` | Sequencer の target 指定に GeoParamAddress を使う（将来） |
