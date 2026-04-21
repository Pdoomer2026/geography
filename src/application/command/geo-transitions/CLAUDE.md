# src/application/command/geo-transitions - CLAUDE.md

## 役割

Mixer Plugin のプルダウンメニューで選択されるトランジション処理を担当する。

**UI を持たない・処理のみ。SceneState を受け取り変形するだけ。**

---

## Transition Plugin Interface

```typescript
interface TransitionPlugin extends PluginBase {
  duration: number
  category: 'pixel' | 'parameter' | 'bpm'
  execute(
    from: SceneState,
    to: SceneState,
    progress: number  // 0.0 → 1.0
  ): SceneState  // 副作用なし・純粋関数
  preview: string  // Mixer のプルダウン表示用テキスト
}
```

---

## v1 実装プラグイン（最小・自走できるもの）

| Plugin 名 | カテゴリ | 説明 | 実装コスト |
|---|---|---|---|
| beat-cut | BPM同期 | 拍の頭でスパッと切り替え・Tempo Driver と連携 | 低 |
| crossfade | parameter | opacity を 0→1 に変化・シェーダー不要 | 低 |

---

## v2 以降の Transition Plugin

| Plugin 名 | カテゴリ | バージョン |
|---|---|---|
| GL Transitions 移植（厳選10種） | ピクセル | v2 |
| bar-fade | BPM同期 | v2 |
| geometry-morph | パラメーター | v3 |
| fx-morph | パラメーター | v3 |
| camera-sweep | パラメーター | v3 |
| full-morph | パラメーター | v3 |
| phrase-morph | BPM同期 | v3 |
| drop-trigger | BPM同期 | v3 |

---

## ファイル構成

```
src/application/command/geo-transitions/[name]/
├── index.ts         ← TransitionPlugin export
├── [Name].ts        ← トランジションロジック
├── CLAUDE.md        ← 各トランジション固有の実装ヒント
└── README.md        ← コントリビューター向け説明
```

---

## 実装ルール

1. **UI を持たない** → React コンポーネントを含めない
2. **SceneState のみ操作する** → Three.js オブジェクトに直接触れない
3. `execute()` は progress（0.0〜1.0）に応じた状態を返す
4. `duration` はミリ秒単位
5. `category` を必ず正しく設定する（Mixer の UI 表示に使用）

---

## Beat Cut の実装例

```typescript
export const beatCutTransition: TransitionPlugin = {
  id: 'beat-cut',
  name: 'Beat Cut',
  renderer: 'threejs',
  enabled: true,
  duration: 0,  // 瞬時に切り替え
  category: 'bpm',
  preview: '拍の頭でスパッと切り替え',
  execute(from, to, progress) {
    // progress >= 1.0 で to の状態を適用
    // Tempo Driver から beat タイミングを受け取る
  }
}
```

---

## 注意事項

- Transition Plugin は Mixer Plugin から呼び出される・直接エンジンに触れない
- GL Transitions の移植は v2 から・v1 は Beat Cut + CrossFade のみ
- コントリビューターは新しいトランジションを追加できる（PR 歓迎）
