# GeoParamAddress Spec

> SSoT: このファイル
> 担当: Claude Desktop（設計） / Claude Code（実装）
> 状態: Day73 設計確定・実装前確認待ち

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
ParameterStore のキーをこの ID に統一する。

---

## 2. GeoParamAddress の仕様

### 2-1. フォーマット

```
geo://{layerId}/{pluginId}/{paramId}

例:
  geo://layer-1/icosphere/scale
  geo://layer-2/bloom/strength
  geo://layer-1/static-camera/posY
```

### 2-2. 設計原則

- `geo://` プレフィックスにより他の ID と絶対に混同しない
- スラッシュ区切りで階層が一目瞭然
- `ccNumber`（数値）と型レベルで区別できる（string vs number）
- OSC（Open Sound Control）互換 → 将来のネットワーク連携に自然に繋がる
- AI 可読性: `geo://layer-1/icosphere/scale` → 「L1の icosphere の scale」と即読める

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

## 3. ccNumber の役割変更

ccNumber は「玄関（入力の受け口）」として残す。
内部では GeoParamAddress に変換してから処理する。

```
MIDI CC 110 が来る
  ↓
TransportRegistry.resolve(110)
  → RegisteredParameterWithCC { geoParamAddress: 'geo://layer-1/icosphere/scale', ... }
  ↓
ParameterStore.set('geo://layer-1/icosphere/scale', 0.7)
  ↓
flushParameterStore()
  → parseGeoParamAddress() で layerId / pluginId / paramId を取り出す
  → plugin.params['scale'].value = rangeMap(0.7, min, max)
```

---

## 4. 影響範囲（3ファイルのみ）

### 4-1. `src/application/schema/midi-registry.ts`

`RegisteredParameterWithCC` に `geoParamAddress` フィールドを追加。

```typescript
export interface RegisteredParameterWithCC extends RegisteredParameter {
  ccNumber: number
  value: number
  geoParamAddress: GeoParamAddress  // ← 追加
}
```

**生成タイミング**: `engine.ts` の `initTransportRegistry()` 内で
`toGeoParamAddress(layerId, pluginId, p.id)` を呼んで付与する。

---

### 4-2. `src/application/registry/transportManager.ts`

**変更箇所: 3箇所の `store.set()`**

#### 変更前（現在）
```typescript
// handle() 内
this.store.set(`${event.layerId}:${event.slot}`, event.value)

// handle() 内（MIDI 全マッチ）
this.store.set(`${entry.layerId}:${event.slot}`, event.value)

// receiveModulation() 内
this.store.set(`${entry.layerId}:${assign.ccNumber}`, mapped)
```

#### 変更後
```typescript
// handle() 内
// layerId がある場合: TransportRegistry から geoParamAddress を取得して書く
const entries = transportRegistry.getAll().filter(
  (p) => p.ccNumber === event.slot && p.layerId === event.layerId
)
for (const entry of entries) {
  this.store.set(entry.geoParamAddress, event.value)
}

// handle() 内（MIDI 全マッチ・layerId なし）
for (const entry of entries) {
  this.store.set(entry.geoParamAddress, event.value)
}

// receiveModulation() 内
for (const entry of entries) {
  this.store.set(entry.geoParamAddress, mapped)
}
```

---

### 4-3. `src/application/orchestrator/engine.ts`

**変更箇所: `flushParameterStore()` 内の 1箇所**

#### 変更前（現在）
```typescript
const storeValue = allValues.get(`${entry.layerId}:${entry.ccNumber}`)
```

#### 変更後
```typescript
const storeValue = allValues.get(entry.geoParamAddress)
```

---

## 5. 変更しないもの

| ファイル | 理由 |
|---|---|
| `ParameterStore` 本体 | キーは `string` のまま。変更なし |
| `TransportRegistry` | `resolve()` は ccNumber ベースのまま。変更なし |
| `ccNumber` の仕組み | 入力側（MIDI受信）は変更なし |
| `plugin.params` への書き込み | `parseGeoParamAddress()` で paramId を取り出すだけ |
| `assignRegistry.ts` の MacroKnob 値 | 別系統のため今回スコープ外 |

---

## 6. MacroKnob アサインの扱い（スコープ外・将来）

`transportManager.ts` 内の MacroKnob アサイン系の `store.set()` は
現在 `assign.paramId` をキーとして使っており、別系統になっている。
今回の変更スコープ外とし、将来の MacroKnob 仕様改定時に合わせて対応する。

---

## 7. 新規ファイル

```
src/application/schema/geoParamAddress.ts   ← 型 + ユーティリティ
```

---

## 8. 実装ステップ

```
Step 1: geoParamAddress.ts 新規作成（型 + ユーティリティ）
Step 2: midi-registry.ts に geoParamAddress フィールド追加
Step 3: engine.ts の initTransportRegistry() 等で geoParamAddress を付与
Step 4: transportManager.ts の store.set() を GeoParamAddress に変更
Step 5: engine.ts の flushParameterStore() の lookup を変更
Step 6: pnpm tsc --noEmit + pnpm test --run 両通過確認
```

---

## 9. 完了条件（CDD 原則）

```bash
pnpm tsc --noEmit   # 型エラーゼロ
pnpm test --run     # 129 tests グリーン（既存テストが壊れていないこと）
```

- `GeoParamAddress` が `geo://` で始まる
- `parseGeoParamAddress()` が不正な入力で `null` を返す
- `flushParameterStore()` が GeoParamAddress で正しく値を取得できる
- 既存のパラメーター操作（スライダー・MIDI CC）が正常動作する

---

## 10. 関連ファイル

| ファイル | 関係 |
|---|---|
| `src/application/schema/geoParamAddress.ts` | 新規（型 + ユーティリティ） |
| `src/application/schema/midi-registry.ts` | `RegisteredParameterWithCC` に追加 |
| `src/application/orchestrator/engine.ts` | `flushParameterStore()` 変更 |
| `src/application/registry/transportManager.ts` | `store.set()` キー変更 |
| `docs/spec/sequencer-window.spec.md` | Sequencer の target 指定に GeoParamAddress を使う（将来） |
