# Day20 - Contour Geometry Plugin 実装ログ

## 日時
2026-03-23

## 概要
`terrain/contour` Geometry Plugin を新規追加。
複数方向のサイン波を重ね合わせた地形的・等高線的なワイヤーフレームメッシュ。

## 作成ファイル

```
src/plugins/geometry/terrain/contour/
├── index.ts              ✅
├── ContourGeometry.ts    ✅
├── contour.config.ts     ✅
├── README.md             ✅
├── CLAUDE.md             ✅
├── template-basic.md     ✅
└── template-all.md       ✅

tests/plugins/geometry/
└── contour.test.ts       ✅ (7 tests)
```

## パラメーター
| param | デフォルト | 説明 |
|---|---|---|
| speed | 0.3 | アニメーション速度 |
| scale | 0.4 | ノイズスケール |
| amplitude | 3.0 | 高さ最大値 |
| segments | 80 | グリッド分割数 |
| size | 100 | 平面サイズ |
| hue | 160 | ワイヤーカラー色相 |

## 技術ポイント
- 4方向サイン波の重ね合わせ（x / y / 斜め / 逆斜め）で地形ノイズに近い形状
- `rotation.x = -Math.PI / 2.8` で地形らしく傾ける
- `material.color.setHSL()` で hue をリアルタイム変更
- import.meta.glob による自動登録で engine 側の変更ゼロ

## 動作確認
- SimpleMixer プルダウンに「Contour」が自動登録される ✅
- L1 を Contour に切り替えると即座に地形メッシュが描画 ✅
- AfterImage + Bloom との組み合わせで残像がきれい ✅

## 完了条件
- [x] `pnpm tsc --noEmit` 型エラーゼロ
- [x] `pnpm test --run` 78 tests グリーン（+7）
