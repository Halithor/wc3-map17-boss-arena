import {AbilityIds, UnitIds} from 'constants'
import {Timer} from 'lib/timer'
import {Vec2} from 'lib/vec2'
import {Trigger, Unit} from 'w3ts/index'

function handleDemonCast() {
  const demon = Unit.fromHandle(GetTriggerUnit())
  const spellId = GetSpellAbilityId()
  const target = new Vec2(GetSpellTargetX(), GetSpellTargetY())
  const targetUnit = Unit.fromHandle(GetSpellTargetUnit())
  if (spellId == AbilityIds.TrailOfFlame) {
    flameTrail(demon)
  } else if (spellId == AbilityIds.HearthsEmbrace) {
    hearthsEmbrace(targetUnit)
  } else if (spellId == AbilityIds.Firewave) {
    firewave(demon, target)
  } else if (spellId == AbilityIds.Flamestrike) {
    flamestrike(demon, target)
  }
}

function flameTrail(demon: Unit) {
  demon.setPathing(false)

  const periodic = Timer.get()
  periodic.startPeriodic(0.2, () => {
    const pos = Vec2.unitPos(demon)
    const ward = new Unit(demon.owner, UnitIds.TrailOfFireWard, pos.x, pos.y, 0)
    ward.applyTimedLife(FourCC('BHwe'), 10.0)
  })
  const limit = Timer.get()
  limit.start(6, () => {
    periodic.release()
    limit.release()
    demon.setPathing(true)
  })
}

function hearthsEmbrace(target: Unit) {}

function firewave(demon: Unit, target: Vec2) {}

function flamestrike(demon: Unit, target: Vec2) {}

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
