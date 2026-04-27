# GeoGraphy 引き継ぎメモ｜Day80→Day81｜2026-04-27

## プロジェクト概要
- **アプリ名**: GeoGraphy（Geometry × 地形 × Graph のダブルミーニング）
- **目的**: No-Texture・Plugin 駆動・VJ 向け映像制作 Electron アプリ
- **スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm / Electron 41 / RxJS 7.8.2 / Zustand 5.0.12 / Zod 4.3.6
- **開発スタイル**: SDD × CDD（仕様駆動 × コンパイラ駆動）
- **GitHub**: https://github.com/Pdoomer2026/geography
- **ブランチ**: `refactor/day53-design`
- **プロジェクトルート**: `/Users/shinbigan/geography`

---

## 重要ファイルパス

| ファイル | パス |
|---|---|
| HANDOVER.md | `/Users/shinbigan/geography/HANDOVER.md` |
| CLAUDE.md | `/Users/shinbigan/geography/CLAUDE.md` |
| outputManager.ts | `src/application/orchestrator/outputManager.ts` |
| layerManager.ts | `src/application/orchestrator/layerManager.ts` |
| App.tsx | `src/ui/App.tsx` |
| main.js (Electron) | `electron/main.js` |
| preload.js (Electron) | `electron/preload.js` |
| geoAPI 型定義 | `src/application/schema/geoAPI.d.ts` |
| projectManager | `src/application/adapter/storage/projectManager.ts` |
| recentManager | `src/application/adapter/storage/recentManager.ts` |
| MidiInputWrapper | `src/application/adapter/input/MidiInputWrapper.ts` |
| MidiLearnService | `src/application/registry/midiLearnService.ts` |
| Macro8MidiWindow | `src/ui/components/window/macro-8-window/Macro8MidiWindow.tsx` |
| Macro8Window | `src/ui/components/window/macro-8-window/Macro8Window.tsx` |
| APC40 デバイス仕様 | `docs/spec/devices/apc40mk2.md` |
| MIDI Learn spec | `docs/spec/midi-learn.spec.md` |
| 要件定義書 | `docs/要件定義書_v2.1.md` |
| 実装計画書 | `docs/実装計画書_v3.2.md`（→ v4.1 未作成） |

---

## Day77〜Day80 の完了内容（累積）

### Day77: 要件定義書 v2.1 作成
- 要件定義書 v2.0 → アーカイブ（`docs/archive/2026-04-23_Day77_要件定義書_v2.0.md`）
- 要件定義書 v2.1 新規作成（Day59〜76 の変更を全反映）
  - PixiJS 完全削除
  - opentype.js / GL Transitions → v1 前倒し
  - MixerPlugin / Geometry Launcher → v1 前倒し
  - OSS 公開 → v2 に戻す
  - IAC 追加・YouTube 圧縮・SDK/WASM §39/40 新設
- 実装計画書 v4.0 → アーカイブ（v4.1 は未作成）

### Day78: Electron 薄い鏡化
- `electron/main.js`: `menuOpen()` / `menuSaveAs()` / `menuOpenRecent()` を `sendToRenderer()` のみに変更
- `electron/preload.js`: `onOpen` / `onSaveAs` 引数なし化・`onOpenRecent` 追加・`addRecent` / `getRecent` / `clearRecent` 追加
- `geoAPI.d.ts`: 型定義を薄い鏡化に合わせて更新
- `recentManager.ts` 新規作成（geoAPI の薄いラッパー）
- `App.tsx`: Open / SaveAs / OpenRecent のオーケストレーションを renderer に移管
- 要件定義書 v2.1 §3.3/3.4 更新（「⚠️ 要確認」マーク解除・薄い鏡化原則を追記）
- **タグ**: `day78` push 済み

### Day79: Output Manager 実装
- `outputManager.ts` 新規作成: L1〜L3 の captureStream + layerManager.onStyleChanged
- **タグ**: `day79` push 済み

### Day80: 案C Electron フレームレス Output ウィンドウ + AspectMode
- `electron/main.js` に `setWindowOpenHandler` を追加
  - `frameName === 'GeoGraphy Output'` で `frame: false / alwaysOnTop: true` の BrowserWindow 作成
  - VJ 本番でタイトルバーなしの Output ウィンドウを実現（動作確認済み ✅）
- `outputManager.openOutput()` が `geoAPI` の有無で自動分岐
  - あり → `_openOutputElectron()`（案C: frameless + 自動配置）
  - なし → `_openOutputBrowser()`（案B: 通常 popup）
- Dead code 削除（BroadcastChannel 系）
  - `src/ui/OutputPage.tsx` → `docs/archive/Day80/`
  - `src/application/sync/outputSync.ts` → `docs/archive/Day80/`
  - `src/main.tsx`: `isOutput` 分岐 + OutputPage import 削除
  - `src/ui/App.tsx`: BroadcastChannel useEffect × 2 削除
- `AspectMode` (`contain` / `cover`) トグル実装
  - `outputManager.toggleAspectMode()` / `setAspectMode(mode)` / `getAspectMode()`
  - Output ウィンドウ開放中に `postMessage` で即時反映
  - `App.tsx` の `A` キーでトグル
- **タグ**: `day80` push 済み（コミット 2 本）
- **HEAD**: `d58150c`（AspectMode toggle、day80 タグの 1 コミット先・未タグ）

---

## 現在の状態

- **ブランチ**: `refactor/day53-design`
- **タグ**: `day80` push 済み / HEAD は 1 コミット先（未タグ）
- **テスト**: 129 tests グリーン・tsc エラーゼロ
- **HANDOVER.md**: 本ファイル（Day81 冒頭に更新済み）

### キーバインド一覧（現在）
```
O: Output ウィンドウ 開閉
A: AspectMode toggle (contain/cover)
1: Macro Window（Macro8Window + Macro8MidiWindow 並列中）
3: Mixer Window
4: Camera SimpleWindow
5: Geometry SimpleWindow
6: GeoMonitor
M: MIDI Monitor
P: Preferences
H: 全非表示
S: 全表示
F: 全非表示 + フルスクリーン
```

---

## slot エンコーディング（SSoT: docs/spec/midi-learn.spec.md §slot-encoding）

```
CC 空間（slot 0〜2047）:
  slot = channel * 128 + cc
  ch0, CC48 → slot 48    Track Knob 1
  ch0, CC7  → slot 7     Track Fader 1
  ch1, CC7  → slot 135   Track Fader 2
  ch2, CC7  → slot 263   Track Fader 3

Note 空間（slot 2048〜4095）:
  slot = 2048 + channel * 128 + note
  ch0, Note 82 → slot 2130  Scene Launch 1
  ch0, Note 52 → slot 2100  Clip Stop Track 1
```

## APC40 mk2 推奨マッピング（確定版）

```
Track Knob 1〜8（CC48〜55, ch0） → Macro #1〜8
Track Fader 1〜3（CC7, ch0〜2 → slot 7/135/263） → Mixer Output L1〜L3 ✅実装済み
Device Knob（CC16〜23, ch0〜7） → 8bank × 8knob = 64スロット
Scene Launch 1〜5（Note 82〜86 → slot 2130〜2134） → UI トグル（将来実装）
```

---

## 次回（Day81）やること

### 優先度 高
1. **film / frei-chen の `FX_STACK_ORDER` 未登録警告修正**
   - `src/plugins/fx/` 内の film・frei-chen プラグインに `FX_STACK_ORDER` を追加
   - `[FxStack] Unknown FX id` コンソール警告が出ている

2. **Macro8MidiWindow → Macro8Window 統合**
   - 現在 `App.tsx` で `Macro8Window` と `Macro8MidiWindow` が並列表示中
   - `Macro8MidiWindow.tsx` を `Macro8Window.tsx` として統合し、旧 `Macro8Window.tsx` をアーカイブ

3. **HEAD を day81 タグで完成させる**（本日のセッション終了時）

### 優先度 中
4. **Scene Launch → UI トグル実装**
   - Note-On → `windowMode` トグル
   - `engine.dispatchToLearned()` に `type === 'command'` 分岐追加

5. **MIDI Learn 永続化**
   - `GeoGraphyProject.midiLearnAssigns` への保存・復元

6. **実装計画書 v4.1 新規作成**
   - v3.2 をアーカイブ → `docs/archive/実装計画書_v3.2.md`
   - Day78〜80 の実装内容を反映

### 優先度 低
7. **Sequencer Plugin spec 作成**（Phase 16）

---

## 設計メモ（Day78〜80 確立）

### 2つの薄い鏡
```
【鏡 1】React UI メニュー（開発・Vercel デモ用）
  ボタンクリック → Application 層（projectManager）に直結

【鏡 2】Electron ネイティブメニュー（製品・.dmg 用）
  Menu click → sendToRenderer() のみ
  → App.tsx が geoAPI 経由で Application 層を呼ぶ

2つの鏡が同じ Application 層（projectManager）を参照する
```

### Electron Output ウィンドウ（案C）
```javascript
// electron/main.js
win.webContents.setWindowOpenHandler(({ frameName }) => {
  if (frameName === 'GeoGraphy Output') {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        frame: false,
        titleBarStyle: 'hidden',
        alwaysOnTop: true,
        backgroundColor: '#000000',
      },
    }
  }
  return { action: 'deny' }
})
```

---

## 環境メモ

- **Electron 起動**: `pnpm dev:electron`（`pnpm electron` や `pnpm electron:dev` は不可）
- **ブラウザ確認**: `open http://localhost:5173`（HMR 不可・必ず新規タブ）
- **NFC 正規化**: `python3 /Users/shinbigan/nfc_normalize.py`（日本語ファイル edit 失敗時）
- **コミット（日本語長文）**: `.claude/dayN-commit.txt` に書いて `git commit -F` で実行
- **テスト**: `pnpm test --run 2>&1 | tee .claude/test-latest.txt`
- **Desktop 環境**: Cursor は起動しない。Mac 標準ターミナルを使う

---

## 次回チャット用スタートプロンプト

```
Day82開始
```
