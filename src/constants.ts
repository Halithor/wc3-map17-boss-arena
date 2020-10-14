import {Players} from 'w3ts/globals/index'

export const PlayerOne = Players[0]
export const PlayerTwo = Players[1]
export const PlayerAncients = Players[10]

export class UnitIds {
  static readonly ScarabKing = FourCC('U000')
  static readonly FireDemon = FourCC('E002')

  static readonly TreantAncient = FourCC('e001')
  static readonly WispAncient = FourCC('e003')

  static readonly TreantMob = FourCC('n001')
  static readonly RockGolemMob = FourCC('n000')

  static readonly Dummy = FourCC('ndum')

  static readonly TrailOfFireWard = FourCC('o001')
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

export class ItemIds {
  static readonly Ahnk = FourCC('I000')

  static readonly LifeRune = FourCC('I001')
  static readonly ManaRune = FourCC('I002')
  static readonly RestoRune = FourCC('I003')
}

export class AbilityIds {
  static readonly CarrionCharge = FourCC('A003')
  static readonly HeavyBash = FourCC('A008')

  static readonly Firewave = FourCC('A00E')
  static readonly Flamestrike = FourCC('A00I')
  static readonly HearthsEmbrace = FourCC('A00F')
  static readonly TrailOfFlame = FourCC('A00D')

  static readonly DummyFlamestrikeStun = FourCC('A00L')
  static readonly DummyHearthsEmbraceStun = FourCC('A00M')

  static readonly DummyStrangleroots = FourCC('A00R')
  static readonly DummyWispAttackStun = FourCC('A00Q')
}
