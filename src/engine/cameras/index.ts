import type { CameraPlugin } from '../../types'

/**
 * Camera Plugin ファクトリ登録
 *
 * 各プラグインファイルは `() => CameraPlugin` 型のファクトリ関数を
 * default export している。
 * getCameraPlugin() は毎回ファクトリを呼んで独立したインスタンスを返す。
 * これにより各レイヤーが独立したクロージャ（camera/controls/angle）を持てる。
 *
 * spec: docs/spec/camera-plugin.spec.md §7
 */

type CameraFactory = () => CameraPlugin

const modules = import.meta.glob('./*/index.ts', { eager: true })

const cameraFactories: Map<string, CameraFactory> = new Map()

for (const mod of Object.values(modules)) {
  const factory = (mod as { default: CameraFactory }).default
  // ファクトリを呼んで id を取得し、Map に登録
  const sample = factory()
  cameraFactories.set(sample.id, factory)
}

/**
 * Camera Plugin の新しいインスタンスを生成して返す。
 * 呼ぶたびに独立したクロージャ（_camera/_controls/_angle）を持つ新インスタンスになる。
 */
export function getCameraPlugin(id: string): CameraPlugin | undefined {
  return cameraFactories.get(id)?.()
}

/**
 * 登録されている全 Camera Plugin の名前・ID 一覧。
 * UI（ドロップダウン）用にインスタンスを返す（params はデフォルト値）。
 */
export function listCameraPlugins(): CameraPlugin[] {
  return Array.from(cameraFactories.values()).map((f) => f())
}
