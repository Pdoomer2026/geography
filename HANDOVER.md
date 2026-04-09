# GeoGraphy 引き継ぎメモ｜Day56（Phase B v1 完了・WindowPlugin 実装）｜2026-04-10

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
| MIDI Registry 型定義 | `src/types/midi-registry.ts` |
| MIDI Registry 実装 | `src/core/midiRegistry.ts` |
| CC Map Service | `src/core/ccMapService.ts` |
| SimpleWindowPlugin | `src/plugins/windows/simple-window/SimpleWindowPlugin.tsx` |
| FxWindowPlugin | `src/plugins/windows/fx-window/FxWindowPlugin.tsx` |
| App.tsx（Orchestrator） | `src/ui/App.tsx` |
| GeometrySimpleWindow（並存中） | `src/ui/GeometrySimpleWindow.tsx` |
| CC マッピング SSoT | `docs/spec/cc-mapping.md` |
| CC Map JSON | `settings/cc-map.json` |
| Plugin Manager spec | `docs/spec/plugin-manager.spec.md` |

---

## 現在の状態

- **ブランチ**: `refactor/day53-design`
- **タグ**: `day56`
- **テスト**: 114 tests グリーン・tsc エラーゼロ

---

## Day56 で完了したこと

### 1. Phase B 壁打ち（設計確定）

**値域変換の責務：**
- 正規化（0〜1）は WindowPlugin が担当
- `(value - param.min) / (param.max - param.min)` で統一
- RangeSlider（可動域制約）は v1 スコープ外
- engine は `0〜1 → pluginMin/Max` の逆変換のみ担当（往復変換・現状踏襲）

**FX params の設計（重要な設計議論）：**
- Geometry: MIDIRegistry 経由（案 B）
- FX params: MIDIRegistry 経由に統一（Geometry と同じパターン）
- FX enabled: engine API 経由（FX 固有の動作状態・MIDIRegistry の責務外）
- onToggle: App.tsx が engine.setFxEnabled を呼ぶコールバックとして渡す
- → コントリビューターは engine を直接知らなくていい

**ccMapService のブラウザ環境問題の発見と解決：**
- 開発時（ブラウザ）では window.geoAPI が undefined → cc-map.json が読めない
- → fetch('/cc-map.json') フォールバックを追加
- → vite.config.ts に `publicDir: 'settings'` を追加
- → ブラウザ環境でも正しい CC 番号（CC101 等）が使われるようになった

### 2. 実装完了ファイル

**新規作成：**
- `src/plugins/windows/simple-window/SimpleWindowPlugin.tsx`
- `src/plugins/windows/simple-window/index.ts`
- `src/plugins/windows/fx-window/FxWindowPlugin.tsx`
- `src/plugins/windows/fx-window/index.ts`

**変更：**
- `src/types/midi-registry.ts` — `RegisteredParameterWithCC` 追加・`availableParameters` 型昇格
- `src/core/midiRegistry.ts` — `registerParams` の引数型を `RegisteredParameterWithCC[]` に変更
- `src/core/ccMapService.ts` — `parseCcMap()` 切り出し・fetch フォールバック追加
- `vite.config.ts` — `publicDir: 'settings'` 追加
- `src/ui/App.tsx` — FX 登録・両 WindowPlugin 表示・FxSimpleWindow 切り離し

---

## 現在地（何ができて何ができていないか）

| 状態 | 内容 |
|---|---|
| ✅ 完成 | RegisteredParameterWithCC 型・MIDIRegistry 型昇格 |
| ✅ 完成 | ccMapService ブラウザ環境対応（fetch フォールバック） |
| ✅ 完成 | SimpleWindowPlugin 表示（layer-1 固定） |
| ✅ 完成 | FxWindowPlugin 表示（layer-1 固定・ON/OFF トグル） |
| ✅ 完成 | FX params の MIDIRegistry 統合 |
| 🔄 並存中 | GeometrySimpleWindow（Preset 機能あり・廃止は次フェーズ） |
| 🔄 並存中 | CameraSimpleWindow（Camera 接続後に廃止） |
| ❌ 未実装 | [L1][L2][L3] タブ切り替え（layer-1 固定のまま） |
| ❌ 未実装 | bindings（MacroKnob D&D フェーズ） |
| ❌ 未実装 | Preset（Save / Load / Delete）→ 将来フェーズ |
| ❌ 未実装 | RangeSlider（可動域制約）→ 上位 WindowPlugin |

---

## 次回セッションの方針

以下のいずれかを壁打ちして決める：

1. **SimpleWindowPlugin の engine 同期問題**
   - 現在の SimpleWindowPlugin は `useState(min)` で初期値を持つ
   - engine 側の現在値（geo.params.value）と同期していない
   - 200ms ポーリングで engine から値を読んで同期する仕組みが必要

2. **[L1][L2][L3] タブ切り替え**
   - 現在 layer-1 固定
   - App.tsx に activeLayer state を追加して各 WindowPlugin に渡す

3. **GeometrySimpleWindow 廃止の準備**
   - Preset 機能を SimpleWindowPlugin に移植するか、別途 PresetPlugin として切り出すか

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
- **publicDir: 'settings'**: vite の静的配信設定・ブラウザから `/cc-map.json` でアクセス可能

---

## 次回チャット用スタートプロンプト

```
Day57開始
```

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
| MIDI Registry 型定義 | `src/types/midi-registry.ts` |
| MIDI Registry 実装 | `src/core/midiRegistry.ts` |
| MIDI Registry spec | `docs/spec/midi-registry.spec.md` |
| Plugin Manager spec | `docs/spec/plugin-manager.spec.md` |
| App.tsx（Registry state） | `src/ui/App.tsx` |
| GeometrySimpleWindow | `src/ui/GeometrySimpleWindow.tsx` |
| Engine | `src/core/engine.ts` |
| 型定義 | `src/types/index.ts` |

---

## 現在の状態

- **ブランチ**: `refactor/day53-design`
- **タグ**: `day55`
- **コミット**: b56fe5d
- **テスト**: 114 tests グリーン・tsc エラーゼロ

---

## Day55 で完了したこと

### 1. 壁打ちで確定した設計

**ccMapService と MIDIRegistry の役割分担：**
- ccMapService = 静的（cc-map.json ベースの CC 番号定義）
- MIDIRegistry = 動的（今どの Plugin がロードされているかの状態）

**Plugin Apply の2段階フロー（確定）：**
- Phase A: Geometry 選択 → MIDIRegistry.availableParameters に登録
- Phase B: Window 選択 → ccNumber を付与 → WindowPlugin が UI を生成

**WindowPlugin エコシステム（確定）：**
- SimpleWindowPlugin: Geometry / Camera / Light 共通
- FxWindowPlugin: FX 専用（ON/OFF トグルが必要なため別実装）
- bindings は MacroKnob D&D フェーズまで空 Map のまま

### 2. 新規 spec ファイル

- `docs/spec/midi-registry.spec.md` — MIDIRegistry 設計の SSoT
- `docs/spec/plugin-manager.spec.md` — Plugin Apply 2段階フロー・WindowPlugin 定義

### 3. Phase A 実装（完了）

**変更ファイル：**

`src/ui/App.tsx`
- `applyPluginToRegistry` / `removePluginFromRegistry` を `useCallback` でラップ（deps=[]）
- `GeometrySimpleWindow` に `onPluginApply` / `onPluginRemove` を props として渡す
- `void applyPluginToRegistry` / `void removePluginFromRegistry` を削除

`src/ui/GeometrySimpleWindow.tsx`
- `GeometrySimpleWindowProps` interface を追加
- `syncFromEngine` 内で Plugin 切り替え時に `onPluginApply(activeLayer, geo.id)` を呼ぶ
- `syncFromEngine` 内で Plugin 除去時に `onPluginRemove(activeLayer)` を呼ぶ
- `useCallback` の deps に `onPluginApply` / `onPluginRemove` を追加

---

## 現在地（何ができて何ができていないか）

| 状態 | 内容 |
|---|---|
| ✅ 完成 | MIDIRegistry の型定義・純粋関数 |
| ✅ 完成 | 起動時に全レイヤーを一括登録 |
| ✅ 完成 | Plugin Apply/Remove 時に Registry を更新（Phase A） |
| ❌ 未実装 | SimpleWindowPlugin の新規実装 |
| ❌ 未実装 | FxWindowPlugin の新規実装 |
| ❌ 未実装 | ccNumber の RegisteredParameter への付与（Phase B） |
| ❌ 未実装 | bindings への紐付け（MacroKnob D&D フェーズ） |
| ❌ 未実装 | 既存 SimpleWindow の廃止 |

---

## 次回セッションの方針

**Phase B の壁打ちから始める。**

Phase B に入る前に以下を確認・設計する必要がある：
1. cc-mapping.md の整備状況（全 Plugin 分の CC 番号が定義されているか）
2. 値域変換の責務（pluginMin/Max ↔ ccMin/ccMax を誰が持つか）
3. SimpleWindowPlugin の実装開始

参照すべきファイル：
- `docs/spec/plugin-manager.spec.md` — Phase B の未解決事項
- `docs/spec/midi-registry.spec.md` — Phase B のフロー
- `docs/spec/cc-mapping.spec.md` — CC マッピング仕様
- `src/core/ccMapService.ts` — 静的マッピングサービス

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ（累積）

- **ブランチ**: `refactor/day53-design` は main からの大幅改変ブランチ。main にマージするのは設計が安定してから
- **ブラウザ確認は不可**: Electron アプリのため Web ブラウザでは確認できない。tsc + test が完了条件
- **localStorage は Preset 永続化のみ例外許可**（Day52確立）
- **git タグは commit 後に打つこと**
- **tsc が反映ズレで失敗する場合**: 2回実行すると解消する

---

## 次回チャット用スタートプロンプト

```
Day56開始
```
