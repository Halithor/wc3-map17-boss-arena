import {Players} from 'w3ts/globals/index'

export const PlayerOne = Players[0]
export const PlayerTwo = Players[1]
export const PlayerAncients = Players[10]

export class UnitIds {
  static readonly ScarabKing = FourCC('U000')

  static readonly TreantAncient = FourCC('e001')
  static readonly WispAncient = FourCC('e002')
}
