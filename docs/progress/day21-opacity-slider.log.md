# Day21 Opacity Slider 進捗ログ

## 概要
SimpleMixer の各レイヤーカードに Opacity スライダーを追加した。

## 実装内容

### 1. `src/core/engine.ts`
- `setLayerOpacity(layerId: string, opacity: number)` メソッドを追加
- 内部で `layerManager.setOpacity()` に委譲（layerManager.setOpacity は Day12 実装済み）

### 2. `src/plugins/windows/simple-mixer/SimpleMixer.tsx`
- 各レイヤーカードに Opacity スライダー（`<input type="range">`）を追加
  - `α` ラベル付き
  - min=0 / max=1 / step=0.01
  - `layer.opacity` を value にバインド
  - `onChange` で `engine.setLayerOpacity()` を呼ぶ
- カードの高さを 130px → 150px に拡大（スライダー分のスペース確保）

## UI 変化
```
Before:
  L1: [Plugin▼][BlendMode▼] LIVE

After:
  L1: [Plugin▼][BlendMode▼] α[━━━━━] LIVE
```

## 完了確認

- `pnpm tsc --noEmit`: PASS
- `pnpm test --run`: 90 tests グリーン（既存テストへの影響なし）
