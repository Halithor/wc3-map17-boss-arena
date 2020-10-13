import {AbilityIds, DestructableIds, UnitIds} from 'constants'
import {Angle} from 'lib/angle'
import {forDestructablesInCircle} from 'lib/destructables'
import {flashEffect} from 'lib/effect'
import {isTerrainWalkable} from 'lib/terrain'
import {doPeriodicallyCounted, Timer} from 'lib/timer'
import {Vec2} from 'lib/vec2'
import {TreeAncient} from 'treeAncient'
import {addScriptHook, Destructable, Trigger, Unit, W3TS_HOOK} from 'w3ts/index'

function handleScarabCast() {
  const scarab = Unit.fromHandle(GetTriggerUnit())
  const spellId = GetSpellAbilityId()
  if (spellId == AbilityIds.CarrionCharge) {
    const target = new Vec2(GetSpellTargetX(), GetSpellTargetY())
    carrionCharge(scarab, target)
  } else if (spellId == AbilityIds.HeavyBash) {
    const targetUnit = Unit.fromHandle(GetSpellTargetUnit())
    // TODO interrupt the boss
  }
}

const speed = 1400
const updateDelta = 0.02
function carrionCharge(scarab: Unit, target: Vec2) {
  print('debug: carrion charge')
  const dir = Vec2.unitPos(scarab).normalizedPointerTo(target)
  const ang = Angle.fromRadians(Atan2(dir.y, dir.x))
  scarab.facing = ang.degrees
  scarab.paused = true

  const trg = new Trigger()
  trg.registerUnitInRage(scarab.handle, 110, null)
  trg.addAction(() => {
    const hit = Unit.fromHandle(GetTriggerUnit())
    if (!hit.isAlly(scarab.owner)) {
      scarab.damageTarget(
        hit.handle,
        100,
        0,
        true,
        false,
        ATTACK_TYPE_MELEE,
        DAMAGE_TYPE_NORMAL,
        WEAPON_TYPE_METAL_HEAVY_BASH
      )
      flashEffect(
        'Abilities\\Spells\\Undead\\Impale\\ImpaleHitTarget.mdl',
        Vec2.unitPos(hit)
      )
    }
  })

  const distance = math.max(target.distanceTo(Vec2.unitPos(scarab)), 300)
  let intervals = math.floor(distance / speed / updateDelta)
  doPeriodicallyCounted(
    updateDelta,
    intervals,
    (cancel, index: number) => {
      const nextPos = Vec2.unitPos(scarab).add(dir.scale(updateDelta * speed))
      if (index % 2 == 0) {
        forDestructablesInCircle(nextPos, 120, (d: Destructable) => {
          if (d.life > 1) {
            if (!DestructableIds.isPathingBlocker(d.typeId)) {
              d.kill()
            }
          }
        })
      }
      if (index % 5 == 0) {
        flashEffect(
          'Abilities\\Spells\\Undead\\Impale\\ImpaleMissTarget.mdl',
          nextPos
        )
      }
      if (!isTerrainWalkable(nextPos)) {
        cancel()
      }
      scarab.x = nextPos.x
      scarab.y = nextPos.y
    },
    () => {
      trg.destroy()
      scarab.paused = false
    }
  )
  // const timer = Timer.get()
  // timer.startPeriodic(updateDelta, () => {
  //   intervals--
  //   if (intervals < 0) {
  //     timer.release()
  //     trg.destroy()
  //     scarab.paused = false
  //     return
  //   }
  //   const nextPos = Vec2.unitPos(scarab).add(dir.scale(updateDelta * speed))
  //   if (ModuloInteger(intervals, 2) == 0) {
  //     flashEffect(
  //       'Abilities\\Spells\\Undead\\Impale\\ImpaleMissTarget.mdl',
  //       nextPos
  //     )
  //     forDestructablesInCircle(nextPos, 150, (d: Destructable) => {
  //       if (d.life > 1) {
  //         if (!DestructableIds.isPathingBlocker(d.typeId)) {
  //           d.kill()
  //         }
  //       }
  //     })
  //   }

  //   if (!isTerrainWalkable(nextPos)) {
  //     timer.release()
  //     trg.destroy()
  //     scarab.paused = false
  //     return
  //   }
  //   scarab.x = nextPos.x
  //   scarab.y = nextPos.y
  // })
}

export function initScarab() {
  const trg = new Trigger()
  trg.registerAnyUnitEvent(EVENT_PLAYER_UNIT_SPELL_EFFECT)
  trg.addCondition(
    Condition(
      () => Unit.fromHandle(GetTriggerUnit()).typeId == UnitIds.ScarabKing
    )
  )
  trg.addAction(() => handleScarabCast())
}
