import * as THREE from 'three'

/**
 * HexGridGeometry
 * 六角形タイルを cols×rows 配置し、各タイルの高さを時間・sin で変動させる。
 * 空撮カメラ（上から見下ろし）で都市・基板感が出る。
 */
export class HexGridGeometry {
  private group: THREE.Group
  private material: THREE.MeshBasicMaterial
  private meshes: THREE.Mesh[] = []
  private offsets: number[] = []   // 各セルのアニメーション位相オフセット

  constructor(cols: number, rows: number, hexSize: number, hue: number) {
    this.group = new THREE.Group()
    this.material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(hue / 360, 1.0, 0.5),
      wireframe: true,
    })
    this.buildGrid(cols, rows, hexSize)
  }

  private buildGrid(cols: number, rows: number, hexSize: number): void {
    // 既存メッシュをクリア
    for (const mesh of this.meshes) {
      this.group.remove(mesh)
      mesh.geometry.dispose()
    }
    this.meshes = []
    this.offsets = []

    const w = hexSize * Math.sqrt(3)
    const h = hexSize * 2

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * w + (row % 2 === 0 ? 0 : w / 2)
        const z = row * h * 0.75

        // 六角形プリズム（CylinderGeometry で代用：6角柱）
        const geo = new THREE.CylinderGeometry(hexSize * 0.95, hexSize * 0.95, 0.1, 6)
        const mesh = new THREE.Mesh(geo, this.material)
        mesh.position.set(
          x - (cols * w) / 2,
          0,
          z - (rows * h * 0.75) / 2,
        )
        this.group.add(mesh)
        this.meshes.push(mesh)
        // ランダムな位相オフセット（各セルが別々のタイミングで上下する）
        this.offsets.push(Math.random() * Math.PI * 2)
      }
    }
  }

  update(time: number, params: Record<string, number>): void {
    const { speed, maxHeight, hue } = params
    ;(this.material.color as THREE.Color).setHSL(hue / 360, 1.0, 0.5)

    for (let i = 0; i < this.meshes.length; i++) {
      const t = time * speed + this.offsets[i]
      const y = (Math.sin(t) * 0.5 + 0.5) * maxHeight
      this.meshes[i].position.y = y
      // 高さに応じてスケールも少し変える（上がるほど細く）
      const scale = 1.0 - y / (maxHeight + 1) * 0.3
      this.meshes[i].scale.set(scale, 1, scale)
    }
  }

  getGroup(): THREE.Group {
    return this.group
  }

  dispose(): void {
    for (const mesh of this.meshes) {
      mesh.geometry.dispose()
    }
    this.material.dispose()
    this.meshes = []
  }
}
