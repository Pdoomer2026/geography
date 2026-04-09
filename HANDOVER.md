# GeoGraphy 引き継ぎメモ｜Day53-54（MIDI Registry 基盤 + App.tsx 配線）｜2026-04-09

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
| App.tsx（Registry state） | `src/ui/App.tsx` |
| Engine | `src/core/engine.ts` |
| 型定義 | `src/types/index.ts` |

---

## 現在の状態

- **ブランチ**: `refactor/day53-design`（main からブランチ）
- **タグ**: `day54`
- **テスト**: 114 tests グリーン・tsc エラーゼロ
- **コミット**: d9b666a

---

## Day53-54 で完了したこと

### 1. アーキテクチャ設計の根本見直し（確定）

**新設計のデータフロー：**
```
Plugin Apply
  → plugin.getParameters() でパラメータ抽出（ParameterSchema[]）
  → App.tsx が layerId/pluginId を付与（RegisteredParameter[]）
  → registerParams() で MIDIRegistry に登録
  → Window Plugin が Registry を読んで UI を生成（次フェーズ）
```

### 2. 新設ファイル

`src/types/midi-registry.ts`
- `ParameterSchema` — Plugin が返す型（layerId/pluginId なし）
- `RegisteredParameter` — Registry に登録する型（layerId/pluginId あり）
- `MIDIRegistry` — availableParameters + bindings
- `createInitialRegistry()` — 初期状態

`src/core/midiRegistry.ts`
- `registerParams(registry, params, layerId)` — layerId 単位で上書き・他レイヤー保持
- `clearParams(registry, layerId)` — 指定レイヤーのみ除去

### 3. 全 Plugin に getParameters() を追加（24本）

- Geometry 8本・FX 12本・Camera 3本・Light 1本
- `ModulatablePlugin` Interface に `getParameters(): ParameterSchema[]` を追加
- 実装は全 Plugin 共通: `Object.entries(this.params).map()` で変換

### 4. engine.ts に getAllLayerPlugins() を追加

```typescript
getAllLayerPlugins(): { layerId: string; plugin: GeometryPlugin }[]
```
- 全レイヤーの Plugin を一括取得（Registry 起動時一括登録用）

### 5. App.tsx の配線（完成）

- `MIDIRegistry` の React state を追加
- 起動時（`initialize` 完了後）に全レイヤーを一括登録
- `applyPluginToRegistry(layerId, pluginId)` ヘルパー定義
- `removePluginFromRegistry(layerId)` ヘルパー定義

---

## 現在地（何ができて何ができていないか）

| 状態 | 内容 |
|---|---|
| ✅ 完成 | Registry にパラメータが登録される（起動時・全レイヤー） |
| ✅ 完成 | Plugin Apply 時に Registry を更新するヘルパーが存在する |
| ❌ 未接続 | GeometrySimpleWindow → applyPluginToRegistry の呼び出し |
| ❌ 未実装 | CC番号の自動割り当て（cc-map.json との接続） |
| ❌ 未実装 | bindings への紐付け（Apply 時に CC を自動アサイン） |
| ❌ 未実装 | Window Plugin が Registry を読んで UI を生成 |
| ❌ 未実装 | 物理MIDI → bindings → param 反映 |

---

## 次回セッションの方針

**CC番号の自動割り当て設計を壁打ちしてから実装する。**

現行の `ccMapService`（cc-map.json ベースの静的マッピング）と新設の `MIDIRegistry`（動的状態）をどう接続するかが核心。急いで実装せず熟慮してから進める。

参照すべきファイル：
- `docs/spec/cc-mapping.spec.md` — CC マッピング仕様
- `src/core/ccMapService.ts` — 既存の静的マッピングサービス
- `src/types/midi-registry.ts` — 新設の Registry 型定義

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ（累積）

- **ブランチ**: `refactor/day53-design` は main からの大幅改変ブランチ。main にマージするのは設計が安定してから
- **セッション開始時は全ファイルを読んでから分析**（Day51確立）
- **差分保持ルール**（Day50確立）
- **ブラウザ確認フロー**（Day47確立）: `pnpm dev` → `open http://localhost:5173`
- **localStorage は Preset 永続化のみ例外許可**（Day52確立）
- **git タグは commit 後に打つこと**
- **tsc が反映ズレで失敗する場合**: 2回実行すると解消する

---

## 次回チャット用スタートプロンプト

```
Day55開始
```
