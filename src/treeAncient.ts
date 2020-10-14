import {Unit, Group, Trigger, Destructable, Widget} from 'w3ts/index'
import {PlayerAncients, UnitIds, DestructableIds, AbilityIds} from 'constants'
import {CircleIndicator, LineIndicator} from 'indicator'
import {Vec2} from 'lib/vec2'
import {damageEnemiesInArea} from 'lib/damage'
import {flashEffect} from 'lib/effect'
import {Statemachine, State} from 'statemachine'
import {
  findNearestUnit as getNearestUnit,
  getRandomUnitInRange,
} from 'lib/groups'
import {forDestructablesInCircle} from 'lib/destructables'
import {Angle} from 'lib/angle'
import {isTerrainWalkable} from 'lib/terrain'
import {Lightning, LightningType} from 'lib/lightning'
import {doAfter} from 'lib/timer'
import {castTarget} from 'lib/instantdummy'

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

const strangleDuration = 800
const strangleDamage = 800

export class TreeAncient {
  tree: Unit
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
    const setup = GetCurrentCameraSetup()
    // pauseCameraSystem(true)
    CinematicModeBJ(true, bj_FORCE_ALL_PLAYERS)
    CameraSetupApply(gg_cam_Boss_Camera, true, false)
    TransmissionFromUnitWithNameBJ(
      bj_FORCE_ALL_PLAYERS,
      this.tree.handle,
      'Forest Guardian',
      null,
      'Your destructive rampage through my forest ends here!',
      1,
      6,
      false
    )

    doAfter(6.0, () => {
      CinematicModeBJ(false, bj_FORCE_ALL_PLAYERS)
      // pauseCameraSystem(false)
      CameraSetupApply(setup, true, false)

      this.statemachine = new Statemachine(
        new Attacking(this.tree),
        this.tree,
        updateDelta
      )
    })
  }

  cleanup() {
    this.tree.kill()
    this.statemachine.cleanup()
  }
}

function pickTargetHero(tree: Unit): Unit {
  return getRandomUnitInRange(
    Vec2.unitPos(tree),
    9000,
    (u: Unit) => {
      return u.isEnemy(PlayerAncients) && u.isHero() && u.isAlive()
    },
    true
  )
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
    if (this.duration > 700) {
      return this.pickNextState(tree)
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
    this.pickNewTarget(tree)
    const rand = GetRandomReal(0, 1)
    if (
      Vec2.unitPos(this.target).distanceTo(Vec2.unitPos(tree)) <
        earthquakeRadius &&
      rand < 0.5
    ) {
      return new EarthquakeWarmup(tree)
    }
    if (tree.life / tree.maxLife < 0.5 && rand < 0.5) {
      return Strangleroots.afterSeeking(tree)
    }
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
      false,
      ATTACK_TYPE_MELEE,
      DAMAGE_TYPE_NORMAL,
      WEAPON_TYPE_WHOKNOWS
    )
    flashEffect(earthquakeEffect, Vec2.unitPos(tree), 2)
    tree.setAnimation('attack')
    // undo the start of earthquake
    tree.paused = false
    this.indicator.remove()
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
          DAMAGE_TYPE_NORMAL,
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

// A generic state that can be used make the tree get close to a target location. After the tree is
// within the given range of a target widget, it will move to provided state. Range does include the
// contact size of the tree.
class Seek implements State {
  private duration: number = 0
  constructor(
    private readonly target: Widget,
    private readonly range: number,
    private readonly nextState: State,
    private readonly maxDuration: number = 1000
  ) {}

  update(entity: Unit): State {
    this.duration++
    const pos = Vec2.widgetPos(this.target)
    if (entity.inRange(pos.x, pos.y, this.range)) {
      return this.nextState
    }
    if (this.duration > this.maxDuration) {
      return this.interrupt(entity)
    }
    if (ModuloInteger(this.duration, 50) == 0) {
      entity.issueOrderAt('move', pos.x, pos.y)
    }

    return this
  }

  interrupt(entity: Unit): State {
    return new Attacking(entity)
  }
}

class Strangleroots implements State {
  private initialized: boolean = false
  private duration: number = 0
  private lightning: Lightning

  constructor(private readonly target: Unit) {}

  static afterSeeking(tree: Unit): State {
    const target = pickTargetHero(tree)
    return new Seek(target, 700, new Strangleroots(target))
  }

  update(tree: Unit): State {
    this.duration++
    if (!this.initialized) {
      this.initialized = true
      tree.paused = true
      this.target.addAbility(FourCC('A007'))
      this.lightning = new Lightning(
        LightningType.HealingWavePrimary,
        Vec2.unitPos(tree),
        Vec2.unitPos(this.target)
      )
      // TODO facing angle?
    }
    if (this.duration > strangleDuration) {
      this.cleanup(tree)
      return new Attacking(tree)
    }
    // strangle every 1 second
    if (this.duration % 100 == 0) {
      castTarget(
        tree.owner,
        AbilityIds.DummyStrangleroots,
        1,
        'entanglingroots',
        this.target,
        Vec2.unitPos(tree)
      )
    }
    if (this.duration != 0 && ModuloInteger(this.duration, 50) == 0) {
      const dmg = 50 * (strangleDamage / strangleDuration)
      tree.damageTarget(
        this.target.handle,
        dmg,
        0,
        false,
        true,
        ATTACK_TYPE_NORMAL,
        DAMAGE_TYPE_NORMAL,
        WEAPON_TYPE_WHOKNOWS
      )
      if (!this.target.isAlive()) {
        return this.interrupt(tree)
      }
    }

    return this
  }

  interrupt(tree: Unit): State {
    this.cleanup(tree)
    return new Attacking(tree)
  }

  private cleanup(tree: Unit) {
    tree.paused = false
    this.target.removeAbility(FourCC('A007'))
    this.lightning.destroy()
  }
}
