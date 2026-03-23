# contour - CLAUDE.md

## 役割

地形的・等高線的なワイヤーフレームメッシュ。
PlaneGeometry の頂点 Z 値を複数のサイン波の重ね合わせで変形する。

## 実装ポイント

- `ContourGeometry.update()` で positions.setZ(i, ...) して `needsUpdate = true`
- 波は4方向（x軸・y軸・斜め・逆斜め）を重ねることで地形ノイズに近い形状
- `material.color.setHSL()` で hue をリアルタイム変更
- `rotation.x = -Math.PI / 2.8` で地形らしく傾ける

## 変更禁止

- `renderer: 'threejs'` / `enabled: true` は変更しないこと
- `destroy()` の dispose 呼び出しは必ず残すこと
