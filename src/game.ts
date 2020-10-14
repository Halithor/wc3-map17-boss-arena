import {Unit, Trigger, Region, Rectangle, FogModifier} from 'w3ts/index'
import {UnitIds, PlayerAncients, PlayerOne, PlayerTwo, ItemIds} from 'constants'
import {Players} from 'w3ts/globals/index'
import {TreeAncient} from 'treeAncient'
import { RuneSystem } from 'runes'

const playerVisionRadius = 5100

export class Game {
  readonly startEncounter: Trigger
  private compVision: FogModifier
  private p1Vision: FogModifier
  private p2Vision: FogModifier

  treeAncient: TreeAncient
  runes: RuneSystem

  constructor() {
    this.startEncounter = new Trigger()
    this.treeAncient = new TreeAncient()
  }

  start() {
    PauseCompAI(PlayerAncients.handle, true)
    SetTimeOfDay(6)

    const startRegion = new Region()
    startRegion.addRect(Rectangle.fromHandle(gg_rct_FightStart))
    this.startEncounter.registerEnterRegion(startRegion.handle, null)
    this.startEncounter.addAction(() => this.onStartEncounter())

    this.spawnPlayers()
    this.setupOnePlayerSettings()

    this.runes = new RuneSystem()
  }

  private spawnPlayers() {
    let scarab = new Unit(
      PlayerOne,
      UnitIds.ScarabKing,
      GetRectCenterX(gg_rct_PlayerOneSpawn),
      GetRectCenterY(gg_rct_PlayerOneSpawn),
      90
    )
    SelectUnitForPlayerSingle(scarab.handle, scarab.owner.handle)
    SetCameraPositionForPlayer(scarab.owner.handle, scarab.x, scarab.y)
    // TODO: Other player
    let demon = new Unit(
      PlayerTwo,
      UnitIds.FireDemon,
      GetRectCenterX(gg_rct_PlayerTwoSpawn),
      GetRectCenterY(gg_rct_PlayerTwoSpawn),
      90
    )
    SelectUnitForPlayerSingle(demon.handle, demon.owner.handle)
    SetCameraPositionForPlayer(PlayerTwo.handle, demon.x, demon.y)
    // Ahnks
    scarab.addItemById(ItemIds.Ahnk)
    demon.addItemById(ItemIds.Ahnk)
  }

  private createVision() {
    this.compVision = new FogModifier(
      PlayerAncients,
      FOG_OF_WAR_VISIBLE,
      0,
      0,
      99999,
      true,
      true
    )
    this.compVision.start()
    this.p1Vision = new FogModifier(
      PlayerOne,
      FOG_OF_WAR_VISIBLE,
      0,
      0,
      playerVisionRadius,
      true,
      true
    )
    this.p1Vision.start()
    this.p2Vision = new FogModifier(
      PlayerTwo,
      FOG_OF_WAR_VISIBLE,
      0,
      0,
      playerVisionRadius,
      true,
      true
    )
    this.p2Vision.start()
  }

  // Debug function for one player play
  private setupOnePlayerSettings() {
    if (
      PlayerTwo.slotState != PLAYER_SLOT_STATE_PLAYING ||
      PlayerTwo.controller != MAP_CONTROL_USER
    ) {
      SetPlayerAllianceStateControlBJ(PlayerTwo.handle, PlayerOne.handle, true)
      SetPlayerAllianceStateFullControlBJ(
        PlayerTwo.handle,
        PlayerOne.handle,
        true
      )
    }
  }

  private onStartEncounter() {
    this.treeAncient.start()
    this.startEncounter.destroy()
    this.createVision()
    this.runes.start()
  }

  private cleanup() {
    this.startEncounter.destroy()
    this.treeAncient.cleanup()
    this.compVision.destroy()
    this.p1Vision.destroy()
    this.p2Vision.destroy()
    this.runes.start()
  }
}
