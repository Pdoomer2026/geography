# Transport Architecture Spec

> SSoT: このファイル
> 担当: Claude Desktop（設計）/ Claude Code（実装）
> 状態: Day58 全 Step 完了（Step1〜4）

---

## 0. 設計原則（最重要）

- システムは「意味」と「伝送」を完全に分離する
- 値は常に **0.0〜1.0 の比率（Normalized Value）** として扱う
- Engine は一切のプロトコル知識を持たない
- プロトコル（MIDI / UMP / OSC 等）はすべて Input Wrapper に隔離する
- **コア層が自律的に動く・UI は鏡**（Day58 Step4 確定）

---

## 1. 二つの世界の定義

### Geometry World（Local / ParamID）

- 言語: ParamID（例: "radius", "speed"）
- 値: 0.0〜1.0（Normalized）
- 責務: 値を受け取り内部定数で実数化・描画に適用
- スタンス: 「誰が操作しているかは知らない。このIDに値が来たら動くだけ」

### Window World（Global / Control Layer）

- 言語: Slot（抽象ID・現在は CC番号と同値）
- 値: 0.0〜1.0（Normalized）
- 責務: UI操作を Normalized に変換・Slot に対して値を送信
- スタンス: 「相手を知らない。Slot に対して値を送るだけ」

---

## 2. TransportEvent 型（Day58 Step1 完了）

すべてのデータはイベントとして扱う。

```typescript
// Day58 確定版
interface TransportEvent {
  slot: number
  value: number       // 0.0〜1.0
  source?: 'window' | 'plugin' | 'midi' | 'osc'
  time?: number
}
// protocol / resolution は MidiInputWrapper が吸収するため廃止（Day58 Step1）
```

---

## 3. Input Wrapper（プロトコル隔離層）（Day58 Step2 完了）

MIDI / UMP / OSC 等の解析を担当。Engine にプロトコル知識を持ち込まない。

### 役割

- CC番号 → Slot 変換
- 生の値（0〜127 等）→ 0.0〜1.0 正規化
- TransportEvent 生成
- `engine.handleMidiCC(event)` を呼ぶ

### ファイル構成

```
src/drivers/input/
├── MidiInputWrapper.ts   // MIDI 1.0 / 2.0 解析・Day58 実装済み
├── OscInputWrapper.ts    // 将来
└── index.ts
```

### App.tsx での使用

```typescript
// App.tsx（3行に簡略化・Day58 Step2）
useEffect(() => {
  midiInputWrapper.init((event) => engine.handleMidiCC(event))
  return () => midiInputWrapper.dispose()
}, [])
```

---

## 4. TransportRegistry（コアシングルトン）（Day58 Step4 完了）

Registry をコア層に降ろし、engine / TransportManager が直接参照できるようにした。

### 役割

- `slot → pluginId:paramId` の対応表を保持
- Plugin Apply / Remove 時に更新
- UI 層は `onChanged` コールバックで変化を購読（鏡）
- `syncValue()` で `flushParameterStore` と連動

### ファイル

```
src/core/transportRegistry.ts   // Day58 新規作成
```

### API

```typescript
transportRegistry.register(params, layerId)     // Plugin Apply 時
transportRegistry.clear(layerId)                // Plugin Remove 時
transportRegistry.resolve(slot)                 // slot → param 解決
transportRegistry.getAll()                      // 全パラメータ取得
transportRegistry.onChanged(cb)                 // UI 購読用
transportRegistry.syncValue(pluginId, paramId, value)  // flushParameterStore 連動
```

---

## 5. データフロー全体像（Day58 完成版）

```
【外側の世界】
  cc-mapping.md  → セマンティック情報（人間・AI が読む）
  MidiInputWrapper → MIDI → TransportEvent
  OscInputWrapper  → OSC  → TransportEvent（将来）
  AI Layer         → 自然言語 → TransportEvent（将来）

【境界線】
  TransportEvent { slot, value, source?, time? }

【コア層】（自律的に動く）
  TransportManager.handle(event)
    → store.set(String(slot), value)
    → MacroKnob 解決
  ParameterStore（slot番号をキーとして値を保持）
  Engine.flushParameterStore()
    → transportRegistry.getAll() で slot→param を解決
    → plugin.params に値を流す
    → transportRegistry.syncValue() で Registry を更新
    → paramChangedCallback 発火

【UI 層】（鏡）
  App.tsx
    → transportRegistry.onChanged() を購読
    → engine.onParamChanged() を購読
    → setMidiRegistry({ availableParameters: [...transportRegistry.getAll()] })
  WindowPlugin
    → midiRegistry.availableParameters を filter して表示するだけ
```

---

## 6. 実装ロードマップ（全 Step 完了）

### Step 1: MidiCCEvent → TransportEvent rename ✅ Day58

- `src/types/index.ts` の `MidiCCEvent` を `TransportEvent` に改名
- `protocol` / `resolution` フィールドを削除
- `source` の型を `'window' | 'plugin' | 'midi' | 'osc'` に絞る
- 影響ファイル8本を一括更新

### Step 2: Input Wrapper 切り出し ✅ Day58

- `src/drivers/input/MidiInputWrapper.ts` を新規作成
- Web MIDI API 受信・CCパース・正規化・TransportEvent 生成を担当
- App.tsx の MIDI useEffect が3行に簡略化

### Step 3: イベント駆動化（ポーリング廃止）✅ Day58

- `engine.onParamChanged(cb)` コールバック登録 API を追加
- `flushParameterStore()` 内で値変更時のみコールバックを発火
- App.tsx の 200ms ポーリングを廃止
- Registry 更新が「値変化時のみ」になった

### Step 4: Registry コア層化・TransportManager 昇格 ✅ Day58

- `src/core/transportRegistry.ts` 新規作成（コアシングルトン）
- `src/core/transportManager.ts` 新規作成（MidiManager をプロトコル非依存に昇格）
- `engine.ts` の `flushParameterStore()` を transportRegistry ベースに書き換え
- `engine.ts` から `ccMapService` への依存を `initialize()` 内のみに限定
- `App.tsx` から `ccMapService` が完全に消えた
- App.tsx は Registry の「鏡」になった

---

## 7. 現状との対応表（Day58 完了時点）

| 要素 | 状態 |
|---|---|
| TransportEvent 型 | ✅ 完了（Day58 Step1） |
| source union 型 | ✅ 完了（Day58 Step1） |
| MidiInputWrapper | ✅ 完了（Day58 Step2） |
| イベント駆動化（ポーリング廃止） | ✅ 完了（Day58 Step3） |
| TransportRegistry（コアシングルトン） | ✅ 完了（Day58 Step4） |
| TransportManager（プロトコル非依存） | ✅ 完了（Day58 Step4） |
| engine の ccMapService 依存 | ✅ initialize() 内のみに限定（Day58 Step4） |
| App.tsx の ccMapService 依存 | ✅ 完全に除去（Day58 Step4） |
| OscInputWrapper | ⏳ 将来（OSC 対応時） |

---

## 8. 設計上の重要な決定（Day58 壁打ちで確定）

### 「外側と内側の境界線」

```
外側: プロトコル・自然言語・セマンティクス
  → cc-mapping.md（人間・AI が読む）
  → MidiInputWrapper / OscInputWrapper（プロトコル変換）
  → 将来の AI Layer（自然言語 → TransportEvent）

内側: 純粋な値の処理
  → TransportManager（slot + value を受け取るだけ）
  → ParameterStore（slot番号をキーとして厳密に動く）
  → Engine（CC番号の意味を知らない）
```

### セマンティックキーについて

セマンティックキー（`"icosphere:radius"`）は**外側の世界で使うもの**。
- コントリビューターが `cc-mapping.md` を書くとき
- 将来の AI が自然言語を TransportEvent に変換するとき

Geometry の内部（ParameterStore のキー）には持ち込まない。
ParameterStore のキーは **slot 番号（MIDI 2.0 として厳密・一意）** のまま。

### TransportManager の抽象度

`MidiManager` という名前がプロトコル依存に見えたため `TransportManager` に昇格。
MIDI / OSC / 将来の入力全てに対応できる汎用設計になった。

---

## 9. References

- `docs/spec/midi-registry.spec.md` — MIDIRegistry 仕様
- `docs/spec/plugin-manager.spec.md` — Plugin Manager 仕様
- `docs/spec/cc-mapping.md` — CC マッピング（SSoT・人間が書く）
- `settings/cc-map.json` — 機械可読フォーマット（自動生成）
- `src/types/index.ts` — TransportEvent 型定義
- `src/core/transportManager.ts` — TransportManager 実装
- `src/core/transportRegistry.ts` — TransportRegistry 実装
- `src/core/engine.ts` — flushParameterStore・initTransportRegistry
- `src/drivers/input/MidiInputWrapper.ts` — MIDI Input Wrapper
- `src/drivers/input/` — 将来の Input Wrapper 配置先
