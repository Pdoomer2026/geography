# Day25 — Setup Geometry 反映ログ
> spec: docs/spec/project-file.spec.md §5 Step 1
> 担当: Claude Desktop
> 日付: 2026-03-24

---

## 目標

Setup タブの Geometry チェックリストで選んだ Plugin を実際のレイヤーに割り当てる。
APPLY ボタンを押すと画面の描画が即座に変わる。

---

## ステップ記録

### Step 1: `engine.ts` に `applyGeometrySetup()` を追加 ✅

```typescript
applyGeometrySetup(selectedIds: string[]): void {
  const layers = layerManager.getLayers()
  layers.forEach((layer, index) => {
    const pluginId = selectedIds[index] ?? null
    this.setLayerPlugin(layer.id, pluginId)
  })
}
```

割り当てルール:
- `selectedIds[0]` → layer-1、`selectedIds[1]` → layer-2、`selectedIds[2]` → layer-3
- index が selectedIds の長さを超える → `plugin=null` + `mute=true`
- 空配列 → 全レイヤー mute

あわせて `buildProject()` を改善:
- 旧: `registry.list()` の全 Plugin を `setup.geometry` に入れていた
- 新: `layerManager.getLayers()` からアクティブ（mute=false）なレイヤーのみを使う

`restoreProject()` も更新:
- 旧: `loadSceneState()` のみ
- 新: `applyGeometrySetup(project.setup.geometry)` → `loadSceneState()` の順で実行

**変更ファイル**: `src/core/engine.ts`

---

### Step 2: `PreferencesPanel.tsx` の `handleApply()` を更新 ✅

```typescript
function handleApply() {
  // Geometry: allGeometry の登録順を維持して selectedGeometry でフィルタ
  const selectedGeometryIds = allGeometry
    .filter((p) => selectedGeometry.has(p.id))
    .map((p) => p.id)
  engine.applyGeometrySetup(selectedGeometryIds)

  // FX: チェックされた FX だけ create()、それ以外は destroy()
  const enabledFxIds = FX_ORDER.filter((fxId) => selectedFx[fxId] ?? false)
  engine.applyFxSetup(enabledFxIds)

  onApply()
}
```

ポイント: `allGeometry`（登録順）でフィルタすることで、
チェックボックスのチェック順ではなく**登録順**を layer 割り当て順として保持する。

**変更ファイル**: `src/ui/PreferencesPanel.tsx`

---

### Step 3: テスト追加 ✅

`tests/core/applyGeometrySetup.test.ts` を新規作成（6件）:

1. setPlugin で layer-1 に plugin が割り当てられ mute=false になる
2. setPlugin(null) で layer-1 が mute=true になる
3. applyGeometrySetup 相当: 1つ選択 → layer-1 にセット / layer-2,3 は mute
4. applyGeometrySetup 相当: 2つ選択 → layer-1,2 にセット / layer-3 は mute
5. applyGeometrySetup 相当: 空配列 → 全レイヤー mute
6. plugin.create() が setPlugin 時に呼ばれる
7. 上書き時に旧 plugin.destroy() が呼ばれる（6+1=7件）

---

## 完了条件確認（実行待ち）

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

期待結果:
- tsc: PASS（型エラーゼロ）
- tests: 104 passed（97 + 7 新規）
