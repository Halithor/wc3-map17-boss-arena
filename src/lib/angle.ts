/** @noSelfInFile */

import { Vec2 } from "./vec2"

/** Converts Degrees to Radians */
const DEGTORAD = 0.017453293
/** Converts Radians to Degrees */
const RADTODEG = 57.295779513
/** A class that represents an angle, to reduce confusion between degrees and radians */
export class Angle {
  rads: number

  protected constructor(radians: number) {
    this.rads = radians
  }

  public static fromDegrees(degrees: number): Angle {
    return new Angle(degrees * DEGTORAD)
  }

  public static fromRadians(radians: number): Angle {
    return new Angle(radians)
  }

  public static random(): Angle {
    return new Angle(GetRandomReal(0, math.pi * 2))
  }

  public get degrees() {
    return this.rads * RADTODEG
  }

  public get radians() {
    return this.rads
  }

  /** The cosine of this angle */
  public get cos() {
    return Cos(this.rads)
  }

  /** The sine of this angle */
  public get sin() {
    return Sin(this.rads)
  }

  /** A normalized vector of this angle */
  public get asDirection() {
    return new Vec2(Cos(this.rads), Sin(this.rads))
  }

  public add(other: Angle): Angle {
    return new Angle(this.radians + other.radians)
  }
}

// Helper methods that make it easy to construct Angles
export const degrees = Angle.fromDegrees
export const radians = Angle.fromRadians
export const randomAngle = Angle.random
