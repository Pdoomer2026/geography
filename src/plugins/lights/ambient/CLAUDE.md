# plugins/lights/ambient - CLAUDE.md

## 実装

```typescript
// plugins/lights/ambient/AmbientLight.ts
import * as THREE from 'three'

export class AmbientLightPlugin implements LightPlugin {
  id = 'ambient'
  name = 'Ambient Light'
  private light: THREE.AmbientLight | null = null

  params = {
    intensity: { value: 0.3, min: 0.0, max: 2.0, step: 0.01 },
    color:     { value: '#ffffff' }
  }

  create(scene: THREE.Scene): void {
    this.light = new THREE.AmbientLight(
      this.params.color.value,
      this.params.intensity.value
    )
    scene.add(this.light)
  }

  update(delta: number, beat: number): void {
    if (!this.light) return
    this.light.intensity = this.params.intensity.value
  }

  destroy(scene: THREE.Scene): void {
    if (this.light) scene.remove(this.light)
    this.light = null
  }
}
```
