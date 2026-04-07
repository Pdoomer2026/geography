# GeoGraphy 引き継ぎメモ｜Day41（MacroKnob D&D アサイン設計・MIDI 2.0 内部バス統一）｜2026-04-07

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応の映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / Electron 41
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **開発サーバー（Electron）**: `pnpm dev:electron`
- **プロジェクトルート**: `/Users/shinbigan/geography`

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| CLAUDE.md（全体方針） | `CLAUDE.md`（v11・Day41 大幅更新フロー追記） |
| 引き継ぎメモ（最新） | `HANDOVER.md` |
| MacroKnob spec（Day41更新） | `docs/spec/macro-knob.spec.md` |
| MacroKnob spec（Day41アーカイブ） | `docs/archive/spec/2026-04-07_Day41_macro-knob.spec.md` |
| CC Standard spec | `docs/spec/cc-standard.spec.md`（v0.2） |
| カメラ spec | `docs/spec/camera-system.spec.md` |
| エンジン本体 | `src/core/engine.ts` |
| MacroKnob コア | `src/core/macroKnob.ts` |
| MacroKnob UI | `src/ui/panels/macro-knob/MacroKnobPanel.tsx` |
| Electron メインプロセス | `electron/main.js` |

---

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day41`
- **テスト**: 110 tests グリーン・tsc エラーゼロ
- **FX Plugin 総数**: 12本

---

## Day41 で完了したこと

### A. 壁打ち：MacroKnob D&D アサイン仕様確定
- Massive スタイルの双方向 D&D アサイン設計
- パラメーター行に CC 番号表示・可動域設定・`[≡]` D&D ハンドル
- MacroKnob の弧インジケーター（min/max 範囲を色分けで表示・最大3アサイン）
- ドロップ時の min/max ダイアログ（初期値 = スライダー可動域）
- 右クリックでアサイン解除（個別・全解除）
- 数値 box は v2 で追加予定

### B. 壁打ち：MIDI 2.0 内部バス統一設計確定
- GeoGraphy の全パラメーター受け渡し = MIDI 2.0 プロトコルに統一
- MacroKnobManager が中枢（エンジンコア固定）
- 内部バス固定フォーマット: `MidiCCEvent { cc, value, protocol: 'midi2', resolution: 4294967296 }`
- Sequencer / LFO / AI も同じ経路を使う

### C. 壁打ち：CC Map 3層構造確定（自然言語対応の準備）
- Layer 1: `docs/spec/cc-standard.spec.md`（既存・開発者向け）
- Layer 2: `settings/cc-map.json`（AI ランタイム参照・未実装）
- Layer 3: Preferences > CC Map タブ（ユーザー確認用 UI・未実装）

### D. 壁打ち：欠けている実装の整理
- MIDI IPC 経路（main.js → App.tsx → engine）
- アサイン永続化（GeoGraphyProject 拡張）+ Preset Save/Load
- D&D アサイン UI
- MIDI デバイス接続 Panel（Preferences > MIDI タブ）
- `settings/cc-map.json` 新設
- Command 経由への修正（現在直接代入）

### E. 壁打ち：Plugin Store v1 → 時期尚早と判断・見送り
- OSS 化の準備だが差し込み口もビジネスモデルも未確定
- 実装準備が整ってから設計する

### F. `docs/spec/macro-knob.spec.md` 大幅更新
- D&D アサイン仕様（§4）追加
- 永続化・Preset（§5）追加
- CC Map 3層構造（§6）追加
- MIDI デバイス接続（§7）追加
- 欠けている実装一覧（§8）追加
- `DragPayload` 型・`addAssign` / `removeAssign` API 追加

### G. CLAUDE.md v11 更新
- 大幅更新フロー（edit_file で対応できない時）追記
- `move_file → create_file → NFC 正規化` の標準手順確立

### H. docs/archive/spec/ 新設
- spec ファイルのアーカイブディレクトリを新設
- アーカイブ命名規則: `YYYY-MM-DD_DayN_[name].spec.md`

---

## 確立した新ルール（Day41）

### 大幅更新フロー（edit_file で対応できない時）
```
Step 0: edit_file で対応できるか判断
Step 1: アーカイブフォルダ確認・なければ create_directory
Step 2: move_file（現行 → アーカイブ・トークンゼロ）
Step 3: create_file（新内容で新規作成）← write_file ではない
Step 4: NFC 正規化
```

### HANDOVER.md の更新フロー
```
move_file → HANDOVER.md を docs/handover/dayN-YYYY-MM-DD.md にアーカイブ
create_file → 新 HANDOVER.md を作成
NFC 正規化
```

---

## 次回やること（Day42）

| 優先度 | 作業 |
|---|---|
| ★★★ | MIDI IPC 経路実装（main.js → App.tsx → engine.handleMidiCC） |
| ★★★ | GeoGraphyProject に `macroKnobAssigns` 追加（永続化） |
| ★★ | Simple Window に CC番号表示・可動域設定・`[≡]` ハンドル追加 |
| ★★ | MacroKnob 弧インジケーター（min/max 範囲表示） |
| ★★ | D&D アサイン UI（ドロップ時ダイアログ・右クリック解除） |
| ★ | `settings/cc-map.json` 新設 |

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ（累積）

- **NFC 正規化**（Day39確立）: `write_file` / `create_file` で日本語ファイル作成後は python3 で NFC 正規化を実行
- **大幅更新フロー**（Day41確立）: `move_file → create_file → NFC 正規化`（write_file は既存ファイルに使わない）
- **spec アーカイブ**（Day41確立）: `docs/archive/spec/YYYY-MM-DD_DayN_[name].spec.md`
- **Linus スタイルコミット**（Day39確立）: `git commit -m "タイトル" -m "ボディ（なぜ変えたか）"`
- **Obsidian dev-log**（Day39確立）: 毎セッション終了時に `GeoGraphy Vault/dev-log/YYYY-MM-DD_DayN.md` を作成
- **終業時の必須手順**: dev-log 作成 → NFC 正規化 → git commit → git tag dayN → git push origin main --tags
- **write_file 禁止**: 既存ファイルへの使用は禁止。`move_file` → `create_file` のフローを使う
- **git タグは commit 後に打つこと**
- **zsh でインラインコメント（`#`）はエラー**: コメント行とコマンド行は必ず分けて渡す
- **tsc が反映ズレで失敗する場合**: 2回実行すると解消する

---

## 次回チャット用スタートプロンプト

```
GeoGraphy Day42を開始します。
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
3. HANDOVER.md の「次回やること（Day42）」を読んで作業を開始してください

開発スタイル：SDD × CDD
- 始業時は HANDOVER.md を読んでから実装開始
- ファイル更新は filesystem:edit_file を使うこと（大幅更新時は move_file → create_file）
- 完了条件は pnpm tsc --noEmit（型エラーゼロ）+ pnpm test --run（全テストグリーン）両方通過
- プランを提示・承認を得てから実装を開始すること
- コミットは Linus スタイル（タイトル + ボディ）で
```
