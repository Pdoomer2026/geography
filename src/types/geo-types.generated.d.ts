/**
 * geo-types.generated.d.ts
 * ⚠️  自動生成ファイル — 手動編集禁止
 *
 * 生成元: docs/spec/cc-mapping.md
 * 生成日: 2026-04-15T04:26:43.906Z
 * 生成コマンド: pnpm gen:types
 *
 * このファイルを再生成するには:
 *   pnpm gen:all   (cc-map.json + geo-types.generated.d.ts を同時更新)
 *   pnpm gen:types (このファイルのみ更新)
 */

// ============================================================
// Plugin ID ユニオン型
// ============================================================

/** Geometry Plugin の ID */
export type GeometryPluginId = 'icosphere' | 'torus' | 'torusknot' | 'contour' | 'hex-grid' | 'grid-tunnel' | 'grid-wave'

/** FX Plugin の ID */
export type FxPluginId = 'bloom（X=1）' | 'after-image（X=2）' | 'feedback（X=3）' | 'color-grading（X=4）' | 'glitch（X=5）' | 'kaleidoscope（X=6）' | 'rgb-shift（X=7）' | 'zoom-blur（X=8）' | 'mirror（X=9）' | 'crt（X=0）' | 'film（X=0）' | 'frei-chen（X=0）'

/** Particle Plugin の ID */
export type ParticlePluginId = 'starfield'

/** 全 Plugin ID のユニオン */
export type PluginId = GeometryPluginId | FxPluginId | ParticlePluginId

// ============================================================
// ParamIdOf<T> — pluginId から有効な paramId を取得
// ============================================================

/**
 * useParam / useAllParams の結果を絞り込む条件型。
 * IDE 補完で「このプラグインのどのパラメータか」を確認できる。
 *
 * @example
 *   type IcoParams = ParamIdOf<'icosphere'>
 *   // => 'radius' | 'detail' | 'speed' | 'hue'
 */
export type ParamIdOf<T extends PluginId> =
  T extends 'icosphere' ? 'radius' | 'detail' | 'speed' | 'hue' :
  T extends 'torus' ? 'radius' | 'tube' | 'tubularSegs' | 'radialSegs' | 'speed' | 'hue' :
  T extends 'torusknot' ? 'radius' | 'tube' | 'tubularSegs' | 'radialSegs' | 'p' | 'q' | 'speed' | 'hue' :
  T extends 'contour' ? 'size' | 'segments' | 'speed' | 'amplitude' | 'scale' | 'hue' :
  T extends 'hex-grid' ? 'hexSize' | 'cols' | 'rows' | 'speed' | 'maxHeight' | 'hue' :
  T extends 'grid-tunnel' ? 'radius' | 'segments' | 'rings' | 'speed' | 'length' | 'hue' :
  T extends 'grid-wave' ? 'size' | 'segments' | 'speed' | 'amplitude' | 'frequency' | 'hue' | 'posX' | 'posY' | 'posZ' | 'lookAtX' | 'lookAtY' | 'lookAtZ' | 'radius' | 'autoRotate' | 'height' :
  T extends 'bloom（X=1）' ? 'strength' | 'radius' | 'threshold' :
  T extends 'after-image（X=2）' ? 'damp' :
  T extends 'feedback（X=3）' ? 'amount' | 'decay' | 'offsetX' | 'offsetY' :
  T extends 'color-grading（X=4）' ? 'saturation' | 'brightness' | 'contrast' :
  T extends 'glitch（X=5）' ? 'goWild' | 'interval' :
  T extends 'kaleidoscope（X=6）' ? 'segments' | 'angle' :
  T extends 'rgb-shift（X=7）' ? 'amount' | 'angle' :
  T extends 'zoom-blur（X=8）' ? 'strength' :
  T extends 'mirror（X=9）' ? 'horizontal' :
  T extends 'crt（X=0）' ? 'scanlineIntensity' | 'curvature' :
  T extends 'film（X=0）' ? 'intensity' | 'grayscale' :
  T extends 'frei-chen（X=0）' ? 'width' | 'height' :
  T extends 'starfield' ? 'size' | 'opacity' | 'count' | 'speed' | 'depth' :
  string

// ============================================================
// CcNumberOf — pluginId + paramId から CC番号を取得
// ============================================================

/**
 * pluginId と paramId から CC番号を型安全に取得する定数オブジェクトの型。
 * Sequencer / LFO のレーン設定でハードコードを避けるために使う。
 *
 * @example
 *   const cc = GEO_CC_MAP['icosphere']['radius']  // => 11101
 */
export interface GeoParamMeta {
  ccNumber: number
  pluginMin: number
  pluginMax: number
  block: string
  blockName: string
}

export type GeoParamMap = {
  'icosphere': {
    'radius': GeoParamMeta
    'detail': GeoParamMeta
    'speed': GeoParamMeta
    'hue': GeoParamMeta
  }
  'torus': {
    'radius': GeoParamMeta
    'tube': GeoParamMeta
    'tubularSegs': GeoParamMeta
    'radialSegs': GeoParamMeta
    'speed': GeoParamMeta
    'hue': GeoParamMeta
  }
  'torusknot': {
    'radius': GeoParamMeta
    'tube': GeoParamMeta
    'tubularSegs': GeoParamMeta
    'radialSegs': GeoParamMeta
    'p': GeoParamMeta
    'q': GeoParamMeta
    'speed': GeoParamMeta
    'hue': GeoParamMeta
  }
  'contour': {
    'size': GeoParamMeta
    'segments': GeoParamMeta
    'speed': GeoParamMeta
    'amplitude': GeoParamMeta
    'scale': GeoParamMeta
    'hue': GeoParamMeta
  }
  'hex-grid': {
    'hexSize': GeoParamMeta
    'cols': GeoParamMeta
    'rows': GeoParamMeta
    'speed': GeoParamMeta
    'maxHeight': GeoParamMeta
    'hue': GeoParamMeta
  }
  'grid-tunnel': {
    'radius': GeoParamMeta
    'segments': GeoParamMeta
    'rings': GeoParamMeta
    'speed': GeoParamMeta
    'length': GeoParamMeta
    'hue': GeoParamMeta
  }
  'grid-wave': {
    'size': GeoParamMeta
    'segments': GeoParamMeta
    'speed': GeoParamMeta
    'amplitude': GeoParamMeta
    'frequency': GeoParamMeta
    'hue': GeoParamMeta
    'posX': GeoParamMeta
    'posY': GeoParamMeta
    'posZ': GeoParamMeta
    'lookAtX': GeoParamMeta
    'lookAtY': GeoParamMeta
    'lookAtZ': GeoParamMeta
    'radius': GeoParamMeta
    'autoRotate': GeoParamMeta
    'height': GeoParamMeta
  }
  'bloom（X=1）': {
    'strength': GeoParamMeta
    'radius': GeoParamMeta
    'threshold': GeoParamMeta
  }
  'after-image（X=2）': {
    'damp': GeoParamMeta
  }
  'feedback（X=3）': {
    'amount': GeoParamMeta
    'decay': GeoParamMeta
    'offsetX': GeoParamMeta
    'offsetY': GeoParamMeta
  }
  'color-grading（X=4）': {
    'saturation': GeoParamMeta
    'brightness': GeoParamMeta
    'contrast': GeoParamMeta
  }
  'glitch（X=5）': {
    'goWild': GeoParamMeta
    'interval': GeoParamMeta
  }
  'kaleidoscope（X=6）': {
    'segments': GeoParamMeta
    'angle': GeoParamMeta
  }
  'rgb-shift（X=7）': {
    'amount': GeoParamMeta
    'angle': GeoParamMeta
  }
  'zoom-blur（X=8）': {
    'strength': GeoParamMeta
  }
  'mirror（X=9）': {
    'horizontal': GeoParamMeta
  }
  'crt（X=0）': {
    'scanlineIntensity': GeoParamMeta
    'curvature': GeoParamMeta
  }
  'film（X=0）': {
    'intensity': GeoParamMeta
    'grayscale': GeoParamMeta
  }
  'frei-chen（X=0）': {
    'width': GeoParamMeta
    'height': GeoParamMeta
  }
  'starfield': {
    'size': GeoParamMeta
    'opacity': GeoParamMeta
    'count': GeoParamMeta
    'speed': GeoParamMeta
    'depth': GeoParamMeta
  }
}
