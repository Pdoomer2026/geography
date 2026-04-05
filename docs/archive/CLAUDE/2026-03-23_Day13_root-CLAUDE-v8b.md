# GeoGraphy - CLAUDE.md v7

## プロジェクト概要

- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応のブラウザベース映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm
- **要件定義書**: docs/要件定義書_v1.7.md
- **実装計画書**: docs/実装計画書_v2.5.md
  → フェーズ詳細・ロードマップはこちらを参照すること（CLAUDE.md には書かない）

---

## 開発スタイル：SDD × CDD（仕様駆動 × コンパイラ駆動）

GeoGraphy は **SDD（Spec-Driven Development）× CDD（Compiler-Driven Development）** を採用している。

- **SSoT（唯一の真実の情報源）**: `docs/spec/` ディレクトリ配下の `.spec.md` ファイル群
- **MUST: 実装前に必ず対応する spec ファイルを読むこと**
- **MUST: 仕様変更はコードより先に spec ファイルを修正すること**
- **MUST: 完了条件 = `pnpm tsc --noEmit`（型エラーゼロ）+ `pnpm test --run`（全テストグリーン）両方通過**
- **MUST: `any` による型解決は禁止。型エラーは自律的に修正すること**
- **SDD 全体概要**: `docs/spec/SDD-OVERVIEW.md` を参照
- **マルチエージェント担当範囲**: `docs/spec/agent-roles.md` を参照

### 開発サイクル

```
1. docs/spec/[機能].spec.md を確認（または新規作成）
2. プランを提示・承認を得てから実装開始
3. 実装後 pnpm tsc --noEmit → 型エラーがあれば自律修正
4. pnpm test --run → 全テストグリーン
5. 両方通過するまでループ
6. docs/progress/[task].log.md にステップ完了を記録
7. 仕様変更が必要な場合 → spec を先に修正 → 再実装
```

### spec ファイル一覧

| ファイル | 対象 | 担当 | 状態 |
|---|---|---|---|
| `docs/spec/SDD-OVERVIEW.md` | SDD全体の設計思想 | Claude Desktop | ✅ |
| `docs/spec/agent-roles.md` | マルチエージェント担当範囲 | Claude Desktop | ✅ |
| `docs/spec/command-pattern.spec.md` | Commandパターン | Claude Code | ✅ 実装済み |
| `docs/spec/plugin-registry.spec.md` | Plugin Registry | Claude Code | ✅ 実装済み |
| `docs/spec/program-preview-bus.spec.md` | Program/Previewバス | Claude Code | ✅ 実装済み |
| `docs/spec/transition-plugin.spec.md` | Transition Plugin | Transition Agent | ✅ 実装済み |
| `docs/spec/mixer-plugin.spec.md` | MixerPlugin Interface | Mixer Agent | ✅ 実装済み |
| `docs/spec/layer-system.spec.md` | レイヤーシステム | Claude Code | ✅ Day12実装済み |
| `docs/spec/macro-knob.spec.md` | マクロノブ | Claude Code | 🔴 Day13実装対象 |
| `docs/spec/geometry-plugin.spec.md` | Geometry Plugin共通 | Geometry Agent | ⬜ v1未着手分あり |
| `docs/spec/fx-stack.spec.md` | FXスタック | FX Agent | ⬜ 未着手 |
| `docs/spec/camera-system.spec.md` | カメラシステム | Claude Code | ⬜ 未着手 |

---

## MUST: 絶対に守るルール

- MUST: 実装前に `docs/spec/[対象].spec.md` を読むこと（SDD原則）
- MUST: プランを提示・承認を得てから実装を開始すること
- MUST: `pnpm tsc --noEmit` + `pnpm test --run` 両方通過を完了条件とすること（CDD原則）
- MUST: `any` による型解決は禁止。型エラーは自律修正すること
- MUST: 各ステップ完了ごとに `docs/progress/[task].log.md` に追記すること
- MUST: `engine.ts` は `App.tsx` に依存してはいけない・単体で動作できること
- MUST: Parameter Store の変更は必ず Command 経由でのみ行うこと（直接代入禁止）
- MUST: Plugin には `renderer`・`enabled` フィールドを持たせること（PluginBase 参照）
- MUST: Transition Plugin は `execute()` を純粋関数として実装すること（戻り値は SceneState）
- MUST: SimpleMixer は閉じることができない（閉じるボタンを実装してはいけない）
- MUST: 各モジュールの CLAUDE.md を読んでから実装すること
- MUST: 共有ファイル（engine.ts・types/index.ts）の変更は Claude Code のみ

---

## 開発の基本ルール

1. 一度に全部作らない → 1ファイルずつ確認しながら進める
2. 必ずプランを提示してから実装する → 「何をするか」を先に伝える
3. 動作確認を必ずはさむ → 実装 → tsc + test → ブラウザ確認 → 次へ
4. YouTube で解説できる理解度を保つ → ブラックボックスにしない

---

## アーキテクチャ

```
plugins/geometry/    ← 何を描画するか（主役）・Geometry Agent担当
plugins/particles/   ← 背景・雰囲気
plugins/fx/          ← エフェクト・FX Agent担当
plugins/lights/      ← ライト
plugins/transitions/ ← トランジション（UI なし・処理のみ）・Transition Agent担当
plugins/windows/     ← UI（React FC）・Mixer Agent担当
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

## レイヤーシステム（Day12実装済み）

- `layerManager` シングルトンで管理（`src/core/layerManager.ts`）
- MAX_LAYERS = 3 / CSS mixBlendMode で合成 / WebGL RenderTarget 不要
- 詳細仕様: `docs/spec/layer-system.spec.md`

---

## Mixer Plugin ルール

- SimpleMixer は v1 固定実装・v2 で MixerPlugin として Plugin 化
- MUST: v1 から MixerPlugin Interface に準拠した実装にすること
- Transition Plugin 選択プルダウン・クロスフェーダーを必ず持つ
- 詳細仕様: `docs/spec/mixer-plugin.spec.md`

---

## FX スタック順序（厳守）

```
AfterImage → Feedback → Bloom → Kaleidoscope → Mirror
→ ZoomBlur → RGBShift → CRT → Glitch → ColorGrading（最後）
```

詳細仕様: `docs/spec/fx-stack.spec.md`

---

## CLAUDE.md の階層

```
geography/CLAUDE.md          ← このファイル（全体方針・SDD×CDD原則）
docs/spec/                   ← SSoT（仕様ファイル群・マルチエージェント定義）
docs/progress/               ← 自律開発の進捗ログ
docs/recipes/                ← 成功した実装パターンの蓄積
src/core/CLAUDE.md           ← エンジン・Command・LayerManager・Bus設計
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
| Claude Desktop | **spec制作・仕様の壁打ち**・CLAUDE.md・docs/ の編集・エージェント定義 |
| Claude Code | specを読んでから実装・tsc+test両方通過・Git 操作・共有ファイル管理 |
| Geometry Agent（v2〜） | `src/plugins/geometry/**` の追加・改善 |
| FX Agent（v2〜） | `src/plugins/fx/**` の追加・改善 |
| Mixer Agent（v2〜） | `src/plugins/windows/**` の追加・改善 |
| Transition Agent（v2〜） | `src/plugins/transitions/**` の追加・改善 |
| Obsidian | 開発ログ・意思決定記録・YouTube 素材管理 |
