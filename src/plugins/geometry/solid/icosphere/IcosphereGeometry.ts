import * as THREE from 'three'

export class IcosphereGeometry {
  private geometry: THREE.IcosahedronGeometry
  private material: THREE.MeshBasicMaterial
  private mesh: THREE.Mesh

  constructor(detail: number, radius: number, hue: number) {
    this.geometry = new THREE.IcosahedronGeometry(radius, detail)
    this.material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(hue / 360, 1.0, 0.5),
      wireframe: true,
    })
    this.mesh = new THREE.Mesh(this.geometry, this.material)
  }

  update(_time: number, params: Record<string, number>): void {
    const { speed, hue } = params
    this.mesh.rotation.x += speed * 0.005
    this.mesh.rotation.y += speed * 0.008
    ;(this.material.color as THREE.Color).setHSL(hue / 360, 1.0, 0.5)
  }

  getMesh(): THREE.Mesh {
    return this.mesh
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }
}
