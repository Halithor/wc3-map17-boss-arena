import {Unit, Group} from 'w3ts/index'
import {Vec2} from './vec2'
import {forUnitsInRange} from './groups'

export function damageEnemiesInArea(
  source: Unit,
  pos: Vec2,
  radius: number,
  amount: number,
  ranged: boolean,
  attackType: attacktype,
  damageType: damagetype,
  weaponType: weapontype
) {
  forUnitsInRange(
    pos,
    radius,
    () => {
      const u = Unit.fromHandle(GetEnumUnit())
      if (source.isEnemy(u.owner)) {
        source.damageTarget(
          u.handle,
          amount,
          0,
          true,
          ranged,
          attackType,
          damageType,
          weaponType
        )
      }
    },
    true
  )
}
