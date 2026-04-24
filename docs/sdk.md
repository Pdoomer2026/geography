# GeoGraphy SDK 仕様書 v1.0

> 作成日: 2026-04-15（Day62）  
> ステータス: Window SDK 確定版。型定義・Hooks・engine ファサード 実装済み。  
> 関連ドキュメント: `docs/commercialization.md` / `docs/spec/cc-mapping.md` / `docs/spec/transport-architecture.spec.md`

---

## 1. 哲学：Everything is a Slot & Minimal Glue

GeoGraphy は特定のライブラリに依存する「フレームワーク」ではなく、  
**Registry（状態の対照表）を介してあらゆる要素を接続する「メタ・プラットフォーム」**である。

- **Engine（Output）** も **Window（Input/UI）** も、Registry に接続される等価な「Slot」として扱う
- SDK は UI パーツを提供せず、Registry への「通信路」と「地図（型定義）」の提供に特化する
- Window Plugin 開発者は `engine` だけを知っていればよい

---

## 2. 三層分離アーキテクチャ

### 2.1 Engine Slot（Output）- "The Sacred Core"

- **役割**: Registry の値を購読し、リアルタイム描画に変換する
- **将来**: 核心ロジックを WASM 化してブラックボックス化する
- **自由度**: Three.js / PixiJS / OpenLayers など、Registry から値を受け取れれば何でも Slot になれる

### 2.2 Registry（Hub）- "The Single Source of Truth"

- **役割**: `ccNumber` と `value` の管理、イベントのルーティング
- **Manifest**: `cc-mapping.md` → `cc-map.json` → `geo-types.generated.d.ts` の自動生成パイプライン
- **境界**: Window は Registry に直接アクセスできない。`engine` ファサード経由のみ

### 2.3 Window Slot（Input/Control）- "The Pluggable UI"

- **役割**: Registry へ値を送信し、システムを制御する
- **構成**: React + `useParam` / `useAllParams` Hook を「接着剤」として外部 UI と接続する
- **ルール**: `engine` のみを import する。コアシングルトンへの直接アクセス禁止

---

## 3. engine ファサード API（公開 API 確定版）

Window Plugin 開発者が使える API の完全なリストです。  
これ以外のコア内部（`transportRegistry` / `assignRegistry` / `transportManager`）は非公開です。

### 3.1 値の送受信

```typescript
// 値の送信（Window → コア）
// 全 Window・物理 MIDI の唯一の入り口
engine.handleMidiCC(event: TransportEvent): void

// Sequencer / LFO からの変調値送信
engine.receiveMidiModulation(knobId: string, value: number): void
```

### 3.2 パラメータ取得

```typescript
// Registry のスナップショット（構造情報 + syncValue で更新された値）
engine.getParameters(layerId?: string): RegisteredParameterWithCC[]

// plugin.params の生値付き（GeoMonitor 専用・毎回最新値を返す）
engine.getParametersLive(layerId?: string): RegisteredParameterWithCC[]
```

### 3.3 Registry 購読

```typescript
// Registry の構造変化（register / clear）を購読する
// 返り値は unsubscribe 関数。useEffect の return で呼ぶこと
engine.onRegistryChanged(cb: () => void): () => void
```

### 3.4 Plugin 登録・削除

```typescript
// Geometry Plugin を Registry に登録（Plugin 切り替え時）
engine.registerPluginToTransportRegistry(layerId: string, pluginId: string): void

// Geometry Plugin の Registry エントリを削除（Plugin 削除時）
engine.removePluginFromRegistry(layerId: string): void

// Camera Plugin を Registry に登録（Camera 切り替え時）
engine.registerCameraToTransportRegistry(layerId: string): void
```

### 3.5 MacroKnob / AssignRegistry

```typescript
// ノブ一覧・設定の取得と更新
engine.getMacroKnobs(): MacroKnobConfig[]
engine.setMacroKnob(id: string, config: MacroKnobConfig): void

// 現在値の取得と更新（0.0〜1.0）
engine.getMacroKnobValue(knobId: string): number
engine.setMacroKnobValue(knobId: string, value: number): void

// アサインの追加・削除
engine.addMacroAssign(knobId: string, assign: MacroAssign): void
engine.removeMacroAssign(knobId: string, paramId: string): void

// 指定 paramId にアサインされている全ノブを返す
engine.getAssignsForParam(paramId: string): { knobId: string; assign: MacroAssign }[]
```

### 3.6 Geometry / Camera / FX

```typescript
// Geometry
engine.getGeometryPlugin(layerId: string): GeometryPlugin | null
engine.getAllLayerPlugins(): { layerId: string; plugin: GeometryPlugin }[]
engine.setGeometryParam(layerId: string, paramKey: string, value: number): void
engine.setLayerPlugin(layerId: string, pluginId: string | null): void
engine.getRegisteredPlugins(): { id: string; name: string }[]

// Camera
engine.getCameraPlugin(layerId: string): CameraPlugin | null
engine.setCameraPlugin(layerId: string, pluginId: string): void
engine.listCameraPlugins(): CameraPlugin[]

// FX
engine.getFxPlugins(layerId?: string): FXPlugin[]
engine.setFxEnabled(fxId: string, enabled: boolean, layerId?: string): void

// コールバック（FX enabled 変化通知）
engine.onFxChanged(cb: () => void): void
```

### 3.7 Layer / Scene

```typescript
engine.getLayers(): Layer[]
engine.getLayerRoutings(): LayerRouting[]
engine.setLayerRouting(layerId, outputOpacity, editOpacity): void
engine.getScreenAssign(): ScreenAssignState
engine.swapScreenAssign(): void
engine.getSceneState(): SceneState
engine.buildProject(name: string): GeoGraphyProject
```

---

## 4. Minimal Glue Hooks（確定版）

`src/ui/hooks/useParam.ts` で提供する React Hook。  
Window Plugin 開発者は自前で `onRegistryChanged` / `setInterval` を書かなくてよい。

### 4.1 `useParam`（標準パターン）

```typescript
/**
 * 指定 layerId + pluginId のパラメータ一覧をリアルタイムで返す。
 * Registry の構造変化（register/clear）で即時更新される。
 *
 * @param layerId   対象レイヤー ID（'layer-1' 等）
 * @param pluginId  対象 Plugin ID（'icosphere' 等）
 */
export function useParam(
  layerId: string,
  pluginId: string
): RegisteredParameterWithCC[]
```

**使用例:**

```tsx
function MyGeometryWindow() {
  const [activeLayer, setActiveLayer] = useState('layer-1')
  const geo = engine.getGeometryPlugin(activeLayer)
  const params = useParam(activeLayer, geo?.id ?? '')

  return (
    <>
      {params.map((p) => (
        <input
          key={p.ccNumber}
          type="range"
          min={p.min} max={p.max} step={p.step} value={p.value}
          onChange={(e) => {
            const normalized = (parseFloat(e.target.value) - p.min) / (p.max - p.min)
            engine.handleMidiCC({ slot: p.ccNumber, value: normalized, source: 'window', layerId: activeLayer })
          }}
        />
      ))}
    </>
  )
}
```

### 4.2 `useAllParams`（GeoMonitor 専用）

```typescript
/**
 * TransportRegistry の全パラメータを plugin.params の生値で返す。
 * 値の変化は 100ms ポーリングで検知。構造変化は即時反映。
 *
 * @param layerId  省略時は全レイヤー。指定するとそのレイヤーのみ。
 */
export function useAllParams(layerId?: string): RegisteredParameterWithCC[]
```

---

## 5. Dynamic Type Definition（確定版）

### 5.1 パイプライン

```
docs/spec/cc-mapping.md   ← 人間が編集する唯一の真実（SSoT）
  ↓ pnpm gen:cc-map
settings/cc-map.json       ← 自動生成・手動編集禁止
  ↓ pnpm gen:types
src/types/geo-types.generated.d.ts   ← 型定義・手動編集禁止
src/types/geo-cc-map.generated.ts    ← 実行時定数・手動編集禁止
```

**コマンド:**

```bash
pnpm gen:cc-map   # cc-mapping.md → cc-map.json のみ
pnpm gen:types    # cc-map.json → 型定義のみ
pnpm gen:all      # 両方を順番に実行（通常はこれを使う）
```

### 5.2 生成される型定義

```typescript
// Plugin ID ユニオン型
type GeometryPluginId = 'icosphere' | 'torus' | 'torusknot' | 'contour' | 'hex-grid' | 'grid-tunnel' | 'grid-wave'
type FxPluginId = 'bloom' | 'after-image' | 'feedback' | 'color-grading' | ...
type ParticlePluginId = 'starfield'
type PluginId = GeometryPluginId | FxPluginId | ParticlePluginId

// pluginId → 有効な paramId の条件型
type ParamIdOf<T extends PluginId> =
  T extends 'icosphere' ? 'radius' | 'detail' | 'speed' | 'hue' :
  T extends 'torus'     ? 'radius' | 'tube' | 'tubularSegs' | 'radialSegs' | 'speed' | 'hue' :
  ...

// CC番号・min/max を実行時に参照するための定数型
interface GeoParamMeta {
  ccNumber: number
  pluginMin: number
  pluginMax: number
  block: string
  blockName: string
}
type GeoParamMap = { [pluginId in PluginId]: { [paramId: string]: GeoParamMeta } }
```

### 5.3 実行時定数

```typescript
import { GEO_CC_MAP } from './types/geo-cc-map.generated'

// Sequencer のレーン設定でハードコードを避ける
const cc = GEO_CC_MAP['icosphere']['radius'].ccNumber  // → 11101（型安全）
const min = GEO_CC_MAP['icosphere']['radius'].pluginMin // → 0.5
```

### 5.4 新 Plugin 追加時のフロー

```
① cc-mapping.md に新 Plugin のセクションを追記（paramId / CC番号 / min / max）
② pnpm gen:all を実行
③ IDE 補完が即座に更新される
④ タイポや存在しない paramId は tsc がコンパイルエラーで検出
```

---

## 6. Window Plugin 開発ガイド

### 6.1 最小構成の Window Plugin

```tsx
// src/plugins/windows/my-window/MyWindow.tsx

import { useState } from 'react'
import { engine } from '../../../core/engine'
import { useParam } from '../../../ui/hooks/useParam'
import { useDraggable } from '../../../ui/useDraggable'

export function MyWindow() {
  const [activeLayer, setActiveLayer] = useState<'layer-1' | 'layer-2' | 'layer-3'>('layer-1')
  const geo = engine.getGeometryPlugin(activeLayer)
  const params = useParam(activeLayer, geo?.id ?? '')
  const { pos, handleMouseDown } = useDraggable({ x: 16, y: 16 })

  return (
    <div className="fixed z-50" style={{ left: pos.x, top: pos.y }}>
      <div onMouseDown={handleMouseDown}>MY WINDOW</div>
      {params.map((p) => (
        <div key={p.ccNumber}>
          <span>{p.name}</span>
          <input
            type="range"
            min={p.min} max={p.max} step={p.step} value={p.value}
            onChange={(e) => {
              const normalized = (parseFloat(e.target.value) - p.min) / (p.max - p.min)
              engine.handleMidiCC({
                slot: p.ccNumber,
                value: Math.min(1, Math.max(0, normalized)),
                source: 'window',
                layerId: activeLayer,
              })
            }}
          />
        </div>
      ))}
    </div>
  )
}
```

### 6.2 Window Plugin の禁止事項

```typescript
// ❌ コアシングルトンへの直接アクセス禁止
import { transportRegistry } from '../../../core/transportRegistry'
import { assignRegistry } from '../../../core/assignRegistry'
import { transportManager } from '../../../core/transportManager'

// ✅ engine ファサード経由のみ
import { engine } from '../../../core/engine'
```

### 6.3 型安全な paramId の使い方

```typescript
import type { ParamIdOf } from '../../../types/geo-types.generated'

// IDE が 'radius' | 'detail' | 'speed' | 'hue' を補完する
type IcoParams = ParamIdOf<'icosphere'>

// Sequencer のレーン定義（ハードコード不要）
const lane = {
  pluginId: 'icosphere' as const,
  paramId: 'radius' as ParamIdOf<'icosphere'>,  // IDE 補完・型安全
  ccNumber: GEO_CC_MAP['icosphere']['radius'].ccNumber,
}
```

---

## 7. GeoMonitor（デバッグツール）

### 7.1 概要

- キー `6` でトグル表示
- `engine.getParametersLive()` で plugin.params を直接読む（100ms ポーリング）
- 構造変化（register/clear）は `onRegistryChanged` で即時反映

### 7.2 `getParameters` vs `getParametersLive` の違い

| API | value の源泉 | 用途 |
|---|---|---|
| `getParameters()` | Registry のスナップショット（syncValue 経由） | Window の購読（useParam） |
| `getParametersLive()` | plugin.params を毎回直接読む | GeoMonitor のリアルタイム表示 |

### 7.3 発見できる問題

- CC 番号の衝突（複数 FX が同じ CC を共有しているとき複数の値バーが同時に動く）
- 値が流れていない経路（バーが動かない）
- 想定外のパラメータ登録（グループ表示で確認）

---

## 8. CC 番号体系

```
CC [万の位] [千の位] [百の位] [下2桁]

万の位  ライブラリ    1=Three.js / 2=将来（PixiJS 等）
千の位  種別          1=Geometry / 2=Camera / 3=Particle / 4=FX / 5=Shader（将来）
百の位  セマンティック 1=EXISTENCE / 2=FORM / 3=MOTION / 4=COLOR / 5=SPACE / 6=EDGE / 7=BLEND
下2桁   連番          01〜99（同一セマンティック内での識別）
```

**例:**
```
CC11101 → Three.js / Geometry / EXISTENCE / 01番目
CC12301 → Three.js / Camera   / MOTION    / 01番目
CC14601 → Three.js / FX       / EDGE      / 01番目
```

**⚠️ 既知の問題（Day62 発見）:**  
同一セマンティックの FX（例: 全 FX の `EXISTENCE/Primary Amount`）が CC14101 を共有しており  
同一レイヤー内で CC 衝突が発生する。`cc-mapping.md` の下2桁を FX ごとに一意化することで解決予定。

---

## 9. 将来の拡張ポイント

### 9.1 Sequencer Window（Phase 16 予定）

```typescript
// Sequencer はこの SDK の上に構築される
// GEO_CC_MAP で CC番号を型安全に参照
// engine.receiveMidiModulation() で変調値を送信
// useParam() で値の変化を購読
```

### 9.2 外部 Window Plugin（将来の Plugin SDK 公開後）

```bash
npm install @geography/sdk
```

```typescript
import { useParam, engine } from '@geography/sdk'
import type { GeometryPluginId, ParamIdOf } from '@geography/sdk'
// 型補完・型安全な Window Plugin が外部開発者でも書ける
```

### 9.3 AI Context Generator（cc-map.json 活用）

`settings/cc-map.json` を AI（Claude / Cursor）に渡すことで、  
「どの CC 番号がどのパラメータか」を AI が把握した状態で Window Plugin を生成できる。  
→ `CLAUDE.md` + `cc-map.json` の組み合わせが既にこの役割を果たしている。

---

## 10. 変更履歴

| バージョン | 日付 | 内容 |
|---|---|---|
| v1.0 | 2026-04-15 | Day62 の実装を踏まえて初版作成。engine ファサード・useParam Hook・型生成パイプライン・GeoMonitor を確定版として記載 |
