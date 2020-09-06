import {Players} from 'w3ts/globals/index'

export const PlayerOne = Players[0]
export const PlayerTwo = Players[1]
export const PlayerAncients = Players[10]

export class UnitIds {
  static readonly ScarabKing = FourCC('U000')

  static readonly TreantAncient = FourCC('e001')
  static readonly WispAncient = FourCC('e002')

  static readonly TreantMob = FourCC('n001')
  static readonly RockGolemMob = FourCC('n000')
}

export class DestructableIds {
  static readonly TreeId = FourCC('B000')
  static readonly RockId = FourCC('B001')

  static readonly PathingBlockerSmall = FourCC('YTpb')
  static readonly PathingBlockerBig = FourCC('YTpc')

  static isPathingBlocker(id: number): boolean {
    return id == this.PathingBlockerSmall || id == this.PathingBlockerBig
  }
}