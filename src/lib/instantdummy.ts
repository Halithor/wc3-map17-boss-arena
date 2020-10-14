import {UnitIds} from 'constants'
import {Players} from 'w3ts/globals/index'
import {
  addScriptHook,
  MapPlayer,
  Rectangle,
  Unit,
  W3TS_HOOK,
  Widget,
} from 'w3ts/index'
import {Angle} from './angle'
import {Vec2} from './vec2'

// the dummy himself
const dummyOwner = Players[PLAYER_NEUTRAL_PASSIVE]
let bounds: Rectangle
let dummy: Unit
let restingPosition: Vec2

// castImmediate uses a dummy unit to immediately cast an ability at a location.
export function castImmediate(
  owner: MapPlayer,
  abilityId: number,
  lvl: number,
  orderId: number | string,
  pos: Vec2
): boolean {
  prepare(owner, abilityId, lvl, pos)
  const success = dummy.issueImmediateOrder(orderId)
  cleanup(abilityId)
  return success
}

// castTarget uses a dummy unit to cast a widget targeted ability from the provided position.
export function castTarget(
  owner: MapPlayer,
  abilityId: number,
  lvl: number,
  orderId: number | string,
  target: Widget,
  casterPos: Vec2
): boolean {
  prepare(owner, abilityId, lvl, casterPos)
  dummy.facing = angle(casterPos, Vec2.widgetPos(target)).degrees
  const success = dummy.issueTargetOrder(orderId, target)
  cleanup(abilityId)
  return success
}

// castPoint uses a dummy unit to cast a point targeted ability from a provided position.
export function castPoint(
  owner: MapPlayer,
  abilityId: number,
  lvl: number,
  orderId: number | string,
  target: Vec2,
  casterPos: Vec2
): boolean {
  prepare(owner, abilityId, lvl, casterPos)
  dummy.facing = angle(casterPos, target).degrees
  let success = dummy.issueOrderAt(orderId, target.x, target.y)
  cleanup(abilityId)
  return success
}

function prepare(owner: MapPlayer, abilityId: number, lvl: number, pos: Vec2) {
  dummy.addAbility(abilityId)
  if (
    pos.x > bounds.minX &&
    pos.x < bounds.maxX &&
    pos.y > bounds.minY &&
    pos.y < bounds.maxY
  ) {
    dummy.x = pos.x
    dummy.y = pos.y
  }
  if (lvl > 1) {
    dummy.setAbilityLevel(abilityId, lvl)
  }
  if (owner != null) {
    dummy.owner = owner
  }
}

function cleanup(abilityId: number) {
  dummy.owner = dummyOwner
  dummy.removeAbility(abilityId)
  dummy.x = bounds.maxX
  dummy.y = bounds.maxY
}

function init() {
  bounds = Rectangle.getWorldBounds()
  restingPosition = new Vec2(bounds.maxX, bounds.maxY)
  dummy = new Unit(
    dummyOwner,
    UnitIds.Dummy,
    restingPosition.x,
    restingPosition.y,
    0
  )
  const ravenForm = FourCC('Amrf')
  const rootAncients = FourCC('Aro1')
  // allows setting height.
  dummy.addAbility(ravenForm)
  dummy.removeAbility(ravenForm)
  // I think this makes turning instant.
  dummy.addAbility(rootAncients)
  dummy.removeAbility(rootAncients)
}

addScriptHook(W3TS_HOOK.MAIN_AFTER, init)

// TODO remvoe when Vec package fixed
function angle(a: Vec2, b: Vec2): Angle {
  const dir = a.normalizedPointerTo(b)
  return Angle.fromRadians(Atan2(dir.y, dir.x))
}
