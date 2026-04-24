# src/drivers/output - CLAUDE.md

## このフォルダの役割

映像の出力先を管理します。

---

## Output Driver 一覧

| Driver | 方法 | 用途 |
|---|---|---|
| HDMIDriver | ブラウザフルスクリーン | プロジェクター・LED への直接出力 |
| BrowserSourceDriver | localhost:5173 | Resolume Web Browser Source |
| NDI（OBS 経由） | OBS 仮想カメラ | Mac 内連携・ドキュメントで対応 |

---

## BrowserSourceDriver（最重要）

Resolume Arena との連携に使用。

```typescript
// アルファ透過対応（必須）
const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,           // ← アルファ透過を有効化
  antialias: true,
  premultipliedAlpha: false
});
renderer.setClearColor(0x000000, 0); // 背景を透明に
```

Resolume 側の設定：
- Sources → Web Browser → `http://localhost:5173`
- Resolume Arena 7.2 以降

---

## フレームレート

- デフォルト: 60fps
- 将来: 120fps オプション追加予定（v2 以降・1行で対応可能）

---

## 解像度設定

Preferences の Output タブで設定：
- 1280 x 720
- 1920 x 1080（デフォルト）
- 2560 x 1440
- 3840 x 2160（4K）
- Custom
