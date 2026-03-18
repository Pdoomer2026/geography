# GeoGraphy - CLAUDE.md（ルート）v4

## プロジェクト概要

GeoGraphy は「No-Texture・Plugin駆動・マルチライブラリ対応」のブラウザベース映像制作プラットフォームです。
幾何学パターン（Geometry）をリアルタイムで操作し、レトロフューチャーな 3D CG 映像を生成します。

- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **ライセンス**: MIT
- **キャッチコピー**: 「すべての設定は Claude.ai に話しかけるだけ」
- **対応要件定義書**: v1.7
- **対応実装計画書**: v2.5

---

## 開発の基本ルール（最重要）

1. **一度に全部作らない** → 1ファイルずつ確認しながら進める
2. **必ず説明してから実装する** → 「何をするか」を先に伝える
3. **動作確認を必ずはさむ** → 実装 → 確認 → 次へ
4. **CLAUDE.md を読んでから書く** → 各モジュールの CLAUDE.md を必ず参照
5. **YouTube で解説できる理解度を保つ** → ブラックボックスにしない
6. **Parameter Store は必ず Command 経由で変更する**

---

## プラットフォーム思想（v1.5 確定）

GeoGraphy は「複数の描画ライブラリを Plugin として束ねるプラットフォーム」です。

```
GeoGraphy Platform
├── Three.js Plugin Group（v1）← 現在実装中
├── PixiJS Plugin Group（v2）
└── opentype.js Plugin Group（v3）
```

- `engine.ts` は `App.tsx` に依存してはいけない・単体で動作できること
- Plugin には `renderer`・`enabled` フィールドを必ず持たせる（PluginBase 参照）
- エンジンは Plugin / Driver の種類を知らない・Interface を通じてのみ通信する

---

## アーキテクチャの核心

```
plugins/geometry/    ← 何を描画するか（主役）
plugins/particles/   ← 背景・雰囲気（脇役）
plugins/fx/          ← どんなエフェクトをかけるか
plugins/lights/      ← どんなライトを当てるか
plugins/transitions/ ← どんなトランジションをかけるか（UI なし・処理のみ）
plugins/windows/     ← どんな UI を表示するか（React FC）
drivers/tempo/       ← どこからテンポを取るか
drivers/input/       ← どのデバイスで操作するか
drivers/output/      ← どこに出力するか
drivers/modulator/   ← どこからパラメーター値が来るか
```

---

## エンジン固定部分（Plugin が触れない）

以下はどの Plugin も直接変更してはいけない：

- **Parameter Store** → 必ず Command 経由で変更
- **Plugin Registry** → 自動登録（import.meta.glob）のみ
- **BPM クロック** → Tempo Driver 経由のみ
- **メニューバー** → File / View / Plugins / Help（全 Mixer 共通・固定）
- **マクロノブパネル** → 32ノブ・4列（MIDI との物理対応関係があるため固定）

---

## Program / Preview バス（v1 実装）

v1 から Program バスと Preview バスの2系統を実装します。

```
Program バス   → フルサイズ Three.js Scene（実際に出力される映像）
Preview バス   → SceneState（JSON のメモ）+ 小キャンバス（320×180・サムネイル確認用）
```

- **切り替え時**: Preview の SceneState を Program のフルサイズに適用
- **GPU メモリー**: Preview は SceneState のみ・増加はほぼゼロ
- **モニタリングモード**: 通常（Program大・Preview小）/ 準備（Program小・Preview大）/ デュアルモニター

---

## Mixer Plugin ルール（v1 実装）

- **SimpleMixer は v1 で固定実装**（v2 で MixerPlugin として Plugin 化する）
- **閉じることができない**（常時表示・全 Mixer Plugin 共通ルール）
- Transition Plugin の選択 UI（プルダウン）を必ず持つ
- クロスフェーダーを必ず持つ
- **v1 の時点から MixerPlugin Interface に準拠した実装にすること**（v2 で設計変更ゼロにするため）

---

## Transition Plugin ルール

- **UI を持たない**・処理のみ
- SceneState を受け取り変形するだけ
- Mixer Plugin のプルダウンで選択される
- v1 実装：Beat Cut（BPM同期）/ CrossFade（opacity変化）

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

## 実装フェーズ（v2.5 更新）

```
Phase 1-2:  基盤 + Plugin/Driver アーキテクチャ + Interface 全定義 + Command パターン
Phase 3-4:  Camera + FX + Light + Particle（starfield）
Phase 5-6:  Tempo + Input + Modulator Driver
Phase 7:    Program/Preview バス + SimpleMixer + Beat Cut + CrossFade
Phase 8:    マクロノブ（32個）+ レイヤー（CSS 合成）+ Output + 録画（WebM）
Phase 9:    UI 全面実装（React + shadcn/ui + Framer Motion）
Phase 10:   Phase 2 プラグイン + OSS 展開
```

---

## ロードマップ

| バージョン | 主な内容 |
|---|---|
| v1 | Three.js 基盤・Plugin/Driver・SimpleMixer・Program/Preview バス・Beat Cut + CrossFade・マクロノブ・レイヤー・録画・OSS 公開 |
| v2 | Geometry ランチャー・Mixer Plugin 化・CrossfadeMixer・GL Transitions・Geometry シーケンサー・Embed Export・PixiJS |
| v3 | Full Morph・opentype.js Typography・Spatial Extension（プロジェクションマッピング） |
| v4 | Claude.ai 自動トランジション・Video Input Driver（Resolume 受信） |

---

## CLAUDE.md の階層

```
geography/CLAUDE.md                       ← このファイル
geography/HANDOVER.md                     ← 引き継ぎメモ（2層構造）
geography/HANDOVER_TEMPLATE.md            ← 引き継ぎメモのテンプレート
.github/CLAUDE.md                         ← OSS 運営ルール
src/core/CLAUDE.md                        ← エンジン・Command・ProgramBus・PreviewBus
src/plugins/geometry/CLAUDE.md            ← renderer・enabled フィールドの扱い
src/plugins/geometry/[name]/CLAUDE.md     ← 各プラグイン固有の実装ヒント
src/plugins/particles/CLAUDE.md
src/plugins/particles/[name]/CLAUDE.md
src/plugins/fx/CLAUDE.md
src/plugins/lights/CLAUDE.md
src/plugins/lights/[name]/CLAUDE.md
src/plugins/transitions/CLAUDE.md         ← UI を持たない・SceneState のみ操作
src/plugins/windows/CLAUDE.md
src/drivers/CLAUDE.md
src/drivers/modulator/CLAUDE.md
src/ui/CLAUDE.md
docs/要件定義書_v1.7.md                   ← 最新要件定義書
docs/実装計画書_v2.5.md                   ← 最新実装計画書
```

---

## ツール役割分担（確定）

| ツール | 役割 |
|---|---|
| Claude Desktop | CLAUDE.md・docs/ の編集・更新・設計の壁打ち |
| Claude Code | 実装・テスト・Git 操作（手を動かす） |
| Obsidian | 開発ログ・意思決定記録・YouTube 素材管理・AIへの指示書管理 |

---

## ハーネス構造（Governance System）

GeoGraphy は「プラガブルアプリのAI駆動開発におけるスキーマ管理によるハーネス構築」という設計思想で開発する。

```
第一層：意図（Obsidian）
  └── 開発ダッシュボード・指示書・決定ログ
      → 人間の思考を構造化・AIへのプロンプトの種

第二層：憲法（ルート CLAUDE.md）   ← このファイル
  └── プロジェクト全体の方針・ツール役割分担
      → AIの「性格」を決める・変更頻度：低・簡潔に保つ

第三層：現場法（プラグイン固有 CLAUDE.md）
  └── 各プラグインの動作定義・依存関係・実装ヒント
      → AIをその場所の「専門家」として振る舞わせる

第四層：物理法（JSON Schema）※ v2 以降
  └── プラグインの I/O 定義・データ型の厳密な定義
      → コード生成時のデータ不整合を機械的に防ぐ
      → 将来: npx typescript-json-schema src/types/index.ts SceneState
```

**CLAUDE.md は簡潔に保つこと。詳細な開発ログや試行錯誤は Obsidian に書く。**

---

## Obsidian 連携ルール

- 重要な設計決定は必ず Obsidian の `decisions/` に記録する
- 各 Day の作業終了後に `dev-log/` に記録する
- Obsidian Git Plugin で geography リポジトリと同期
- Claude Code のチャット履歴は消えるため、重要な決定事項は Obsidian に転記する
- YouTube 台本の素材は `youtube/` に蓄積する
