# GeoGraphy 引き継ぎメモ｜Day53（MIDI Registry 基盤 + アーキテクチャ設計見直し）｜2026-04-09

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
| MidiManager | `src/core/midiManager.ts` |
| MacroKnobManager | `src/core/macroKnob.ts` |
| Engine | `src/core/engine.ts` |
| 型定義 | `src/types/index.ts` |

---

## 現在の状態

- **ブランチ**: `refactor/day53-design`（main からブランチ）
- **タグ**: `day53`
- **テスト**: 114 tests グリーン・tsc エラーゼロ
- **コミット**: 49785e2

---

## Day53 で完了したこと

### 1. アーキテクチャ設計の根本見直し（壁打ちで確定）

**新設計の核心：**
- `SimpleWindow` を廃止し Geometry・FX は「選択のみ」の形にする
- `MIDI Registry` を新設し、Plugin Apply 時に自動登録する
- Window Plugin は Registry を読んで独立した UI を提供する（密結合を解消）

**確定したデータフロー：**
```
Plugin Apply
  → PluginManager がエンジンをインスタンス化
  → engine.getParameters() でパラメータ抽出
  → App.tsx が layerId/pluginId を付与
  → registerParams() で Registry に登録
  → Window Plugin が Registry を読んで UI を更新（次フェーズ）
```

### 2. MIDI Registry 基盤の実装

**新設ファイル：**

`src/types/midi-registry.ts`
```typescript
interface ParameterSchema {
  id: string; name: string; min: number; max: number; step: number
}
interface RegisteredParameter extends ParameterSchema {
  layerId: string   // どのレイヤーのパラメータか
  pluginId: string  // どの Plugin のパラメータか
}
interface MIDIRegistry {
  availableParameters: RegisteredParameter[]
  bindings: Map<number, string>
}
```

`src/core/midiRegistry.ts`
- `registerParams(registry, params, layerId)` — layerId 単位で上書き・他レイヤー保持
- `clearParams(registry, layerId)` — 指定レイヤーのみ除去

### 3. 全 Plugin に getParameters() を追加

- Geometry 8本・FX 12本・Camera 3本・Light 1本 = 計24本
- 実装: `Object.entries(this.params).map()` で `ParameterSchema[]` に変換
- **責務分離確定**: Plugin は `ParameterSchema[]` を返すだけ・`layerId`/`pluginId` の付与は呼び出し側（App.tsx）

### 4. 確定した設計原則

- `ParameterSchema`（Plugin が返す型）と `RegisteredParameter`（Registry に登録する型）を分離
- Registry は全レイヤー分をフラットに保持（`layerId` でフィルタリング）
- `registerParams()` は layerId 単位で上書きするため、1レイヤーだけ変更する場合も同じ関数で対応できる

---

## Day54 の最重要タスク

### App.tsx の配線（B-2 案の実装）

```typescript
// Plugin Apply 時
const handleApply = (layerId: string, pluginId: string) => {
  engine.setGeometry(layerId, pluginId)
  
  const plugin = engine.getPlugin(layerId)
  const params = plugin.getParameters()   // ParameterSchema[]
  
  // layerId / pluginId を付与して RegisteredParameter[] に変換
  const enriched = params.map(p => ({ ...p, layerId, pluginId }))
  setRegistry(prev => registerParams(prev, enriched, layerId))
}
```

**必要な作業：**
1. `App.tsx` に `MIDIRegistry` の React state を追加
2. `engine.getPlugin(layerId)` を `engine.ts` に追加（Plugin インスタンスを返す）
3. Plugin Apply 時に Registry を更新する配線を追加
4. 起動時（initialize 後）に全レイヤー分を一括登録する処理を追加

---

## 確立した新ルール（Day53）

- **Plugin は layerId/pluginId を知らない**: 付与は呼び出し側（App.tsx）の責務
- **Registry はフラット構造**: layerId でフィルタリングする設計
- **registerParams は layerId 単位で上書き**: 他レイヤーは保持する純粋関数

---

## 次回セッション開始時の確認コマンド

```bash
cd /Users/shinbigan/geography && pnpm tsc --noEmit && pnpm test --run
```

---

## 環境メモ（累積）

- **セッション開始時は全ファイルを読んでから分析**（Day51確立）
- **差分保持ルール**（Day50確立）
- **ブラウザ確認フロー**（Day47確立）: `pnpm dev` → `open http://localhost:5173`
- **localStorage は Preset 永続化のみ例外許可**（Day52確立）: `src/ui/CLAUDE.md` 参照
- **git タグは commit 後に打つこと**
- **tsc が反映ズレで失敗する場合**: 2回実行すると解消する
- **ブランチ**: `refactor/day53-design` は main からの大幅改変ブランチ。main にマージするのは設計が安定してから

---

## 次回チャット用スタートプロンプト

```
Day54開始
```
