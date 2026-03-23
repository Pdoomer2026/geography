# Day20 - Grid Tunnel Geometry Plugin 実装ログ

## 日時
2026-03-23

## 概要
`tunnel/grid-tunnel` Geometry Plugin を新規追加。
多角形リングを Z 方向に並べ、前進アニメーションでトンネルを飛び抜ける感覚を演出。

## 作成ファイル

```
src/plugins/geometry/tunnel/grid-tunnel/
├── index.ts                  ✅
├── GridTunnelGeometry.ts     ✅
├── grid-tunnel.config.ts     ✅
├── README.md                 ✅
├── CLAUDE.md                 ✅
├── template-basic.md         ✅
└── template-all.md           ✅

tests/plugins/geometry/
└── grid-tunnel.test.ts       ✅ (7 tests)
```

## パラメーター
| param | デフォルト | 説明 |
|---|---|---|
| speed | 0.8 | 前進速度 |
| radius | 4.0 | トンネル半径 |
| segments | 8 | リングの多角形分割数 |
| rings | 20 | リング枚数 |
| length | 40 | トンネル全長 |
| hue | 280 | ワイヤーカラー色相 |

## 技術ポイント
- LineLoop（多角形リング）を Z 方向に等間隔配置
- update() で ring.position.z を増加、カメラ手前を超えたら末尾に折り返す（ループ）
- Line（縦線 segments 本）でグリッド感を追加
- THREE.Group にまとめて scene に add/remove

## 動作確認
- SimpleMixer プルダウンに「Grid Tunnel」が自動登録 ✅
- 紫のトンネルリングが前進アニメーション ✅
- Grid Wave・Contour と同時 LIVE で映像が重なる ✅

## 完了条件
- [x] `pnpm tsc --noEmit` 型エラーゼロ
- [x] `pnpm test --run` 85 tests グリーン（+7）
