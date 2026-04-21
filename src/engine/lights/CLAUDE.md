# src/engine/lights - CLAUDE.md

## 役割

「どんなライトを当てるか」を定義する Light Plugin。v1 は AmbientLight のみ。
ワイヤーフレーム系（MeshBasicMaterial / Line2）はライトを無視するため映像への影響はほぼゼロだが、将来のソリッド系 Geometry Plugin のために差し込み口を確保する。

---

## Light Plugin Interface

```typescript
interface LightPlugin extends PluginBase {
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

## v1 実装プラグイン

| プラグイン | 説明 |
|---|---|
| ambient | THREE.AmbientLight・intensity 0.3（薄め） |

---

## 将来の拡張候補

| プラグイン | 説明 |
|---|---|
| directional | 太陽光・影あり・ソリッド系に最適 |
| point | 点光源・局所的な発光 |
| spot | スポットライト |
| bpm-pulse | BPM に合わせて intensity が明滅（v2） |

---

## 注意事項

- `MeshBasicMaterial` はライトを無視する（ワイヤーフレーム系は影響なし）
- ライトを使いたい場合は `MeshStandardMaterial` または `MeshPhongMaterial` を使う
- `destroy()` では必ず `scene.remove(light)` を呼ぶ
- `renderer: 'threejs'` を必ず設定すること
