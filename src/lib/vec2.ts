/** @noSelfInFile */

import {Angle} from 'lib/angle'
import {Unit} from 'w3ts/index'

/**
 * Class that encapsulates a position in the game.
 */
export class Vec2 {
  private xInternal: number
  private yInternal: number

  constructor(x: number, y: number) {
    this.xInternal = x
    this.yInternal = y
  }

  static unitPos(u: Unit): Vec2 {
    return new Vec2(u.x, u.y)
  }

  public get x() {
    return this.xInternal
  }

  public get y() {
    return this.yInternal
  }

  public add(other: Vec2): Vec2 {
    return new Vec2(this.x + other.x, this.y + other.y)
  }

  public sub(other: Vec2): Vec2 {
    return new Vec2(this.x - other.x, this.y - other.y)
  }

  public scale(factor: number): Vec2 {
    return new Vec2(this.x * factor, this.y * factor)
  }

  public mul(other: Vec2): Vec2 {
    return new Vec2(this.x * other.x, this.y * other.y)
  }

  public dot(other: Vec2): number {
    return this.x * other.x + this.y * other.y
  }

  public get length(): number {
    return SquareRoot(this.x * this.x + this.y * this.y)
  }

  public get lengthSq(): number {
    return this.x * this.x + this.y * this.y
  }

  public get norm(): Vec2 {
    const len = this.length
    if (len > 0) {
      return new Vec2(this.x / len, this.y / len)
    }
    return new Vec2(this.x, this.y)
  }

  public rotate(angle: Angle): Vec2 {
    const cos = angle.cos
    const sin = angle.sin

    const px = this.x * cos - this.y * sin
    const py = this.x * sin + this.y * cos
    return new Vec2(px, py)
  }

  // TODO(Halithor): Figure out why this doesn't work!
  // public angleTo(other: Vec2): Angle {
  //   // const ang = Atan2(other.y - this.y, other.x - this.x)
  //   // return Angle.fromRadians(0)
  //   // return new Angle(0)
  // }

  // return a normalized vector in the direction of the target. When the target and this vector are equal, return a
  // vector pointing right.
  public normalizedPointerTo(other: Vec2): Vec2 {
    let v = other.sub(this).norm
    if (v.length == 0) {
      return new Vec2(1, 0)
    }
    return v
  }

  public moveTowards(other: Vec2, dist: number) {
    return this.add(this.normalizedPointerTo(other).scale(dist))
  }

  public polarOffset(angle: Angle, dist: number) {
    return this.add(angle.asDirection.scale(dist))
  }

  public distanceTo(other: Vec2) {
    return other.sub(this).length
  }

  public distanceToSq(other: Vec2) {
    return other.sub(this).lengthSq
  }

  // Is this Vec2 in the given range of the other vec2
  public inRange(other: Vec2, radius: number): boolean {
    return this.distanceToSq(other) < radius * radius
  }
}

// Make a new position.
export const vec2 = (x: number, y: number) => new Vec2(x, y)

export function getRandomPosInRect(rect: rect): Vec2 {
  return new Vec2(
    GetRandomInt(GetRectMinX(rect), GetRectMaxX(rect)),
    GetRandomInt(GetRectMinY(rect), GetRectMaxY(rect))
  )
}
