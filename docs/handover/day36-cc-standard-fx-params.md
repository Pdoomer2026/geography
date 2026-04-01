# GeoGraphy 引き継ぎメモ｜Day36（CC Standard・FXパラメーター対照表・映像設計提案書）｜2026-04-02

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
| 引き継ぎメモ（最新） | `HANDOVER.md` |
| CLAUDE.md（全体方針） | `CLAUDE.md`（v10・Day36強化版） |
| CC Standard 仕様書 | `docs/spec/cc-standard.spec.md`（Day36 新規作成・v0.1） |
| FXパラメーター対照表 | `docs/spec/fx-parameter-reference.md`（Day36 新規作成） |
| 映像設計提案書 | `docs/spec/fx-visual-design-proposals.md`（Day36 新規作成） |
| Shader Plugin spec | `docs/spec/shader-plugin.spec.md` |
| MacroKnob spec | `docs/spec/macro-knob.spec.md` |
| 型定義 | `src/types/index.ts` |
| geoAPI 型定義 | `src/types/geoAPI.d.ts` |
| エンジン本体 | `src/core/engine.ts` |
| LayerManager | `src/core/layerManager.ts` |

---

## Day36 で完了したこと

### 新規作成ファイル（4つ）

| ファイル | 内容 |
|---|---|
| `docs/spec/fx-parameter-reference.md` | 全FX/Geometry/Particle パラメーター対照表（公開済・未公開・未実装） |
| `docs/spec/fx-visual-design-proposals.md` | 映像設計提案書（`fx-parameter-reference.md` の上に乗る別ファイル） |
| `docs/spec/cc-standard.spec.md` | GeoGraphy CC Standard 仕様書（MIDI 2.0 AC体系・全Plugin横断表・AI自然言語インターフェース） |
| `cc_mapping_table_v2.xlsx` | 全パラメーター × CC番号 横断Excel表（白黒印刷対応） |

### 更新ファイル（1つ）

| ファイル | 内容 |
|---|---|
| `CLAUDE.md` | Day36の重大ミス記録・`write_file`禁止ルールの強化 |

---

## CC Standard v0.1 の核心設計（`docs/spec/cc-standard.spec.md`）

### Block 体系

| Block | 名前 | AI 語彙（例） |
|---|---|---|
| **1xx** | EXISTENCE | 「消えていく」「浮かび上がる」 |
| **2xx** | FORM | 「シンプルな」「複雑な」「対称的な」 |
| **3xx** | MOTION | 「激しい」「穏やかな」「脈打つ」 |
| **4xx** | COLOR | 「暖かい」「冷たい」「モノクロの」 |
| **5xx** | SPACE | 「遠い」「近い」「広大な」 |
| **6xx** | EDGE | 「くっきりした」「光る輪郭」 |
| **7xx** | BLEND | 「焼き付く」「溶ける」 |
| **8xx** | （Shader Plugin 固有） | CC Standard の対象外 |
| **9xx** | SCENE | シーン全体のエネルギー・緊張・密度（AIとの接点） |

### AI 変換フロー

```
人間の言葉（自然言語）
  ↓ AI が変換
Block 9xx の語彙（中間言語）
  ↓ GeoGraphy が解釈
Block 1xx〜7xx の具体値 → Plugin パラメーター
```

### MIDI 1.0 互換ブリッジ（Layer 2）

| MIDI 1.0 CC# | 音楽での意味 | 対応 GeoGraphy CC# |
|---|---|---|
| CC1 | Modulation | CC302 Deformation |
| CC7 | Volume | CC103 Opacity |
| CC10 | Pan | CC500 Position X |
| CC11 | Expression | CC101 Primary Amount |
| CC64 | Sustain | CC701 Feedback Amount |

---

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day34`（Day36 はドキュメント・spec 作業のみ・実装コミットなし）
- **テスト**: 104 tests グリーン・tsc エラーゼロ（Day35開始時確認済み・Day36でコード変更なし）
- **コードベースに変更なし**（Day36 は設計・spec 作業のみ）

---

## 発生した問題と解決策

- **Day36 重大ミス**：`fx-parameter-reference.md`（元の対照表）を提案書の内容で `write_file` 上書きし、元ファイルを消滅させた。
  - 原因：`edit_file` でエンコードエラーが出たことを口実に `write_file` を使用
  - 正しい対処：`read_text_file` で読んでから `edit_file` を使う。エラーが出ても `write_file` への逃げは禁止
  - 解決：元ファイル内容を復元済み。CLAUDE.md にルール強化を記録済み

---

## 次回やること（Day37）

| 優先度 | 作業 |
|---|---|
| ★★★ | `docs/spec/macro-knob.spec.md` 更新（CC Standard 統合・MIDI Learn・MIDI 2.0 IPC 設計） |
| ★★★ | Phase 13 実装：`src/ui/panels/` 新設・`PreferencesPanel.tsx` 移動・`MacroKnobSimpleWindow.tsx` → `MacroKnobPanel.tsx` リネーム |
| ★★★ | `src/ui/panels/CLAUDE.md` 新規作成（Panel 共通ルール） |
| ★★★ | `src/ui/panels/preferences/CLAUDE.md` 新規作成 |
| ★★★ | `src/ui/panels/macro-knob/CLAUDE.md` 新規作成（最重要・MIDI 2.0 設計含む） |
| ★★ | Glitch Plugin 未公開パラメーター公開（`amount`, `distortion_x`, `distortion_y`） |
| ★★ | Feedback Plugin `scale` / `rotation` 拡張実装 |
| ★★ | FilmPass Plugin 新規実装 |
| ★★ | FreiChenShader Plugin 新規実装 |
| ★★ | `docs/spec/sequencer.spec.md` 新設 |
| ★ | 録画機能の動作確認（`pnpm dev:electron` → ⌘R → ⌘⇧R → WebM 保存） |

**Phase 13 実装順序：**

```
1. 各モジュールの CLAUDE.md / docs/spec/[feature].spec.md を確認
2. src/ui/panels/ ディレクトリ新設
3. PreferencesPanel.tsx 移動
4. MacroKnobSimpleWindow.tsx → MacroKnobPanel.tsx リネーム+移動
5. App.tsx の import を全て更新
6. 各 CLAUDE.md 新規作成
7. pnpm tsc --noEmit → 型エラーゼロ確認
8. pnpm test --run → 104 tests グリーン確認
9. git commit + tag day37
```

---

## 環境メモ（累積）

- **ファイル更新鉄則（Day36強化）**: 既存ファイルの更新は `filesystem:edit_file` を使う。`write_file` は新規作成のみ。エンコードエラーが出ても `write_file` への逃げは禁止。正しい対処は `read_text_file` → `edit_file`
- **preserveDrawingBuffer: true**（Day31確立）: `drawImage` で WebGL canvas を読み取るには必須
- **録画**（Day32確立）: `startRecording()` / `stopRecording()` は `engine.ts` に実装済み・IPC は `save-recording`
- **Geometry 自動登録**: `import.meta.glob` で `solid/` 配下も自動スキャン済み・手動登録不要
- **Shader Plugin**（Day34確立）: 独立型（選択肢3）・`GeometryData` 経由・実装はシーケンサー後
- **GeoGraffi**（Day34確立）: 将来の別アプリ・スマートグラス決定打待ち・Obsidian に保存済み
- **MacroKnob = コア固定**（Day35確立）: Plugin 化しない・Panel として分離・コントリビューター触れない
- **MIDI 2.0 = main.js 経由**（Day35確立）: IPC でレンダラーへ・CC 32,768個・32bit 解像度
- **Sequencer → MacroKnob 経由**（Day35確立）: Sequencer は macroKnobId に値を送るだけ・paramId を直接知らない
- **CC Standard v0.1**（Day36確立）: Block 1xx〜9xx・全Plugin横断マッピング表・AI自然言語インターフェース設計・`docs/spec/cc-standard.spec.md`
- **CLAUDE.md の読み方**: ルート → 作業対象モジュール → spec の順で読む
- **今後 `dist-electron/` は絶対にコミットしない**（`.gitignore` 済み）
- **git push の前に必ず `git status` で staged を確認してから `git tag` を打つこと**
- **zsh でインラインコメント（`#`）はエラーになる**: コメント行とコマンド行は必ず分けて渡す

---

## 次回チャット用スタートプロンプト

```
GeoGraphy Day37を開始します。
まず HANDOVER.md を読んでください（/Users/shinbigan/geography/HANDOVER.md）

その後、以下の手順で進めてください：
1. 下記コマンドの結果を貼り付けます
   cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
2. HANDOVER.md の「次回やること（Day37）」を読んで作業を開始してください

開発スタイル：SDD × CDD
- 始業時は HANDOVER.md → 各モジュールの CLAUDE.md / docs/spec/[機能].spec.md を確認 → 更新か継続か判定 → 必要箇所だけ更新してから実装
- ファイル更新は filesystem:edit_file を使うこと（write_file は新規作成のみ）
- 完了条件は pnpm tsc --noEmit（型エラーゼロ）+ pnpm test --run（全テストグリーン）両方通過
- プランを提示・承認を得てから実装を開始すること
```
