import {Unit, Timer, Effect, Group, Trigger} from 'w3ts/index'
import {PlayerAncients, UnitIds, PlayerOne, PlayerTwo} from 'constants'
import {CircleIndicator, LineIndicator} from 'indicator'
import {Vec2} from 'lib/vec2'
import {damageEnemiesInArea} from 'lib/damage'
import {flashEffect} from 'lib/effect'
import {Players} from 'w3ts/globals/index'
import {Statemachine, State} from 'statemachine'
import {findNearestUnit as getNearestUnit} from 'lib/groups'

const updateDelta = 0.01

const earthquakeWarmupDuration = 200
const earthquakeRadius = 400
const earthquakeDamage = 150
const earthquakeEffect =
  'Abilities\\Spells\\Human\\Thunderclap\\ThunderClapCaster.mdl'

const chargeWarumpDuration = 200
const chargeDistance = 2000
const chargeWidth = 300
const chargeSpeed = 800

export class TreeAncient {
  private readonly tree: Unit

  private statemachine: Statemachine

  constructor() {
    this.tree = new Unit(
      PlayerAncients,
      UnitIds.TreantAncient,
      GetRectCenterX(gg_rct_Boss_Spawn),
      GetRectCenterY(gg_rct_Boss_Spawn),
      270
    )
    this.tree.issueImmediateOrder('unroot')
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

  // private trg: Trigger

  constructor(tree: Unit) {
    // this.trg = new Trigger()
    // this.trg.registerAnyUnitEvent(EVENT_PLAYER_UNIT_ATTACKED)
    // this.trg.addAction(() => {
    //   print('attacked')
    //   const target = Unit.fromHandle(GetTriggerUnit())
    //   const attacker = Unit.fromHandle(GetAttacker())
    //   if (attacker.isUnit(tree)) {
    //     this.trg.enabled = false
    //     print('by tree!')
    //     attacker.issueOrderAt('attackground', target.x, target.y)
    //     const t = new Timer()
    //     t.start(1.2, false, () => {
    //       print('normal attack')
    //       tree.issueTargetOrder('attack', this.target)
    //       this.trg.enabled = true
    //       t.destroy()
    //     })
    //   }
    // })
  }

  update(tree: Unit): State {
    this.duration++
    if (this.target == null || !this.target.isAlive()) {
      this.pickNewTarget(tree)
      tree.issueTargetOrder('attack', this.target)
    }
    if (this.duration > 800) {
      // this.trg.destroy()
      return this.pickNextState(tree)
    }
    if (ModuloInteger(this.duration, 25) == 0) {
      print('attacking(' + this.duration.toString() + '): ' + this.target.name)
    }
    return this
  }
  interrupt(): State {
    // no interruption effect
    return this
  }

  private pickNewTarget(tree: Unit) {
    this.target = getNearestUnit(
      Vec2.unitPos(tree),
      3000,
      Filter(() => {
        return Unit.fromHandle(GetFilterUnit()).isEnemy(PlayerAncients)
      })
    )
  }

  private pickNextState(tree: Unit): State {
    return new ChargeWarmup(tree)
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
    tree.paused = true
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
      return new Attacking(entity) // TODO
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
  constructor(private startPos: Vec2, private targetPos: Vec2) {

  }
  update(entity: Unit): State {
    throw new Error("Method not implemented.")
  }
  interrupt(entity: Unit): State {
    throw new Error("Method not implemented.")
  }

  
}