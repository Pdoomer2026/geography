# GeoGraphy 引き継ぎメモ｜Day39（後半）｜2026-04-03

## プロジェクト概要
- アプリ名：GeoGraphy（Electron VJ アプリ + Three.js ビジュアルエンジン）
- スタック：Vite / React 18 / TypeScript / Three.js r160+ / Electron / pnpm
- 開発スタイル：SDD × CDD（spec → 実装 → tsc + test グリーン）
- GitHub：https://github.com/Pdoomer2026/geography
- 開発コマンド：`pnpm dev:electron`
- 検証コマンド：`pnpm tsc --noEmit && pnpm test --run`

## 重要ファイルパス
| ファイル | パス |
|---|---|
| CLAUDE.md（全体方針） | `CLAUDE.md`（v10・Day39 最終更新済み） |
| HANDOVER.md | `HANDOVER.md` |
| Shader Plugin spec | `docs/spec/shader-plugin.spec.md`（Day39 更新済み） |
| CC Standard spec | `docs/spec/cc-standard.spec.md`（v0.2・Day39 更新済み） |
| カメラ spec | `docs/spec/camera-system.spec.md`（Day40 実装前に必読） |
| 型定義 | `src/types/index.ts` |
| エンジン | `src/core/engine.ts` |
| Obsidian dev-log | `/Users/shinbigan/GeoGraphy Vault/dev-log/` |

## 今回のセッション（Day39 後半）で完了したこと

### dev-log の遡り作成
Day13〜Day39 分の Obsidian dev-log が作成されていなかったことが発覚。git log と docs/handover/ の記録をもとに Day17〜Day39 分（計 20 ファイル）を遡って作成した。

### CLAUDE.md に3つのルールを追記
1. **NFC 正規化ルール**（`write_file` で日本語ファイルを作成した直後に python3 で NFC 正規化）
2. **Linus スタイルのコミットメッセージ**（タイトル + ボディの2段構成・Day40 から適用）
3. **Obsidian dev-log の作成ルール**（セッション終了時に必ず作成・NFC 正規化も実行）

### Git の記録体制について理解を深めた
3層の記録体制が整った：
- コミットメッセージ（何を・なぜ変えたか）
- HANDOVER.md / docs/handover/（その日の判断・壁打ちの結論）
- CLAUDE.md（ルール・トラブル解決策を永続的に記録）

## 現在の状態（重要）
- **tsc エラー：ゼロ**
- **テスト：104 passed（14 files）**（Day39 はコード変更なし）
- **最新タグ：`day39`**
- **最新コミット：`66df363`**（docs: add Obsidian dev-log rule to CLAUDE.md）

## 発生した問題と解決策
- **問題**：`edit_file` で日本語行がマッチしない
  - **原因**：macOS APFS が NFD / Claude が NFC で送信 → 不一致
  - **解決**：`write_file` 後に python3 で NFC 正規化。CLAUDE.md にルール追記済み
- **問題**：dev-log が Day13 以降作られていなかった
  - **解決**：git log + docs/handover/ から遡って Day17〜Day39 を作成。CLAUDE.md にルール追記済み
- **問題**：Day28 の dev-log が作れない
  - **原因**：git log にコミットなし・記録が残っていない
  - **状態**：未解決（Day28 は休止日の可能性）

## 次回やること（Day40）
優先度順：

1. **★★★ Orbit カメラシステム実装**（Icosphere / Torus / Torusknot 用）
   - 始業時に `docs/spec/camera-system.spec.md` を必ず読むこと
   - OrbitControls を `cameraPreset` 機構に統合する
2. **★★★ Aerial カメラ実装**（Hex Grid 用・真上俯瞰）
3. **★★ Plugin Store v1 設計**（手動フォルダ追加方式）
4. **★ `docs/spec/sequencer.spec.md` 新設**（MacroKnob 経由設計）

## 環境メモ
- `write_file` で日本語ファイルを作成した直後は必ず NFC 正規化コマンドを実行すること
- コミットは Linus スタイル（`-m "タイトル" -m "ボディ"`）で Day40 から全面適用
- dev-log は毎セッション終了時に作成・NFC 正規化も忘れずに
- セッション終了の必須手順：dev-log 作成 → NFC 正規化 → git commit → git tag dayN → git push
- zsh でインラインコメント（`#`）はエラーになる：コメント行とコマンド行は必ず分けて渡す
- tsc が反映ズレで失敗する場合：2回実行すると解消する
