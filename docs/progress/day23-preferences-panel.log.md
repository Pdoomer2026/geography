# Day23 Preferences Panel + Plugin Lifecycle 実装ログ

## 2026-03-23

### Step 1: PreferencesPanel.tsx 新規作成
- `src/ui/PreferencesPanel.tsx` 作成
- タブ UI（Setup / Project / Plugins / Audio / MIDI / Output）
- Setup タブ: Geometry チェックリスト（engine.getRegisteredPlugins() から取得） + FX チェックリスト + [APPLY]
- Project タブ: Save / Load / Save As（LocalStorage v1 実装）・最近のファイル履歴（最大5件）
- Plugins / Audio / MIDI / Output: Coming Soon

### Step 2: App.tsx 更新
- ⚙ ボタン追加（left:8, top:8・常時表示・H キーでも消えない・z-index:300）
- P キーで PreferencesPanel 開閉トグル
- F キー時に prefsOpen も false に
- ヒント表示に `P:Prefs` を追加

### Step 3: Plugin Lifecycle 実装（spec: plugin-lifecycle.spec.md §6）
- `src/types/index.ts`: `IFxStack` に `applySetup(enabledIds, composer)` 追加
- `src/core/fxStack.ts`: `applySetup()` 実装
  - 全プラグイン destroy()（VRAM 解放）
  - composer.passes から RenderPass だけ残して残りを削除
  - enabledIds のプラグインだけ FX_STACK_ORDER 順で create()
- `src/core/layerManager.ts`: `applyFxSetup(enabledIds)` 追加（全レイヤーに適用）
- `src/core/engine.ts`: `applyFxSetup(enabledIds)` を公開
- `src/ui/PreferencesPanel.tsx`: handleApply を `engine.applyFxSetup(enabledIds)` に変更

### 完了条件
- [x] pnpm tsc --noEmit PASS（型エラーゼロ）
- [x] pnpm test --run 90 tests グリーン（変化なし）
- [x] ブラウザ動作確認
  - ⚙ ボタン・P キー開閉 ✅
  - Setup タブ: Bloom チェック外し → APPLY → FX Controls の Bloom が OFF に ✅
  - APPLY 後ビジュアル変化（Bloom なしのシャープな描画）✅
  - Plugin Lifecycle: destroy() → dispose() → VRAM 解放 ✅
