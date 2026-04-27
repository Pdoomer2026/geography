# GeoGraphy 引き継ぎメモ｜Day81→Day82｜2026-04-27

## プロジェクト概要
- **アプリ名**: GeoGraphy（No-Texture Plugin 駆動 VJ アプリ）
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm / Electron / Zod
- **開発スタイル**: SDD × CDD
- **GitHub**: https://github.com/Pdoomer2026/geography
- **ブランチ**: `feature/inspector-ui`（ベース: `refactor/day53-design`）
- **タグ**: `day81` push 済み
- **テスト**: 129 tests グリーン・tsc エラーゼロ

---

## Day81 完了内容

- Phase 1: LayerPreset / LayerInstance / LayerRuntime 型定義 + Zod スキーマ
- Phase 2: layerManager ダブルバッファ（replaceLayerPreset）
- Phase 3: Inspector UI（右固定パネル・Mixer タブ・Layer タブ）
- Phase 4: Preferences に Presets タブ新設
- layerPresetStore.ts 新設（Application 層 SSoT）
- ClipCell 右クリックメニュー（ASSIGN PRESET 階層サブメニュー・Save to Presets・Clear Clip）

---

## Day82 最優先タスク（設計ミス修正）

### 問題
`layerPresetStore.ts` が `window.geoAPI` の有無で分岐しており、保存先が2つ存在する:
- Electron → `~/Documents/GeoGraphy/presets/`（ファイル）
- ブラウザ → `localStorage`

**これは薄い鏡原則に違反する致命的な設計ミス。**

### 正しい設計（Day81 で合意）
```
保存先: localStorage に一本化
Electron も ブラウザも 同じ localStorage を使う

geoAPI の役割:
  showSaveDialog() / showOpenDialog() / saveFile() / loadFile() のみ
  preset:save / preset:list / preset:delete は不要 → 削除

Application 層（layerPresetStore.ts）:
  localStorage のみで完結
  geoAPI の分岐を完全に削除
```

### 修正手順
```
Step 1: layerPresetStore.ts を localStorage 一本化に修正
        window.geoAPI 分岐を削除

Step 2: electron/preload.js から presetSave/presetList/presetDelete を削除
        electron/main.js から preset:save/list/delete IPC ハンドラーを削除
        geoAPI.d.ts から preset 型定義を削除

Step 3: pnpm tsc --noEmit && pnpm test --run

Step 4: コミット
```

---

## 現在のファイル構成

| ファイル | 状態 |
|---|---|
| `src/application/adapter/storage/layerPresetStore.ts` | ⚠️ 要修正（localStorage 一本化）|
| `src/application/schema/zod/layerPreset.schema.ts` | ✅ |
| `src/application/schema/zod/scenePreset.schema.ts` | ✅ |
| `src/application/orchestrator/layerManager.ts` | ✅ ダブルバッファ実装済み |
| `src/ui/components/inspector/Inspector.tsx` | ✅ |
| `src/ui/components/inspector/mixer/ClipGrid.tsx` | ✅ |
| `src/ui/components/inspector/mixer/ClipCell.tsx` | ✅ 右クリックメニュー付き |
| `src/ui/components/inspector/tabs/MixerTab.tsx` | ✅ |
| `src/ui/components/inspector/tabs/LayerTab.tsx` | ✅ |
| `src/ui/components/inspector/layer/panels/` | ✅ 各 Panel |
| `src/ui/panels/preferences/PreferencesPanel.tsx` | ✅ Presets タブ追加済み |
| `electron/main.js` | ⚠️ preset IPC 削除予定 |
| `electron/preload.js` | ⚠️ preset メソッド削除予定 |
| `src/application/schema/geoAPI.d.ts` | ⚠️ preset 型定義削除予定 |

---

## Inspector UI 設計（確定）

```
画面右固定パネル（幅 280px・I キーで開閉）

MIXER タブ（初期表示）:
  3×5 Clip グリッド（Ableton Session View 的）
  空セル クリック → 現在の Layer 状態を Clip 化
  有りセル クリック → replaceLayerPreset（再生）
  右クリック → ASSIGN PRESET（Geometry 名フォルダ階層）/ Save to Presets / Clear Clip
  Scene [▶] → 行全体を同時起動
  Opacity フェーダー × 3 + BlendMode

LAYER タブ:
  L1/L2/L3 タブ + アコーディオン（display:none で非表示・値維持）
  MACRO（デフォルト open）/ GEOMETRY / CAMERA / FX
```

---

## Preset 設計（確定）

```
LayerPreset = Plugin 構成の定義（何を使うか）
  → Geometry 名フォルダで自動分類
  → 将来: Clip（小節数追加）→ Sequencer（時間軸追加）

ScenePreset = 3レイヤー分の LayerPreset の組み合わせ

保存先: localStorage（一本化予定）
キー: geography:layer-presets-v2 / geography:scene-presets-v2
Clip グリッド: geography:clip-grid-v1
```

---

## その後の実装候補（優先度順）

1. **Clip D&D 並び替え**（ClipGrid.tsx のみ変更・dragSource state + drop swap）
2. **Phase 4: 旧 Window 廃止・windowMode 簡素化**（Inspector 安定後）
3. **Mixer 改善**（BlendMode ボタン式・フェードトグル）
4. **APC40 Scene Launch → Clip グリッド MIDI Learn**
5. **AutoLauncher**（ClipSchema.extend({ duration })）
6. **Sequencer**（ClipSchema.extend({ timeline })）

---

## 環境メモ

- 開発: `pnpm dev` → `open http://localhost:5173`
- Electron: `pnpm dev:electron`
- NFC 正規化: `python3 /Users/shinbigan/nfc_normalize.py`
- localStorage クリア（ブラウザ DevTools `Cmd+Option+J`）:
  - `localStorage.removeItem('geography:clip-grid-v1')`
  - `localStorage.removeItem('geography:layer-presets-v2')`
  - `localStorage.removeItem('geography:scene-presets-v2')`

---

## 次回スタートプロンプト

```
Day82開始
```
