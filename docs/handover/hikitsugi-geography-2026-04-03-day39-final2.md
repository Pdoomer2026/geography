# GeoGraphy 引き継ぎメモ｜Day39（最終版）｜2026-04-03

## プロジェクト概要
- アプリ名：GeoGraphy（Electron VJ アプリ + Three.js ビジュアルエンジン）
- スタック：Vite / React 18 / TypeScript / Three.js r160+ / Electron / pnpm
- 開発スタイル：SDD x CDD（spec → 実装 → tsc + test グリーン）
- GitHub：https://github.com/Pdoomer2026/geography
- 開発コマンド：`pnpm dev:electron`
- 検証コマンド：`pnpm tsc --noEmit && pnpm test --run`

## 重要ファイルパス
| ファイル | パス |
|---|---|
| CLAUDE.md（v11・最終更新） | `CLAUDE.md` |
| HANDOVER.md（NFC 正規化済み） | `HANDOVER.md` |
| NFC 正規化スクリプト | `/Users/shinbigan/nfc_normalize.py` |
| Shader Plugin spec（Day39更新） | `docs/spec/shader-plugin.spec.md` |
| CC Standard spec（v0.2・Day39更新） | `docs/spec/cc-standard.spec.md` |
| カメラ spec（Day40 必読） | `docs/spec/camera-system.spec.md` |
| 型定義 | `src/types/index.ts` |
| エンジン | `src/core/engine.ts` |
| 引き継ぎスキル（更新済み） | `/Users/shinbigan/Library/Application Support/Claude/local-agent-mode-sessions/skills-plugin/d67ec059-3ee6-4aad-a14b-dc87d4bde2f3/56542368-911b-4c16-9557-7aff04c7e41b/skills/hikitsugi-teikei/SKILL.md` |

## 今回のセッション（Day39）で完了したこと

### A. spec 整備
- `shader-plugin.spec.md`：ShaderPlugin を ModulatablePlugin 継承に変更・疎結合/密結合のディレクトリ分類を確定
- `cc-standard.spec.md`：v0.2 に更新・Block 8xx（SHADER）を正式定義（CC800〜CC805）

### B. 開発ルール3本を CLAUDE.md v11 に追記
1. NFC 正規化ルール
2. Linus スタイルのコミットメッセージ
3. Obsidian dev-log 作成ルール

### C. NFC 正規化問題の根本解決（最重要）
- 問題：macOS APFS が日本語を NFD 形式で保存するため edit_file がマッチしない
- 解決策の確立：
  1. `nfc_normalize.py` を `/Users/shinbigan/` に保存（バックアップ・検証付き）
  2. `CLAUDE.md` v11 のファイル更新鉄則の先頭に最重要ルールとして明記
  3. `HANDOVER.md` のスタートプロンプトに手順1として組み込み
  4. `hikitsugi-teikei/SKILL.md` に追記
  5. geography/ と GeoGraphy Vault/ 配下の全 .md ファイルを NFC 正規化済み

### D. Obsidian dev-log を Day17〜Day39 分遡って作成（計 20 ファイル）

## 現在の状態（重要）
- tsc エラー：ゼロ
- テスト：104 passed（14 files）（Day39 はコード変更なし）
- 最新タグ：`day39`
- 最新コミット：`a1ecc05`（docs: add NFC normalization as top-priority rule）
- 全 .md ファイル：NFC 正規化済み

## 発生した問題と解決策
- 問題：edit_file で日本語行がマッチしない
  - 原因：macOS APFS が NFD / Claude が NFC で送信 → 不一致
  - 解決：nfc_normalize.py で全ファイルを一括正規化（バックアップ・検証付き）
- 問題：python3 コマンドを直接ターミナルに貼ると日本語で途切れる
  - 解決：スクリプトをファイルとして保存して `python3 /Users/shinbigan/nfc_normalize.py` で実行
- 問題：HANDOVER.md を write_file で書き直すリスク（情報消失・ルール違反）
  - 解決：NFC 正規化後は edit_file で安全に編集できる。write_file は不要になった

## 次回やること（Day40）
優先度順：

1. **★★★ セッション開始時に NFC 正規化を実行**
   `python3 /Users/shinbigan/nfc_normalize.py`
2. **★★★ Orbit カメラシステム実装**（Icosphere / Torus / Torusknot 用）
   - `docs/spec/camera-system.spec.md` を必ず読んでから実装
   - OrbitControls を cameraPreset 機構に統合
3. **★★★ Aerial カメラ実装**（Hex Grid 用・真上俯瞰）
4. **★★ Plugin Store v1 設計**（手動フォルダ追加方式）
5. **★ `docs/spec/sequencer.spec.md` 新設**（MacroKnob 経由設計）

## 環境メモ
- **NFC 正規化（最重要）**：セッション開始時に `python3 /Users/shinbigan/nfc_normalize.py` を実行
- **Linus スタイルコミット**：`git commit -m "タイトル" -m "ボディ"` で Day40 から全面適用
- **dev-log**：毎セッション終了時に `GeoGraphy Vault/dev-log/YYYY-MM-DD_DayN.md` を作成後 NFC 正規化
- **終業時の必須手順**：dev-log 作成 → nfc_normalize.py 実行 → git commit → git tag dayN → git push
- **write_file は新規作成のみ**：既存ファイルには edit_file を使う（NFC 正規化済みなら安全）
- **git タグは commit 後に打つこと**
- **zsh でインラインコメント（#）はエラー**：コメント行とコマンド行は必ず分けて渡す
- **tsc が反映ズレで失敗する場合**：2回実行すると解消する
- **python3 スクリプトは直接貼り付けず**：ファイルに保存して実行する
