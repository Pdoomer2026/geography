# GeoGraphy 引き継ぎメモ｜壁打ちセッション Day4完了〜設計確定｜2026-03-12

## 🔴 次のセッションで最初にやること

1. `git checkout -b docs/v1.7-design-update` でブランチを切る
2. 下記「Day5 着手前にやること」を実行
3. Day5 の本実装タスクに進む

---

## プロジェクト概要
- **アプリ名**: GeoGraphy
- **目的**: No-Texture・Plugin駆動・マルチライブラリ対応のブラウザベース映像制作プラットフォーム
- **技術スタック**: Vite / React 18 / TypeScript / Three.js r160+ / pnpm v10.32+
- **GitHub**: https://github.com/Pdoomer2026/geography
- **開発サーバー**: `pnpm dev`（ポート5173〜5176）
- **最新ドキュメント**: 要件定義書 v1.7 / 実装計画書 v2.5

---

## Day4 完了状態（実装済み）
- `src/core/config.ts` 作成済み（MAX_LAYERS=3 / MAX_UNDO_HISTORY=50 / DEFAULT_BPM=128 / LERP_FACTOR=0.05）
- `src/plugins/lights/ambient/` 実装済み
- `src/plugins/particles/starfield/` 実装済み
- `src/core/registry.ts` 型拡張済み（AnyPlugin = GeometryPlugin | LightPlugin | ParticlePlugin）
- ブラウザで grid-wave + 星空の動作確認 ✅
- GitHub push済み（commit: feat: Day4 - config, AmbientLight plugin, Starfield particle plugin）

---

## 今回の壁打ちで確定した設計

### Plugin の定義と役割（確定版）
| 種類 | 役割 | UI | v1 |
|---|---|---|---|
| Geometry Plugin | 何を描画するか | Window Plugin で操作 | ✅ |
| Particle Plugin | 背景・雰囲気 | Window Plugin で操作 | ✅ |
| FX Plugin | エフェクト | Window Plugin で操作 | ✅ |
| Light Plugin | ライティング | Window Plugin で操作 | ✅ |
| **Mixer Plugin** | Program/Preview の操作UI・フェーダー | それ自体がUI | v1固定→v2Plugin化 |
| **Transition Plugin** | トランジション処理（Mixerのプルダウンで選択） | UIなし・処理のみ | v1最小実装 |
| **Window Plugin** | Geometry・FX・Particle等の専用コントローラーUI | それ自体がUI | ✅ |
| Tempo Driver | テンポ入力 | なし | ✅ |
| Input Driver | デバイス入力 | なし | ✅ |
| Output Driver | 出力先 | なし | ✅ |
| Modulator Driver | パラメーター値の入力源 | なし | ✅ |
| Video Input Driver | 外部映像をレイヤーとして取り込む | なし | v4 |

### エンジン固定部分（Plugin が触れない）
- Parameter Store / Plugin Registry / Command パターン / レンダリングループ / BPM クロック
- **メニューバー**（全Mixer共通・固定）
- **マクロノブパネル**（32ノブ・4列・MIDIとの物理対応があるため固定）

### Program / Preview バス構造（v1から実装）
- **Program バス**: フルサイズ Three.js Scene（実際に出力）
- **Preview バス**: SceneState（JSONのメモ）+ 小キャンバス（320×180・サムネイル確認用）
- 切り替え時: Preview の SceneState → Three.js オブジェクト生成 → Program に昇格 → 旧Program を dispose()
- メモリー増加はほぼゼロ（16GB問題解決済み）

### モニタリングモード
- 通常モード: Program大・Preview小
- 準備モード: Program小・Preview大
- デュアルモニター: モニター1=Program / モニター2=Preview

### SimpleMixer（v1・固定実装）
- **閉じることができない**（常時表示・全Mixer Plugin共通ルール）
- 縦フェーダー × レイヤー数
- Transition Plugin のプルダウン選択
- クロスフェーダー（MIDI フェーダー割り当て可能）
- マクロノブパネルから MIDI 入力を受け付ける

### v1 の Transition Plugin（最小実装・この2つのみ）
- **Beat Cut**: 拍の頭でスパッと切り替え（実装コスト低）
- **CrossFade**: opacity 0→1（実装コスト低）

### SceneState Interface（核心）
```typescript
interface SceneState {
  layers: LayerState[]
}
interface LayerState {
  geometryId: string
  geometryParams: Record<string, number>
  fxStack: FxState[]
  opacity: number
  blendMode: string
}
interface TransitionPlugin extends PluginBase {
  duration: number
  category: 'pixel' | 'parameter' | 'bpm'
  execute(from: SceneState, to: SceneState, progress: number): void
  preview: string
}
interface MixerPlugin {
  id: string
  name: string
  renderer: string
  enabled: boolean
  component: React.FC
}
```

### Geometry ランチャー vs シーケンサー（v2）
| | ランチャー | シーケンサー |
|---|---|---|
| 内容 | エディット済みGeometryを時間軸で順番起動 | パラメーターをBPMで自動変調 |
| 用途 | VJ現場で流しっぱなし | 実験・複雑な変調探求 |
| 実装 | シンプル・v2最初に実装 | v2の開発の中心・締めくくり |

---

## Day5 着手前にやること

1. `geography/CLAUDE.md` にプラットフォーム思想・Mixer Plugin ルールを追記
2. `src/core/CLAUDE.md` にEngine/UI分離・ProgramBus/PreviewBus 設計を追記
3. `src/plugins/geometry/CLAUDE.md` に renderer・enabled フィールドの扱いを追記
4. `src/types/index.ts` の PluginBase に `renderer`・`enabled` を追加
5. 既存 Plugin 3つ（grid-wave / starfield / ambient）に `renderer`・`enabled` を追加
6. `src/types/index.ts` に `SceneState`・`LayerState`・`TransitionPlugin`・`MixerPlugin` の Interface を追加
7. `settings/embeds/` フォルダを作成（空でよい）
8. `src/plugins/transitions/beat-cut/` の空実装を作成

---

## Day5 本実装タスク

1. `src/plugins/geometry/index.ts` — import.meta.glob で Geometry Plugin 自動登録
2. `src/plugins/particles/index.ts` — Particle Plugin 自動登録
3. `src/plugins/lights/index.ts` — Light Plugin 自動登録
4. `tests/core/registry.test.ts` — Plugin 登録・切り替えテスト
5. `tests/core/command.test.ts` — Command の execute / undo / redo テスト
6. GitHub push（commit: feat: Day5 - auto-registration, test foundation）

---

## ロードマップ（確定版）
| バージョン | 主な内容 |
|---|---|
| v1 | Three.js基盤・Plugin/Driver・SimpleMixer・Program/Preview・Beat Cut・CrossFade・マクロノブ・録画・OSS |
| v2 | Geometry ランチャー・Mixer Plugin化・CrossfadeMixer・GL Transitions・Geometry シーケンサー・Embed Export・PixiJS |
| v3 | Full Morph・opentype.js Typography・Spatial Extension（プロジェクションマッピング） |
| v4 | Claude.ai自動トランジション・Video Input Driver（Resolume受信） |
| Browser Bridge | Syphon/Spoutユーティリティ（別プロジェクト・Tauri・GeoGraphy v1完成後） |

---

## 環境メモ・注意点
- pnpm 必須（npm / yarn 不可）
- Three.js r160+ を使用
- SimpleMixer は v1 で固定実装・ただし最初から MixerPlugin Interface に準拠して実装する
- Preview バスの小キャンバス（320×180）は FPS への影響を最初に確認すること
- Browser Bridge は GeoGraphy とは完全に別リポジトリ・別プロジェクト
- **Claude Desktop からプロジェクトフォルダに直接アクセス可能**（CLAUDE.md の更新等に活用）
