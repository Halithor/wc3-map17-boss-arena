import {Rectangle, Destructable} from 'w3ts/index'
import {Vec2} from './vec2'

export function forDestructablesInRect(
  rect: Rectangle,
  callback: (Destructable) => void
) {
  EnumDestructablesInRectAll(rect.handle, () => {
    callback(Destructable.fromHandle(GetEnumDestructable()))
  })
}

export function forDestructablesInCircle(
  pos: Vec2,
  radius: number,
  callback: (Destructable) => void
) {
  const r = new Rectangle(
    pos.x - radius,
    pos.y - radius,
    pos.x + radius,
    pos.y + radius
  )
  const radiusSq = radius * radius
  forDestructablesInRect(r, (d: Destructable) => {
    const dPos = new Vec2(d.x, d.y)
    if (dPos.distanceToSq(pos) < radiusSq) {
      callback(d)
    }
  })
}
