import {Unit, Timer, Effect, Group} from 'w3ts/index'
import {PlayerAncients, UnitIds, PlayerOne, PlayerTwo} from 'constants'
import {Indicator} from 'indicator'
import {Vec2} from 'lib/vec2'
import {damageEnemiesInArea} from 'lib/damage'
import {flashEffect} from 'lib/effect'
import {Players} from 'w3ts/globals/index'
import {Statemachine, State} from 'statemachine'

// type Attacking = {
//   kind: 'attacking'
//   target: Unit
// }
// const Attacking = (): Attacking => ({
//   kind: 'attacking',
//   target: null,
// })
type EarthquakeCharge = {
  kind: 'earthquakeCharge'
  indicator: Indicator
}
const EarthquakeCharge = (): EarthquakeCharge => ({
  kind: 'earthquakeCharge',
  indicator: null,
})
type Earthquake = {
  kind: 'earthquake'
  indicator: Indicator
}
const Earthquake = (): Earthquake => ({kind: 'earthquake', indicator: null})

type TreeState = Attacking | Earthquake | EarthquakeCharge

const earthquakeChargeDuration = 200
const earthquakeRadius = 512
const earthquakeDamage = 150
const earthquakeEffect =
  'Abilities\\Spells\\Human\\Thunderclap\\ThunderClapCaster.mdl'

class Attacking implements State {
  private target: Unit
  private duration: number = 0

  update(tree: Unit): State {
    this.duration++
    if (!this.target || !this.target.isAlive()) {
      this.pickNewTarget()
      tree.issueTargetOrder('attack', this.target)
    }
    if (this.duration > 800) {
      return pickNextState()
    }

    return this
  }
  interrupt(): State {
    // no interruption effect
    return this
  }

  private pickNewTarget() {
    const g = new Group()
    g.enumUnitsOfPlayer(PlayerOne, null)
    g.enumUnitsOfPlayer(PlayerTwo, null)
    this.target = g.getUnitAt(GetRandomInt(0, g.size))
    g.destroy()
  }

  private pickNextState(): State {
    // TODO
    return this
  }
}

export class TreeAncient {
  private readonly tree: Unit
  private stateTimer: Timer

  private state: TreeState
  private stateDuration: number = 0

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
    // this.state = Attacking()
    // this.stateTimer = new Timer()
    // this.stateTimer.start(0.01, true, () => {
    //   this.update()
    // })
    // print('tree started')
    this.statemachine = new Statemachine(new Attacking(), this.tree)
  }

  update() {
    this.stateDuration += 1
    if (ModuloInteger(this.stateDuration, 25) == 0) {
      print(
        'TreeState(' + this.stateDuration.toString() + '): ' + this.state.kind
      )
    }

    if (this.state.kind == 'attacking') {
      if (this.stateDuration > 1000) {
        this.changeState(EarthquakeCharge())
      }
    } else if (this.state.kind == 'earthquake') {
      damageEnemiesInArea(
        this.tree,
        Vec2.unitPos(this.tree),
        earthquakeRadius,
        earthquakeDamage,
        ATTACK_TYPE_NORMAL,
        DAMAGE_TYPE_PLANT,
        WEAPON_TYPE_WHOKNOWS
      )
      flashEffect(earthquakeEffect, Vec2.unitPos(this.tree), 2)
      this.tree.setAnimation('attack')
      this.changeState(Attacking())
    } else if (this.state.kind == 'earthquakeCharge') {
      const indicatorCompletion = earthquakeChargeDuration - 100
      const indicatorProgress = this.stateDuration / indicatorCompletion
      const indicatorRadius = math.min(indicatorProgress, 1) * earthquakeRadius
      this.state.indicator.radius = indicatorRadius
      if (this.stateDuration > earthquakeChargeDuration) {
        this.changeState(Earthquake())
      }
    } else {
      const _exhaustive: never = this.state
    }
  }

  // This method handles any immediate actions that need to be taken on state change
  changeState(newState: TreeState) {
    print('Tree.changeState: ' + newState.kind)

    // Undo any effects from the current state
    if (this.state.kind == 'earthquake') {
      // Earthquake has the tree unpaused and the indicator removed
      this.tree.paused = false
      this.state.indicator.remove()
    } else if (this.state.kind == 'earthquakeCharge') {
      // Move the indicator to the new state, or destroy it
      if (newState.kind == 'earthquake') {
        newState.indicator = this.state.indicator
      } else {
        this.state.indicator.remove()
      }
    }

    // Do any immediate setup for the new state.
    if (newState.kind == 'attacking') {
      const g = GetUnitsOfPlayerAll(Players[0].handle)
      newState.target = Unit.fromHandle(FirstOfGroup(g))
      DestroyGroup(g)
      this.tree.issueTargetOrder('attack', newState.target)
    } else if (newState.kind == 'earthquakeCharge') {
      this.tree.issueImmediateOrder('stop')
      this.tree.paused = true
      flashEffect(
        'Abilities\\Spells\\Human\\DispelMagic\\DispelMagicTarget.mdl',
        Vec2.unitPos(this.tree),
        2
      )
      newState.indicator = new Indicator(
        Vec2.unitPos(this.tree),
        earthquakeRadius / 5,
        36
      )
      this.tree.setAnimation('morph')
    } else if (newState.kind == 'earthquake') {
    }

    this.state = newState
    this.stateDuration = 0
    print('Tree.changeState done')
  }
}
