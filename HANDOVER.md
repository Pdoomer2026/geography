# GeoGraphy 引き継ぎメモ｜Day58（Transport Architecture Step1+2 完了）｜2026-04-12

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
- **コミット**: `ef8fcb9`
- **テスト**: 114 tests グリーン・tsc エラーゼロ

---

## Day58 で完了したこと

### Step 1: MidiCCEvent → TransportEvent rename

- `src/types/index.ts`: `MidiCCEvent` を `TransportEvent` に改名
- `protocol` / `resolution` フィールドを削除（Input Wrapper が吸収）
- `source` の型を `string` → `'window' | 'plugin' | 'midi' | 'osc'` に絞る
- 影響ファイル8本を一括更新（engine / midiManager / App.tsx / 各 WindowPlugin）

### Step 2: MidiInputWrapper 切り出し

- `src/drivers/input/MidiInputWrapper.ts` を新規作成
- 責務: Web MIDI API 受信・CCパース・rawValue 正規化・TransportEvent 生成
- `App.tsx` の MIDI `useEffect` が約20行 → 3行に簡略化
- シングルトン `midiInputWrapper` を export

### 確定した設計判断

- **ControlBus（別 AI 提案）は Obsidian に保存**・今の実装には持ち込まない（過剰抽象化リスク）
- **Desktop 環境でも実装完結できる**ことを確認（tsc + test は手動実行）
- `source: 'window'` への統一により Step 3（ループ防止）の基盤が整った

---

## 現在地（何ができて何ができていないか）

| 状態 | 内容 |
|---|---|
| ✅ 完了 | TransportEvent 型（MidiCCEvent から移行） |
| ✅ 完了 | MidiInputWrapper（Input Wrapper 切り出し） |
| ✅ 完了 | source: 'window' / 'midi' の統一 |
| ⏳ 未着手 | Step 3: イベント駆動化（ポーリング廃止） |
| ⏳ 未着手 | 既存 SimpleWindow 廃止（3ファイル） |
| ⏳ 未着手 | MacroKnob D&D アサイン UI |
| ⏳ 未着手 | [L1][L2][L3] タブ切り替え |
| ⏳ 未着手 | Sequencer spec 作成（壁打ちから） |
| 別セッション | Step 4: Engine ccMapService 依存解消 |

---

## 次回セッションの方針

**Step 3 の壁打ちから始める。**

```
Step 3: イベント駆動化（ポーリング → イベント駆動）

現状:
  App.tsx が 200ms ごとに syncValues() を呼ぶ
  → engine の全レイヤー・全 Plugin を走査

目標:
  Plugin が値を変更したとき
  → source: 'plugin' の TransportEvent を発火
  → Registry 経由で Window に通知
  → Window は source === 'plugin' のとき自己ループを防止して表示更新

着手前に設計を壁打ちしてから実装すること。
参照: docs/spec/transport-architecture.spec.md §5 Step 3
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
- **git commit メッセージ**: `.claude/dayN-commit.txt` に書いて `git commit -F` で実行（`-m` は日本語で hang するリスク）
- **Desktop 環境でも実装可能**: tsc + test は慎太郎さんが手動実行して結果を貼る
- **NFC 正規化スクリプト**: `/Users/shinbigan/nfc_normalize.py`（このセッションでは不在だった・次回確認）

---

## 次回チャット用スタートプロンプト

```
Day59開始
```
