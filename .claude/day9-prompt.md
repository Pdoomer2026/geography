## Day 9 タスク：engine.ts に grid-wave Plugin を統合し画面に映像を映す

### 目的
現在の `engine.ts` は Plugin Registry の update() を呼んでいるが、
`create()` を呼ぶ処理が存在しない（scene に何も追加されない状態）。
grid-wave Plugin の `create()` を engine の初期化フローに組み込み、
実際に Three.js Scene に映像を映す。

---

### 前提知識（読み込むべきファイル）
実装前に以下を必ず読むこと：

- `geography/CLAUDE.md`（設計原則・engine.ts は App.tsx に依存しない）
- `src/core/CLAUDE.md`（エンジン設計・Plugin 統合方針）
- `src/core/engine.ts`（現在の実装）
- `src/core/registry.ts`（Plugin Registry の API）
- `src/plugins/geometry/wave/grid-wave/index.ts`（grid-wave Plugin）
- `src/types/index.ts`（GeometryPlugin・SceneState・LayerState の型）
- `src/core/programBus.ts`（ProgramBus の load() / getState()）
- `src/core/previewBus.ts`（PreviewBus の update()）

---

### 実装タスク一覧（順番どおりに進める）

#### タスク 1：`engine.ts` の `initialize()` に Plugin `create()` 呼び出しを追加する

`registerGeometryPlugins()` / `registerLightPlugins()` / `registerParticlePlugins()` の
自動登録が完了した後に、登録済み Plugin の `create()` を呼び出す処理を追加する。

```typescript
// Plugin の create() を scene に適用（登録済みのものを全て）
for (const plugin of registry.list()) {
  if (plugin.enabled && this.scene) {
    plugin.create(this.scene)
  }
}
```

この処理は `initialize()` の末尾・`window.addEventListener('resize', this.onResize)` より前に追加する。

#### タスク 2：初期 SceneState を生成して ProgramBus・PreviewBus に渡す

`initialize()` の末尾で、grid-wave Plugin のパラメーターから初期 SceneState を生成し、
`programBus.load()` と `previewBus.update()` に渡す。

```typescript
// 初期 SceneState を生成
const initialState: SceneState = {
  layers: registry.list()
    .filter((p) => p.enabled)
    .map((p) => ({
      geometryId: p.id,
      geometryParams: Object.fromEntries(
        Object.entries(p.params).map(([k, v]) => [k, v.value])
      ),
      fxStack: [],
      opacity: 1,
      blendMode: 'normal',
    })),
}
programBus.load(initialState)
previewBus.update(initialState)
```

import 追加が必要：
- `import { programBus } from './programBus'`
- `import { previewBus } from './previewBus'`
- `import type { SceneState } from '../types'`

#### タスク 3：`dispose()` に Plugin `destroy()` 呼び出しを追加する

現在の `dispose()` は renderer のクリーンアップのみ。Plugin の `destroy()` も呼ぶ。

```typescript
// Plugin のクリーンアップ
if (this.scene) {
  for (const plugin of registry.list()) {
    plugin.destroy?.(this.scene)
  }
}
```

`this.stop()` の直後・`window.removeEventListener` の前に追加する。

---

### 制約（必ず守ること）

- `engine.ts` は `App.tsx` に依存してはいけない（`programBus` / `previewBus` への import は OK）
- `GeometryPlugin` 以外（Light / Particle）も `create()` を持つため、全 Plugin に適用して問題ない
- Parameter Store を直接変更しない（今回のタスクでは Command パターン不要）
- 既存のテスト（34 tests）を壊さない

---

### 完了条件

1. `pnpm dev` でブラウザを開いたとき、画面に grid-wave の波形メッシュが表示される
2. SimpleMixer の PREVIEW エリアに canvas が表示され、「grid-wave」「1 layer(s)」のテキストが見える
3. `pnpm test --run` が 34 tests グリーンのまま

---

### 実装後にやること

1. `pnpm test --run 2>&1 | tee .claude/test-latest.txt` でテスト結果を保存
2. `git add -A && git commit -m "feat: Day9 - engine.ts grid-wave create/destroy + initial SceneState"`
3. 完了を報告する（実装した内容・変更したファイル一覧・テスト結果）
