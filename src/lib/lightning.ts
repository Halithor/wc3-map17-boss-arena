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

  constructor(type: LightningType, start: Vec2, end: Vec2) {
    this.lightning = AddLightning(type, true, start.x, start.y, end.x, end.y)
  }

  destroy() {
    DestroyLightning(this.lightning)
  }
}
