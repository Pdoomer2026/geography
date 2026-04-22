# GeoGraphy 引き継ぎメモ｜Day73｜2026-04-22

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
| Clock | `src/application/orchestrator/tempo/clock.ts` |
| IClock | `src/application/orchestrator/tempo/IClock.ts` |
| GeoParamAddress | `src/application/schema/geoParamAddress.ts` |
| GeoParamAddress spec | `docs/spec/geo-param-address.spec.md` |
| Clock spec | `docs/spec/clock.spec.md` |
| Engine | `src/application/orchestrator/engine.ts` |
| TransportManager | `src/application/registry/transportManager.ts` |
| AssignRegistry | `src/application/registry/assignRegistry.ts` |

---

## 現在の状態

- **ブランチ**: `refactor/day53-design`
- **タグ**: `day73`（Clock移行）/ `day73-geo-param`（GeoParamAddress導入）
- **テスト**: **129 tests グリーン・tsc エラーゼロ**
- **Day73 コミット一覧**:
  ```
  3e7db93 feat: migrate Clock to Tone.js + add getTotalBeats/isRunning/reset (Day73)
  df16d0d feat: introduce GeoParamAddress as unified parameter identity (Day73)
  ```

---

## Day73 で完了したこと

### Clock → Tone.js 移行
- `pnpm add tone`（Tone.js 15.1.22）
- `IClock` インターフェース新設（`src/application/orchestrator/tempo/IClock.ts`）
- `Clock` を Tone.js ベースに全面移行
  - `performance.now()` → `Tone.Transport.ticks / PPQ`
  - BPM変更時のリセット問題を解決（`Transport.pause()` で累積保持）
  - `getTotalBeats()` 追加（Sequencer/LFOの時間計算の源）
  - `isRunning()` / `reset()` 追加（Scheduler連携の準備）
- Vitest用 Tone.js モック追加（`clock.test.ts` / `engine.test.ts`）
- `docs/spec/clock.spec.md` 新規作成

**Tone.js 導入で得られた恩恵:**
- BPM変更時のリセット問題 → 解決済み
- MIDI Clock受信 → 外部音源と同期（Phase 2）
- 将来の音生成 → そのまま拡張できる
- スケジューラ精度 → AudioContext ベースで高精度
- TAP TEMPO → Tone.js に組み込み済み

### GeoParamAddress 導入
- `src/application/schema/geoParamAddress.ts` 新規作成
  - `GeoParamAddress = 'geo://layer-1/icosphere/scale'` 形式
  - `toGeoParamAddress()` / `parseGeoParamAddress()` / `isGeoParamAddress()`
- `RegisteredParameterWithCC` に `geoParamAddress` フィールド追加
- `MacroAssign.paramId` → `geoParamAddress` に変更
- `ParameterStore` に `delete()` メソッド追加
- `engine.ts` の `initTransportRegistry()` で geoParamAddress を付与
- `transportManager.ts` の `store.set()` を GeoParamAddress キーに変更
- `assignRegistry.ts` の `removeAssign()` を geoParamAddress ベースに変更
- `MacroWindow` / `Macro8Window` の UI を geoParamAddress 対応に更新
- `docs/spec/geo-param-address.spec.md` 新規作成

**GeoParamAddress 導入の効果:**
- レイヤー間の CC 誤作動を構造的に防止（layerId が Address に含まれる）
- AI 可読性向上（`geo://` プレフィックスで一意識別）
- Sequencer の target 指定が `geoParamAddress` で直接できる
- エンジン非依存（PixiJS 等どのエンジンが来ても Address は変わらない）

---

## アーキテクチャ確定事項（Day73）

### GeoParamAddress の役割
```
ccNumber / paramId → 「玄関（入力の受け口）」として残す
geoParamAddress    → GeoGraphy 内部の唯一の識別子

変換タイミング: engine.ts の initTransportRegistry() のみ
  toGeoParamAddress(layerId, plugin.id, p.id)
```

### BPM クロック設計（Tone.js ベース）
```
Wall Time（実時間）→ Scheduler（将来）→ clock.setTempo() / start() / stop()
Clock（Tone.js）  → getTotalBeats() → Sequencer / LFO（将来）
  currentBar  = Math.floor(total / 4) % 16
  step16th    = Math.floor(total * 4) % 64
  loopPhase   = (total % 64) / 64
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
1. **flushParameterStore() の GeoParamAddress 対応**（未完了）
   - `engine.ts` の `flushParameterStore()` の lookup キーを
     `${entry.layerId}:${entry.ccNumber}` → `entry.geoParamAddress` に変更
   - spec §4-3 参照
2. **Plugin 切り替え時のクリーンアップ**
   - `setLayerPlugin()` で古い GeoParamAddress を ParameterStore から削除
   - `ParameterStore.delete()` は追加済み
3. **Sequencer Window spec 作成**（Phase 16）

---

## 環境メモ

- **ブラウザ確認**: `pnpm dev` → `open http://localhost:5173`（毎回再起動が必要）
- **git commit**: 日本語長文は `.claude/dayN-commit.sh` に書いて `bash` で実行
- **NFC 正規化**: 日本語ファイル編集後は `python3 /Users/shinbigan/nfc_normalize.py`
- **Tone.js テスト**: `vi.mock('tone', ...)` を clock.test.ts / engine.test.ts に追加済み

---

## 次回チャット用スタートプロンプト

```
Day74開始
```
