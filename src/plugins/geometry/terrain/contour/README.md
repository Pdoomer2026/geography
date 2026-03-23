# Contour — README

## 概要

複数方向のサイン波を重ね合わせた地形的・等高線的なワイヤーフレームメッシュ。
grid-wave より有機的で地形らしい動きが特徴。

## パラメーター

| param | 説明 | デフォルト |
|---|---|---|
| speed | アニメーション速度 | 0.3 |
| scale | ノイズスケール（地形の粗さ） | 0.4 |
| amplitude | 高さの最大値 | 3.0 |
| segments | グリッド分割数（多いほど滑らか・重い） | 80 |
| size | 平面サイズ | 100 |
| hue | ワイヤーカラー（色相 0〜360） | 160 |

## 推奨 FX

- AfterImage: damp 0.88
- Bloom: strength 0.6
- ColorGrading: saturation 1.2
