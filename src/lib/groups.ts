import {Vec2} from './vec2'
import {Unit, Group, Rectangle} from 'w3ts/index'

const maxCollisionSize = 200.0

function getUnitsInRange(
  pos: Vec2,
  radius: number,
  filter?: (Unit) => boolean,
  collisionSizeFiltering: boolean = false
): Group {
  const enumGroup = new Group()
  if (collisionSizeFiltering) {
    enumGroup.enumUnitsInRange(
      pos.x,
      pos.y,
      radius + maxCollisionSize,
      Filter(() => {
        const u = Unit.fromHandle(GetFilterUnit())
        return (
          u.inRange(pos.x, pos.y, radius) && (filter != null ? filter(u) : true)
        )
      })
    )
  } else {
    if (filter != null) {
      enumGroup.enumUnitsInRange(
        pos.x,
        pos.y,
        radius,
        Filter(() => filter(Unit.fromHandle(GetFilterUnit())))
      )
    } else {
      enumGroup.enumUnitsInRange(pos.x, pos.y, radius, null)
    }
  }
  return enumGroup
}

// Iterate over all units in range calling the callback
export function forUnitsInRange(
  pos: Vec2,
  radius: number,
  callback: (u: Unit) => void,
  collisionSizeFiltering: boolean = false
) {
  const enumGroup = getUnitsInRange(pos, radius, null, collisionSizeFiltering)
  enumGroup.for(() => {
    callback(Unit.fromHandle(GetEnumUnit()))
  })
  enumGroup.destroy()
}

// Get a random unit in range, matching the provided filter.
export function getRandomUnitInRange(
  pos: Vec2,
  radius: number,
  filter: (Unit) => boolean,
  collisionSizeFiltering: boolean = false
): Unit {
  const enumGroup = getUnitsInRange(pos, radius, filter, collisionSizeFiltering)
  const u = enumGroup.getUnitAt(GetRandomInt(0, enumGroup.size - 1))
  enumGroup.destroy()
  return u
}

// Executes a callback on the nearest unit
export function findNearestUnit(
  pos: Vec2,
  range: number,
  filter: filterfunc
): Unit {
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

export function forUnitsInRect(rct: Rectangle, callback: (u: Unit) => void) {
  const enumGroup = new Group()
  enumGroup.enumUnitsInRect(rct, null)
  enumGroup.for(() => {
    callback(Unit.fromHandle(GetEnumUnit()))
  })
}
