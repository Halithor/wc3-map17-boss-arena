/** @noSelfInFile **/
import {Destructable, Effect, Unit, Widget} from 'w3ts/index'
import {forDestructablesInCircle} from './destructables'
import {forUnitsInRange} from './groups'
import {doPeriodically} from './timer'
import {Vec2} from './vec2'

const interval = 0.03

export class Projectile {
  fx: Effect
  private releaseTimer: (this: void) => void
  private _impactUnits = false
  private _impactDestructables = false
  private _destroyOnImpact = false
  private originalDistance: number
  destFilter: () => (d: Destructable) => boolean
  unitFilter: () => (u: Unit) => boolean
  vertSpeed: number

  constructor(
    private pos: Vec2,
    private target: Vec2 | Unit,
    private groundSpeed: number,
    private gravity: number,
    effectPath: string,
    private onImpact: (target: Vec2 | Unit | Destructable, pos: Vec2) => void
  ) {
    this.fx = new Effect(effectPath, pos.x, pos.y)
    this.fx.z = pos.terrainZ + 80
    const endPeriodic = doPeriodically(interval, () => this.tick())
    // Wrap to make the lua converter happy
    this.releaseTimer = function (this: void) {
      endPeriodic()
    }
    let targetPos: Vec2
    if (target instanceof Vec2) {
      targetPos = target
    } else {
      targetPos = Vec2.unitPos(target)
    }
    this.originalDistance = pos.distanceTo(targetPos)
    const flightTime = this.originalDistance / groundSpeed
    const y0 = this.fx.z
    const yEnd = targetPos.terrainZ
    // motion equation to land on the height of the platform targeted.
    this.vertSpeed =
      (yEnd - y0) / flightTime + (flightTime * this.gravity) / 2.0
  }

  private tick() {
    let targetPos: Vec2
    if (this.target instanceof Vec2) {
      targetPos = this.target
    } else {
      targetPos = Vec2.unitPos(this.target)
    }
    const targetZ = targetPos.terrainZ

    const distance = this.pos.distanceTo(targetPos)

    // const flightTime = distance / this.groundSpeed
    // const heightDiff = targetZ - this.fx.z
    // const verticalSpeed = heightDiff / flightTime - 0.5 * this.arc * flightTime
    this.vertSpeed = this.vertSpeed - this.gravity * interval

    if (this.groundSpeed * interval >= distance) {
      this.onImpact(this.target, targetPos)
      this.fx.destroy()
      this.releaseTimer()
    } else {
      const nextPos = this.pos.moveTowards(
        targetPos,
        this.groundSpeed * interval
      )
      const nextZ = math.max(
        this.fx.z + this.vertSpeed * interval,
        nextPos.terrainZ + 30
      )
      this.fx.setPosition(nextPos.x, nextPos.y, nextZ)
      this.pos = nextPos

      if (this._impactUnits) {
        forUnitsInRange(
          this.pos,
          80,
          (u: Unit) => {
            if (this.unitFilter()(u)) {
              this.onImpact(u, this.pos)
              if (this._destroyOnImpact) {
                this.fx.destroy()
                this.releaseTimer()
              }
            }
          },
          true
        )
      }
      if (this._impactDestructables) {
        forDestructablesInCircle(this.pos, 80 + 64, (d: Destructable) => {
          if (this.destFilter()(d)) {
            this.onImpact(d, this.pos)
            if (this._destroyOnImpact) {
              this.fx.destroy()
              this.releaseTimer()
            }
          }
        })
      }
    }
  }

  public impactsUnits(value: boolean, filter?: (u: Unit) => boolean) {
    this._impactUnits = value
    this.unitFilter = () => filter
  }

  public impactsDestructables(
    value: boolean,
    filter: (d: Destructable) => boolean
  ) {
    this._impactDestructables = value
    this.destFilter = () => filter
  }

  public destroyOnImpact(value: boolean) {
    this._destroyOnImpact = value
  }
}
