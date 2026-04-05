# GeoGraphy - CLAUDE.md（ルート）v3

## プロジェクト概要

GeoGraphy は Three.js を使用したブラウザベースのリアルタイム VJ プラットフォームです。
幾何学パターン（Geometry）をリアルタイムで操作し、レトロフューチャーな 3D CG 映像を生成します。

- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **ライセンス**: MIT
- **キャッチコピー**: 「すべての設定は Claude.ai に話しかけるだけ」

---

## 開発の基本ルール（最重要）

1. **一度に全部作らない** → 1ファイルずつ確認しながら進める
2. **必ず説明してから実装する** → 「何をするか」を先に伝える
3. **動作確認を必ずはさむ** → 実装 → 確認 → 次へ
4. **CLAUDE.md を読んでから書く** → 各モジュールの CLAUDE.md を必ず参照
5. **YouTube で解説できる理解度を保つ** → ブラックボックスにしない
6. **Parameter Store は必ず Command 経由で変更する**

---

## アーキテクチャの核心

```
plugins/geometry/   ← 何を描画するか（主役）
plugins/particles/  ← 背景・雰囲気（脇役）← NEW
plugins/fx/         ← どんなエフェクトをかけるか
plugins/lights/     ← どんなライトを当てるか ← NEW
plugins/windows/    ← どんな UI を表示するか（React FC）
drivers/tempo/      ← どこからテンポを取るか
drivers/input/      ← どのデバイスで操作するか
drivers/output/     ← どこに出力するか
drivers/modulator/  ← どこからパラメーター値が来るか ← NEW
```

**エンジンはすべての Plugin / Driver の種類を知らない。Interface を通じてのみ通信する。**

---

## Command パターン（必須）

```typescript
// すべての Parameter Store 変更は Command 経由
// 直接変更禁止：parameterStore.value = x  ← NG
// 正しい方法：parameterStore.set('key', value)  ← OK（内部で Command を生成）
// MAX_UNDO_HISTORY = 50（config.ts）
// Cmd+Z でアンドゥ / Cmd+Shift+Z でリドゥ
```

---

## レイヤーシステム

```typescript
// Canvas を position: absolute で重ねる（WebGL RenderTarget 不要）
// MAX_LAYERS = 3（config.ts の1行で変更可能）
// CSS mixBlendMode で合成：normal / add / multiply / screen / overlay
```

---

## マクロノブ

```typescript
// 32ノブ・4列・1ノブ最大3パラメーター割り当て
// MIDI 0〜127 → min〜max にマッピング（変化幅を任意に指定）
const map = (midi: number, min: number, max: number) =>
  min + (midi / 127) * (max - min)
// 設定は template-basic.md の Macro Knobs セクションに保存
```

---

## FX スタック順序（厳守）

```
AfterImage → Feedback → Bloom → Kaleidoscope → Mirror
→ ZoomBlur → RGBShift → CRT → Glitch → ColorGrading（最後）
```

---

## FX デフォルト（起動時）

Bloom ON（0.8）/ After Image ON（0.85）/ RGB Shift ON（0.001）/ その他 OFF / ColorGrading ON（フラット）

---

## 実装フェーズ

```
Phase 1-2:  基盤 + Plugin/Driver アーキテクチャ + Command パターン
Phase 3-4:  Camera + FX + Light + Particle（starfield）
Phase 5-6:  Tempo + Input + Modulator Driver
Phase 7:    マクロノブ（32個）+ レイヤー（CSS 合成）
Phase 8:    Output + 録画（WebM）+ デュアルモニター
Phase 9:    UI 全面実装（React + shadcn/ui + Framer Motion）
Phase 10:   Phase 2 プラグイン + OSS 展開
```

---

## CLAUDE.md の階層

```
geography/CLAUDE.md                    ← このファイル
.github/CLAUDE.md                      ← OSS 運営ルール
src/core/CLAUDE.md                     ← エンジン・Command・Layer
src/plugins/geometry/CLAUDE.md
src/plugins/geometry/[name]/CLAUDE.md
src/plugins/particles/CLAUDE.md        ← NEW
src/plugins/particles/[name]/CLAUDE.md ← NEW
src/plugins/fx/CLAUDE.md
src/plugins/lights/CLAUDE.md           ← NEW
src/plugins/lights/[name]/CLAUDE.md    ← NEW
src/plugins/windows/CLAUDE.md
src/drivers/CLAUDE.md
src/drivers/modulator/CLAUDE.md        ← NEW
src/ui/CLAUDE.md
```
