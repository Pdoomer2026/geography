import * as THREE from 'three'

export class GridWaveGeometry {
  private geometry: THREE.PlaneGeometry
  private material: THREE.MeshBasicMaterial
  private mesh: THREE.Mesh

  constructor(segments: number, size: number) {
    this.geometry = new THREE.PlaneGeometry(size, size, segments, segments)
    this.material = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true })
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.mesh.rotation.x = -Math.PI / 2
  }

  update(time: number, params: Record<string, number>): void {
    const { speed, amplitude, frequency, hue } = params
    const positions = this.geometry.attributes.position

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const z = positions.getZ(i)
      const y = Math.sin(x * frequency + time * speed) *
                Math.cos(z * frequency + time * speed) * amplitude
      positions.setZ(i, y)
    }

    positions.needsUpdate = true
    this.geometry.computeVertexNormals()

    // hue 制御（0〜360度）
    if (hue !== undefined) {
      this.material.color.setHSL(hue / 360, 1, 0.5)
    }
  }

  getMesh(): THREE.Mesh {
    return this.mesh
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }
}
