import * as THREE from 'three'

export class AmbientLightController {
  private light: THREE.AmbientLight | null = null

  create(scene: THREE.Scene, intensity: number): void {
    this.light = new THREE.AmbientLight(0xffffff, intensity)
    scene.add(this.light)
  }

  update(intensity: number): void {
    if (!this.light) return
    this.light.intensity = intensity
  }

  destroy(scene: THREE.Scene): void {
    if (!this.light) return
    scene.remove(this.light)
    this.light = null
  }
}
