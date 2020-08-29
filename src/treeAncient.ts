import {Unit, Timer, Effect, Group, Trigger} from 'w3ts/index'
import {PlayerAncients, UnitIds, PlayerOne, PlayerTwo} from 'constants'
import {Indicator} from 'indicator'
import {Vec2} from 'lib/vec2'
import {damageEnemiesInArea} from 'lib/damage'
import {flashEffect} from 'lib/effect'
import {Players} from 'w3ts/globals/index'
import {Statemachine, State} from 'statemachine'

const earthquakeChargeDuration = 200
const earthquakeRadius = 400
const earthquakeDamage = 150
const earthquakeEffect =
  'Abilities\\Spells\\Human\\Thunderclap\\ThunderClapCaster.mdl'

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
    this.statemachine = new Statemachine(new Attacking(this.tree), this.tree)
  }
}

class Attacking implements State {
  private target: Unit = null
  private duration: number = 0

  private trg: Trigger

  constructor(tree: Unit) {
    this.trg = new Trigger()
    this.trg.registerAnyUnitEvent(EVENT_PLAYER_UNIT_ATTACKED)
    this.trg.addAction(() => {
      print('attacked')
      const target = Unit.fromHandle(GetTriggerUnit())
      const attacker = Unit.fromHandle(GetAttacker())
      if (attacker.isUnit(tree)) {
        this.trg.enabled = false
        print('by tree!')
        attacker.issueOrderAt('attackground', target.x, target.y)
        const t = new Timer()
        t.start(1.2, false, () => {
          print('normal attack')
          tree.issueTargetOrder('attack', this.target)
          this.trg.enabled = true
          t.destroy()
        })
      }
    })
  }

  update(tree: Unit): State {
    this.duration++
    if (this.target == null) {
      this.pickNewTarget(tree)
      tree.issueTargetOrder('attack', this.target)
    }
    if (this.duration > 800) {
      this.trg.destroy()
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
    const playerOne = new Group()
    playerOne.enumUnitsOfPlayer(PlayerOne, null)
    const playerTwo = new Group()
    playerTwo.enumUnitsOfPlayer(PlayerTwo, null)

    playerOne.addGroupFast(playerTwo)
    this.target = playerOne.getUnitAt(GetRandomInt(0, playerOne.size - 1))
    print('pickTarget(' + playerOne.size.toString() + '): ' + this.target.name)
    playerOne.destroy()
    playerTwo.destroy()
  }

  private pickNextState(tree: Unit): State {
    return new EarthquakeCharge(tree)
  }
}

class EarthquakeCharge implements State {
  private duration: number = 0
  private indicator: Indicator

  constructor(tree: Unit) {
    this.indicator = new Indicator(Vec2.unitPos(tree), earthquakeRadius / 5, 36)
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
    const indicatorCompletion = earthquakeChargeDuration - 100
    const indicatorProgress = math.min(this.duration / indicatorCompletion, 1.0)
    const indicatorRadius = indicatorProgress * earthquakeRadius
    this.indicator.radius = indicatorRadius
    if (this.duration > earthquakeChargeDuration) {
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
  constructor(private indicator: Indicator) {}

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
