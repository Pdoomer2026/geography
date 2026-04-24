# wave/grid-wave - CLAUDE.md

## このプラグインについて

平面グリッドの頂点を波状に変形させる Geometry プラグインです。
GeoGraphy の最初のプラグイン・Phase 1 のコア確認用です。

---

## 実装の核心

`PlaneGeometry` の頂点を毎フレーム Y 軸方向に変形させます。

```typescript
// 毎フレームの頂点変形
const positions = geometry.attributes.position;
for (let i = 0; i < positions.count; i++) {
  const x = positions.getX(i);
  const z = positions.getZ(i);
  const y = Math.sin(x * frequency + time * speed) *
            Math.cos(z * frequency + time * speed) * depth;
  positions.setY(i, y);
}
positions.needsUpdate = true; // ← 忘れると更新されない！
geometry.computeVertexNormals();
```

---

## パラメーターの意味

| パラメーター | 説明 | 推奨範囲 | pinned |
|---|---|---|---|
| speed | 波の進行速度（BPM と連動） | 0.1〜2.0 | ✅ |
| scale | グリッド全体のスケール | 0.5〜3.0 | ✅ |
| depth | 波の振幅（高さ） | 0.1〜2.0 | ✅ |
| twist | 波のねじれ量 | -1.0〜1.0 | ✅ |
| density | グリッドの細かさ（頂点数） | 10〜100 | ○ |
| rotX | X 軸回転 | -180〜180° | ✅ |
| rotZ | Z 軸回転 | -180〜180° | ✅ |
| size | グリッドの物理サイズ | 1〜20 | ○ |

---

## Camera との相性

- **Mode B（自転）+ AUTO** → 最もおすすめ・波の全体像が見える
- **Mode C（空撮ドローン）+ AUTO** → 海面のように見える
- **Mode A（オービット）** → 波の構造が理解しやすい

---

## AUTO モードのおすすめ設定

```
AUTO: ON
Target: ALL（SHAPE + COLOR 両方）
強度: 0.4〜0.6
Pattern: Cycle
BPM Sync: 1/4
```

---

## 既知の問題・注意点

- `density` が高い（80以上）と低スペック Mac でフレームレートが落ちる
- `geometry.computeVertexNormals()` を毎フレーム呼ぶのでコストが高い
  → density のデフォルト値は 32 程度に抑える

---

## FX との相性

- **Bloom** → 発光するグリッドになって映える
- **Feedback** → 残像で波の軌跡が美しくなる
- **RGB Shift** → サイバーパンク感が増す
