# GeoGraphy 引き継ぎメモ｜Day58（Transport Architecture Step1+2+3 完了）｜2026-04-12

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
| Transport Architecture spec | `docs/spec/transport-architecture.spec.md` |
| MIDI Registry spec | `docs/spec/midi-registry.spec.md` |
| Plugin Manager spec | `docs/spec/plugin-manager.spec.md` |
| CC Mapping（SSoT） | `docs/spec/cc-mapping.md` |
| CC Map JSON（自動生成） | `settings/cc-map.json` |
| TransportEvent 型定義 | `src/types/index.ts` |
| MidiManager | `src/core/midiManager.ts` |
| MidiInputWrapper | `src/drivers/input/MidiInputWrapper.ts`（Day58 新規） |
| MidiRegistry 純粋関数 | `src/core/midiRegistry.ts` |
| Registry 型定義 | `src/types/midi-registry.ts` |
| SimpleWindowPlugin | `src/plugins/windows/simple-window/SimpleWindowPlugin.tsx` |
| FxWindowPlugin | `src/plugins/windows/fx-window/FxWindowPlugin.tsx` |
| App.tsx（Orchestrator） | `src/ui/App.tsx` |

---

## 現在の状態

- **ブランチ**: `refactor/day53-design`
- **タグ**: `day58`
- **最新コミット**: `44d5517`
- **テスト**: 114 tests グリーン・tsc エラーゼロ

---

## Day58 で完了したこと

### Step 1: MidiCCEvent → TransportEvent rename
- `src/types/index.ts`: `MidiCCEvent` を `TransportEvent` に改名
- `protocol` / `resolution` フィールドを削除（Input Wrapper が吸収）
- `source` の型を `'window' | 'plugin' | 'midi' | 'osc'` に絞る
- 影響ファイル8本を一括更新

### Step 2: MidiInputWrapper 切り出し
- `src/drivers/input/MidiInputWrapper.ts` を新規作成
- 責務: Web MIDI API 受信・CCパース・rawValue 正規化・TransportEvent 生成
- App.tsx の MIDI useEffect が約20行 → 3行に簡略化

### Step 3: イベント駆動化（ポーリング廃止）
- `engine.ts` に `onParamChanged(cb)` コールバック登録 API を追加
- `flushParameterStore()` 内で値が実際に変わったときだけコールバックを発火
- App.tsx の 200ms ポーリングを廃止 → `engine.onParamChanged + 16ms throttle` に置き換え
- Registry 更新が「値変化時のみ」になった

### Day58 で確定した重要な認識
- **`cc-mapping.md` → `cc-map.json` の翻訳機は既に完成している**
- **問題は「json → engine」の経路が不完全**なこと（フォールバック時に pluginMin/Max が無視される）
- **Step 4 の本質**: engine から ccMapService 依存を剥がすことで、「外側（プロトコル・セマンティクス）」と「内側（純粋な値処理）」の境界線を完全に閉じる
- **将来の自然言語 AI 対応**は、この境界線の外側に実装される（engine は何も知らずに動く）
- **ControlBus（別 AI 提案）は Obsidian に保存**・今の実装には持ち込まない

---

## 現在地

| 状態 | 内容 |
|---|---|
| ✅ 完了 | TransportEvent 型（MidiCCEvent から移行） |
| ✅ 完了 | MidiInputWrapper（Input Wrapper 切り出し） |
| ✅ 完了 | イベント駆動化（ポーリング廃止） |
| ✅ 完了 | cc-mapping.md → cc-map.json の翻訳機 |
| ⏳ 次フェーズ | Step 4: Engine ccMapService 依存解消（境界線を完全に閉じる） |
| ⏳ 未着手 | 既存 SimpleWindow 廃止（3ファイル） |
| ⏳ 未着手 | MacroKnob D&D アサイン UI |
| ⏳ 未着手 | [L1][L2][L3] タブ切り替え |
| ⏳ 未着手 | Sequencer spec 作成（壁打ちから） |

---

## 次回セッションの方針

**Step 4 の壁打ちから始める。**

```
Step 4: Engine の ccMapService 依存解消

問題箇所:
  engine.ts の flushParameterStore() が
  ccMapService.getCcNumber() を直接呼んでいる（フォールバック経路）
  → CC番号という MIDI の概念が engine 内部に残存している

目標:
  engine は TransportEvent（slot + value）だけを知る
  cc-map.json の意味解釈は完全に外側（Registry / Input層）の責務

設計の本質:
  「外側と内側の境界線を完全に閉じる」
  外側: プロトコル・自然言語・セマンティクス（cc-mapping.md / MidiInputWrapper）
  内側: 純粋な値の処理（engine / plugin）

着手前に単独で壁打ちして設計を固めること。
参照: docs/spec/transport-architecture.spec.md §5 Step4
```

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ（累積）

- **ブランチ**: `refactor/day53-design` は main からの大幅改変ブランチ
- **ブラウザ確認**: `pnpm dev` → `open http://localhost:5173`（毎回再起動が必要）
- **localStorage は Preset 永続化のみ例外許可**（Day52確立）
- **git タグは commit 後に打つこと**
- **tsc が反映ズレで失敗する場合**: 2回実行すると解消する
- **cc-map.json**: `settings/cc-map.json` が SSoT・変更後は `pnpm gen:cc-map` を実行
- **git commit メッセージ**: `.claude/dayN-commit.txt` に書いて `git commit -F` で実行
- **Desktop 環境でも実装可能**: tsc + test は慎太郎さんが手動実行して結果を貼る
- **NFC 正規化スクリプト**: `/Users/shinbigan/nfc_normalize.py`

---

## 次回チャット用スタートプロンプト

```
Day59開始
```
