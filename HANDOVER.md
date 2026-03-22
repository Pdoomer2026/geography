# GeoGraphy HANDOVER.md｜Day11 完了｜2026-03-18

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

#### 開発スタイル：SDD（仕様駆動開発）
- **SSoT（唯一の真実）**: `docs/spec/` 配下の `.spec.md` ファイル群
- **MUST: 実装前に対応する spec ファイルを読むこと**
- **MUST: 仕様変更は spec を先に修正 → 再実装**
- 詳細: `docs/spec/SDD-OVERVIEW.md`

#### spec ファイル一覧
| ファイル | 状態 |
|---|---|
| `docs/spec/command-pattern.spec.md` | ✅ 実装済み |
| `docs/spec/program-preview-bus.spec.md` | ✅ 実装済み |
| `docs/spec/transition-plugin.spec.md` | ✅ 実装済み |
| `docs/spec/layer-system.spec.md` | 🔴 Day12実装対象 |

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

#### レイヤーシステム
- MAX_LAYERS = 3 / CSS mixBlendMode で合成 / WebGL RenderTarget 不要

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
| Day11+ | SDD導入・docs/spec/ ディレクトリ作成・spec4本作成・CLAUDE.md v6更新 | ✅ |

---

### ドキュメント構成（累積）

| ファイル | 内容 | 用途 |
|---|---|---|
| `docs/要件定義書_v1.4.md` | 元の要件定義書 | 参照・保存用 |
| `docs/要件定義書_v1.7.md` | v1.4 + 壁打ち追加の完全統合版 | **最新・実装の根拠** |
| `docs/実装計画書_v2.2.md` | 元の実装計画書 | 参照・保存用 |
| `docs/実装計画書_v2.5.md` | v2.2 + 壁打ち追加の完全統合版 | **最新・実装の根拠** |
| `docs/spec/SDD-OVERVIEW.md` | SDD全体の設計思想・開発サイクル | **SSoT管理ファイル** |
| `docs/spec/command-pattern.spec.md` | Commandパターン仕様 | **SSoT** |
| `docs/spec/program-preview-bus.spec.md` | Program/Previewバス仕様 | **SSoT** |
| `docs/spec/transition-plugin.spec.md` | Transition Plugin仕様 | **SSoT** |
| `docs/spec/layer-system.spec.md` | レイヤーシステム仕様 | **SSoT・Day12実装根拠** |

---

### CLAUDE.md 構成（累積）

| ファイル | バージョン | 主な内容 |
|---|---|---|
| `geography/CLAUDE.md` | **v6** | プラットフォーム思想・SDD原則・spec一覧・ツール役割 |
| `src/core/CLAUDE.md` | 最新 | ProgramBus・PreviewBus・SceneState・ENABLED_PLUGIN_GROUPS |
| `src/plugins/geometry/CLAUDE.md` | 最新 | renderer・enabled フィールド必須 |
| `src/plugins/transitions/CLAUDE.md` | 最新 | UI を持たない・execute() 純粋関数・SceneState のみ操作 |
| `src/plugins/windows/CLAUDE.md` | 最新 | SimpleMixer の制約・MixerPlugin Interface |
| `src/plugins/fx/CLAUDE.md` | 最新 | FX スタック順序・renderer 必須 |
| `src/plugins/lights/CLAUDE.md` | 最新 | renderer 必須 |
| `src/plugins/particles/CLAUDE.md` | 最新 | renderer 必須 |
| `src/drivers/CLAUDE.md` | 最新 | Modulator Driver 優先順位一覧 |
| `src/ui/CLAUDE.md` | 最新 | SimpleMixer の配置・固定 UI の明記 |

---

### 重要ファイルパス（累積）

| ファイル | パス |
|---|---|
| ルート CLAUDE.md | `geography/CLAUDE.md` |
| SDD概要 | `docs/spec/SDD-OVERVIEW.md` |
| 引き継ぎテンプレート | `geography/HANDOVER_TEMPLATE.md` |
| 引き継ぎメモ | `geography/HANDOVER.md` |
| 要件定義書 v1.7（最新） | `docs/要件定義書_v1.7.md` |
| 実装計画書 v2.5（最新） | `docs/実装計画書_v2.5.md` |
| 型定義 | `src/types/index.ts` |
| エンジン設定 | `src/core/config.ts` |
| エンジン本体 | `src/core/engine.ts` |
| BPM クロック | `src/core/clock.ts` |
| Plugin Registry | `src/core/registry.ts` |
| Parameter Store | `src/core/parameterStore.ts` |
| Program バス | `src/core/programBus.ts` |
| Preview バス | `src/core/previewBus.ts` |
| SimpleMixer | `src/plugins/windows/simple-mixer/` |
| Transition Plugin | `src/plugins/transitions/` |
| CrossFade Plugin | `src/plugins/transitions/crossfade/index.ts` |
| Beat Cut Plugin | `src/plugins/transitions/beat-cut/index.ts` |
| Obsidian Vault | `/Users/shinbigan/GeoGraphy Vault/` |

---

### Git ブランチ構成（累積）

| ブランチ | 内容 |
|---|---|
| `main` | メイン開発ブランチ |
| `restore/day4-baseline` | Day4 完了時点の状態を永久保存 |
| `restore/day5-baseline` | Day5 開始前の状態を永久保存（2026-03-18） |
| `restore/day6-baseline` | Day6 開始前の状態を永久保存（2026-03-18） |

---

### 環境メモ・注意点（累積）

- pnpm 必須（npm / yarn 不可）
- Three.js r160+ を使用（それ以前は API が異なる）
- Preview バスの小キャンバス（320×180）は FPS への影響を最初に確認すること
- SimpleMixer は v1 固定だが最初から MixerPlugin Interface に準拠すること
- Browser Bridge は GeoGraphy とは完全に別リポジトリ・別プロジェクト
- **Claude Desktop MCP は `/Users/shinbigan` 全体に権限拡張済み**
- CLAUDE.md 群・docs/ の更新は Claude Desktop から直接行う
- Git 操作（ブランチ・コミット・プッシュ）は Claude Code から行う
- `import.meta.glob` を使う場合は `tsconfig.json` に `"types": ["vite/client"]` が必要
- Claude Desktop から Cursor 内ターミナルの stdout を直接読む手段はない（`.claude/` には会話ログのみ）
- テスト結果をファイルに書き出す運用：`pnpm test --run 2>&1 | tee .claude/test-latest.txt`
- Claude Code へのプロンプトは `.claude/day{N}-prompt.md` に保存して `cat` で読み込む運用
- grid-wave の実際のパス: `src/plugins/geometry/wave/grid-wave/index.ts`（`wave/` サブフォルダ以下）
- `engine.ts` の `threeClock`（THREE.Clock）と `clock`（BPM Clock）は別物・混同しないこと
- `engine.clock` は `readonly` で外部（SimpleMixer 等）からアクセス可能
- Beat Cut のラップアラウンド検出条件: `prevBeat > 0.8 && beat < 0.2`
- `engine.setTransition(id)` で SimpleMixer プルダウンから Transition を切り替え可能

---

### ロードマップ（確定版）

| バージョン | 主な内容 |
|---|---|
| v1 | Three.js 基盤・Plugin/Driver・SimpleMixer・Program/Preview バス・Beat Cut + CrossFade・マクロノブ・レイヤー・録画・OSS 公開 |
| v2 | Geometry ランチャー・Mixer Plugin 化・CrossfadeMixer・GL Transitions・Geometry シーケンサー・Embed Export・PixiJS |
| v3 | Full Morph・opentype.js Typography・Spatial Extension（プロジェクションマッピング） |
| v4 | Claude.ai 自動トランジション・Video Input Driver（Resolume 受信） |
| Browser Bridge | Syphon/Spout ユーティリティ（別プロジェクト・Tauri・GeoGraphy v1 完成後） |

---

## 【引き継ぎ層】次のセッションでやること（毎回上書き）

### 🔴 次のセッションで最初にやること

1. `pnpm test --run` でグリーン確認（38 tests）
2. `pnpm dev` でブラウザ目視確認
3. **`docs/spec/layer-system.spec.md` を読んでから** Day12の実装に進む

### 現在の作業状態

- **ブランチ**: `main`
- **最後のコミット**: `feat: Day11 - beat cut transition connected to engine`（6e65277）
- **動作確認状態**: 38 tests グリーン ✅・ブラウザ目視確認済み ✅
- **未コミットファイル**: `docs/spec/` 新規ファイル群（未コミット）・`CLAUDE.md` v6更新（未コミット）
- **開発環境**: Cursor / Simple Browser（上部タブ）+ zsh ターミナル

### 未解決の問題

なし

### 次回の本実装タスク（Day 12）

**⚠️ SDD原則：実装前に `docs/spec/layer-system.spec.md` を必ず読むこと**

Beat Cut と CrossFade が engine に接続された。
次は**レイヤーシステム**の実装に進む（Phase 8）。

現状、SimpleMixer の PROGRAM エリアには L1/L2/L3 のプレースホルダーが表示されているが、
実際のレイヤー（CSS 合成）はまだ実装されていない。

0. **`docs/spec/layer-system.spec.md` を読む**（SDD原則・必須）

1. **`src/core/layerManager.ts` の実装**
   - spec の Interface・Constraints に準拠すること
   - MAX_LAYERS = 3（config.ts から）
   - 各レイヤーは `position: absolute` で重ねる
   - CSS `mixBlendMode` で合成

2. **`tests/core/layerManager.test.ts` を実装**
   - spec の Test Cases をすべてパスさせること

3. **`engine.ts` に LayerManager を接続**

4. **SimpleMixer の PROGRAM エリアにレイヤー状態を反映**

5. `git add -A && git commit -m "feat: Day12 - layer system"`

### 今回のセッション（Day 11 + SDD導入）で確定したこと

- `engine.ts` に `prevBeat`・`activeTransitionId` フィールド追加
- `update()` にビートラップアラウンド検出 → programBus/previewBus swap 実装
- `setTransition(id)` メソッド追加
- `SimpleMixer.tsx` の `handleTransitionChange` に `engine.setTransition(id)` 追加
- **SDD（仕様駆動開発）を導入：`docs/spec/` ディレクトリ作成**
- **spec4本作成：command-pattern / program-preview-bus / transition-plugin / layer-system**
- **`CLAUDE.md` v6 に更新：SDD原則・spec一覧を追記**
- テスト: 38 tests グリーン（変化なし）
