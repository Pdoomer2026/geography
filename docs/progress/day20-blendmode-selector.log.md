# Day20 - BlendMode Selector 実装ログ

## 日時
2026-03-23

## 概要
SimpleMixer の各レイヤーカード（L1/L2/L3）に blendMode プルダウンを追加。
Normal / Add / Multiply / Screen / Overlay をリアルタイムで切り替え可能に。

## 実装内容

### `src/core/engine.ts`
- `CSSBlendMode` を import に追加
- `setLayerBlendMode(layerId, blendMode)` メソッドを追加

### `src/plugins/windows/simple-mixer/SimpleMixer.tsx`
- `CSSBlendMode` を import に追加
- `BLEND_MODES` 定数を追加（5種類）
- blendMode テキスト表示 → `<select>` プルダウンに変更
- onChange → `engine.setLayerBlendMode()`
- カードの高さを 110px → 130px に拡大

## 動作確認
- L2 が初期値 Add で正しく表示 ✅
- プルダウンで変更すると即座にキャンバスに反映 ✅

## 完了条件
- [x] `pnpm tsc --noEmit` 型エラーゼロ
- [x] `pnpm test --run` 85 tests グリーン
