import {AbilityIds, DestructableIds, PlayerAncients, UnitIds} from 'constants'
import {CircleIndicator} from 'indicator'
import {Angle} from 'lib/angle'
import {damageEnemiesInArea} from 'lib/damage'
import {
  getRandomDestructableInRange,
  killDestructablesInCircle,
} from 'lib/destructables'
import {flashEffect} from 'lib/effect'
import {forUnitsInRange, getRandomUnitInRange} from 'lib/groups'
import {castImmediate} from 'lib/instantdummy'
import {Lightning, LightningType} from 'lib/lightning'
import {Projectile} from 'lib/projectile'
import {getRectCenter, Vec2} from 'lib/vec2'
import {State, Statemachine} from 'statemachine'
import {addScriptHook, Destructable, Effect, Unit, W3TS_HOOK} from 'w3ts/index'

const updateDelta = 0.01

const attackInterval = 135
const attackDuration = 900
const attackAoE = 150
const attackDamage = 125
const attackMinFlightTime = 1.6

let summonCount = 1
const mobSummonChanceFactor = 7
const mobsSummonWarmup = 150
const mobsSummonArea = 225

const laserArea = 125
const laserDamage = 25
const laserDuration = 800
const laserDelay = 150
const laserTrailDuration = 10
const laserSpeed = 320

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
    summonCount = 1
  }

  start() {
    const firstMove = new Move(this.spirit, getRectCenter(gg_rct_Boss_Spawn))
    this.statemachine = new Statemachine(firstMove, this.spirit, 0.01)
  }

  cleanup() {
    this.spirit.kill()
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

class PickNextState implements State {
  constructor(private lastState: State) {}

  update(spirit: Unit): State {
    const rand = math.random()
    if (!(this.lastState instanceof Move) && math.random() < 0.4) {
      print('move')
      return new Move(spirit)
    }
    if (math.random() < mobSummonChanceFactor / summonCount) {
      print('summon')
      summonCount++
      return new SummonMobs()
    }
    // Only after the summons have happend does the laser start replacing them
    if (rand < 0.5 && spirit.life / spirit.maxLife < 0.6) {
      print('laser')
      return new Lasers(spirit)
    }
    print('attacking')
    return new Attacking()
  }

  interrupt(entity: Unit): State {
    return this
  }
}

class Attacking implements State {
  duration: number = 0

  update(entity: Unit): State {
    this.duration++
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
      ball.fx.setColorByPlayer(PlayerAncients)
      entity.setAnimation('spell')
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
  constructor(entity: Unit, target?: Vec2) {
    this.target = target
    while (!this.target) {
      const index = math.random(0, moveRects.length - 1)
      this.target = getRectCenter(moveRects[index])
      // rejection sample to not pick the same spot
      if (Vec2.unitPos(entity).distanceTo(this.target) < 100) {
        this.target = null
      }
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
      entity.queueAnimation('stand,channel')
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

class SummonMobs implements State {
  duration: number = 0
  update(entity: Unit): State {
    this.duration++
    if (this.duration % 66 == 0) {
      flashEffect(
        'Objects\\Spawnmodels\\NightElf\\EntBirthTarget\\EntBirthTarget.mdl',
        Vec2.unitPos(entity),
        2.5
      )
    }
    if (this.duration > mobsSummonWarmup) {
      const target = getRandomDestructableInRange(
        Vec2.unitPos(entity),
        7000,
        (d: Destructable) => {
          return !DestructableIds.isPathingBlocker(d.typeId) && d.life > 0
        }
      )
      if (target) {
        const pos = Vec2.widgetPos(target)
        killDestructablesInCircle(pos, mobsSummonArea, (d: Destructable) => {
          if (d.typeId == DestructableIds.TreeId) {
            const u = new Unit(
              PlayerAncients,
              UnitIds.TreantMob,
              d.x,
              d.y,
              Angle.random().degrees
            )
            flashEffect(
              'Objects\\Spawnmodels\\NightElf\\EntBirthTarget\\EntBirthTarget.mdl',
              Vec2.widgetPos(d)
            )
          }
          if (d.typeId == DestructableIds.RockId) {
            const u = new Unit(
              PlayerAncients,
              UnitIds.RockGolemMob,
              d.x,
              d.y,
              Angle.random().degrees
            )
            flashEffect(
              'Abilities\\Spells\\Orc\\EarthQuake\\EarthQuakeTarget.mdl',
              Vec2.widgetPos(d),
              0.5
            )
          }
        })
      }
      return new PickNextState(this)
    }
    return this
  }
  interrupt(entity: Unit): State {
    return new PickNextState(this)
  }
}

class LaserInfo {
  constructor(
    public target: Unit,
    public pos: Vec2,
    public lighting: Lightning,
    public indicator: CircleIndicator
  ) {}
}

class Lasers implements State {
  duration: number = 0
  lasers: LaserInfo[]

  constructor(entity: Unit) {
    this.lasers = []
    const startPos = Vec2.unitPos(entity)
    forUnitsInRange(startPos, 7000, (u: Unit) => {
      if (u.isEnemy(entity.owner) && u.isHero()) {
        const pos = Vec2.unitPos(u)
        const indicator = new CircleIndicator(pos, laserArea, 8)
        const laser = new Lightning(LightningType.DrainMana, startPos, pos)
        this.lasers.push(new LaserInfo(u, pos, laser, indicator))
      }
    })
  }

  update(entity: Unit): State {
    this.duration++
    // Change effect to show that its active
    if (this.duration == laserDelay) {
      const startPos = Vec2.unitPos(entity)
      for (let laser of this.lasers) {
        laser.lighting.destroy()
        laser.lighting = new Lightning(
          LightningType.ChainLightningPrimary,
          startPos,
          laser.pos
        )
        laser.lighting
      }
    }
    if (this.duration >= laserDelay) {
      for (let laser of this.lasers) {
        const nextPos = laser.pos.moveTowards(
          Vec2.unitPos(laser.target),
          laserSpeed * updateDelta
        )
        laser.pos = nextPos
        if (this.duration % 2 == 0) {
          // do this only every other update...
          laser.indicator.pos = nextPos
          laser.lighting.endPos = nextPos
        }
        // Deal damage every 1/4 second
        if (this.duration % 25 == 0) {
          damageEnemiesInArea(
            entity,
            laser.pos,
            laserArea,
            laserDamage,
            true,
            ATTACK_TYPE_MELEE,
            DAMAGE_TYPE_NORMAL,
            WEAPON_TYPE_WHOKNOWS
          )
          const ward = new Unit(
            entity.owner,
            UnitIds.LaserTrailWard,
            laser.pos.x,
            laser.pos.y,
            0
          )
          ward.applyTimedLife(FourCC('BHwe'), laserTrailDuration)
          killDestructablesInCircle(laser.pos, laserArea + 64)
        }
      }
    }
    if (this.duration > laserDuration) {
      this.cleanup()
      return new PickNextState(this)
    }

    return this
  }

  interrupt(entity: Unit): State {
    this.cleanup()
    return new PickNextState(this)
  }

  cleanup() {
    this.lasers.forEach((laser) => {
      // being very defensive because this errors sometimes?
      if (laser) {
        if (laser.indicator) {
          laser.indicator.remove()
        }
        laser.lighting.destroy()
      }
    })
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
