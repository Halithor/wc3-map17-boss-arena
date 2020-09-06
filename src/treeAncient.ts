import {Unit, Timer, Effect, Group, Trigger, Destructable} from 'w3ts/index'
import {
  PlayerAncients,
  UnitIds,
  PlayerOne,
  PlayerTwo,
  DestructableIds,
} from 'constants'
import {CircleIndicator, LineIndicator} from 'indicator'
import {Vec2} from 'lib/vec2'
import {damageEnemiesInArea} from 'lib/damage'
import {flashEffect} from 'lib/effect'
import {Players} from 'w3ts/globals/index'
import {Statemachine, State} from 'statemachine'
import {findNearestUnit as getNearestUnit} from 'lib/groups'
import {forDestructablesInCircle} from 'lib/destructables'
import {Angle} from 'lib/angle'
import {isTerrainWalkable} from 'lib/terrain'

const updateDelta = 0.01

const earthquakeWarmupDuration = 200
const earthquakeRadius = 400
const earthquakeDamage = 150
const earthquakeEffect =
  'Abilities\\Spells\\Human\\Thunderclap\\ThunderClapCaster.mdl'

const chargeWarumpDuration = 200
const chargeDistance = 1800
const chargeWidth = 300
const chargeSpeed = 1400
const chargeDamage = 125

export class TreeAncient {
  private readonly tree: Unit

  private statemachine: Statemachine

  private addTimer: Timer

  constructor() {
    this.tree = new Unit(
      PlayerAncients,
      UnitIds.TreantAncient,
      GetRectCenterX(gg_rct_Boss_Spawn),
      GetRectCenterY(gg_rct_Boss_Spawn),
      270
    )
    this.tree.issueImmediateOrder('unroot')

    const g = new Group()
    this.addTimer = new Timer()
    this.addTimer.start(5, true, () => {
      g.enumUnitsOfPlayer(
        PlayerAncients,
        Filter(() => {
          return !this.tree.isUnit(Unit.fromHandle(GetFilterUnit()))
        })
      )
      g.for(() => {
        const u = Unit.fromHandle(GetEnumUnit())
        const target = getNearestUnit(
          Vec2.unitPos(u),
          2500,
          Filter(() => {
            return Unit.fromHandle(GetFilterUnit()).isEnemy(PlayerAncients)
          })
        )
        u.issueOrderAt('attack', target.x, target.y)
      })
    })
  }

  start() {
    print('WHO DISTURBS MY FOREST')
    this.statemachine = new Statemachine(
      new Attacking(this.tree),
      this.tree,
      updateDelta
    )
  }
}

class Attacking implements State {
  private target: Unit = null
  private duration: number = 0

  constructor(tree: Unit) {}

  update(tree: Unit): State {
    this.duration++
    if (this.target == null || !this.target.isAlive()) {
      this.pickNewTarget(tree)
      if (this.target != null) {
        tree.issueTargetOrder('attack', this.target)
      }
    }
    if (this.duration > 800) {
      // this.trg.destroy()
      return this.pickNextState(tree)
    }
    if (ModuloInteger(this.duration, 100) == 0) {
      print('attacking(' + this.duration.toString() + '): ' + this.target.name)
    }
    return this
  }
  interrupt(): State {
    // no interruption effect
    return this
  }

  private pickNewTarget(tree: Unit) {
    // TODO: Handle null target in Attacking
    this.target = getNearestUnit(
      Vec2.unitPos(tree),
      3000,
      Filter(() => {
        const u = Unit.fromHandle(GetFilterUnit())
        return u.isEnemy(PlayerAncients) && u.isAlive()
      })
    )
  }

  private pickNextState(tree: Unit): State {
    const rand = GetRandomReal(0, 1)
    if (rand < 0.5) {
      return new ChargeWarmup(tree)
    } else {
      return new EarthquakeWarmup(tree)
    }
  }
}

class EarthquakeWarmup implements State {
  private duration: number = 0
  private indicator: CircleIndicator

  constructor(tree: Unit) {
    this.indicator = new CircleIndicator(
      Vec2.unitPos(tree),
      earthquakeRadius / 5,
      36
    )
    tree.issueImmediateOrder('stop')
    tree.paused = true
    tree.setAnimation('morph')
    flashEffect(
      'Abilities\\Spells\\Human\\DispelMagic\\DispelMagicTarget.mdl',
      Vec2.unitPos(tree),
      2
    )
  }

  update(tree: Unit): State {
    this.duration++
    const indicatorCompletion = earthquakeWarmupDuration - 100
    const indicatorProgress = math.min(this.duration / indicatorCompletion, 1.0)
    const indicatorRadius = indicatorProgress * earthquakeRadius
    this.indicator.radius = indicatorRadius
    if (this.duration > earthquakeWarmupDuration) {
      return new Earthquake(this.indicator)
    }

    if (ModuloInteger(this.duration, 25) == 0) {
      print('eqcharge(' + this.duration.toString() + ')')
    }
    return this
  }

  interrupt(tree: Unit): State {
    this.indicator.remove()
    tree.paused = false
    return new Attacking(tree)
  }
}

// Earthquake is a flash state that causes the damage effects.
class Earthquake implements State {
  constructor(private indicator: CircleIndicator) {}

  update(tree: Unit): State {
    damageEnemiesInArea(
      tree,
      Vec2.unitPos(tree),
      earthquakeRadius,
      earthquakeDamage,
      ATTACK_TYPE_NORMAL,
      DAMAGE_TYPE_PLANT,
      WEAPON_TYPE_WHOKNOWS
    )
    flashEffect(earthquakeEffect, Vec2.unitPos(tree), 2)
    tree.setAnimation('attack')
    // undo the start of earthquake
    tree.paused = false
    this.indicator.remove()
    print('earthquake!')
    return new Attacking(tree)
  }

  interrupt(entity: Unit): State {
    // Can't interrupt this state.
    return this
  }
}

class ChargeWarmup implements State {
  private duration: number = 0
  private indicator: LineIndicator

  private startPos: Vec2
  private targetPos: Vec2

  constructor(tree: Unit) {
    this.startPos = Vec2.unitPos(tree)
    const target = getNearestUnit(
      this.startPos,
      3000,
      Filter(() => {
        return Unit.fromHandle(GetFilterUnit()).isEnemy(PlayerAncients)
      })
    )
    this.targetPos = this.startPos.moveTowards(
      Vec2.unitPos(target),
      chargeDistance
    )
    this.indicator = new LineIndicator(this.startPos, this.targetPos, 0, 2)
    tree.issueImmediateOrder('stop')
    tree.paused = true
    tree.setAnimation('morph')
    const pointer = this.startPos.normalizedPointerTo(this.targetPos)
    const ang = Angle.fromRadians(Atan2(pointer.y, pointer.x))
    tree.facing = ang.degrees
    this.duration = 0
    print('charge Warmup')
  }

  update(entity: Unit): State {
    this.duration++
    const indicatorCompletion = chargeWarumpDuration - 100
    const indicatorProgress = math.min(1.0, this.duration / indicatorCompletion)
    const indicatorWidth = indicatorProgress * chargeWidth
    this.indicator.width = indicatorWidth
    if (this.duration > chargeWarumpDuration) {
      return new Charge(entity, this.startPos, this.targetPos, this.indicator)
    }
    if (ModuloInteger(this.duration, 25) == 0) {
      print('chargewarmup(' + this.duration.toString() + ')')
    }
    return this
  }

  interrupt(entity: Unit): State {
    this.indicator.remove()
    entity.paused = false
    return new Attacking(entity)
  }
}

class Charge implements State {
  private duration: number = 0
  private trgHit: Trigger
  private createdGroup: Group

  constructor(
    tree: Unit,
    private startPos: Vec2,
    private targetPos: Vec2,
    private indicator: LineIndicator
  ) {
    tree.issueImmediateOrder('stop')
    tree.setAnimation('walk')
    tree.setTimeScale(2)

    this.createdGroup = new Group()

    this.trgHit = new Trigger()
    this.trgHit.registerUnitInRage(tree.handle, chargeWidth / 2, null)
    this.trgHit.addAction(() => {
      const hit = Unit.fromHandle(GetTriggerUnit())
      if (!this.createdGroup.hasUnit(hit)) {
        tree.damageTarget(
          hit.handle,
          chargeDamage,
          0,
          true,
          false,
          ATTACK_TYPE_MELEE,
          DAMAGE_TYPE_PLANT,
          WEAPON_TYPE_WHOKNOWS
        )
      }
    })
  }

  update(entity: Unit): State {
    this.duration++

    const tickSpeed = chargeSpeed * updateDelta
    const pos = Vec2.unitPos(entity)
    const nextPos = pos.moveTowards(this.targetPos, tickSpeed)
    if (!isTerrainWalkable(nextPos)) {
      this.cleanup(entity)
      return new Attacking(entity)
    }
    entity.x = nextPos.x
    entity.y = nextPos.y

    if (ModuloInteger(this.duration, 8) == 0) {
      flashEffect(
        'Abilities\\Spells\\Human\\Thunderclap\\ThunderClapCaster.mdl',
        nextPos,
        1.2
      )
      forDestructablesInCircle(
        nextPos,
        chargeWidth / 2 + 50,
        (d: Destructable) => {
          if (d.life > 1) {
            if (!DestructableIds.isPathingBlocker(d.typeId)) {
              d.kill()
            }
            if (d.typeId == DestructableIds.TreeId) {
              const u = new Unit(
                PlayerAncients,
                UnitIds.TreantMob,
                d.x,
                d.y,
                Angle.random().degrees
              )
              this.createdGroup.addUnit(u)
            }
            if (d.typeId == DestructableIds.RockId) {
              const u = new Unit(
                PlayerAncients,
                UnitIds.RockGolemMob,
                d.x,
                d.y,
                Angle.random().degrees
              )
              this.createdGroup.addUnit(u)
            }
          }
        }
      )
    }

    if (nextPos.distanceToSq(this.targetPos) < tickSpeed * tickSpeed) {
      this.cleanup(entity)
      return new Attacking(entity)
    }
    return this
  }

  interrupt(entity: Unit): State {
    this.cleanup(entity)
    return new Attacking(entity)
  }

  private cleanup(tree: Unit) {
    this.indicator.remove()
    tree.paused = false
    tree.setTimeScale(1)
    this.createdGroup.destroy()
    this.trgHit.destroy()
  }
}
