# GeoGraphy HANDOVER_TEMPLATE.md

## このファイルの使い方

HANDOVER.md を更新するときは必ずこの構造に従う。

```
【継続層】累積・追記のみ・過去の内容を消してはいけない
【引き継ぎ層】毎回上書き・次のセッションが始まったら用済みになる情報
```

**このテンプレート自体は永久保存。構造が変わったときのみ更新する。**

---

## ⚠️ HANDOVER.md 書き込みの必須ルール（厳守）

1. **HANDOVER.md の内容を制作したら、まずチャットに表示する**
2. **ユーザーに内容を確認してもらう**
3. **ユーザーから書き込みの許可をもらう**
4. **許可を得てから `geography/HANDOVER.md` に書き込む**

> 許可なしに直接書き込んではいけない。

---

# GeoGraphy HANDOVER.md｜Day[N]｜YYYY-MM-DD

---

## 【継続層】プロジェクト全体の状態（累積・上書き禁止）

> ここは毎回「追記」する。過去の内容を消してはいけない。
> Day1 から現在まで、確定した情報をすべて積み上げる。

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
| <!-- Day5以降ここに追記 --> | | |

---

### ドキュメント構成（累積）

| ファイル | 内容 | 用途 |
|---|---|---|
| `docs/要件定義書_v1.4.md` | 元の要件定義書 | 参照・保存用 |
| `docs/要件定義書_v1.7.md` | v1.4 + 壁打ち追加の完全統合版 | **最新・実装の根拠** |
| `docs/実装計画書_v2.2.md` | 元の実装計画書 | 参照・保存用 |
| `docs/実装計画書_v2.5.md` | v2.2 + 壁打ち追加の完全統合版 | **最新・実装の根拠** |

---

### CLAUDE.md 構成（累積）

| ファイル | バージョン | 主な内容 |
|---|---|---|
| `geography/CLAUDE.md` | v4 | プラットフォーム思想・Program/Preview・Mixer・Transition・ロードマップ |
| `src/core/CLAUDE.md` | 最新 | ProgramBus・PreviewBus・SceneState・ENABLED_PLUGIN_GROUPS |
| `src/plugins/geometry/CLAUDE.md` | 最新 | renderer・enabled フィールド必須 |
| `src/plugins/transitions/CLAUDE.md` | 新規 | UI を持たない・SceneState のみ操作 |
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
| 引き継ぎテンプレート | `geography/HANDOVER_TEMPLATE.md` |
| 引き継ぎメモ | `geography/HANDOVER.md` |
| 要件定義書 v1.7（最新） | `docs/要件定義書_v1.7.md` |
| 実装計画書 v2.5（最新） | `docs/実装計画書_v2.5.md` |
| 型定義 | `src/types/index.ts` |
| エンジン設定 | `src/core/config.ts` |
| Plugin Registry | `src/core/registry.ts` |
| Transition Plugin | `src/plugins/transitions/` |
| Embed 設定フォルダ | `settings/embeds/` |

---

### Git ブランチ構成（累積）

| ブランチ | 内容 |
|---|---|
| `main` | メイン開発ブランチ |
| `restore/day4-baseline` | Day4 完了時点の状態を永久保存 |
| <!-- 追加ブランチはここに追記 --> | |

---

### 環境メモ・注意点（累積）

- pnpm 必須（npm / yarn 不可）
- Three.js r160+ を使用（それ以前は API が異なる）
- Preview バスの小キャンバス（320×180）は FPS への影響を最初に確認すること
- SimpleMixer は v1 固定だが最初から MixerPlugin Interface に準拠すること
- Browser Bridge は GeoGraphy とは完全に別リポジトリ・別プロジェクト
- **Claude Desktop からプロジェクトフォルダに直接アクセス可能**（`/Users/shinbigan/geography/` のみ許可）
- CLAUDE.md 群・docs/ の更新は Claude Desktop から直接行う
- Git 操作（ブランチ・コミット・プッシュ）は Claude Code から行う

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

> ここは毎回「上書き」する。前回の内容は消してよい。
> 次のセッションが始まったら用済みになる情報だけ書く。

### 🔴 次のセッションで最初にやること

1. <!-- 最優先タスクを書く -->
2.
3.

### 現在の作業状態

- **ブランチ**: <!-- 例：main -->
- **最後のコミット**: <!-- 例：feat: Day4 - config, AmbientLight plugin, Starfield -->
- **動作確認状態**: <!-- 例：ブラウザで grid-wave + 星空の動作確認 ✅ -->
- **未コミットファイル**: <!-- なければ「なし」 -->

### 未解決の問題

<!-- なければ「なし」 -->

### 次回の本実装タスク

1. <!-- 具体的なアクションレベルで書く -->
2. <!-- NG：「デバッグを続ける」 OK：「registry.ts の register() メソッドを修正する」 -->
3.

### 今回の壁打ち・設計で確定したこと

<!-- このセッションで新たに決まったことを書く（次回の実装の根拠になるもの） -->

---

## このテンプレートの更新ルール

| タイミング | 操作 | 対象 |
|---|---|---|
| 設計原則が確定したとき | 継続層「確定した設計原則」に追記 | 継続層 |
| 実装が完了したとき | 継続層「実装済み内容」の表に追記 | 継続層 |
| CLAUDE.md を更新したとき | 継続層「CLAUDE.md 構成」の表を更新 | 継続層 |
| 新しいブランチを作ったとき | 継続層「Git ブランチ構成」の表に追記 | 継続層 |
| 新しい注意点が見つかったとき | 継続層「環境メモ・注意点」に追記 | 継続層 |
| ロードマップが変わったとき | 継続層「ロードマップ」を更新 | 継続層 |
| セッション終了時 | 引き継ぎ層を上書き | 引き継ぎ層 |
| このテンプレート自体の更新 | 構造が変わったときのみ | HANDOVER_TEMPLATE.md |

---

## Claude Desktop / Claude Code の役割分担

```
【壁打ちセッション（Claude Desktop）】
  設計を決める
    ↓
  CLAUDE.md 群を直接更新（/Users/shinbigan/geography/ に直接書き込み）
    ↓
  docs/ の要件定義書・実装計画書を更新（必要な場合）
    ↓
  HANDOVER.md を制作 → チャットに表示 → 確認 → 許可をもらって書き込み

【実装セッション（Claude Code）】
  HANDOVER.md と docs/ の最新ドキュメントを読む
    ↓
  git checkout -b [ブランチ名] でブランチを切る
    ↓
  実装 → 動作確認 → コミット
    ↓
  HANDOVER.md の「実装済み内容」に追記
    ↓
  必要に応じて git push・PR 作成
```
