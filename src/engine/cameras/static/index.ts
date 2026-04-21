import * as THREE from 'three'
import type { CameraPlugin } from '../../../application/schema'

/**
 * StaticCameraPlugin ファクトリ
 * spec: docs/spec/camera-plugin.spec.md §3-C
 */
export function createStaticCameraPlugin(): CameraPlugin {
  let _camera: THREE.PerspectiveCamera | null = null

  return {
    id: 'static-camera',
    name: 'Static Camera',
    renderer: 'threejs',
    enabled: true,
    params: {
      posX:    { value: 0,  min: -50, max: 50, label: 'Pos X' },
      posY:    { value: 8,  min: -50, max: 50, label: 'Pos Y' },
      posZ:    { value: 12, min: -50, max: 50, label: 'Pos Z' },
      lookAtX: { value: 0,  min: -50, max: 50, label: 'LookAt X' },
      lookAtY: { value: 0,  min: -50, max: 50, label: 'LookAt Y' },
      lookAtZ: { value: 0,  min: -50, max: 50, label: 'LookAt Z' },
    },

    getParameters() {
      return Object.entries(this.params).map(([id, p]) => ({
        id, name: p.label, min: p.min, max: p.max,
        step: (p.max - p.min) / 100,
      }))
    },

    mount(cam: THREE.PerspectiveCamera, _renderer: THREE.WebGLRenderer): void {
      _camera = cam
      _camera.position.set(
        this.params.posX.value,
        this.params.posY.value,
        this.params.posZ.value,
      )
      _camera.lookAt(
        this.params.lookAtX.value,
        this.params.lookAtY.value,
        this.params.lookAtZ.value,
      )
    },

    update(_delta: number): void {
      if (!_camera) return
      _camera.position.set(
        this.params.posX.value,
        this.params.posY.value,
        this.params.posZ.value,
      )
      _camera.lookAt(
        this.params.lookAtX.value,
        this.params.lookAtY.value,
        this.params.lookAtZ.value,
      )
    },

    dispose(): void {
      _camera = null
    },
  }
}

export default createStaticCameraPlugin
