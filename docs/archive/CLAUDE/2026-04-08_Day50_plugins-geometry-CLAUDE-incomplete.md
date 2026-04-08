# src/plugins/geometry - CLAUDE.md

## 役割

GeoGraphy の主役。Three.js で幾何学パターンを描画する。

---

## Geometry Plugin Interface

```typescript
interface GeometryPlugin extends ModulatablePlugin {
  create(scene: THREE.Scene): void
  update(delta: number, beat: number): void
  destroy(scene: THREE.Scene): void
  defaultCameraPluginId?: string
  defaultCameraParams?: Record<string, number>
}

// ModulatablePlugin → PluginBase（必須フィールド）
// renderer: 'threejs'  ← 必ず指定
// enabled: boolean     ← false のとき Registry は update() を呼ばない
// params: Record<string, PluginParam>  ← MidiManager から CC Standard 経由で制御される
```

### Plugin 二分類

| 分類 | Interface | params | MidiManager 制御 |
|---|---|---|---|
| **ModulatablePlugin** | GeometryPlugin / FXPlugin 等 | ✅ あり | ✅ 可能 |
| **PluginBase のみ** | TransitionPlugin / WindowPlugin 等 | ❌ なし | ❌ 不要 |

GeometryPlugin は MidiManager → CC Standard 経由で外部制御される。
制御経路: `engine.handleMidiCC()` → `MidiManager` → `ParameterStore` → `plugin.params.value`

---

## ファイル構成（必須）

```
plugins/geometry/[category]/[name]/
├── index.ts
├── [Name]Geometry.ts
├── [name].config.ts
├── README.md
├── CLAUDE.md
├── template-basic.md
└── template-all.md
```

---

## 実装の注意事項

- `destroy()` では `geometry.dispose()` / `material.dispose()` / `scene.remove()` を必ず呼ぶ
- `update()` では新規オブジェクトをアロケートしない
- 頂点を動かす場合は `geometry.attributes.position.needsUpdate = true` を必ず設定
- `renderer: 'threejs'`・`enabled: true` を必ずデフォルト値として設定する

## MUST: requiresRebuild フラグ（Day46 確立）

メッシュの頂点数・形状が変わる param には必ず `requiresRebuild: true` を設定すること。

```typescript
export const defaultParams: Record<string, PluginParam> = {
  speed:    { value: 0.5, min: 0.1, max: 2.0, label: 'Speed' },
  segments: { value: 60,  min: 10,  max: 100,  label: 'Segments', requiresRebuild: true },
  size:     { value: 80,  min: 1,   max: 500,  label: 'Size',     requiresRebuild: true },
}
```

**requiresRebuild: true が必要な param の例:**
- `segments` / `rings` / `detail` / `radius` / `tube` / `size` / `cols` / `rows`

**requiresRebuild: true が不要な param の例:**
- `speed` / `hue` / `alpha` / `amplitude` / `frequency`

---

## v1 実装プラグイン

| フェーズ | カテゴリ | プラグイン |
|---|---|---|
| Phase 1 | wave | grid-wave |
| Phase 1 | terrain | contour |
| Phase 1 | tunnel | grid-tunnel |
