# GeoGraphy 引き継ぎメモ｜Day50（MidiManager責務分離・ドキュメント整備）｜2026-04-08

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
| 実装計画書（最新） | `docs/実装計画書_v4.0.md` |
| MidiManager | `src/core/midiManager.ts`（Day50新設） |
| MacroKnobManager | `src/core/macroKnob.ts` |
| CC Map Service | `src/core/ccMapService.ts` |
| Engine | `src/core/engine.ts` |
| 型定義 | `src/types/index.ts` |
| MacroKnob spec | `docs/spec/macro-knob.spec.md`（Day50更新） |
| Simple Window spec | `docs/spec/simple-window.spec.md`（Day50更新） |
| CC Standard | `docs/spec/cc-standard.spec.md` |
| CC Mapping | `docs/spec/cc-mapping.spec.md` |

---

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day50`
- **テスト**: 114 tests グリーン・tsc エラーゼロ
- **Day50は設計壁打ち＋実装＋ドキュメント整備**

---

## Day50 で完了したこと

### 1. 設計壁打ち：責務分離の確定

- `macroKnob.ts` の責務を整理し、2つのクラスに分離することを確定
  - `MacroKnobManager`（`macroKnob.ts`）= 32ノブのUI設定管理のみ
  - `MidiManager`（`midiManager.ts`・新設）= CC入力の唯一の通路
- 全 SimpleWindow と MacroKnobPanel が `engine.handleMidiCC()` 経由で統一される設計を確定
- `MacroKnobPanel` が `macroKnobManager` を直接参照していた問題を発見・修正

### 2. 実装

- `src/core/midiManager.ts` 新規作成（`handleMidiCC` / `receiveModulation` を移管）
- `src/core/macroKnob.ts` 責務削減（`handleMidiCC` / `receiveModulation` / `init` を削除・`setValue` を追加）
- `src/core/engine.ts` 更新（`midiManager` に委譲・公開API追加: `getMacroKnobs` / `setMacroKnob` / `getMacroKnobValue` / `receiveMidiModulation`）
- `src/ui/panels/macro-knob/MacroKnobPanel.tsx` engine経由に変更（`macroKnobManager` 直接参照を削除）
- `src/types/index.ts` `MidiManager` interface 追加・`MacroKnobManager` から `handleMidiCC` / `receiveModulation` を削除・`setValue` 追加

### 3. ドキュメント整備

- `docs/spec/macro-knob.spec.md` Day50アーキテクチャに全面更新（元内容を全保持・Day50変更を統合）
- `docs/spec/simple-window.spec.md` engine経由MUSTルール追加・ファイルパス修正
- 6つのCLAUDE.mdを新アーキテクチャに更新（MidiManager責務分離を反映）
- ルートCLAUDE.mdに**差分保持ルール**追記（Day50確立）

---

## 確立した新ルール（Day50）

- **差分保持ルール（最重要）**: CLAUDE.md / spec.md / 全ドキュメントを更新するときは `move_file` → `read_text_file` で元ファイルを読む → 差分を整理・承認 → `write_file`。「記憶で書ける」は理由にならない
- **ルートCLAUDE.mdは `edit_file` のみ**: `move_file` + `write_file` は禁止
- **MidiManager = 全CC入力の唯一の通路**: 全UI・物理MIDI・Sequencer（将来）が `engine.handleMidiCC()` 経由で統一
- **MacroKnobPanel は engine 経由のみ**: `macroKnobManager` 直接参照は禁止

---

## 次回やること（Day51）

### 未完了のDay49タスク（引き継ぎ）
- `ccMapService.ts` の `getCcNumber()` を修正（CC1000〜自動払い出し）
- cc-standard.spec.md / cc-mapping.spec.md の定義漏れ追記（CC110・CC510〜512・grid-wave hue）

### SimpleWindow の engine.handleMidiCC() 経由への統一
現在 `GeometrySimpleWindow` / `CameraSimpleWindow` / `FxSimpleWindow` のスライダーは `engine.setGeometryParam()` 等を直接呼んでいる。
Day50で設計確定した仕様（`engine.handleMidiCC()` 経由）への移行が残っている。

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ（累積）

- **差分保持ルール**（Day50確立）: write_file前に必ずread_text_fileで元ファイルを読む・差分を整理して承認を得てから実行。CLAUDE.md / spec.md / 全ドキュメントに適用
- **ENABLE_TOOL_SEARCH: true**（Day49確立）: `~/.claude/settings.json` に設定済み（Claude Code のコンテキスト削減）
- **5分アイドルでキャッシュ切れ**（Day49確認）: 混雑時間帯は1ステップずつ・短いメッセージで繋ぐ
- **ブラウザ確認フロー**（Day47確立）: `pnpm dev` → `open http://localhost:5173` の2ステップ必須。HMR・hard reload では反映されない
- **Preset は GeoGraphyProject をそのまま保存**（Day47確立）: localStorage キー `geography:presets-v1`
- **Camera 初期値バグ修正済み**（Day48）: PreferencesPanel は engine.getLayers() から cameraPlugin.id を直接読む
- **requiresRebuild フラグ**（Day46確立）: メッシュ形状に影響する param に `requiresRebuild: true` を必ず設定
- **Camera Plugin はファクトリ関数パターン**（Day45確立）: `getCameraPlugin()` が毎回新インスタンスを生成
- **大幅更新フロー**（Day41確立）: `move_file → read_text_file → 差分確認 → 承認 → write_file → NFC 正規化`
- **write_file は新規ファイルのみ**: 既存ファイルへの使用は禁止
- **spec アーカイブ**（Day41確立）: `docs/archive/spec/YYYY-MM-DD_DayN_[name].spec.md`
- **MIDI 受信は App.tsx で直接**（Day44確立）: IPC 経路不要
- **Linus スタイルコミット**（Day39確立）: `git commit -m "タイトル" -m "ボディ"`
- **git タグは commit 後に打つこと**
- **tsc が反映ズレで失敗する場合**: 2回実行すると解消する

---

## 次回チャット用スタートプロンプト

```
Day51開始
引き継ぎメモ読んで
```
