/**
 * FX Plugins バレルエクスポート
 * FxStack に登録する全 12 FX Plugin をまとめてエクスポートする。
 */

// クラスエクスポート（レイヤーごとに独立したインスタンスを生成するため）
export { AfterImagePlugin }    from './after-image'
export { FeedbackPlugin }      from './feedback'
export { BloomPlugin }         from './bloom'
export { KaleidoscopePlugin }  from './kaleidoscope'
export { MirrorPlugin }        from './mirror'
export { ZoomBlurPlugin }      from './zoom-blur'
export { RGBShiftPlugin }      from './rgb-shift'
export { CRTPlugin }           from './crt'
export { GlitchPlugin }        from './glitch'
export { ColorGradingPlugin }  from './color-grading'
export { FilmPlugin }          from './film'
export { FreiChenPlugin }      from './frei-chen'

// シングルトン（テスト・外部参照用に残す）
export { afterImagePlugin }    from './after-image'
export { feedbackPlugin }      from './feedback'
export { bloomPlugin }         from './bloom'
export { kaleidoscopePlugin }  from './kaleidoscope'
export { mirrorPlugin }        from './mirror'
export { zoomBlurPlugin }      from './zoom-blur'
export { rgbShiftPlugin }      from './rgb-shift'
export { crtPlugin }           from './crt'
export { glitchPlugin }        from './glitch'
export { colorGradingPlugin }  from './color-grading'
export { filmPlugin }          from './film'
export { freiChenPlugin }      from './frei-chen'

import { AfterImagePlugin }    from './after-image'
import { FeedbackPlugin }      from './feedback'
import { BloomPlugin }         from './bloom'
import { KaleidoscopePlugin }  from './kaleidoscope'
import { MirrorPlugin }        from './mirror'
import { ZoomBlurPlugin }      from './zoom-blur'
import { RGBShiftPlugin }      from './rgb-shift'
import { CRTPlugin }           from './crt'
import { GlitchPlugin }        from './glitch'
import { ColorGradingPlugin }  from './color-grading'
import { FilmPlugin }          from './film'
import { FreiChenPlugin }      from './frei-chen'
import type { FXPlugin } from '../../types'

/**
 * 毎回新しいインスタンスを生成して返す。
 * レイヤーごとに独立した FX を持たせるために使う（engine.ts 専用）。
 * FX_STACK_ORDER 順で返す。
 */
export function createFxPlugins(): FXPlugin[] {
  return [
    new AfterImagePlugin(),
    new FeedbackPlugin(),
    new BloomPlugin(),
    new KaleidoscopePlugin(),
    new MirrorPlugin(),
    new ZoomBlurPlugin(),
    new RGBShiftPlugin(),
    new CRTPlugin(),
    new GlitchPlugin(),
    new ColorGradingPlugin(),
    new FilmPlugin(),
    new FreiChenPlugin(),
  ]
}
