# src/core - CLAUDE.md v4

## 役割

GeoGraphy のエンジンコア。レンダーループ・Plugin Registry・Parameter Store・Command パターン・LayerManager・Program/Preview バス・MacroKnobManager を管理する。

**engine.ts は App.tsx に依存してはいけない・単体で動作できること。**

---

## 完了条件（CDD 原則・必須）

```bash
pnpm tsc --noEmit   # 型エラーゼロ
pnpm test --run     # 全テストグリーン
```

---

## ファイル構成

```
src/core/
├── engine.ts          ← レンダーループ・初期化（App.tsx に依存しない）
├── layerManager.ts    ← レイヤー管理（CSS 合成）
├── clock.ts           ← BPM クロック・beat 値
├── registry.ts        ← Plugin Registry（自動登録）
├── parameterStore.ts  ← パラメーター一元管理（Command 経由）
├── commandHistory.ts  ← Command パターン・アンドゥ履歴
├── macroKnob.ts       ← MacroKnobManager（エンジン固定部分）
├── programBus.ts      ← Program バス（フルサイズ Three.js Scene）
├── previewBus.ts      ← Preview バス（SceneState + 小キャンバス）
└── config.ts          ← 定数（MAX_LAYERS / MAX_UNDO_HISTORY など）
```

---

## エンジン固定部分（Plugin が触れない）

| 固定部分 | 役割 | アクセスルール |
|---|---|---|
| Parameter Store | 全パラメーターの一元管理 | MUST: Command 経由のみ |
| Plugin Registry | Plugin の登録・切り替え・list() | 自動登録（import.meta.glob）のみ |
| Command パターン | アンドゥ・リドゥ | commandHistory.ts 経由 |
| レンダリングループ | requestAnimationFrame・delta・beat の供給 | engine.ts 内部のみ |
| BPM クロック | BPM・beat 値の管理 | Tempo Driver 経由のみ |
| MacroKnobManager | MIDI CC とパラメーターの対応管理 | src/core/macroKnob.ts・直接改変禁止 |
| メニューバー | GeoGraphy / File / View の定義 | Electron main.js に集約 |

---

## MacroKnobManager

```
MIDI 機器（物理ノブ）
  ↓ CC 番号
Input Driver（MIDI Driver）
  ↓
MacroKnobManager（src/core/macroKnob.ts）← エンジン固定部分
  ↓ normalize() して
Parameter Store → Command 経由でパラメーター更新
```

詳細仕様: `docs/spec/macro-knob.spec.md`

---

## Clock の2系統（MUST・混同禁止）

```typescript
engine.threeClock  // THREE.Clock → getDelta() でフレーム間の経過時間を取得
engine.clock       // Clock（独自）→ BPM・beat 値の管理・readonly で外部公開
```

- `threeClock` と `clock` は絶対に混同しない
- テンポ変更時は `startTime = performance.now()` でリセット（beat 急ジャンプ防止）

---

## Output view / Edit view（Day30確定・Phase 11）

```
Large screen（Electronメインウィンドウ）
Small screen（MixerSimpleWindow内）
  ↑ それぞれ Output view または Edit view をアサインして表示

Output view = 出力映像（観客に見せる映像）
Edit view   = 編集映像（次に出す映像を仕込む場所）
```

各レイヤーの canvas は1つだけ存在する。
Output/Edit それぞれへの Opacity をルーティングで制御する（CSS制御・GPU負荷変化なし）。

```typescript
interface LayerRouting {
  layerId: string
  outputOpacity: number   // 0.0〜1.0
  editOpacity: number     // 0.0〜1.0
}

type ScreenAssign = 'output' | 'edit'

interface ScreenAssignState {
  large: ScreenAssign   // デフォルト: 'output'
  small: ScreenAssign   // デフォルト: 'edit'
}
```

詳細仕様: `docs/spec/program-preview-bus.spec.md`

---

## Program / Preview バス（Phase 7 実装済み）

```
Program バス
  └── フルサイズ Three.js Scene（実際に出力・GPU 使用）

Preview バス
  ├── SceneState JSON（パラメーターのメモのみ・GPU 不使用）
  └── 小キャンバス（320×180・Mixer サムネイル確認用）

切り替え時
  → Preview の SceneState を Program のフルサイズ Scene に適用
  → 旧 Program Scene を dispose()
```

- IMPORTANT: Preview バスは Three.js Scene を持たない・SceneState のみ

詳細仕様: `docs/spec/program-preview-bus.spec.md`

---

## LayerManager

```typescript
// CSS mixBlendMode で合成（WebGL RenderTarget 不要）
export const layerManager = new LayerManager()
```

- `initialize(container)` は engine.initialize() 内で呼ぶ（DOM 存在後）
- `position: absolute` + `alpha: true` + `setClearColor(0x000000, 0)` で透明背景
- `pointerEvents: 'none'` でマウスイベントを吸収しない
- MAX_LAYERS = 3（config.ts から参照）

詳細仕様: `docs/spec/layer-system.spec.md`

---

## Command パターン（最重要）

```typescript
interface Command {
  execute(): void
  undo(): void
  description: string
}
```

**Parameter Store は必ず Command 経由で変更すること。直接代入は禁止。**

詳細仕様: `docs/spec/command-pattern.spec.md`

---

## config.ts の定数

```typescript
export const MAX_LAYERS = 3
export const MAX_UNDO_HISTORY = 50
export const DEFAULT_BPM = 128
export const LERP_FACTOR = 0.05
```
