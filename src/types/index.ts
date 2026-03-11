import type * as THREE from 'three'
import type { FC } from 'react'

/** パラメーター1つの定義 */
export interface PluginParam {
  value: number
  min: number
  max: number
  label: string
}

/** ジオメトリプラグイン */
export interface GeometryPlugin {
  id: string
  name: string
  create(scene: THREE.Scene): void
  update(delta: number, beat: number): void
  destroy(scene: THREE.Scene): void
  params: Record<string, PluginParam>
}

/** パーティクルプラグイン */
export interface ParticlePlugin extends GeometryPlugin {}

/** ライトプラグイン */
export interface LightPlugin extends GeometryPlugin {}

/** FXプラグイン */
export interface FXPlugin {
  id: string
  name: string
  create(composer: any): void // EffectComposer は後で型付け
  update(delta: number, beat: number): void
  destroy(): void
  params: Record<string, PluginParam>
}

/** ウィンドウプラグイン */
export interface WindowPlugin {
  id: string
  name: string
  component: FC
}

/** モジュレータードライバー */
export interface ModulatorDriver {
  id: string
  name: string
  getValue(paramId: string): number | null
}
