# GeoGraphy 引き継ぎメモ｜Day74｜2026-04-22

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応の映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / Electron 41 / RxJS 7.8.2 / Zustand 5.0.12 / Zod 4.3.6 / **Tone.js 15.1.22（Day73追加）**
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **ブランチ**: `refactor/day53-design`
- **プロジェクトルート**: `/Users/shinbigan/geography`

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| CLAUDE.md（全体方針） | `CLAUDE.md` |
| GeoParamAddress | `src/application/schema/geoParamAddress.ts` |
| GeoParamAddress spec | `docs/spec/geo-param-address.spec.md` |
| windowMode | `src/application/schema/windowMode.ts` |
| Engine | `src/application/orchestrator/engine.ts` |
| TransportManager | `src/application/registry/transportManager.ts` |
| GeometryStandardDnDWindow | `src/ui/components/window/standard-dnd-window/GeometryStandardDnDWindow.tsx` |
| Macro8Window | `src/ui/components/window/macro-8-window/Macro8Window.tsx` |

---

## 現在の状態

- **ブランチ**: `refactor/day53-design`
- **タグ**: `day74`
- **テスト**: **129 tests グリーン・tsc エラーゼロ**
- **Day74 コミット**:
  ```
  13d2c3b feat: GeoParamAddress integration + StandardDnD default + MacroWindow removal (Day74)
  ```

---

## Day74 で完了したこと

### GeoParamAddress 統合（Day73未完了タスク）
- `transportManager.ts`: store キーを geoParamAddress に統一（3経路）
  - window 入力（`event.layerId` あり）: entries から `entry.geoParamAddress` で set
  - MIDI 入力（`event.layerId` なし）: 同上
  - `receiveModulation`: `entry.geoParamAddress` で set
- `engine.ts` `flushParameterStore()`: lookup キーを `entry.geoParamAddress` に変更
- `engine.ts` `setLayerPlugin()`: Plugin 切り替え時に古い geoParamAddress を ParameterStore から削除
- これにより ParameterStore の書き込みキーと読み出しキーが完全一致 → スライダー・MIDI CC が正しく plugin.params に反映される

### UI デフォルト変更
- `windowMode.ts` `DEFAULT_WINDOW_MODE`: geometry/camera/fx を `standard-dnd`、macro を `macro-8-window` に変更

### 無限ループバグ修正
- `onRegistryChanged` コールバック内で `onPluginApply` を呼ぶと registry が再発火して無限ループになるバグを発見・修正
- 修正方法: `pluginIdRef.current = geo.id` を `onPluginApply` 呼び出し**前**に更新して再入を防ぐ
- 影響ファイル: `GeometryStandardDnDWindow` / `GeometrySimpleWindow` / `GeometrySimpleDnDWindow`（3ファイル）
- `GeometryStandardWindow` はすでに修正済みだった

### MacroWindow 廃止
- 旧 MacroWindow（32ノブ）を廃止、Macro8Window に一本化
- `MacroWindowMode` から `'macro-window'` を削除
- `App.tsx` / `PreferencesPanel` / キーバインド（キー `1`）/ `onToggleMacroKnobWindow` を全て `macro-8-window` に変更

---

## アーキテクチャ確定事項（Day74）

### GeoParamAddress の完全統合（Day74完了）
```
入力経路（window/MIDI/modulation）
  → transportManager: store.set(entry.geoParamAddress, value)
  → ParameterStore: キー = 'geo://layer-1/icosphere/scale'
  → engine.flushParameterStore(): allValues.get(entry.geoParamAddress)
  → plugin.params[entry.id].value = actual
```

### Geometry Window の onRegistryChanged パターン（バグ修正済み）
```typescript
// MUST: pluginIdRef.current を onPluginApply より先に更新する
if (geo.id !== pluginIdRef.current) {
  pluginIdRef.current = geo.id  // ← 先に更新して再入ループを防ぐ
  setPluginId(geo.id)
  onPluginApply(activeLayer, geo.id)
}
```

### Tone.js Phase ロードマップ
| Phase | 内容 |
|---|---|
| Phase 1（完了） | Tone.js 導入・Clock 移行・getTotalBeats 追加 |
| Phase 2 | MIDI Clock 受信・外部音源同期 |
| Phase 3 | 音生成・Tone.Synth 等の統合 |

---

## 次回やること

### 優先度 高
1. **Sequencer Window spec 作成**（Phase 16）
   - `docs/spec/sequencer-window.spec.md` 新規作成
   - Sequencer の target 指定は `geoParamAddress` で直接指定（Day74で基盤完成）
   - Clock の `getTotalBeats()` / `currentBar` / `step16th` を制御源として使用

---

## 環境メモ

- **ブラウザ確認**: `pnpm dev` → `open http://localhost:5173`（毎回再起動が必要）
- **git commit**: 日本語長文は `.claude/dayN-commit.sh` に書いて `bash` で実行
- **NFC 正規化**: 日本語ファイル編集後は `python3 /Users/shinbigan/nfc_normalize.py`
- **Tone.js テスト**: `vi.mock('tone', ...)` を clock.test.ts / engine.test.ts に追加済み
- **DEFAULT_WINDOW_MODE**: StandardD&D + Macro8 が初期表示（Day74変更）
- **MacroWindow（旧32ノブ）**: 廃止済み・ファイルは残るが参照なし

---

## 次回チャット用スタートプロンプト

```
Day75開始
```
