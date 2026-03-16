# src/plugins/particles - CLAUDE.md

## 役割

背景・雰囲気を担当する Particle Plugin。Geometry Plugin が主役（前景）に対し、Particle Plugin は脇役（背景）として空間の雰囲気を作る。

---

## Particle Plugin Interface

```typescript
// Geometry Plugin と同じ Interface
interface ParticlePlugin extends PluginBase {
  create(scene: THREE.Scene): void
  update(delta: number, beat: number): void
  destroy(scene: THREE.Scene): void
  params: Record<string, PluginParam>
}

// PluginBase（必須フィールド）
// renderer: 'threejs'  ← 必ず指定
// enabled: boolean
```

---

## 実装パターン

```typescript
// THREE.Points + PointsMaterial で実装
const geometry = new THREE.BufferGeometry()
const positions = new Float32Array(count * 3)
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

const material = new THREE.PointsMaterial({
  size: 0.05,
  color: '#a0c4ff',
  transparent: true,
  opacity: 0.6,
  blending: THREE.AdditiveBlending,  // add blending で発光感
  depthWrite: false,                  // 背景なので depth 書き込み不要
})
const points = new THREE.Points(geometry, material)
scene.add(points)
```

---

## v1 実装プラグイン

| プラグイン | 説明 |
|---|---|
| starfield | 星空・宇宙空間・depth に応じて前後に流れる |

---

## template-basic.md の記述例

```markdown
## Recommended Particles
starfield:
  enabled: true
  count: 5000
  depth: 50
  speed: 0.3
  size: 0.05
  opacity: 0.6
  blendMode: add
```

---

## CLI スキャフォールド

```bash
pnpm cli create-particle --name Starfield --id starfield
```

---

## 注意事項

- `depthWrite: false` を必ず設定する（背景パーティクルが前景を隠さないように）
- `blending: THREE.AdditiveBlending` でレトロフューチャー感が増す
- `count` が多すぎると GPU 負荷が増える（v1 の上限目安：10000）
- Camera 移動に連動させる場合は scene の camera 参照を使う
- `renderer: 'threejs'` を必ず設定すること
