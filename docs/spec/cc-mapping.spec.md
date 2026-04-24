# GeoGraphy CC Mapping System Spec

> SSoT: このファイル
> 担当: Claude Desktop（設計・cc-mapping.md 更新） / Claude Code（実装）
> 状態: Day58 更新（TransportEvent / MidiInputWrapper 対応）

---

## 1. 概要

GeoGraphy の全 Plugin パラメーターと GeoGraphy CC番号（MIDI 2.0 AC 空間の独自体系）の対応を管理する3層構造。
この仕組みが固まらないと MacroKnob・D&D アサイン・AI 自然言語インターフェース
の全てが不安定になるため、最優先で設計を確定する。

> **内部バスについて（Day58 確定）**
> GeoGraphy の内部バスは TransportEvent フォーマット（slot + value・0.0〜1.0 float）で統一されている。
> 外部コントローラーとの通信は Web MIDI API 経由のため MIDI 1.0 プロトコルだが、
> GeoGraphy に入った瞬間から MidiInputWrapper が TransportEvent に変換し、内部バスは常に MIDI 2.0 準拠。
> CC番号体系は MIDI 2.0 AC 空間に統一した GeoGraphy 独自の体系であり、外部受信プロトコルとは別の話。

---

## 2. 3層構造

```
【Layer 0】docs/spec/cc-mapping.md
  SSoT（唯一の真実の情報源）
  開発者が編集・Claude Desktop が更新を支援
  Plugin × paramId × CC番号 × 値域 を一元管理
  人間にも AI にも読みやすい Markdown 形式
        ↓ pnpm gen:cc-map（スクリプト自動生成）
        ↓ 生成時に未マッピングの paramId を警告

【Layer 1】settings/cc-map.json
  デフォルト定義・読み取り専用（スクリプト生成物）
  AI が runtime で参照
  MacroKnob / ccMapService の lookup 元
  手動編集禁止（必ず Layer 0 を編集してスクリプトで再生成）
        ↓ ユーザーが Preferences > CC Map タブで上書き

【Layer 2】~/Documents/GeoGraphy/cc-overrides.json
  ユーザー上書き分のみ保存（差分だけ・Layer 1 は汚染しない）
  存在しない場合は Layer 1 のデフォルトをそのまま使う
  Electron IPC 経由で読み書き（geoAPI.saveCcOverrides / loadCcOverrides）

Runtime lookup 優先順位: Layer 2 → Layer 1（上書き優先）
```

---

## 3. Layer 0：cc-mapping.md のフォーマット

### 3-1. ファイルの役割

- 開発者が新 Plugin を追加したとき、ここに paramId と CC 番号を追記する
- Claude Desktop がこのファイルを読んで整合性を確認・更新を支援する
- `pnpm gen:cc-map` がこのファイルをパースして `settings/cc-map.json` を生成する

### 3-2. Markdown テーブルフォーマット

```markdown
## [pluginType]: [pluginId]

| paramId | CC#   | Block     | pluginMin | pluginMax | ccMin | ccMax | 備考 |
|---------|-------|-----------|-----------|-----------|-------|-------|------|
| radius  | CC101 | EXISTENCE | 0.5       | 10        | 0.0   | 1.0   |      |
| speed   | CC300 | MOTION    | 0.0       | 2.0       | 0.0   | 1.0   |      |
```

- `pluginType`: `geometry` / `fx` / `particle`
- `pluginMin` / `pluginMax`: Plugin の実際の値域（config.ts の min/max）
- `ccMin` / `ccMax`: CC 値域（基本的に 0.0〜1.0。負の値域を持つ場合は別途指定）
- `備考`: CC Standard にない独自パラメーターや注意事項

### 3-3. 更新ルール

- 新 Plugin 追加時: cc-mapping.md に新セクションを追記 → pnpm gen:cc-map
- CC 番号変更時: cc-mapping.md を編集 → pnpm gen:cc-map → cc-map.json が再生成される
- ユーザー上書き（cc-overrides.json）は cc-mapping.md に影響しない

---

## 4. Layer 1：settings/cc-map.json のスキーマ

```json
{
  "version": "0.2",
  "generatedAt": "2026-04-07T09:00:00Z",
  "generatedFrom": "docs/spec/cc-mapping.md",
  "mappings": [
    {
      "pluginId": "icosphere",
      "pluginType": "geometry",
      "params": [
        {
          "paramId": "radius",
          "ccNumber": 101,
          "block": "EXISTENCE",
          "blockName": "Primary Amount",
          "pluginMin": 0.5,
          "pluginMax": 10,
          "ccMin": 0.0,
          "ccMax": 1.0,
          "note": ""
        }
      ]
    }
  ]
}
```

- `generatedFrom`: このファイルがどこから生成されたかを明示
- `block`: CC Standard の Block 名（EXISTENCE / FORM / MOTION / COLOR / SPACE / EDGE / BLEND / SHADER / SCENE）
- `blockName`: CC Standard の CC 名（Primary Amount / Density / Temporal Speed 等）

---

## 5. Layer 2：cc-overrides.json のスキーマ

差分のみ保存する設計。変更のあった paramId だけを記録する。

```json
{
  "version": "0.2",
  "updatedAt": "2026-04-07T10:00:00Z",
  "overrides": [
    {
      "pluginId": "icosphere",
      "paramId": "radius",
      "ccNumber": 20
    },
    {
      "pluginId": "bloom",
      "paramId": "strength",
      "ccNumber": 25
    }
  ]
}
```

- 保存先: `~/Documents/GeoGraphy/cc-overrides.json`
- IPC ハンドラー: `load-cc-overrides` / `save-cc-overrides`（electron/main.js に追加）
- ccNumber のみ上書き可能。pluginMin/pluginMax は変更不可

---

## 6. Runtime: ccMapService

### 6-1. ファイルパス

`src/core/ccMapService.ts`

### 6-2. 責務

- `settings/cc-map.json` を起動時に読み込んでメモリに保持
- `~/Documents/GeoGraphy/cc-overrides.json` を起動時に読み込んでマージ
- `getCcNumber(pluginId, paramId)` → Layer 2 優先で CC 番号を返す
- `getMapping(pluginId, paramId)` → 完全な ParamMapping オブジェクトを返す
- `getAllMappings()` → Preferences > CC Map タブの表示用
- **使用場所**: `engine.initialize()` 内の `initTransportRegistry()` のみ（Day58 確定）

### 6-3. Interface

```typescript
interface ParamMapping {
  pluginId: string
  pluginType: 'geometry' | 'fx' | 'particle'
  paramId: string
  ccNumber: number          // ユーザー上書き後の実効値
  defaultCcNumber: number   // cc-map.json のデフォルト値
  block: string
  blockName: string
  pluginMin: number
  pluginMax: number
  ccMin: number
  ccMax: number
  note: string
  isOverridden: boolean     // ユーザーが上書きしているか
}

interface CcMapService {
  init(): Promise<void>
  getCcNumber(pluginId: string, paramId: string): number
  getMapping(pluginId: string, paramId: string): ParamMapping | null
  getAllMappings(): ParamMapping[]
  applyOverride(pluginId: string, paramId: string, ccNumber: number): Promise<void>
  resetOverride(pluginId: string, paramId: string): Promise<void>
  resetAllOverrides(): Promise<void>
}
```

---

## 7. pnpm gen:cc-map スクリプト

### 7-1. ファイルパス

`scripts/generate-cc-map.ts`

### 7-2. 動作

1. `docs/spec/cc-mapping.md` を読み込む
2. Markdown テーブルをパースして `settings/cc-map.json` を生成
3. 生成時に Plugin の config.ts をスキャンして未マッピングの paramId を検出・警告

### 7-3. 警告仕様

```bash
$ pnpm gen:cc-map

cc-map.json を生成しました (83 mappings)

⚠ 以下の paramId が cc-mapping.md に未記載です:
  → docs/spec/cc-mapping.md を更新後、再度 pnpm gen:cc-map を実行してください
```

### 7-4. package.json への追加

```json
{
  "scripts": {
    "gen:cc-map": "tsx scripts/generate-cc-map.ts"
  }
}
```

---

## 8. Preferences > CC Map タブ

### 8-1. タブ追加位置

`PreferencesPanel.tsx` の TABS 配列に `{ id: 'ccmap', label: 'CC Map' }` を追加。
既存タブ順: Setup / Project / Plugins / Audio / MIDI / **CC Map** / Output

### 8-2. UI 仕様

```
CC MAP

Filter: [All ▼]  種別: [All ▼]  🔍 [検索...]

─────────────────────────────────────────────────
icosphere                              [geometry]
┌──────────┬───────┬───────────┬──────────────┐
│ paramId  │ CC#   │ Block     │ 値域         │
├──────────┼───────┼───────────┼──────────────┤
│ radius   │ [101] │ EXISTENCE │ 0.5 〜 10.0  │
│ detail   │ [201] │ FORM      │ 0 〜 5       │
│ speed    │ [300] │ MOTION    │ 0.0 〜 2.0   │
│ hue      │ [400] │ COLOR     │ 0 〜 360     │
└──────────┴───────┴───────────┴──────────────┘
─────────────────────────────────────────────────
※ オレンジ色の CC# はデフォルトから変更されています
[Reset All to Defaults]          [Save Changes]
```

### 8-3. 操作ルール

- CC# セルをクリック → インライン数値入力（0〜32767）
- 変更された CC# はオレンジ色でハイライト
- `Save Changes` → `applyOverride()` を呼んで `cc-overrides.json` に差分保存
- `Reset All to Defaults` → `resetAllOverrides()` を呼んで `cc-overrides.json` を削除
- 個別リセット: 変更済みセルを右クリック → `Reset this CC#`

---

## 9. MacroKnob との連携

D&D アサイン時の ccNumber 取得フロー：

```
ユーザーが Simple Window の [≡] ハンドルを MacroKnob にドロップ
  ↓
DragPayload { type: 'param', pluginId, paramId, ... } を受け取る
  ↓
ccMapService.getCcNumber(pluginId, paramId) → ccNumber を取得
  ↓
min/max ダイアログ表示（初期値 = pluginMin / pluginMax）
  ↓
MacroAssign { paramId, ccNumber, min, max, curve } を生成
  ↓
macroKnobManager.addAssign(knobId, assign)
```

`MacroAssign.ccNumber` は ccMapService が提供する。Plugin が CC 番号を知る必要はない。

---

## 10. AI との連携（v3 実装対象）

```
ユーザー「ネオン廃墟の夜にして」
  ↓
AI が settings/cc-map.json を読む（pluginId × paramId × ccNumber が全て入っている）
  ↓
Block 9xx → Block 1xx〜7xx の値を決定
  ↓
TransportEvent として engine.handleMidiCC() に流す（内部バス経由）
  ↓
TransportManager → ParameterStore 更新 → 映像が変わる
```

---

## 11. 実装状況（Day58 更新）

| 作業 | 状態 |
|------|------|
| `docs/spec/cc-mapping.md` 作成（全 Plugin 分） | ✅ 完了 |
| `scripts/generate-cc-map.ts` 実装 | ✅ 完了 |
| `settings/cc-map.json` 生成（83 mappings） | ✅ 完了（Day58 再生成） |
| `src/core/ccMapService.ts` 実装 | ✅ 完了 |
| `electron/main.js` に cc-overrides IPC 追加 | ✅ 完了 |
| `MacroAssign.ccNumber` を ccMapService 経由に統一 | ✅ 完了 |
| ccMapService の使用を engine.initialize() 内のみに限定 | ✅ 完了（Day58） |
| Preferences > CC Map タブ実装 | ⏳ 未実装 |

---

## 12. References

- `docs/spec/cc-standard.spec.md` — CC Standard v0.2（Block 定義・AI 語彙）
- `docs/spec/cc-mapping.md` — SSoT（Plugin × paramId × CC 番号の対応表）
- `docs/spec/transport-architecture.spec.md` — Transport Architecture 全体仕様
- `docs/spec/macro-knob.spec.md` — MacroKnob システム仕様
- `docs/spec/preferences-panel.spec.md` — Preferences パネル仕様
- `settings/cc-map.json` — 自動生成・読み取り専用
- `~/Documents/GeoGraphy/cc-overrides.json` — ユーザー上書き
- `src/core/ccMapService.ts` — runtime lookup サービス（engine.initialize 内でのみ使用）
- `src/core/transportRegistry.ts` — ccMapService の結果を受け取るコアシングルトン
- `scripts/generate-cc-map.ts` — 生成スクリプト
