# src/plugins/geometry - CLAUDE.md

## 役割

GeoGraphy の主役。Three.js で幾何学パターンを描画する。

---

## Geometry Plugin Interface

```typescript
interface GeometryPlugin extends PluginBase {
  create(scene: THREE.Scene): void
  update(delta: number, beat: number): void
  destroy(scene: THREE.Scene): void
  params: Record<string, PluginParam>
}

// PluginBase（必須フィールド）
interface PluginBase {
  id: string
  name: string
  renderer: 'threejs' | 'pixijs' | 'opentype' | string  // 必ず 'threejs' を指定
  enabled: boolean  // false のとき Registry は update() を呼ばない
}
```

**renderer と enabled は必須。`renderer: 'threejs'` / `enabled: true` をデフォルトにすること。**

---

## ファイル構成（必須）

```
plugins/geometry/[category]/[name]/
├── index.ts              ← GeometryPlugin export
├── [Name]Geometry.ts     ← Three.js ロジック
├── [name].config.ts      ← パラメーター定義
├── README.md             ← ユーザー・コントリビューター向け
├── CLAUDE.md             ← Claude Code 向け実装ガイド
├── template-basic.md     ← 厳選パラメーター + Recommended FX / Particles / Macro Knobs
└── template-all.md       ← 全パラメーター
```

---

## template-basic.md の構造

```markdown
# [name] - Basic Template

## Shape
speed: 0.5
scale: 1.0

## Color
hue: 200
alpha: 1.0

## Recommended FX
bloom:
  enabled: true
  strength: 0.8
after-image:
  enabled: true
  damp: 0.85
rgb-shift:
  enabled: true
  amount: 0.001

## Recommended Particles
starfield:
  enabled: true
  count: 5000
  speed: 0.3

## Color Grading
saturation: 1.0
contrast: 1.0
brightness: 1.0

## Macro Knobs
knob1:
  name: CHAOS
  midi_cc: 1
  assign:
    - param: speed
      min: 0.0  max: 2.0  curve: linear
    - param: bloom.strength
      min: 0.3  max: 1.5  curve: linear
```

---

## 実装の注意事項

- `destroy()` では `geometry.dispose()` / `material.dispose()` / `scene.remove()` を必ず呼ぶ
- `update()` では新規オブジェクトをアロケートしない
- 頂点を動かす場合は `geometry.attributes.position.needsUpdate = true` を必ず設定
- Color は Hue / Alpha のみ管理（Saturation / Contrast / Brightness は ColorGrading FX に委譲）
- `renderer: 'threejs'`・`enabled: true` を必ずデフォルト値として設定する

---

## v1 実装プラグイン

| フェーズ | カテゴリ | プラグイン | 説明 |
|---|---|---|---|
| Phase 1 | wave | grid-wave | 平面グリッドの波 |
| Phase 1 | terrain | contour | 等高線・地形メッシュ |
| Phase 1 | tunnel | grid-tunnel | グリッドトンネル |
| Phase 2 | wave | ocean | 海面 |
| Phase 2 | terrain | mountain | 山岳地形 |
| Phase 2 | tunnel | hex-tunnel | 六角形トンネル |

---

## CLI スキャフォールド

```bash
pnpm cli create-geometry --name GridWave --id grid-wave --category wave
```
