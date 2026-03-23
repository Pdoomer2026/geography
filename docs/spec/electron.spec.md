# Electron Spec

> SSoT: このファイル
> 担当エージェント: Claude Code
> 状態: ⬜ Day22 壁打ち完了・実装は今後

---

## 1. 採用理由

GeoGraphy は Electron アプリとして配布する。

| 比較 | Web ホスティング | Electron |
|---|---|---|
| サーバー | 必要 | **不要** |
| 配布方法 | URL | **.dmg / .exe をダウンロード** |
| ファイル操作 | ブラウザ制限あり | **Node.js fs で自由** |
| プラグイン追加 | 困難 | **外部フォルダをスキャン可能** |

---

## 2. 技術構成

既存の Vite + React + Three.js はそのまま使う。Electron は外側に被せるだけ。

```
geography/
  electron/
    main.js       ← メインプロセス（ウィンドウ生成・ファイルアクセス）
    preload.js    ← レンダラーと main の橋渡し（IPC）
  src/            ← 既存コードそのまま
  dist/           ← pnpm build の出力先
```

---

## 3. プラグインの外部化（段階的導入）

### v1（現状）
```
src/plugins/ 内の固定プラグインのみ
```

### v2（Electron 化後）
```
~/Documents/GeoGraphy/plugins/ をスキャン
→ ユーザーがフォルダにプラグインを手動追加
→ 起動時に自動認識
```

### v3（将来）
```
Preferences > Plugins タブ → プラグインストア
→ [追加] ボタン1クリックでインストール
→ 裏側: GitHub / ストアサーバーからダウンロード → v2 と同じフォルダに配置
```

**v3 は v2 の「ダウンロード処理」を追加するだけ。アーキテクチャの変更なし。**

---

## 4. ファイルアクセス（IPC 経由）

Electron では renderer（React）から直接 fs を使えない。
preload.js 経由で安全に公開する。

```typescript
// preload.js
contextBridge.exposeInMainWorld('geoAPI', {
  saveFile: (path, data) => ipcRenderer.invoke('save-file', path, data),
  loadFile: (path) => ipcRenderer.invoke('load-file', path),
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
})

// React 側
window.geoAPI.saveFile('project.geography', JSON.stringify(data))
```

---

## 5. 実装優先順位

| フェーズ | 内容 |
|---|---|
| Phase 1 | Electron の骨格追加（main.js / preload.js）・既存機能の動作確認 |
| Phase 2 | プロジェクトファイルの Save / Load（fs 経由） |
| Phase 3 | 外部プラグインフォルダのスキャン対応 |
| Phase 4 | プラグインストア（v3） |

---

## 6. References

- `docs/spec/preferences-panel.spec.md`
- `docs/spec/project-file.spec.md`
