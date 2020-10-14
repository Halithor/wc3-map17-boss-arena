import {AbilityIds, PlayerAncients, UnitIds} from 'constants'
import {CircleIndicator} from 'indicator'
import {Angle} from 'lib/angle'
import {damageEnemiesInArea} from 'lib/damage'
import {killDestructablesInCircle} from 'lib/destructables'
import {flashEffect} from 'lib/effect'
import {getRandomUnitInRange} from 'lib/groups'
import {castImmediate} from 'lib/instantdummy'
import {Projectile} from 'lib/projectile'
import {getRectCenter, Vec2} from 'lib/vec2'
import {State, Statemachine} from 'statemachine'
import {addScriptHook, Destructable, Effect, Unit, W3TS_HOOK} from 'w3ts/index'

const updateDelta = 0.01

const attackInterval = 150
const attackDuration = 900
const attackAoE = 150
const attackDamage = 110
const attackMinFlightTime = 2.0

let moveRects: rect[]

export class Spirit {
  private spirit: Unit
  private statemachine: Statemachine

  constructor(pos: Vec2) {
    this.spirit = new Unit(
      PlayerAncients,
      UnitIds.WispAncient,
      pos.x,
      pos.y,
      270
    )
  }

  start() {
    const firstMove = new Move(getRectCenter(gg_rct_Boss_Spawn))
    this.statemachine = new Statemachine(firstMove, this.spirit, 0.01)
  }

  cleanup() {
    throw new Error('Method not implemented.')
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

class PickNextState implements State {
  constructor(private lastState: State) {}

  update(spirit: Unit): State {
    const rand = math.random()
    if (this.lastState instanceof Attacking && rand < 0.5) {
      print('move')
      return new Move()
    } else {
      print('attacking')
      return new Attacking()
    }
  }

  interrupt(entity: Unit): State {
    return this
  }
}

class Attacking implements State {
  duration: number = 0

  update(entity: Unit): State {
    this.duration++
    if (this.duration % 25 == 0) {
      print('attacking ' + this.duration.toString())
    }
    if (this.duration % attackInterval == 0) {
      const target = pickTargetHero(entity)
      const pos = Vec2.unitPos(target)
      const origin = Vec2.unitPos(entity)
      const angleTo = angleHack(origin, pos)
      entity.facing = angleTo.degrees

      const indicator = new CircleIndicator(pos, attackAoE, 16)

      const distance = origin.distanceTo(pos)
      const groundSpeed = math.min(700, distance / attackMinFlightTime)
      const ball = new Projectile(
        origin.moveTowards(pos, 50),
        pos,
        groundSpeed,
        1400,
        // 'Abilities\\Weapons\\WitchDoctorMissile\\WitchDoctorMissile.mdl',
        'units\\nightelf\\Wisp\\Wisp.mdl',
        (_target: Unit | Vec2 | Destructable, pos: Vec2) => {
          killDestructablesInCircle(pos, attackAoE + 64)
          damageEnemiesInArea(
            entity,
            pos,
            attackAoE,
            attackDamage,
            true,
            ATTACK_TYPE_MELEE,
            DAMAGE_TYPE_NORMAL,
            WEAPON_TYPE_WHOKNOWS
          )
          indicator.remove()
          castImmediate(
            entity.owner,
            AbilityIds.DummyWispAttackStun,
            1,
            'stomp',
            pos
          )
          flashEffect('Units\\NightElf\\Wisp\\WispExplode.mdl', pos, 0.5)
        }
      )
      ball.fx.scale = 1
      // ball.fx.setColorByPlayer(PlayerAncients)
      entity.setAnimation('attack')
    }
    if (this.duration > attackDuration) {
      return new PickNextState(this)
    }
    return this
  }
  interrupt(entity: Unit): State {
    // interrupting attack state doesn't do anything
    return this
  }
}

class Move implements State {
  target: Vec2
  duration: number = 0
  effect1: Effect
  effect2: Effect
  constructor(target?: Vec2) {
    this.target = target
    if (!this.target) {
      const index = math.random(0, moveRects.length - 1)
      this.target = getRectCenter(moveRects[index])
    }

    this.effect1 = new Effect(
      'Abilities\\Spells\\Human\\MassTeleport\\MassTeleportTo.mdl',
      this.target.x,
      this.target.y
    )
    this.effect1.scale = 2
  }
  update(entity: Unit): State {
    if (!this.effect2) {
      this.effect2 = new Effect(
        'Abilities\\Spells\\Human\\MassTeleport\\MassTeleportTo.mdl',
        entity.x,
        entity.y
      )
      this.effect2.scale = 2
    }
    if (this.duration == 0) {
      entity.facing = angleHack(Vec2.unitPos(entity), this.target).degrees
    }
    this.duration++
    if (this.duration > 250) {
      flashEffect(
        'Abilities\\Spells\\Human\\MassTeleport\\MassTeleportCaster.mdl',
        Vec2.unitPos(entity),
        2
      )
      entity.x = this.target.x
      entity.y = this.target.y
      this.cleanup()
      return new PickNextState(this)
    }
    return this
  }

  interrupt(entity: Unit): State {
    this.cleanup()
    return new PickNextState(this)
  }

  private cleanup() {
    this.effect1.destroy()
    this.effect2.destroy()
  }
}

// TODO remove when Vec package fixed
function angleHack(a: Vec2, b: Vec2): Angle {
  const dir = a.normalizedPointerTo(b)
  return Angle.fromRadians(Atan2(dir.y, dir.x))
}

function init() {
  // init the array of rects here, since it doesn't seem to work in the file plain.
  moveRects = [
    gg_rct_Boss_Spawn,
    gg_rct_StatueNE,
    gg_rct_StatueNW,
    gg_rct_StatueSE,
    gg_rct_StatueSW,
  ]
}

addScriptHook(W3TS_HOOK.MAIN_AFTER, init)
