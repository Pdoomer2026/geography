# GeoGraphy - CLAUDE.md v6

## プロジェクト概要

- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応のブラウザベース映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm
- **要件定義書**: docs/要件定義書_v1.7.md
- **実装計画書**: docs/実装計画書_v2.5.md
  → フェーズ詳細・ロードマップはこちらを参照すること（CLAUDE.md には書かない）

---

## 開発スタイル：仕様駆動開発（SDD）

GeoGraphy は **Spec-Driven Development（SDD）** を採用している。

- **SSoT（唯一の真実の情報源）**: `docs/spec/` ディレクトリ配下の `.spec.md` ファイル群
- **MUST: 実装前に必ず対応する spec ファイルを読むこと**
- **MUST: 仕様変更はコードより先に spec ファイルを修正すること**
- **SDD 全体概要**: `docs/spec/SDD-OVERVIEW.md` を参照

### SDD 開発サイクル

```
1. docs/spec/[機能].spec.md を確認（または新規作成）
2. spec の Interface・Constraints に従って実装
3. spec の Test Cases がすべてパスすることを確認
4. 仕様変更が必要な場合 → spec を先に修正 → 再実装
```

### spec ファイル一覧

| ファイル | 対象 | 状態 |
|---|---|---|
| `docs/spec/SDD-OVERVIEW.md` | SDD全体の設計思想 | ✅ |
| `docs/spec/command-pattern.spec.md` | Commandパターン | ✅ 実装済み |
| `docs/spec/program-preview-bus.spec.md` | Program/Previewバス | ✅ 実装済み |
| `docs/spec/transition-plugin.spec.md` | Transition Plugin | ✅ 実装済み |
| `docs/spec/layer-system.spec.md` | レイヤーシステム | 🔴 Day12実装対象 |

---

## MUST: 絶対に守るルール

- MUST: 実装前に `docs/spec/[対象].spec.md` を読むこと（SDD原則）
- MUST: `engine.ts` は `App.tsx` に依存してはいけない・単体で動作できること
- MUST: Parameter Store の変更は必ず Command 経由でのみ行うこと（直接代入禁止）
- MUST: Plugin には `renderer`・`enabled` フィールドを持たせること（PluginBase 参照）
- MUST: Transition Plugin は `execute()` を純粋関数として実装すること（戻り値は SceneState）
- MUST: SimpleMixer は閉じることができない（閉じるボタンを実装してはいけない）
- MUST: 各モジュールの CLAUDE.md を読んでから実装すること

---

## 開発の基本ルール

1. 一度に全部作らない → 1ファイルずつ確認しながら進める
2. 必ず説明してから実装する → 「何をするか」を先に伝える
3. 動作確認を必ずはさむ → 実装 → 確認 → 次へ
4. YouTube で解説できる理解度を保つ → ブラックボックスにしない

---

## アーキテクチャ

```
plugins/geometry/    ← 何を描画するか（主役）
plugins/particles/   ← 背景・雰囲気
plugins/fx/          ← エフェクト
plugins/lights/      ← ライト
plugins/transitions/ ← トランジション（UI なし・処理のみ）
plugins/windows/     ← UI（React FC）
drivers/tempo/       ← テンポ取得
drivers/input/       ← デバイス操作
drivers/output/      ← 出力先
drivers/modulator/   ← パラメーター値の供給元
```

---

## エンジン固定部分（Plugin が触れない）

- Parameter Store → MUST: Command 経由のみ
- Plugin Registry → 自動登録（import.meta.glob）のみ
- BPM クロック → Tempo Driver 経由のみ
- メニューバー → 全 Mixer 共通・固定
- マクロノブパネル → 32ノブ・4列・MIDI 物理対応のため固定

---

## Program / Preview バス

```
Program バス → フルサイズ Three.js Scene（実際に出力）
Preview バス → SceneState（JSON）+ 小キャンバス（320×180）
```

- 切り替え時: Preview の SceneState を Program に適用・旧 Scene を dispose()
- IMPORTANT: Preview バスは Three.js Scene を持たない・SceneState のみ
- 詳細仕様: `docs/spec/program-preview-bus.spec.md`

---

## Mixer Plugin ルール

- SimpleMixer は v1 固定実装・v2 で MixerPlugin として Plugin 化
- MUST: v1 から MixerPlugin Interface に準拠した実装にすること（v2 で設計変更ゼロにするため）
- Transition Plugin 選択プルダウン・クロスフェーダーを必ず持つ

---

## FX スタック順序（厳守）

```
AfterImage → Feedback → Bloom → Kaleidoscope → Mirror
→ ZoomBlur → RGBShift → CRT → Glitch → ColorGrading（最後）
```

FX デフォルト: Bloom ON（0.8）/ AfterImage ON（0.85）/ RGBShift ON（0.001）/ ColorGrading ON（フラット）

---

## CLAUDE.md の階層

```
geography/CLAUDE.md          ← このファイル（全体方針・SDD原則）
docs/spec/                   ← SSoT（仕様ファイル群）← NEW
src/core/CLAUDE.md           ← エンジン・Command・ProgramBus・PreviewBus
src/plugins/geometry/        ← renderer・enabled フィールドの扱い
src/plugins/transitions/     ← UI を持たない・execute() 純粋関数
src/plugins/windows/         ← SimpleMixer の制約・MixerPlugin Interface
src/plugins/fx/              ← FX スタック順序
src/plugins/lights/
src/plugins/particles/
src/drivers/
src/ui/
```

---

## ツール役割分担

| ツール | 役割 |
|---|---|
| Claude Desktop | **spec制作・仕様の壁打ち**・CLAUDE.md・docs/ の編集 |
| Claude Code | specを読んでから実装・テスト・Git 操作 |
| Obsidian | 開発ログ・意思決定記録・YouTube 素材管理 |
