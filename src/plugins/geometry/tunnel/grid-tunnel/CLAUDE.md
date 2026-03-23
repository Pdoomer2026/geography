# grid-tunnel - CLAUDE.md

## 役割

多角形リングを Z 方向に並べたトンネル。LineLoop + Line でグリッド感を表現する。

## 実装ポイント

- rings 枚の LineLoop（多角形）を Z 方向に等間隔配置
- update() で ring.position.z を増加させ、カメラ手前を超えたら末尾に折り返す
- segments 本の Line（縦線）でグリッド感を追加
- THREE.Group にまとめて scene に add/remove する

## 変更禁止

- `renderer: 'threejs'` / `enabled: true` は変更しないこと
- `destroy()` の dispose 呼び出しは必ず残すこと
