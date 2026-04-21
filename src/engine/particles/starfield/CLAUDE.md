# plugins/particles/starfield - CLAUDE.md

## 役割

宇宙空間・星空を表現する Particle Plugin。全 Geometry プラグインと相性が良い汎用背景。

---

## 実装の核心

```typescript
// depth に応じて z 座標を分散させ、前後に流れる星を表現
for (let i = 0; i < count; i++) {
  positions[i * 3]     = (Math.random() - 0.5) * spread  // x
  positions[i * 3 + 1] = (Math.random() - 0.5) * spread  // y
  positions[i * 3 + 2] = (Math.random() - 0.5) * depth   // z（奥行き）
}

// update() でパーティクルをカメラ方向に移動
positions[i * 3 + 2] += delta * speed
// 手前を超えたら奥に戻す（ループ）
if (positions[i * 3 + 2] > near) positions[i * 3 + 2] -= depth
```

---

## パラメーター

| パラメーター | 型 | デフォルト | 説明 |
|---|---|---|---|
| count | number | 5000 | パーティクル数 |
| depth | number | 50 | z 方向の奥行き範囲 |
| spread | number | 30 | x / y 方向の広がり |
| speed | number | 0.3 | 流れる速度 |
| size | number | 0.05 | パーティクルサイズ |
| opacity | number | 0.6 | 透明度 |
| color | string | '#a0c4ff' | 星の色（青白） |
