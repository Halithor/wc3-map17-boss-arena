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
import {Vec2} from './vec2'

// the dummy himself
const dummyOwner = Players[PLAYER_NEUTRAL_PASSIVE]
let dummy: Unit
let restingPosition: Vec2

// castImmediate uses a dummy unit to immediately cast an ability at a location.
export function castImmediate(
  owner: MapPlayer,
  abilityId: number,
  lvl: number,
  orderId: number,
  pos: Vec2
) {}

// castTarget uses a dummy unit to cast a widget targeted ability from the provided position.
export function castTarget(
  owner: MapPlayer,
  abilityId: number,
  lvl: number,
  orderId: number,
  target: Widget,
  pos: Vec2
) {}

// castPoint uses a dummy unit to cast a point targeted ability from a provided position.
export function castPoint(
  owner: MapPlayer,
  abilityId: number,
  lvl: number,
  orderId: number,
  target: Vec2,
  pos: Vec2
) {}

function prepare(owner: MapPlayer, abilityId: number, lvl: number, pos: Vec2) {}

function init() {
  const bound = Rectangle.getWorldBounds()
  restingPosition = new Vec2(bound.maxX, bound.maxY)
  dummy = new Unit(
    dummyOwner,
    UnitIds.Dummy,
    restingPosition.x,
    restingPosition.y,
    0
  )
  
}

addScriptHook(W3TS_HOOK.MAIN_AFTER, init)
