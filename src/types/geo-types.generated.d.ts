/**
 * geo-types.generated.d.ts
 * ⚠️  自動生成ファイル — 手動編集禁止
 *
 * 生成元: docs/spec/cc-mapping.md
 * 生成日: 2026-04-15T03:08:27.900Z
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
export type FxPluginId = 'bloom' | 'after-image' | 'feedback' | 'color-grading' | 'glitch' | 'kaleidoscope' | 'rgb-shift' | 'zoom-blur' | 'mirror' | 'crt' | 'film' | 'frei-chen'

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
  T extends 'bloom' ? 'strength' | 'radius' | 'threshold' :
  T extends 'after-image' ? 'damp' :
  T extends 'feedback' ? 'amount' | 'decay' | 'offsetX' | 'offsetY' :
  T extends 'color-grading' ? 'saturation' | 'brightness' | 'contrast' :
  T extends 'glitch' ? 'goWild' | 'interval' :
  T extends 'kaleidoscope' ? 'segments' | 'angle' :
  T extends 'rgb-shift' ? 'amount' | 'angle' :
  T extends 'zoom-blur' ? 'strength' :
  T extends 'mirror' ? 'horizontal' :
  T extends 'crt' ? 'scanlineIntensity' | 'curvature' :
  T extends 'film' ? 'intensity' | 'grayscale' :
  T extends 'frei-chen' ? 'width' | 'height' :
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
  'bloom': {
    'strength': GeoParamMeta
    'radius': GeoParamMeta
    'threshold': GeoParamMeta
  }
  'after-image': {
    'damp': GeoParamMeta
  }
  'feedback': {
    'amount': GeoParamMeta
    'decay': GeoParamMeta
    'offsetX': GeoParamMeta
    'offsetY': GeoParamMeta
  }
  'color-grading': {
    'saturation': GeoParamMeta
    'brightness': GeoParamMeta
    'contrast': GeoParamMeta
  }
  'glitch': {
    'goWild': GeoParamMeta
    'interval': GeoParamMeta
  }
  'kaleidoscope': {
    'segments': GeoParamMeta
    'angle': GeoParamMeta
  }
  'rgb-shift': {
    'amount': GeoParamMeta
    'angle': GeoParamMeta
  }
  'zoom-blur': {
    'strength': GeoParamMeta
  }
  'mirror': {
    'horizontal': GeoParamMeta
  }
  'crt': {
    'scanlineIntensity': GeoParamMeta
    'curvature': GeoParamMeta
  }
  'film': {
    'intensity': GeoParamMeta
    'grayscale': GeoParamMeta
  }
  'frei-chen': {
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
