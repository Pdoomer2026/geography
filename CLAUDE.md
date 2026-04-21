# GeoGraphy - CLAUDE.md v12

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

### ブラウザ確認フロー（MUST・Day47確立）

Cursor でコマンド実行後はブラウザが古いビルドを参照している。
**必ず以下の2ステップを順番に実行すること**：

```bash
# Step 1: dev サーバーを起動（止まっていたら再起動）
cd /Users/shinbigan/geography && pnpm dev

# Step 2: ブラウザを新規タブで開く（Step 1 の起動確認後）
open http://localhost:5173
```

- `open` コマンドだけでは古いキャッシュが残るため反映されない
- HMR（Hot Module Replacement）も hard reload も反映されないため、必ず `pnpm dev` から再起動すること
- Claude In Chrome MCP のスクリーンショットで確認する前に、必ず慎太郎さんが上記2ステップを実行済みであることを確認すること

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
   例）src/engine/geometry/ を触る → src/engine/geometry/CLAUDE.md を読む
       src/engine/fx/ を触る       → src/engine/fx/CLAUDE.md を読む
       src/ui/ を触る             → src/ui/CLAUDE.md を読む
       src/application/ を触る    → 該当サブディレクトリの CLAUDE.md を読む
4. その CLAUDE.md が参照している spec ファイルを読む
4.5. 下記「ファイル更新時の鉄則」を確認する（毎回）
5. 実装開始
```

### ファイル更新時の鉄則（MUST・Day30確立・Day36強化・Day39最重要ルール追加）

**⚠️ 最重要ルール（Day39確立）：HANDOVER.md・日本語ファイルは必ず NFC 正規化してから編集すること**

macOS APFS は日本語を NFD 形式で保存する。NFC 正規化していないファイルは `edit_file` の `oldText` がマッチしない。
これが未解決のまま `write_file` で逃げると情報消失リスクがある。

**セッション開始時に HANDOVER.md を NFC 正規化するコマンド（毎回実行すること）：**

```bash
python3 -c "
import unicodedata, pathlib
p = pathlib.Path('/Users/shinbigan/geography/HANDOVER.md')
p.write_text(unicodedata.normalize('NFC', p.read_text('utf-8')), 'utf-8')
print('HANDOVER.md NFC 正規化完了')
"
```

**新規ファイルを `write_file` で作成した直後も同様に NFC 正規化すること。**

毎回のセッションで同じミスが起きるため、始業時に必ず確認すること。

- MUST: ファイル更新前に必ず `read_text_file` で元ファイルを読むこと
- MUST: 更新は `filesystem:edit_file` を使うこと（変更箇所だけを編集・差分を最小化する）
- MUST: `write_file` は全書き換えになるため**既存ファイルには絶対に使わない**
- MUST: 新規ファイル作成のみ `write_file` を使う（既存ファイルへの使用は禁止）
- MUST: `write_file` で新規作成した直後は NFC 正規化を実行する：`python3 /Users/shinbigan/nfc_normalize.py`
- MUST: 更新後は `git diff HEAD [ファイル名] | cat` で差分を慎太郎さんと一緒に確認すること

**⚠️ 大幅更新フロー（edit_file で対応できない時・Day41確立）**

更新量が大きく `edit_file` での編集が困難な場合（spec の全書き直し等）は以下のフローを使う：

```
Step 0: edit_file で対応できるか判断
  → 変更箇所が少ない・日本語 anchor が安定 → edit_file で通常編集
  → 更新量が大きい・全体を書き直す場合    → 以下のフローへ

Step 1: アーカイブフォルダ確認
  → なければ create_directory で作成
  → spec の場合: docs/archive/spec/
  → CLAUDE.md の場合: docs/archive/CLAUDE/（archive スクリプトが自動作成）

Step 2: move_file（現行 → アーカイブ・トークンゼロ）
  docs/spec/[name].spec.md
  → docs/archive/spec/YYYY-MM-DD_DayN_[name].spec.md

Step 3: write_file（新内容で新規作成）← move_file 後はファイルが存在しないので write_file が正しい
  docs/spec/[name].spec.md

Step 4: NFC 正規化
  python3 /Users/shinbigan/nfc_normalize.py
```

- move_file = ファイルの中身を読まずに済む → トークンゼロ・一瞬で完了
- move_file 後はファイルが存在しない → write_file で新規作成（filesystem MCP に create_file は存在しない）
- アーカイブファイル名に日付・Day番号を含める → 更新履歴が一目瞭然

**⚠️ CLAUDE.md / spec.md 更新時の差分保持ルール（Day50確立）**

既存の CLAUDE.md・spec.md・その他ドキュメントを更新するときは以下の手順を厳守すること。
「記憶で書ける」と判断して元ファイルを読まずに進めることは禁止。
このルールは CLAUDE.md・spec.md・HANDOVER.md・すべてのドキュメントファイルに適用される。

```
Step 0: edit_file で対応できるか判断する
  → 追記・一部変更のみ          → edit_file で編集（ルート CLAUDE.md は必ず edit_file）
  → 大幅更新・全体を書き直す場合 → 以下の Step 1〜5 へ

Step 1: move_file でアーカイブ
Step 2: アーカイブした元ファイルを read_text_file で必ず読む
Step 3: 「継続すべき内容」と「変更・追加する内容」の差分を整理して慎太郎さんに提示する
Step 4: 承認を得る
Step 5: write_file で新規作成
```

- MUST: Step 2〜4 を省略しない・「記憶で書ける」は理由にならない
- MUST: 「継続すべき内容」は全て保持する・削除は承認を得てから
- MUST: ルート CLAUDE.md は edit_file のみ・move_file + write_file は禁止
- MUST: 承認前に write_file を実行しない

**⚠️ CLAUDE.md 更新時の必須手順（AI への命令の品質管理・Day39確立）**

CLAUDE.md は「AI への命令書」であり、その変遷を追うことで「ルールが機能したか」を dev-log / handover で検証できる。

CLAUDE.md を編集する**前**に必ずアーカイブする：

```bash
bash /Users/shinbigan/archive_claude_before_edit.sh DayN [module]
# module: root / core / plugins-fx / plugins-geometry / plugins-mixers / ui / ui-panels
# 例: bash /Users/shinbigan/archive_claude_before_edit.sh Day40 root
```

- アーカイブ保存先: `docs/archive/CLAUDE/YYYY-MM-DD_DayN_[module]-CLAUDE.md`
- アーカイブ後に `edit_file` で編集する
- 編集後に `python3 /Users/shinbigan/nfc_normalize.py` で NFC 正規化

**⚠️ Day36 で発生した重大ミス（同じ過ちを繰り返さないために記録）**

`fx-parameter-reference.md`（元の対照表）を提案書の内容で `write_file` 上書きし、
元ファイルを消滅させた。「`edit_file` でエンコードエラーが出たことがある」という
過去の経験を口実に `write_file` を使い続けた。

- `edit_file` でエンコードエラーが出る原因 → **`read_text_file` で読まずに編集しようとするから**
- 正しい対処 → エラーが出たら「読んでから `edit_file`」。`write_file` への逃げは禁止
- 「承認をもらった」「早い方が良い」はいかなる理由にもならない
- 新規ドキュメントを作るときは**既存ファイルとは別のファイル名で作成する**（上書きしない）

**⚠️ Day39 で発生した問題：Unicode NFC/NFD 不一致による edit_file ミスマッチ（Day39確立）**

macOS の APFS ファイルシステムは日本語を NFD 形式で保存する。
Claude が NFC 形式で `oldText` を送ると一致しない → `edit_file` が失敗する。

- MUST: `write_file` で日本語を含む新規ファイルを作成した直後に、以下の正規化コマンドを慎太郎さんに実行してもらうこと
- 毎回ではなく**新規作成の直後に 1 回だけ**実行すれば十分

```bash
# Unicode NFC 正規化（write_file で作成した日本語ファイルに必ず実行）
python3 -c "
import unicodedata, pathlib
p = pathlib.Path('/Users/shinbigan/geography/[作成したファイルのパス]')
p.write_text(unicodedata.normalize('NFC', p.read_text('utf-8')), 'utf-8')
"
```

- `edit_file` の `oldText` に日本語を含める場合は**できるだけ短く・ASCII を anchor にする**こと
- エラーが出たら NFC 正規化を疑い、上記コマンドを実行してから再試行する

### Obsidian dev-log の作成（MUST・Day39確立）

セッション終了時に必ず Obsidian の dev-log を作成すること。

- **ファイル名**: `YYYY-MM-DD_DayN.md`
- **保存先**: `/Users/shinbigan/GeoGraphy Vault/dev-log/`
- **内容**: 今日やったこと・重要な判断・学び・次回の予定を自然な文章で記述する
- **作成後**: python3 で NFC 正規化を必ず実行する（`write_file` が NFD で保存するため）

```bash
# dev-log NFC 正規化
python3 -c "
import unicodedata, pathlib
p = pathlib.Path('/Users/shinbigan/GeoGraphy Vault/dev-log/YYYY-MM-DD_DayN.md')
p.write_text(unicodedata.normalize('NFC', p.read_text('utf-8')), 'utf-8')
"
```

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

### コミットメッセージの形式（Day39確立・Linus スタイル）

Claude がコミットコマンドを渡すときは必ず **タイトル + ボディ**の2段構成にすること。

```bash
# タイトル（1行目）：何をしたか
# ボディ（3行目以降）：なぜその変更をしたのか・何を判断したのか
git commit -m "feat: add orbit camera to icosphere (Day40)" \
           -m "壁打ちで Orbit カメラが必要と確定。
camera-system.spec.md の CameraPreset 機構を拡張し OrbitControls を統合。
Icosphere / Torus / Torusknot の 3 Plugin に cameraPreset を追加。"
```

- 1行目：`type: 内容の要約 (DayN)` 形式
- ボディ：「なぜ」と「何を判断したか」を必ず恂ること
- `git log --oneline` では1行目だけ表示されるのでログの見やすさは変わらない
- 詳細は `git show <commit>` でいつでも参照できる

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
| `docs/spec/midi-registry.spec.md` | MIDI Registry（動的状態管理） | Claude Desktop | ⬜ Day55 設計確定 |
| `docs/spec/plugin-manager.spec.md` | Plugin Manager（Phase A/B フロー） | Claude Desktop | ⬜ Day55 設計確定 |

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
- MUST: localStorage は原則使用しない。Preset 永続化のみ例外許可（`src/ui/CLAUDE.md` の localStorage 使用方針を参照）

---

## 開発の基本ルール

1. 一度に全部作らない → 1ファイルずつ確認しながら進める
2. 必ずプランを提示してから実装する → 「何をするか」を先に伝える
3. 動作確認を必ずはさむ → 実装 → tsc + test → ブラウザ確認 → 次へ
4. YouTube で解説できる理解度を保つ → ブラックボックスにしない

---

## アーキテクチャ（Day68確定・3ゾーン構造）

```
src/
  engine/              Three.js プラグイン（疎結合）
    geometry/          何を描画するか（主役）
    fx/                エフェクト
    cameras/           カメラ
    lights/            ライト
    particles/         背景・雰囲気

  application/         意思決定・Registry・Transport
    orchestrator/      エンジン中枢
      engine.ts        レンダーループ・初期化
      layerManager.ts  レイヤー管理
      fxStack.ts       FX スタック管理
      programBus.ts    Program バス
      previewBus.ts    Preview バス（SceneState のみ）
      tempo/clock.ts   BPM クロック
    registry/          パラメータ管理
      registry.ts      Plugin Registry（自動登録）
      transportManager.ts   全入力の唯一の通路
      transportRegistry.ts  slot→paramId 対応表
      assignRegistry.ts     CC→パラメータのアサイン定義
      state/parameterStore.ts  パラメーター一元管理
    catalog/           CC マッピング
      ccMapService.ts  将来 paramCatalog に昇格予定
    command/           Command パターン
      command.ts
      geo-transitions/ GeoGraphy 独自 Transition
    adapter/           入出力ドライバ
      input/MidiInputWrapper.ts
      storage/projectManager.ts
      storage/presetStore.ts
    schema/            型定義 SSoT
      index.ts  config.ts  midi-registry.ts
      windowMode.ts  geoAPI.d.ts  midiRegistry.ts

  ui/                  表示・操作
    components/
      window/          Window コンポーネント群
      mixers/          Mixer コンポーネント群
    panels/            Preferences 等
    hooks/             useParam 等

  types/               自動生成ファイルのみ（geo-cc-map.generated.ts 等）
```

---

## CLAUDE.md の階層と参照先

このファイルはプロジェクト全体の方針・開発ルール・ナビゲーションのみを持つ。
実装の詳細・モジュール固有の MUST ルールは各モジュールの CLAUDE.md に書く。
実装時は必ず対応するモジュールの CLAUDE.md を読むこと（上記「始業時の読み方」参照）。

```
geography/CLAUDE.md                             <- このファイル（全体方針・SDD x CDD原則）
docs/spec/                                      <- SSoT（仕様ファイル群・マルチエージェント定義）
docs/progress/                                  <- 自律開発の進捗ログ
docs/recipes/                                   <- 成功した実装パターンの蓄積

src/core/CLAUDE.md                             <- WARNING: src/core/ は Day68 で解体済み
                                                   実装ファイルは application/ 以下に移行完了

src/engine/geometry/CLAUDE.md                  <- Geometry Plugin 実装詳細
src/engine/fx/CLAUDE.md                        <- FX Plugin / FX スタック順序

src/ui/CLAUDE.md                               <- Window/Panel 命名原則 / Simple Window 一覧
src/ui/panels/CLAUDE.md                        <- Panels 全般
src/ui/panels/preferences/CLAUDE.md           <- Preferences Panel
src/ui/panels/macro-knob/CLAUDE.md            <- MacroKnob Panel
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
