# GeoGraphy 引き継ぎメモ｜Day58（Transport Architecture 完了・ドキュメント全更新）｜2026-04-14

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
| MacroKnob spec | `docs/spec/macro-knob.spec.md` |
| CC Mapping（SSoT） | `docs/spec/cc-mapping.md` |
| CC Map JSON（自動生成） | `settings/cc-map.json` |
| TransportEvent 型定義 | `src/types/index.ts` |
| TransportManager | `src/core/transportManager.ts`（Day58 新規） |
| TransportRegistry | `src/core/transportRegistry.ts`（Day58 新規） |
| MidiInputWrapper | `src/drivers/input/MidiInputWrapper.ts`（Day58 新規） |
| MidiRegistry 純粋関数 | `src/core/midiRegistry.ts`（後方互換・非推奨） |
| Registry 型定義 | `src/types/midi-registry.ts` |
| SimpleWindowPlugin | `src/plugins/windows/simple-window/SimpleWindowPlugin.tsx` |
| FxWindowPlugin | `src/plugins/windows/fx-window/FxWindowPlugin.tsx` |
| App.tsx（鏡） | `src/ui/App.tsx` |

---

## 現在の状態

- **ブランチ**: `refactor/day53-design`
- **タグ**: `day58`
- **最新コミット**: `cb6170f`（docs: 実装計画書 v4.0 更新）
- **テスト**: 114 tests グリーン・tsc エラーゼロ

---

## Day58 で完了したこと

### Step 1: MidiCCEvent → TransportEvent rename
- `MidiCCEvent` を `TransportEvent` に改名
- `protocol` / `resolution` フィールドを削除
- `source` を `'window' | 'plugin' | 'midi' | 'osc'` に絞る

### Step 2: MidiInputWrapper 切り出し
- `src/drivers/input/MidiInputWrapper.ts` 新規作成
- App.tsx の MIDI useEffect が3行に簡略化

### Step 3: イベント駆動化（ポーリング廃止）
- `engine.onParamChanged(cb)` コールバック登録 API を追加
- 200ms ポーリングを廃止・値変化時のみ発火

### Step 4: Registry コア層化・TransportManager 昇格
- `src/core/transportRegistry.ts` 新規作成（コアシングルトン）
- `src/core/transportManager.ts` 新規作成（MidiManager をプロトコル非依存に昇格）
- `engine.ts` の `flushParameterStore()` を transportRegistry ベースに書き換え
- `ccMapService` の使用を `engine.initialize()` 内のみに限定
- `App.tsx` から `ccMapService` が完全に消えた
- App.tsx は Registry の「鏡」になった

### ドキュメント更新（Day58 全 Step 反映）
- `docs/spec/transport-architecture.spec.md` — 完成版に全面更新
- `src/core/CLAUDE.md` — v5 → v6（TransportManager / TransportRegistry 反映）
- `docs/spec/midi-registry.spec.md` — TransportRegistry との役割分担を明記
- `docs/spec/plugin-manager.spec.md` — Day58 実装順序追加
- `docs/spec/macro-knob.spec.md` — TransportEvent / TransportManager に全面更新
- `src/ui/CLAUDE.md` — TransportEvent に更新
- `src/drivers/input/CLAUDE.md` — MidiInputWrapper の役割を明記

---

## 確定した設計思想（Day58 壁打ちで確定）

### 「外側と内側の境界線」

```
【外側】プロトコル・自然言語・セマンティクス
  cc-mapping.md（人間・AI が読む）
  MidiInputWrapper / OscInputWrapper（プロトコル変換）
  将来の AI Layer（自然言語 → TransportEvent）

【境界線】
  TransportEvent { slot, value, source?, time? }

【内側】純粋な値の処理
  TransportManager（slot + value を受け取るだけ）
  ParameterStore（slot番号をキーとして厳密に動く）
  Engine（CC番号の意味を知らない）
  TransportRegistry（slot→paramId の対応表）
```

### セマンティックキーの用途
- `"icosphere:radius"` は外側（cc-mapping.md・AI）で使うもの
- ParameterStore のキーは slot 番号（MIDI 2.0 として厳密・一意）のまま

### ControlBus（別 AI 提案）
- Obsidian に保存済み（長期ビジョン用）
- 今の実装には持ち込まない

---

## 現在地

| 状態 | 内容 |
|---|---|
| ✅ 完了 | Transport Architecture Step 1〜4 全て |
| ✅ 完了 | cc-mapping.md → cc-map.json の翻訳機 |
| ✅ 完了 | 関連ドキュメント全更新 |
| ✅ 完了 | 要件定義書 v2.0 新規作成（`docs/要件定義書_v2.0.md`） |
| ✅ 完了 | 実装計画書 v4.0 更新（Day49〜58 実績追加・Phase 16 詳述） |
| ⏳ 未着手 | 既存 SimpleWindow 廃止（3ファイル） |
| ⏳ 未着手 | MacroKnob D&D アサイン UI |
| ⏳ 未着手 | [L1][L2][L3] タブ切り替え |
| ⏳ 未着手 | Sequencer spec 作成（壁打ちから） |

---

## 次回セッションの方針

Transport Architecture・ドキュメントが全て完成。次は **Phase 16（engine の ccMapService 依存解消）の壁打ち**から始める。
影響範囲が大きいため単独セッションで設計を固めてから実装。
参照: `docs/spec/transport-architecture.spec.md` §5 Step4

```bash
# ベースライン確認
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ（累積）

- **ブランチ**: `refactor/day53-design`
- **ブラウザ確認**: `pnpm dev` → `open http://localhost:5173`（毎回再起動が必要）
- **git commit メッセージ**: `.claude/dayN-commit.txt` に書いて `git commit -F` で実行
- **Desktop 環境でも実装可能**: tsc + test は慎太郎さんが手動実行して結果を貼る
- **NFC 正規化スクリプト**: `/Users/shinbigan/nfc_normalize.py`
- **write_file ルール**: 継続部分を必ず保持・move_file → read → 差分提示 → 承認 → write_file

---

## 次回チャット用スタートプロンプト

```
Day59開始
```
