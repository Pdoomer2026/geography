# FX 動作確認レポート｜Day18 実機テスト

> テスト日: 2026-03-23
> 環境: grid-wave (layer-1) + starfield (layer-2/add) / AfterImage OFF で素の映像をベースに確認

---

## ✅ 正常動作確認済み

| FX | デフォルト | 確認内容 | 状態 |
|---|---|---|---|
| **AfterImage** | ON / Damp=0.85 | 残像エフェクト。ON/OFFで映像の拡散が明確に変化 | ✅ 正常 |
| **Bloom** | ON / Strength=0.8 | 光のにじみ。ON/OFFでシアンの光が広がる/くっきりが明確 | ✅ 正常 |
| **RGB Shift** | ON / Amount=0.001 | 色ずれ。ONで微妙な色のにじみが出る | ✅ 正常（ただし Amount 表示が `0.00` → **要修正** ）|
| **Color Grading** | ON / 各1.0 | Brightness=0で真っ黒、Saturation/Contrastも正常反応 | ✅ 正常 |
| **Glitch** | OFF / Wild=0 | ONにするとグリッチエフェクト発動 | ✅ 正常（確認済み）|
| **Mirror** | OFF / Horizontal=1 | 左右ミラー合成 | ✅ コード的に問題なし（要詳細確認）|
| **CRT** | OFF | スキャンライン＋樽型歪み | ✅ コード的に問題なし（要詳細確認）|
| **Feedback** | OFF / Amount=0.7 | フィードバックループ | ✅ コード的に問題なし（要詳細確認）|

---

## ⚠️ 問題あり・要改善

| FX | 問題内容 | 優先度 |
|---|---|---|
| **Kaleidoscope** | ONにすると全画面がシアン単色になる。万華鏡のUV変換がgrid-waveのシアン色を全面に広げてしまう。Angle/Segmentsパラメータで調整が必要かもしれないが、現状はほぼ使用不可 | 🔴 高 |
| **Zoom Blur** | Strength=0.50でも視覚的変化が非常に微妙で分かりにくい。デフォルト値が低すぎる可能性 | 🟡 中 |
| **RGB Shift Amount 表示** | デフォルト値 0.001 が `0.00` と表示される（小数桁数の判定バグ）| 🟡 中 |

---

## 📝 Kaleidoscope 問題の詳細

**症状**: ONにした瞬間、全画面がシアン（grid-waveの色）で塗りつぶされる

**原因の仮説**:
- Kaleidoscope の GLSL シェーダーが UV=0.5中心の極座標変換を行う
- grid-wave のシアン色がスクリーン全体を占めているため、折り返した UV が全て同じシアンに
- `camera.position.z = 5`（真正面）のため映像がほぼ単色に近い → 万華鏡の効果が出ない

**改善案**:
1. カメラを斜め上から（`camera.position.set(0, 8, 12)`）に変更 → 映像に奥行きが出て万華鏡が機能する可能性
2. Kaleidoscope のデフォルト Segments を減らす（6→4）
3. Angle を少し回転させてデフォルト設定を調整

---

## 📝 Zoom Blur 問題の詳細

**症状**: Strength=0.5 でも映像の変化がほとんど見えない

**原因の仮説**:
- シェーダーの `strength * 0.1` で実際の強度が `0.05` に抑えられている
- grid-wave が比較的均一な映像のため、ぼかし効果が視覚的に出にくい

**改善案**:
- デフォルト Strength を 1.0〜2.0 に上げる
- またはシェーダー内の `* 0.1` 係数を調整

---

## 🔜 次回対応タスク（Day19）

1. **RGB Shift Amount 表示バグ修正**（`FxControlPanel.tsx` の `formatParamValue` 関数）
2. **Kaleidoscope 調整** → カメラ位置改善（`camera-system.spec.md` 作成 → SDD）と合わせて対応
3. **Zoom Blur デフォルト値調整**（Strength のデフォルト or シェーダー係数）
4. **Mirror / CRT / Feedback の詳細動作確認**（未実施）
