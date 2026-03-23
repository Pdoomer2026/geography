/**
 * FX Plugins バレルエクスポート
 * FxStack に登録する全 10 FX Plugin をまとめてエクスポートする。
 */

export { afterImagePlugin }   from './after-image'
export { feedbackPlugin }     from './feedback'
export { bloomPlugin }        from './bloom'
export { kaleidoscopePlugin } from './kaleidoscope'
export { mirrorPlugin }       from './mirror'
export { zoomBlurPlugin }     from './zoom-blur'
export { rgbShiftPlugin }     from './rgb-shift'
export { crtPlugin }          from './crt'
export { glitchPlugin }       from './glitch'
export { colorGradingPlugin } from './color-grading'

import { afterImagePlugin }   from './after-image'
import { feedbackPlugin }     from './feedback'
import { bloomPlugin }        from './bloom'
import { kaleidoscopePlugin } from './kaleidoscope'
import { mirrorPlugin }       from './mirror'
import { zoomBlurPlugin }     from './zoom-blur'
import { rgbShiftPlugin }     from './rgb-shift'
import { crtPlugin }          from './crt'
import { glitchPlugin }       from './glitch'
import { colorGradingPlugin } from './color-grading'
import type { FXPlugin } from '../../types'

/** FX_STACK_ORDER 順で全プラグインを返す */
export function getAllFxPlugins(): FXPlugin[] {
  return [
    afterImagePlugin,
    feedbackPlugin,
    bloomPlugin,
    kaleidoscopePlugin,
    mirrorPlugin,
    zoomBlurPlugin,
    rgbShiftPlugin,
    crtPlugin,
    glitchPlugin,
    colorGradingPlugin,
  ]
}
