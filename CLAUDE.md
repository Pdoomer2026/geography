# GeoGraphy - CLAUDE.md v10

## プロジェクト概要

- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応の映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm / Electron 41
- **要件定義書**: docs/要件定義書_v1.9.md
- **実装計画書**: docs/実装計画書_v3.1.md
  → フェーズ詳細・ロードマップはこちらを参照すること（CLAUDE.md には書かない）

---

## 開発環境制約（重要・セッション開始時に必ず確認）

Claude はセッション開始時に利用可能な MCP ツールを確認することで自分の実行環境を把握できる。

| ツール | 可否 | 用途 |
|---|---|---|
| filesystem MCP | ✅ | ファイルの読み書き（Claude Desktop 環境の証拠） |
| Claude in Chrome MCP | ✅ | ブラウザ操作・JS実行・スクリーンショット |
| bash / ターミナル MCP | ❌ | **使用不可** |

- `pnpm tsc --noEmit` / `pnpm test --run` / `pnpm dev` / `git` コマンドは **慎太郎さんが手動で実行して結果を貼り付けること**
- Claude は「ターミナルを試みる → 失敗 → 気づく」という無駄なステップを踏まない
- filesystem MCP が使えていれば Claude Desktop 環境と判断してよい
- **MUST: Claude がターミナルコマンドの実行を求めるときは、必ずコピペ可能なコマンドを作って渡すこと**

### コマンド依頼の形式（必ずこの形式で渡す）

```bash
# [目的の説明]
[実行するコマンド]
```

例：
```bash
# tsc + テスト確認
cd /Users/shinbigan/geography && pnpm tsc --noEmit 2>&1 && pnpm test --run 2>&1
```

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
1. 各モジュールの CLAUDE.md / docs/spec/[機能].spec.md を確認（または新規作成）
2. プランを提示・承認を得てから実装開始
3. 実装後 → 慎太郎さんに pnpm tsc --noEmit を実行してもらい結果を貼り付けてもらう
4. 型エラーがあれば自律修正 → 再度コマンドを渡す
5. 慎太郎さんに pnpm test --run を実行してもらい結果を貼り付けてもらう
6. 全テストグリーンになるまでループ
7. docs/progress/[task].log.md にステップ完了を記録
8. 仕様変更が必要な場合 → spec を先に修正 → 再実装
9. セッション終了時に git commit + Day タグを打つ（MUST）
```

### 始業時の CLAUDE.md 読み方（MUST）

ルート CLAUDE.md はプロジェクト全体の方針確認のみに使う。
実装詳細は各モジュールの CLAUDE.md に書かれている。必ず以下の順で読むこと。

```
1. HANDOVER.md を読んで今日の作業対象モジュールを特定する
2. このファイル（ルート）で全体方針を確認する
3. 作業対象モジュールの CLAUDE.md を必ず読む
   例）src/plugins/fx/ を触る → src/plugins/fx/CLAUDE.md を読む
       src/ui/ を触る       → src/ui/CLAUDE.md を読む
       src/core/ を触る     → src/core/CLAUDE.md を読む
4. その CLAUDE.md が参照している spec ファイルを読む
4.5. 下記「ファイル更新時の鉄則」を確認する（毎回）
5. 実装開始
```

### ファイル更新時の鉄則（MUST・Day30確立）

毎回のセッションで同じミスが起きるため、始業時に必ず確認すること。

- MUST: ファイル更新前に必ず `read_text_file` で元ファイルを読むこと
- MUST: 更新は `filesystem:edit_file` を使うこと（変更箇所だけを編集・差分を最小化する）
- MUST: `write_file` は全書き換えになるため使わない
- MUST: 新規ファイル作成のみ `write_file` を使う（既存ファイルへの使用は禁止）
- MUST: 更新後は `git diff HEAD [ファイル名] | cat` で差分を慎太郎さんと一緒に確認すること

### 終業時・引き継ぎ制作時の CLAUDE.md 更新方法（MUST）

CLAUDE.md を更新するときは「どのファイルに書くべきか」を必ず判断すること。
ルートだけ更新して各モジュールの CLAUDE.md を放置しない。

```
1. 今日触ったファイル・モジュールを列挙する
2. 各モジュールの CLAUDE.md を読む
3. 更新内容がどこに属するかを判断する：
   - プロジェクト全体の方針・開発ルール・ナビゲーション → ルート CLAUDE.md
   - 特定モジュールの実装詳細・MUST ルール・Interface → そのモジュールの CLAUDE.md
4. 正しいファイルを更新する（両方が必要なこともある）
5. HANDOVER.md を書く
```

⚠️ ルートに書くべきでない内容（実装詳細・モジュール固有ルール）がルートに蓄積しやすい。
　 終業時に各モジュールの CLAUDE.md を読むことで「本来ここに書くべきだった」と気づける。

### Day タグの打ち方（セッション終了時に必ず実行）

```bash
# DayN を今日の番号に置き換える
git tag dayN && git push origin dayN
```

- タグは「その Day の最後の feat: コミット」に打つ
- `git checkout day12` のように任意の日に戻れる
- HANDOVER.md の「現在のコミット」欄にもタグ名を記載すること

### spec ファイル一覧

| ファイル | 対象 | 担当 | 状態 |
|---|---|---|---|
| `docs/spec/SDD-OVERVIEW.md` | SDD全体の設計思想 | Claude Desktop | ✅ |
| `docs/spec/agent-roles.md` | マルチエージェント担当範囲 | Claude Desktop | ✅ |
| `docs/spec/command-pattern.spec.md` | Commandパターン | Claude Code | ✅ |
| `docs/spec/plugin-registry.spec.md` | Plugin Registry | Claude Code | ✅ |
| `docs/spec/program-preview-bus.spec.md` | Program/Previewバス | Claude Code | ✅ |
| `docs/spec/transition-plugin.spec.md` | Transition Plugin | Transition Agent | ✅ |
| `docs/spec/mixer-plugin.spec.md` | MixerPlugin Interface | Mixer Agent | ✅ |
| `docs/spec/simple-window.spec.md` | Simple Window の概念 | Claude Desktop | ✅ |
| `docs/spec/window-plugin.spec.md` | Window Plugin 再定義 | Claude Desktop | ✅ |
| `docs/spec/layer-system.spec.md` | レイヤーシステム | Claude Code | ✅ |
| `docs/spec/macro-knob.spec.md` | マクロノブ | Claude Code | ✅ |
| `docs/spec/geometry-plugin.spec.md` | Geometry Plugin共通 | Geometry Agent | ✅ |
| `docs/spec/fx-stack.spec.md` | FXスタック | FX Agent | ✅ |
| `docs/spec/camera-system.spec.md` | カメラシステム | Claude Code | ✅ |
| `docs/spec/electron.spec.md` | Electron アーキテクチャ | Claude Code | ✅ |
| `docs/spec/preferences-panel.spec.md` | Preferences Panel | Claude Code | ✅ |
| `docs/spec/project-file.spec.md` | プロジェクトファイル | Claude Code | ✅ |
| `docs/spec/plugin-lifecycle.spec.md` | Plugin ライフサイクル | Claude Code | ⬜ |
| `docs/spec/shader-plugin.spec.md` | Shader Plugin（疎結合・GeoGraffiコア） | Claude Code | ⬜ 設計済み・実装はシーケンサー後 |

---

## MUST: 絶対に守るルール

- MUST: 実装前に `docs/spec/[対象].spec.md` を読むこと（SDD原則）
- MUST: プランを提示・承認を得てから実装を開始すること
- MUST: `pnpm tsc --noEmit` + `pnpm test --run` 両方通過を完了条件とすること（CDD原則）
- MUST: `any` による型解決は禁止。型エラーは自律修正すること
- MUST: 各ステップ完了ごとに `docs/progress/[task].log.md` に追記すること
- MUST: セッション終了時に `git commit` + `git tag dayN && git push origin dayN` を実行すること
- MUST: `engine.ts` は `App.tsx` に依存してはいけない・単体で動作できること
- MUST: Parameter Store の変更は必ず Command 経由でのみ行うこと（直接代入禁止）
- MUST: Plugin には `renderer`・`enabled` フィールドを持たせること（PluginBase 参照）
- MUST: Transition Plugin は `execute()` を純粋関数として実装すること（戻り値は SceneState）
- MUST: 各モジュールの CLAUDE.md を読んでから実装すること
- MUST: 共有ファイル（engine.ts・types/index.ts）の変更は Claude Code のみ
- MUST: ターミナルコマンドの実行を求めるときは必ずコピペ可能なコマンドを作って渡すこと

---

## 開発の基本ルール

1. 一度に全部作らない → 1ファイルずつ確認しながら進める
2. 必ずプランを提示してから実装する → 「何をするか」を先に伝える
3. 動作確認を必ずはさむ → 実装 → tsc + test → ブラウザ確認 → 次へ
4. YouTube で解説できる理解度を保つ → ブラックボックスにしない

---

## アーキテクチャ

```
src/plugins/
  geometry/    ← 何を描画するか（主役）・Geometry Agent担当
  particles/   ← 背景・雰囲気
  fx/          ← エフェクト・FX Agent担当
  lights/      ← ライト
  transitions/ ← トランジション（UI なし・処理のみ）・Transition Agent担当
  mixers/      ← MixerPlugin（Simple Window 含む）・Mixer Agent担当
  windows/     ← Window Plugin（カスタム UI）・v2〜
src/drivers/
  tempo/       ← テンポ取得
  input/       ← デバイス操作
  output/      ← 出力先
  modulator/   ← パラメーター値の供給元
```

---

## CLAUDE.md の階層と参照先

このファイルはプロジェクト全体の方針・開発ルール・ナビゲーションのみを持つ。
実装の詳細・モジュール固有の MUST ルールは各モジュールの CLAUDE.md に書く。
実装時は必ず対応するモジュールの CLAUDE.md を読むこと（上記「始業時の読み方」参照）。

```
geography/CLAUDE.md               ← このファイル（全体方針・SDD×CDD原則）
docs/spec/                        ← SSoT（仕様ファイル群・マルチエージェント定義）
docs/progress/                    ← 自律開発の進捗ログ
docs/recipes/                     ← 成功した実装パターンの蓄積
src/core/CLAUDE.md                ← エンジン固定部分・Clock・LayerManager・Bus・Command設計
src/plugins/geometry/CLAUDE.md    ← renderer・enabled フィールドの扱い
src/plugins/transitions/CLAUDE.md ← UI を持たない・execute() 純粋関数
src/plugins/mixers/CLAUDE.md      ← MixerPlugin 定義・Simple Window との関係・MUST ルール
src/plugins/windows/CLAUDE.md     ← Window Plugin 定義（v2〜）
src/plugins/fx/CLAUDE.md          ← FX スタック順序・FX Plugin Interface
src/plugins/lights/CLAUDE.md      ← Light Plugin Interface
src/plugins/particles/CLAUDE.md   ← Particle Plugin Interface
src/drivers/
src/ui/CLAUDE.md                  ← Window/Panel 命名原則・Simple Window 一覧・View メニュー連携
```

---

## ツール役割分担

| ツール | 役割 |
|---|---|
| Claude Desktop | **spec制作・仕様の壁打ち**・CLAUDE.md・docs/ の編集・エージェント定義 |
| Claude Code | specを読んでから実装・tsc+test両方通過・Git 操作・共有ファイル管理 |
| Geometry Agent（v2〜） | `src/plugins/geometry/**` の追加・改善 |
| FX Agent（v2〜） | `src/plugins/fx/**` の追加・改善 |
| Mixer Agent（v2〜） | `src/plugins/mixers/**` の追加・改善 |
| Transition Agent（v2〜） | `src/plugins/transitions/**` の追加・改善 |
| Obsidian | 開発ログ・意思決定記録・YouTube 素材管理 |
