import {AbilityIds, DestructableIds, UnitIds} from 'constants'
import {Angle} from 'lib/angle'
import {damageEnemiesInArea} from 'lib/damage'
import {
  forDestructablesInCircle,
  killDestructablesInCircle,
} from 'lib/destructables'
import {flashEffect} from 'lib/effect'
import {castImmediate, castTarget} from 'lib/instantdummy'
import {Projectile} from 'lib/projectile'
import {doAfter, doPeriodically} from 'lib/timer'
import {Vec2} from 'lib/vec2'
import {Destructable, Trigger, Unit} from 'w3ts/index'

function handleDemonCast() {
  const demon = Unit.fromHandle(GetTriggerUnit())
  const spellId = GetSpellAbilityId()
  if (spellId == AbilityIds.TrailOfFlame) {
    flameTrail(demon)
  } else if (spellId == AbilityIds.HearthsEmbrace) {
    const targetUnit = Unit.fromHandle(GetSpellTargetUnit())
    hearthsEmbrace(targetUnit)
  } else if (spellId == AbilityIds.Firewave) {
    const target = new Vec2(GetSpellTargetX(), GetSpellTargetY())
    firewave(demon, target)
  } else if (spellId == AbilityIds.Flamestrike) {
    const target = new Vec2(GetSpellTargetX(), GetSpellTargetY())
    flamestrike(demon, target)
  }
}

function flameTrail(demon: Unit) {
  demon.setPathing(false)
  // BlzSetUnitIntegerField(demon.handle, UNIT_IF_MOVE_TYPE, 2) // Fly

  const endTrail = doPeriodically(0.2, () => {
    const pos = Vec2.unitPos(demon)
    const ward = new Unit(demon.owner, UnitIds.TrailOfFireWard, pos.x, pos.y, 0)
    ward.applyTimedLife(FourCC('BHwe'), 10.0)
    killDestructablesInCircle(pos, 120)
  })
  doAfter(6, () => {
    endTrail()
    demon.setPathing(true)
    // BlzSetUnitIntegerField(demon.handle, UNIT_IF_MOVE_TYPE, 1)
  })
}

function hearthsEmbrace(target: Unit) {
  castTarget(
    target.owner,
    AbilityIds.DummyHearthsEmbraceStun,
    1,
    'creepthunderbolt',
    target,
    Vec2.unitPos(target)
  )
}

function firewave(demon: Unit, target: Vec2) {
  const makeBall = (target: Vec2) => {
    const ball = new Projectile(
      Vec2.unitPos(demon).moveTowards(target, 32),
      target,
      1000,
      0,
      'Abilities\\Weapons\\RedDragonBreath\\RedDragonMissile.mdl',
      (_target: Unit | Vec2 | Destructable, pos: Vec2) => {
        killDestructablesInCircle(pos, 164)
        demon.damageAt(
          0,
          100,
          pos.x,
          pos.y,
          100,
          false,
          true,
          ATTACK_TYPE_NORMAL,
          DAMAGE_TYPE_FIRE,
          WEAPON_TYPE_WHOKNOWS
        )
      }
    )
    ball.impactsDestructables(
      true,
      (d: Destructable) =>
        !DestructableIds.isPathingBlocker(d.typeId) && d.life > 0
    )
    ball.impactsUnits(true, (u: Unit) => !u.isUnit(demon) && u.isAlive())
    ball.destroyOnImpact(true)
  }
  const demonPos = Vec2.unitPos(demon)
  const targetFixed = demonPos.moveTowards(
    target,
    math.max(500, demonPos.distanceTo(target))
  )
  const normal = demonPos.normalizedPointerTo(targetFixed)
  makeBall(targetFixed.add(normal.rotate(Angle.fromDegrees(-90)).scale(500)))
  makeBall(targetFixed.add(normal.rotate(Angle.fromDegrees(-90)).scale(166)))
  makeBall(targetFixed.add(normal.rotate(Angle.fromDegrees(90)).scale(166)))
  makeBall(targetFixed.add(normal.rotate(Angle.fromDegrees(90)).scale(500)))
}

function flamestrike(demon: Unit, target: Vec2) {
  flashEffect(
    'Abilities\\Spells\\Human\\FlameStrike\\FlameStrikeTarget.mdl',
    target,
    0.4
  )
  doAfter(1.1, () => {
    castImmediate(
      demon.owner,
      AbilityIds.DummyFlamestrikeStun,
      1,
      'stomp',
      target
    )
    demon.damageAt(
      0,
      200,
      target.x,
      target.y,
      100,
      false,
      true,
      ATTACK_TYPE_NORMAL,
      DAMAGE_TYPE_FIRE,
      WEAPON_TYPE_WHOKNOWS
    )
    killDestructablesInCircle(target, 200)
    flashEffect('Abilities\\Spells\\Orc\\WarStomp\\WarStompCaster.mdl', target)
    flashEffect(
      'Objects\\Spawnmodels\\Human\\FragmentationShards\\FragBoomSpawn.mdl',
      target
    )
  })
}

export function initDemon() {
  const trg = new Trigger()
  trg.registerAnyUnitEvent(EVENT_PLAYER_UNIT_SPELL_EFFECT)
  trg.addCondition(
    Condition(
      () => Unit.fromHandle(GetTriggerUnit()).typeId == UnitIds.FireDemon
    )
  )
  trg.addAction(() => handleDemonCast())
}
