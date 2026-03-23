# GeoGraphy HANDOVER.md｜Day12 完了｜2026-03-23

---

## 【継続層】プロジェクト全体の状態（累積・上書き禁止）

> ここは毎回「追記」する。過去の内容を消してはいけない。

### プロジェクト概要（固定）

- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応のブラウザベース映像制作プラットフォーム
- **技術スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / shadcn/ui / Framer Motion
- **GitHub**: https://github.com/Pdoomer2026/geography
- **開発サーバー**: `pnpm dev`（ポート5173〜5176）
- **ホスティング**: Vercel
- **最新ドキュメント**: 要件定義書 v1.7 / 実装計画書 v2.5（`docs/` フォルダ）

---

### 確定した設計原則（変更不可）

#### 開発スタイル：SDD × CDD（仕様駆動 × コンパイラ駆動）
- **SSoT（唯一の真実）**: `docs/spec/` 配下の `.spec.md` ファイル群
- **MUST: 実装前に対応する spec ファイルを読むこと**
- **MUST: 仕様変更は spec を先に修正 → 再実装**
- **MUST: 完了条件 = `pnpm tsc --noEmit` + `pnpm test --run` 両方通過**
- **MUST: `any` による解決禁止・型エラーは自律修正**
- 詳細: `docs/spec/SDD-OVERVIEW.md`

#### spec ファイル一覧
| ファイル | 状態 |
|---|---|
| `docs/spec/command-pattern.spec.md` | ✅ 実装済み |
| `docs/spec/program-preview-bus.spec.md` | ✅ 実装済み |
| `docs/spec/transition-plugin.spec.md` | ✅ 実装済み |
| `docs/spec/layer-system.spec.md` | ✅ Day12実装済み |
| `docs/spec/geometry-plugin.spec.md` | ✅ 作成済み |
| `docs/spec/fx-stack.spec.md` | ✅ 作成済み |
| `docs/spec/mixer-plugin.spec.md` | ✅ 作成済み |
| `docs/spec/plugin-registry.spec.md` | ✅ 作成済み |
| `docs/spec/agent-roles.md` | ✅ マルチエージェント担当範囲 |
| `docs/spec/macro-knob.spec.md` | ⬜ 未着手 |
| `docs/spec/camera-system.spec.md` | ⬜ 未着手 |

#### プラットフォーム思想
- engine.ts は App.tsx に依存してはいけない・単体で動作できること
- Plugin には `renderer`・`enabled` フィールドを必ず持たせる
- エンジンは Plugin / Driver の種類を知らない・Interface を通じてのみ通信する

#### Plugin Group 構造
```
Three.js Plugin Group（v1）← 現在実装中
PixiJS Plugin Group（v2）
opentype.js Plugin Group（v3）
```

#### エンジン固定部分（Plugin が触れない）
- Parameter Store / Plugin Registry / Command パターン / BPM クロック
- メニューバー（全 Mixer 共通・固定）
- マクロノブパネル（32ノブ・4列・MIDI との物理対応があるため固定）

#### Program / Preview バス
- Program バス：フルサイズ Three.js Scene（実際に出力）
- Preview バス：SceneState（JSON）+ 小キャンバス（320×180）
- GPU メモリー増加はほぼゼロ

#### Mixer Plugin ルール
- SimpleMixer は v1 で固定実装・v2 で Plugin 化
- **閉じることができない**（常時表示・全 Mixer Plugin 共通）
- v1 から MixerPlugin Interface に準拠した実装にすること

#### Transition Plugin ルール
- UI を持たない・SceneState を受け取り変形するだけ
- **execute() は純粋関数・戻り値は SceneState**（void ではない）
- v1 実装：Beat Cut / CrossFade のみ

#### レイヤーシステム（Day12実装済み）
- MAX_LAYERS = 3 / CSS mixBlendMode で合成 / WebGL RenderTarget 不要
- LayerManager シングルトン（`layerManager`）で管理
- 各レイヤーは独立した THREE.WebGLRenderer / THREE.Scene / PerspectiveCamera を持つ
- `position: absolute` で重ねる・`alpha: true` + `setClearColor(0x000000, 0)` で透明背景

#### FX スタック順序（厳守）
```
AfterImage → Feedback → Bloom → Kaleidoscope → Mirror
→ ZoomBlur → RGBShift → CRT → Glitch → ColorGrading（最後）
```

#### FX デフォルト（起動時）
Bloom ON（0.8）/ After Image ON（0.85）/ RGB Shift ON（0.001）/ その他 OFF / ColorGrading ON（フラット）

#### Command パターン
- Parameter Store の変更は必ず Command 経由
- MAX_UNDO_HISTORY = 50 / Cmd+Z アンドゥ / Cmd+Shift+Z リドゥ

---

### 実装済み内容（Day別・累積）

| Day | 主な実装内容 | 確認 |
|---|---|---|
| Day1 | Three.js 回転する立方体 | ✅ |
| Day2 | Plugin Interface / Command パターン / Parameter Store | ✅ |
| Day3 | Plugin Registry / grid-wave Plugin / OrbitControls | ✅ |
| Day4 | config.ts / AmbientLight Plugin / Starfield Plugin | ✅ |
| Day5 | Obsidian 導入 / parameterStore.test.ts / engine.ts 骨格 | ✅ |
| Day6 | ProgramBus / PreviewBus / SimpleMixer scaffold | ✅ |
| Day7 | CrossFade Transition Plugin / execute() 純粋関数化 / SimpleMixer App.tsx 常時表示 | ✅ |
| Day8 | SimpleMixer ↔ ProgramBus / PreviewBus 本接続・PreviewCanvas mount・crossfader execute() 接続 | ✅ |
| Day9 | engine.ts に grid-wave create/destroy 統合・初期 SceneState 生成・ProgramBus/PreviewBus に流し込み | ✅ |
| Day10 | src/core/clock.ts BPM クロック実装・engine.ts に接続・SimpleMixer Tap Tempo ボタン追加 | ✅ |
| Day11 | engine.ts に Beat Cut 接続（ラップアラウンド検出・swap）・SimpleMixer プルダウン → engine.setTransition() 接続 | ✅ |
| Day11+ | SDD導入・docs/spec/ ディレクトリ作成・spec9本作成・CLAUDE.md v7更新・CDD統合指針策定 | ✅ |
| Day12 | LayerManager実装・engine.ts接続・SimpleMixer PROGRAM表示・型追加・テスト43本 | ✅ |

---

### ドキュメント構成（累積）

| ファイル | 内容 | 用途 |
|---|---|---|
| `docs/要件定義書_v1.7.md` | 最新要件定義書 | **実装の根拠** |
| `docs/実装計画書_v2.5.md` | 最新実装計画書 | **実装の根拠** |
| `docs/spec/SDD-OVERVIEW.md` | SDD全体の設計思想 | **SSoT管理ファイル** |
| `docs/spec/agent-roles.md` | マルチエージェント担当範囲 | **エージェント憲法** |
| `docs/spec/layer-system.spec.md` | レイヤーシステム仕様 | **SSoT・実装済み** |
| `docs/progress/day12-layer-system.log.md` | Day12進捗ログ | 完了記録 |
| `docs/recipes/README.md` | 実装パターン集 | コントリビューター向け |

---

### 重要ファイルパス（累積）

| ファイル | パス |
|---|---|
| ルート CLAUDE.md | `geography/CLAUDE.md` |
| SDD概要 | `docs/spec/SDD-OVERVIEW.md` |
| エージェント憲法 | `docs/spec/agent-roles.md` |
| 引き継ぎメモ | `geography/HANDOVER.md` |
| 要件定義書 v1.7 | `docs/要件定義書_v1.7.md` |
| 実装計画書 v2.5 | `docs/実装計画書_v2.5.md` |
| 型定義 | `src/types/index.ts` |
| エンジン設定 | `src/core/config.ts` |
| エンジン本体 | `src/core/engine.ts` |
| LayerManager | `src/core/layerManager.ts` |
| BPM クロック | `src/core/clock.ts` |
| Plugin Registry | `src/core/registry.ts` |
| Parameter Store | `src/core/parameterStore.ts` |
| Program バス | `src/core/programBus.ts` |
| Preview バス | `src/core/previewBus.ts` |
| SimpleMixer | `src/plugins/windows/simple-mixer/` |
| CrossFade Plugin | `src/plugins/transitions/crossfade/index.ts` |
| Beat Cut Plugin | `src/plugins/transitions/beat-cut/index.ts` |
| Obsidian Vault | `/Users/shinbigan/GeoGraphy Vault/` |
| Hooks設定 | `.claude/settings.json` |
| 進捗ログ | `docs/progress/` |
| Recipeパターン集 | `docs/recipes/` |

---

### Git ブランチ構成（累積）

| ブランチ | 内容 |
|---|---|
| `main` | メイン開発ブランチ |
| `restore/day4-baseline` | Day4 完了時点の状態を永久保存 |
| `restore/day5-baseline` | Day5 開始前 |
| `restore/day6-baseline` | Day6 開始前 |

---

### 環境メモ・注意点（累積）

- pnpm 必須（npm / yarn 不可）
- Three.js r160+ を使用
- **完了条件: `pnpm tsc --noEmit` + `pnpm test --run` 両方通過（CDD原則）**
- `.claude/settings.json` にHooks設定済み（PostToolUse: tsc自動実行 / TaskCompleted: tsc+test強制）
- `layerManager` はシングルトンで export（`engine.ts` と同様のパターン）
- LayerManager の `initialize()` は DOM が存在する状態で呼ぶ（engine.initialize() 内）
- `engine.ts` の `threeClock`（THREE.Clock）と `clock`（BPM Clock）は別物・混同しないこと
- Beat Cut のラップアラウンド検出条件: `prevBeat > 0.8 && beat < 0.2`
- CLAUDE.md 群・docs/ の更新は Claude Desktop から直接行う
- Git 操作（ブランチ・コミット・プッシュ）は Claude Code から行う

---

### ロードマップ（確定版）

| バージョン | 主な内容 |
|---|---|
| v1 | Three.js 基盤・Plugin/Driver・SimpleMixer・Program/Preview バス・Beat Cut + CrossFade・マクロノブ・レイヤー・録画・OSS 公開 |
| v2 | Geometry ランチャー・Mixer Plugin 化・CrossfadeMixer・GL Transitions・Geometry シーケンサー・Embed Export・PixiJS |
| v3 | Full Morph・opentype.js Typography・Spatial Extension |
| v4 | Claude.ai 自動トランジション・Video Input Driver |
| Browser Bridge | Syphon/Spout ユーティリティ（別プロジェクト） |

---

## 【引き継ぎ層】次のセッションでやること（毎回上書き）

### 🔴 次のセッションで最初にやること

1. `pnpm tsc --noEmit && pnpm test --run` で確認（43 tests）
2. `pnpm dev` でブラウザ目視確認
3. Day13の実装タスクに進む（下記参照）

### 現在の作業状態

- **ブランチ**: `main`
- **最後のコミット**: `feat: Day12 - layer system`（ff3f3b2）
- **動作確認状態**: tsc PASS ✅・43 tests グリーン ✅・ブラウザ目視確認済み ✅
- **未コミットファイル**: なし（HANDOVER.md更新後にpush必要）
- **開発環境**: Cursor / Browser Tab + zsh ターミナル

### 未解決の問題

なし

### 次回の本実装タスク（Day 13）

レイヤーシステムが実装された。
次は**マクロノブシステム**の実装に進む（Phase 8 続き）。

実装前に `docs/spec/macro-knob.spec.md` を作成すること（SDD原則）。

0. **Claude Desktopで `docs/spec/macro-knob.spec.md` を作成**
1. **`src/core/macroKnob.ts` の実装**
   - 32ノブ（8ノブ × 4行）
   - 1ノブに最大3パラメーター割り当て
   - MIDIマッピング（CC 0〜127 → min/max に正規化）
2. **`engine.ts` に MacroKnob を接続**
3. **SimpleMixer または MacroKnobPanel UI の実装**
4. テスト追加・tsc + test 両方通過確認
5. `git add -A && git commit -m "feat: Day13 - macro knob system"`

### 今回のセッション（Day12）で確定したこと

- `src/core/layerManager.ts` 新規作成（MAX_LAYERS参照・CSS合成・mute対応）
- `src/types/index.ts` に `CSSBlendMode` / `Layer` interface 追加
- `engine.ts` を LayerManager 駆動に変更（initialize/update/resize/dispose/getLayers）
- `SimpleMixer.tsx` の PROGRAM エリアを実レイヤー表示化（blendMode・LIVE/MUTE表示）
- `tests/core/layerManager.test.ts` 新規作成（TC-1〜TC-5・43 tests）
- Progressログ自動記録を確認（エージェントが `docs/progress/` に自律記録）
- **CDD（コンパイラ駆動開発）初運用：tsc + test 両方通過を完了条件として実証**
