# GeoGraphy 引き継ぎメモ｜Day49（MidiManager 設計確定・CC体系整理）｜2026-04-08

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
| MidiManager 本体（リネーム前） | `src/core/macroKnob.ts` → 次回 `midiManager.ts` |
| CC Map Service | `src/core/ccMapService.ts` |
| Engine | `src/core/engine.ts` |
| 型定義 | `src/types/index.ts` |
| MacroKnob spec | `docs/spec/macro-knob.spec.md` |
| CC Standard | `docs/spec/cc-standard.spec.md` |
| CC Mapping | `docs/spec/cc-mapping.md` |

---

## 現在の状態

- **ブランチ**: `main`
- **タグ**: `day47`（Day48・49 タグは未打）
- **テスト**: 114 tests グリーン・tsc エラーゼロ
- **実装変更なし**: Day49 は設計の壁打ちのみ。コード変更ゼロ
- **既知の未解決バグ**: `macroKnob.ts` の `handleMidiCC()` / `receiveModulation()` は `ParameterStore` に書くだけで `plugin.params` に反映されない

---

## Day49 で完了したこと

### 1. MidiManager 設計確定

- `MacroKnobManager` → `MidiManager` にリネーム確定
- 全入力源（物理MIDI / SimpleWindow / Sequencer / LFO / AI）が `MidiCCEvent(MIDI 2.0)` に統一される設計を言語化
- CC未定義 param → CC1000〜自動払い出し設計確定
- Simple Window → `handleMidiCC()` 経由に統一（案A 完全 SSoT）確定

### 2. CC体系整理

- Camera Plugin 3種（static / orbit / aerial）のパラメーター全洗い出し
- CC110（Auto Rotate）新設確定
- CC510〜512（LookAt X/Y/Z）新設確定
- grid-wave の `hue` → CC400 追記漏れ確認
- Block内サブエリア方針確定（20個単位でPlugin カテゴリー専用エリアを予約）
- コントリビューター帯 CC1000〜9999 確定

### 3. 環境設定

- `~/.claude/settings.json` に `ENABLE_TOOL_SEARCH: true` 追加（Claude Code のコンテキスト削減）

---

## 確立した新ルール（Day49）

- **MidiManager = 全 CC の唯一の通路**: 全入力源が `MidiCCEvent(MIDI 2.0)` に統一
- **CC未定義 param は存在してはいけない**: 定義漏れは CC1000〜自動払い出しでカバー
- **5分以上アイドルでキャッシュ切れ**: コスト跳ね上がるため短いメッセージで繋ぐ

---

## 次回やること（Day50）

### Step 1（最初にやること）
`src/core/ccMapService.ts` の `getCcNumber()` を修正
```typescript
// -1 返す代わりに CC1000〜自動払い出し
private autoAssignedCc: Map<string, number> = new Map()
private nextAutoCc: number = 1000
```

### Step 2
`src/core/macroKnob.ts` → `src/core/midiManager.ts` にリネーム
- クラス名・export 変数名・interface 名を全て変更
- `src/types/index.ts` の `MacroKnobManager` → `MidiManager`

### Step 3
`MidiManager.handleMidiCC()` が `engine` 経由で `plugin.params` に書くように修正
- `init()` に engine を追加
- `handleMidiCC()` / `receiveModulation()` で `engine.setGeometryParam()` 等を呼ぶ

### Step 4
Simple Window 3種のスライダーを `handleMidiCC()` 経由に変更
```typescript
const cc = ccMapService.getCcNumber(pluginId, paramKey)
const normalized = (value - param.min) / (param.max - param.min)
engine.handleMidiCC({ cc, value: normalized, protocol: 'midi2', resolution: 4294967296 })
```
ポーリングで `plugin.params[key].value` を読んで表示を追従させる

### Step 5
cc-standard.spec.md / cc-mapping.md の定義漏れ追記
- CC110（Auto Rotate）/ CC510〜512（LookAt X/Y/Z）/ grid-wave hue

### Step 6
CLAUDE.md / spec のリネーム反映

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ（累積）

- **ENABLE_TOOL_SEARCH: true**（Day49確立）: `~/.claude/settings.json` に設定済み（Claude Code のコンテキスト削減）
- **5分アイドルでキャッシュ切れ**（Day49確認）: 混雑時間帯は1ステップずつ・短いメッセージで繋ぐ
- **ブラウザ確認フロー**（Day47確立）: `pnpm dev` → `open http://localhost:5173` の2ステップ必須。HMR・hard reload では反映されない
- **Preset は GeoGraphyProject をそのまま保存**（Day47確立）: localStorage キー `geography:presets-v1`
- **Camera 初期値バグ修正済み**（Day48）: PreferencesPanel は engine.getLayers() から cameraPlugin.id を直接読む
- **requiresRebuild フラグ**（Day46確立）: メッシュ形状に影響する param に `requiresRebuild: true` を必ず設定
- **Camera Plugin はファクトリ関数パターン**（Day45確立）: `getCameraPlugin()` が毎回新インスタンスを生成
- **大幅更新フロー**（Day41確立）: `move_file → write_file → NFC 正規化`
- **write_file は新規ファイルのみ**: 既存ファイルへの使用は禁止
- **spec アーカイブ**（Day41確立）: `docs/archive/spec/YYYY-MM-DD_DayN_[name].spec.md`
- **MIDI 受信は App.tsx で直接**（Day44確立）: IPC 経路不要
- **Linus スタイルコミット**（Day39確立）: `git commit -m "タイトル" -m "ボディ"`
- **git タグは commit 後に打つこと**
- **tsc が反映ズレで失敗する場合**: 2回実行すると解消する

---

## 次回チャット用スタートプロンプト

```
Day50開始
引き継ぎスキル
```
