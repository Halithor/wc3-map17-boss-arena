import {Effect} from 'w3ts/index'
import {Vec2} from 'lib/vec2'
import {Angle} from 'lib/angle'

const indicatorModel = 'Doodads\\Cinematic\\GlowingRunes\\GlowingRunes4.mdl'

export class Indicator {
  private _radius: number
  private _pos: Vec2
  private effects: Effect[]

  public constructor(pos: Vec2, radius: number, effectCount: number) {
    this._pos = pos
    this._radius = radius
    this.effects = []
    for (let i = 0; i < effectCount; i++) {
      this.effects[i] = new Effect(indicatorModel, pos.x, pos.y)
      this.effects[i].scale = 0.4
      this.effects[i].setTimeScale(5.0)
    }
    this.updateEffects()
  }

  public get pos(): Vec2 {
    return this._pos
  }

  public set pos(pos: Vec2) {
    this._pos = pos
    this.updateEffects()
  }

  public get radius(): number {
    return this._radius
  }

  public set radius(radius: number) {
    this._radius = radius
    this.updateEffects()
  }

  private updateEffects() {
    this.effects.forEach((effect, index) => {
      const angle = Angle.fromDegrees((360 / this.effects.length) * index)
      const pos = this.pos.polarOffset(angle, this.radius)
      effect.x = pos.x
      effect.y = pos.y
      effect.setYaw(angle.radians)
    })
  }

  public remove() {
    this.effects.forEach((effect) => {
      effect.destroy()
    })
  }
}
