# GeoGraphy 引き継ぎメモ｜Day63（Standard Window + Preferences 全面刷新）｜2026-04-15

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry×地形×Graph のダブルミーニング）
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応の映像制作プラットフォーム
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+ / Electron 41
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **ブランチ**: `refactor/day53-design`
- **プロジェクトルート**: `/Users/shinbigan/geography`

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| CLAUDE.md（全体方針） | `CLAUDE.md` |
| CC Mapping（SSoT） | `docs/spec/cc-mapping.md`（v0.5） |
| CC Mapping Guide | `docs/spec/cc-mapping-guide.md`（v1.0） |
| CC Map JSON（自動生成） | `settings/cc-map.json` |
| WindowMode 型 | `src/types/windowMode.ts` |
| Engine | `src/core/engine.ts` |
| App.tsx | `src/ui/App.tsx` |
| PreferencesPanel | `src/ui/panels/preferences/PreferencesPanel.tsx` |
| GeometryStandardWindow | `src/plugins/windows/standard-window/GeometryStandardWindow.tsx` |
| CameraStandardWindow | `src/plugins/windows/standard-window/CameraStandardWindow.tsx` |
| FxStandardWindow | `src/plugins/windows/standard-window/FxStandardWindow.tsx` |
| RangeSlider | `src/plugins/windows/standard-window/RangeSlider.tsx` |
| GeometrySimpleWindow | `src/plugins/windows/simple-window/GeometrySimpleWindow.tsx` |
| CameraSimpleWindow | `src/plugins/windows/simple-window/CameraSimpleWindow.tsx` |
| FxSimpleWindow | `src/plugins/windows/simple-window/FxSimpleWindow.tsx` |
| MacroWindow | `src/plugins/windows/macro-window/MacroWindow.tsx` |
| GeoMonitorWindow | `src/plugins/windows/geo-monitor/GeoMonitorWindow.tsx` |
| 引き継ぎ（最新） | `docs/handover/day63-2026-04-15.md` |

---

## 現在の状態

- **ブランチ**: `refactor/day53-design`
- **タグ**: `day63`
- **最新コミット**: `3394276`
- **テスト**: 127 tests グリーン・tsc エラーゼロ

---

## 確定したアーキテクチャ（Day63 時点）

### Window 階層
```
Simple Window   → パラメータ表示・操作（min〜maxフル範囲）
Standard Window → パラメータ表示・操作 + lo/hi 稼働幅制限
（将来）D&D Window → MacroKnob アサイン用
```

### WindowMode 管理（App.tsx）
```typescript
windowMode: {
  geometry: 'none' | 'simple' | 'standard'
  camera:   'none' | 'simple' | 'standard'
  fx:       'none' | 'simple' | 'standard'
  macro:    'none' | 'macro-window'
  mixer:    'none' | 'mixer-simple'
  monitor:  boolean
}
```

### Preferences レイアウト
```
PRESETS → WINDOWS（ドロップダウン）→ [L1/L2/L3] → SETUP → Macro/Mixer → Monitor(debug)
```

### キーバインド
```
1: Macro トグル
3: Mixer トグル
6: Monitor トグル
P: Preferences
H: 全非表示
S: 全表示（DEFAULT_WINDOW_MODE）
F: 全非表示 + 全画面
```

### コアアーキテクチャ
```
MidiInputWrapper → TransportEvent → engine.handleMidiCC()
  → TransportManager → AssignRegistry → ParameterStore
  → engine.flushParameterStore() → TransportRegistry → Plugin.params
```

### SDK 境界
```
【公開】engine.handleMidiCC() / getParameters() / getParametersLive()
       engine.onRegistryChanged() / onFxChanged()
       useParam() / useAllParams() Hook
【非公開】TransportRegistry / AssignRegistry / TransportManager
```

---

## 次回やること

1. **Sequencer Window spec 検討**（Phase 16）
2. **LICENSE ファイル追加**（OSS 公開直前）

---

## 環境メモ

- **ブラウザ確認**: `pnpm dev` → `open http://localhost:5173`（毎回再起動が必要）
- **NFC 正規化スクリプト**: `/Users/shinbigan/nfc_normalize.py`
- **git commit メッセージ**: 日本語長文は `.claude/dayN-commit.txt` に書いて `git commit -F`
- **write_file ルール**: 既存ファイルには使わない（edit_file を使う）
- **gen:cc-map**: cc-mapping.md 編集後は必ず `pnpm gen:all` を実行

---

## 次回チャット用スタートプロンプト

```
Day64開始
```
