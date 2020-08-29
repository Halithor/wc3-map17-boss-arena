import {Vec2} from './vec2'
import {Unit, Group} from 'w3ts/index'

const maxCollisionSize = 200.0

export function forUnitsInRange(
  pos: Vec2,
  radius: number,
  callback: (u: Unit) => void,
  collisionSizeFiltering: boolean = false
) {
  const enumGroup = new Group()
  if (collisionSizeFiltering) {
    enumGroup.enumUnitsInRange(pos.x, pos.y, radius + maxCollisionSize, null)
    enumGroup.for(() => {
      const u = Unit.fromHandle(GetEnumUnit())
      if (u.inRange(pos.x, pos.y, radius)) {
        callback(u)
      }
    })
  } else {
    enumGroup.enumUnitsInRange(
      pos.x,
      pos.y,
      radius,
      Filter(() => {
        let u = Unit.fromHandle(GetFilterUnit())
        callback(u)
        return false
      })
    )
  }
  enumGroup.destroy()
}

// Executes a callback on the nearest unit
export function findNearestUnit(pos: Vec2, range: number, filter: filterfunc) {
  const enumGroup = new Group()
  enumGroup.enumUnitsInRange(pos.x, pos.y, range, filter)
  let nearest: Unit = null
  let bestDist = 2147483647 // max int32
  enumGroup.for(() => {
    const u = Unit.fromHandle(GetEnumUnit())
    const distSq = pos.distanceToSq(Vec2.unitPos(u))
    if (distSq < bestDist) {
      bestDist = distSq
      nearest = u
    }
  })
  enumGroup.destroy()
  return nearest
}
