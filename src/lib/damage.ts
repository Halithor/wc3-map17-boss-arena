import {Unit, Group} from 'w3ts/index'
import {Vec2} from './vec2'

export function damageEnemiesInArea(
  source: Unit,
  pos: Vec2,
  radius: number,
  amount: number,
  attackType: attacktype,
  damageType: damagetype,
  weaponType: weapontype
) {
  let g = new Group()
  g.enumUnitsInRange(pos.x, pos.y, radius + 144, null)
  g.for(() => {
    const u = Unit.fromHandle(GetEnumUnit())
    if (
      source.isEnemy(u.owner) &&
      Vec2.unitPos(u).distanceTo(Vec2.unitPos(source)) <
        radius + u.collisionSize
    ) {
      source.damageTarget(
        u.handle,
        amount,
        0,
        true,
        false,
        attackType,
        damageType,
        weaponType
      )
    }
  })
}
