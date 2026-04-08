# GeoGraphy 引き継ぎメモ｜Day51（CC Mapping 整備・SimpleWindow engine経由統一）｜2026-04-08

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
- **タグ**: `day51`
- **テスト**: 114 tests グリーン・tsc エラーゼロ
- **Day51は CC Mapping 整備 + SimpleWindow engine.handleMidiCC() 経由統一**

---

## Day51 で完了したこと

### 1. CC Mapping 整備（Day49 引き継ぎタスク完了）

- `cc-standard.spec.md` Block 1xx に CC110（Auto Rotate）追加
- `cc-standard.spec.md` Block 5xx に CC510〜512（LookAt X/Y/Z）追加・クイックリファレンス更新
- `cc-mapping.md` v0.3 に更新
  - Camera Plugin 3種（static/orbit/aerial）のマッピング追加
  - grid-wave の hue（CC400）欠落を修正
- git commit: 82f361a

### 2. SimpleWindow → engine.handleMidiCC() 経由への統一（Day50 設計完成）

- `src/core/midiManager.ts` 修正: CC番号を key に ParameterStore へ直接書くよう変更（MacroKnob アサイン有無に関わらず動作）
- `src/core/engine.ts` に `flushParameterStore()` / `resolveParamValue()` を追加
  - 毎フレームの update() ループ内で ParameterStore → plugin.params に反映
  - cc-map.json あり（Electron）: ccMapService の mapping で逆変換
  - cc-map.json なし（ブラウザ確認時）: getCcNumber() + param.min/max でフォールバック
- `GeometrySimpleWindow` / `CameraSimpleWindow` / `FxSimpleWindow` の handleParam を `engine.handleMidiCC()` 経由に変更
- git commit: ee4af4c

### 3. grid-wave hue の実装完成

- `grid-wave.config.ts` に hue param 追加（value:180, min:0, max:360）
- `GridWaveGeometry.ts` の update() で `material.color.setHSL(hue/360, 1, 0.5)` に反映
- ブラウザで動作確認済み
- git commit: c9ac424

---

## 確立した新ルール（Day51）

- **セッション引き継ぎは必ず全ファイルを読んでから分析する**: 引き継ぎチャット・HANDOVER.md・関連 spec/CLAUDE.md を全て読んでから推測・分析を始める。「記憶で推測」は禁止
- **flushParameterStore フォールバック設計**: cc-map.json 未生成時は `getCcNumber()` + `param.min/max` で逆変換してブラウザ確認でも動作させる

---

## 次回やること（Day52）

- **Sequencer Plugin 設計**（壁打ち）: uProgress 0.0〜1.0 の制御源として Sequencer が必要。Shader Plugin 実装の前提
- **MacroKnob D&D アサイン UI**: SimpleWindow の `[≡]` ハンドル実装・MacroKnob へのドロップ
- **Plugin Store v1 設計**（壁打ち）

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ（累積）

- **セッション開始時は全ファイルを読んでから分析**（Day51確立）: HANDOVER.md・関連 spec・CLAUDE.md を全て読んでから推測・分析を始める
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
Day52開始
引き継ぎメモ読んで
```
