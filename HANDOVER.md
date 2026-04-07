# GeoGraphy 引き継ぎメモ｜Day42（CC Mapping 3層構造設計確定）｜2026-04-07

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応の映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / Electron 41
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **プロジェクトルート**: `/Users/shinbigan/geography`

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| CLAUDE.md（全体方針） | `CLAUDE.md`（v11） |
| CC Mapping SSoT | `docs/spec/cc-mapping.md`（v0.2・Day42新設） |
| CC Mapping 設計仕様 | `docs/spec/cc-mapping.spec.md`（Day42新設） |
| CC Standard | `docs/spec/cc-standard.spec.md`（v0.3・CC204/205更新） |
| MacroKnob spec | `docs/spec/macro-knob.spec.md` |
| Preferences spec | `docs/spec/preferences-panel.spec.md` |
| エンジン本体 | `src/core/engine.ts` |
| MacroKnob コア | `src/core/macroKnob.ts` |

---

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day41`（Day42 はまだコミット・タグなし）
- **テスト**: 110 tests グリーン・tsc エラーゼロ（Day42 は設計フェーズのみ・実装なし）

---

## Day42 で完了したこと（全て設計・壁打ちフェーズ）

### A. CC Mapping 3層構造の設計確定

**問題の発見**: `cc-standard.spec.md` §5 の横断マッピング表が Markdown にしか存在せず、
runtime・MacroKnob・AI が参照できない「断絶」を発見。
これを解消しないと MacroKnob D&D・MIDI IPC・AI 自然言語インターフェース全てが砂の上に建つと判断。

**確定した3層構造**:

```
Layer 0: docs/spec/cc-mapping.md（SSoT・人間 + AI が読む）
  Plugin × paramId × CC番号 × blockName × 値域
  開発者が編集・Claude Desktop が更新支援
  セマンティック情報は cc-standard.spec.md に委譲（重複なし）
        ↓ pnpm gen:cc-map（自動生成スクリプト）

Layer 1: settings/cc-map.json（runtime が使う・自動生成物）
  CC番号 × 値域のみ・セマンティック情報は持たない
  MacroKnob / ccMapService の lookup 元
  手動編集禁止
        ↓ ユーザーが Preferences > CC Map タブで上書き

Layer 2: ~/Documents/GeoGraphy/cc-overrides.json（ユーザー差分のみ）
  変更した CC番号だけを保存・Layer 1 を汚染しない
  Runtime lookup 優先順位: Layer 2 → Layer 1
```

**役割分担の確定**:

```
cc-mapping.md     → pluginId × paramId × CC番号 × 値域（SSoT）
cc-standard.spec.md → CC番号 × Block × AI語彙（参照先）
AI は両ファイルを組み合わせて自然言語 → CC番号 → paramId を解決する
```

### B. 新規作成ファイル

| ファイル | 内容 |
|---|---|
| `docs/spec/cc-mapping.spec.md` | 3層構造の設計仕様書（ccMapService Interface・UI仕様・実装順序） |
| `docs/spec/cc-mapping.md` v0.2 | 全 Plugin 横断マッピング SSoT（全 Plugin の config.ts から実データで作成） |

**cc-mapping.md の収録内容**（全て実コードから起こした正確なデータ）:
- Geometry 7本: icosphere / torus / torusknot / contour / hex-grid / grid-tunnel / grid-wave
- Particle 1本: starfield
- FX 12本: bloom / after-image / feedback / color-grading / glitch / kaleidoscope / rgb-shift / zoom-blur / mirror / crt / film / frei-chen

### C. cc-standard.spec.md v0.3 更新

- バージョン v0.2 → v0.3
- Block 2xx FORM に CC204（Topology A）・CC205（Topology B）を正式追加
  （torusknot の `p` / `q` に対応・「将来追加候補」から「実装済み」に格上げ）
- §5 横断マッピング表に「SSoT は cc-mapping.md」の注記を追加
- 参照元を `fx-parameter-reference.md` から `cc-mapping.md` に更新
- §7 新規 Plugin 開発ガイドラインに「cc-mapping.md への追記」ステップを追加

### D. アーカイブ整備

- `docs/archive/spec/` を新設
- `cc-standard.spec.md` v0.2 をアーカイブ
- `cc-mapping.md` v0.1（途中版）をアーカイブ

---

## 確立した新ルール（Day42）

### AI が cc-mapping.md を読む際のルール
- `cc-mapping.md` で `paramId → CC番号 → Block` を特定する
- `cc-standard.spec.md` の該当 CC# 定義で AI語彙・意味を参照する
- 2ファイルが役割分担・意味情報の重複記載はしない

### 新 Plugin 追加時のフロー
```
1. Plugin の config.ts に params を定義
2. docs/spec/cc-mapping.md に該当セクションを追記
3. pnpm gen:cc-map を実行（未マッピングの paramId が警告として出る）
4. settings/cc-map.json が自動再生成される
```

---

## 次回やること（Day43）

### Claude Code 実装タスク（設計完了・実装待ち）

| 優先度 | 作業 |
|---|---|
| ★★★ | `scripts/generate-cc-map.ts` 実装（cc-mapping.md → cc-map.json 変換・未マッピング警告） |
| ★★★ | `settings/` ディレクトリ新設・`pnpm gen:cc-map` 実行・`cc-map.json` 生成 |
| ★★★ | `src/core/ccMapService.ts` 実装（CcMapService Interface・Layer 2 優先 lookup） |
| ★★★ | `electron/main.js` に cc-overrides IPC 追加（load-cc-overrides / save-cc-overrides） |
| ★★★ | `MacroAssign` 型の `ccNumber` を ccMapService 経由に統一 |
| ★★★ | `macroKnob.ts` に `addAssign()` / `removeAssign()` を追加 |
| ★★★ | `GeoGraphyProject` に `macroKnobAssigns` を追加（永続化） |
| ★★ | Preferences > CC Map タブ実装 |
| ★★ | MIDI IPC 経路実装（main.js → App.tsx → engine.handleMidiCC） |

### Claude Desktop タスク
| 優先度 | 作業 |
|---|---|
| ★★ | CLAUDE.md の spec 一覧に cc-mapping 関連を追記 |
| ★ | Obsidian dev-log 作成（2026-04-07_Day42.md） |

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ（累積）

- **NFC 正規化**（Day39確立）: `write_file` / `create_file` で日本語ファイル作成後は python3 で NFC 正規化を実行
- **大幅更新フロー**（Day41確立）: `move_file → create_file → NFC 正規化`（write_file は既存ファイルに使わない）
- **spec アーカイブ**（Day41確立・Day42 docs/archive/spec/ 新設）: `docs/archive/spec/YYYY-MM-DD_DayN_[name].spec.md`
- **cc-mapping.md 更新後は pnpm gen:cc-map 必須**（Day42確立）
- **Linus スタイルコミット**（Day39確立）: `git commit -m "タイトル" -m "ボディ（なぜ変えたか）"`
- **Obsidian dev-log**（Day39確立）: 毎セッション終了時に `GeoGraphy Vault/dev-log/YYYY-MM-DD_DayN.md` を作成
- **終業時の必須手順**: dev-log 作成 → NFC 正規化 → git commit → git tag dayN → git push origin main --tags
- **write_file 禁止**: 既存ファイルへの使用は禁止。`move_file` → `create_file` のフローを使う
- **git タグは commit 後に打つこと**
- **tsc が反映ズレで失敗する場合**: 2回実行すると解消する

---

## 次回チャット用スタートプロンプト

```
GeoGraphy Day43を開始します。
引き継ぎスキル

その後、以下の手順で進めてください：
1. まず HANDOVER.md を NFC 正規化してください（必須）：
   python3 -c "
import unicodedata, pathlib
p = pathlib.Path('/Users/shinbigan/geography/HANDOVER.md')
p.write_text(unicodedata.normalize('NFC', p.read_text('utf-8')), 'utf-8')
print('NFC 正規化完了')
"
2. 下記コマンドの結果を貼り付けます
   cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
3. HANDOVER.md の「次回やること（Day43）」を読んで作業を開始してください
```
