import {Vec2} from './vec2'
import {Angle} from './angle'

export function flashEffect(
  path: string,
  pos: Vec2,
  scale?: number,
  angle?: Angle
) {
  let e = AddSpecialEffect(path, pos.x, pos.y)
  if (scale) {
    BlzSetSpecialEffectScale(e, scale)
  }
  if (angle) {
    BlzSetSpecialEffectYaw(e, angle.radians)
  }
  DestroyEffect(e)
}
