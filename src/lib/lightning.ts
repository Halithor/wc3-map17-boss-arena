import {Vec2} from './vec2'

export enum LightningType {
  ChainLightningPrimary = 'CLPB',
  ChainLightningSecondary = 'CLSB',
  Drain = 'DRAB',
  DrainLife = 'DRAL',
  DrainMana = 'DRAM',
  FingerOfDeath = 'AFOD',
  ForkedLightning = 'FORK',
  HealingWavePrimary = 'HWPB',
  HealingWaveSecondary = 'HWSB',
  LighingAttack = 'CHIM',
  MagicLeash = 'LEAS',
  ManaBurn = 'MBUR',
  ManaFlare = 'MFPB',
  SpiritLink = 'SPLK',
}

export class Lightning {
  private lightning: lightning

  constructor(type: LightningType, private _start: Vec2, private _end: Vec2) {
    this.lightning = AddLightning(
      type,
      true,
      _start.x,
      _start.y,
      _end.x,
      _end.y
    )
  }

  destroy() {
    if (this.lightning != null) {
      DestroyLightning(this.lightning)
    }
  }

  public set endPos(pos: Vec2) {
    this._end = pos
    this.moveLighting()
  }

  private moveLighting() {
    MoveLightning(
      this.lightning,
      true,
      this._start.x,
      this._start.y,
      this._end.x,
      this._end.y
    )
  }
}
