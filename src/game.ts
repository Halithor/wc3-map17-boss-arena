import {Unit, Trigger, Region, Rectangle} from 'w3ts/index'
import {UnitIds, PlayerAncients, PlayerOne} from 'constants'
import {Players} from 'w3ts/globals/index'
import {TreeAncient} from 'treeAncient'

export class Game {
  readonly startEncounter: Trigger

  treeAncient: TreeAncient

  constructor() {
    this.startEncounter = new Trigger()
    this.treeAncient = new TreeAncient()
  }

  start() {
    PauseCompAI(PlayerAncients.handle, true)

    const startRegion = new Region()
    startRegion.addRect(Rectangle.fromHandle(gg_rct_FightStart))
    this.startEncounter.registerEnterRegion(startRegion.handle, null)
    this.startEncounter.addAction(() => this.onStartEncounter())

    this.spawnPlayers()
  }

  private spawnPlayers() {
    let scarab = new Unit(
      PlayerOne,
      UnitIds.ScarabKing,
      GetRectCenterX(gg_rct_HeroSpawn),
      GetRectCenterY(gg_rct_HeroSpawn),
      90
    )
    SelectUnitForPlayerSingle(scarab.handle, scarab.owner.handle)
    SetCameraPositionForPlayer(scarab.owner.handle, scarab.x, scarab.y)
    // TODO: Other player
  }

  private onStartEncounter() {
    this.treeAncient.start()
    this.startEncounter.destroy()
  }

  private restart() {}
}
