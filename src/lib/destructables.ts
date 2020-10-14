import {DestructableIds} from 'constants'
import {Rectangle, Destructable} from 'w3ts/index'
import {Vec2} from './vec2'

export function forDestructablesInRect(
  rect: Rectangle,
  callback: (d: Destructable) => void
) {
  EnumDestructablesInRectAll(rect.handle, () => {
    callback(Destructable.fromHandle(GetEnumDestructable()))
  })
}

export function forDestructablesInCircle(
  pos: Vec2,
  radius: number,
  callback: (d: Destructable) => void
) {
  // add buffer for AoE
  const adjustedRadius = radius + 40
  const r = new Rectangle(
    pos.x - adjustedRadius,
    pos.y - adjustedRadius,
    pos.x + adjustedRadius,
    pos.y + adjustedRadius
  )
  const radiusSq = radius * radius
  forDestructablesInRect(r, (d: Destructable) => {
    const dPos = new Vec2(d.x, d.y)
    if (dPos.distanceToSq(pos) < radiusSq) {
      callback(d)
    }
  })
  r.destroy()
}

// killDestructablesInCircle kills all destructables, optionally calling the
// passed callback after each kill. Does not remove pathing blockers.
export function killDestructablesInCircle(
  pos: Vec2,
  radius: number,
  callback?: (d: Destructable) => void
) {
  forDestructablesInCircle(pos, radius, (d: Destructable) => {
    if (d.life > 1 && !DestructableIds.isPathingBlocker(d.typeId)) {
      d.kill()
      if (callback) {
        callback(d)
      }
    }
  })
}
