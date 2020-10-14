import {
  Unit,
  Trigger,
  Region,
  Rectangle,
  FogModifier,
  Destructable,
  Group,
} from 'w3ts/index'
import {UnitIds, PlayerAncients, PlayerOne, PlayerTwo, ItemIds} from 'constants'
import {Players} from 'w3ts/globals/index'
import {TreeAncient} from 'treeAncient'
import {RuneSystem} from 'runes'
import {findNearestUnit, forUnitsInRange, forUnitsInRect} from 'lib/groups'
import {Vec2} from 'lib/vec2'
import {forDestructablesInRect} from 'lib/destructables'
import {doAfter, Timer} from 'lib/timer'
import {Spirit} from 'spirit'

const playerVisionRadius = 5100

export class Game {
  private startEncounter: Trigger
  private compVision: FogModifier
  private p1Vision: FogModifier
  private p2Vision: FogModifier

  treeAncient: TreeAncient
  runes: RuneSystem
  scarab: Unit
  demon: Unit
  swap: Trigger
  gameOver: Trigger
  bossDeath: Trigger
  mobTimer: Timer
  spirit: Spirit

  start() {
    this.startEncounter = new Trigger()
    this.treeAncient = new TreeAncient()

    PauseCompAI(PlayerAncients.handle, true)
    SetTimeOfDay(6)

    const startRegion = new Region()
    startRegion.addRect(Rectangle.fromHandle(gg_rct_FightStart))
    this.startEncounter.registerEnterRegion(startRegion.handle, null)
    this.startEncounter.addAction(() => this.onStartEncounter())

    this.spawnPlayers()
    this.setupOnePlayerSettings()
    this.setupGameOver()
    this.setupMobOrdering()
    this.setupBossDeath()

    this.runes = new RuneSystem()
  }

  private setupGameOver() {
    this.gameOver = new Trigger()
    this.gameOver.registerAnyUnitEvent(EVENT_PLAYER_UNIT_DEATH)
    let gameOver = false
    this.gameOver.addAction(() => {
      if (!this.scarab.isAlive() && !this.demon.isAlive() && !gameOver) {
        gameOver = true
        print('It seems the forest is victorious today...')
        doAfter(2.0, () => {
          print(
            'But lets |cffffcc00roll back the clock|r and |cff990000try this one more time.'
          )
          doAfter(5.0, () => {
            this.cleanup()
            this.start()
          })
        })
      }
    })
  }

  private setupBossDeath() {
    this.bossDeath = new Trigger()
    this.bossDeath.registerAnyUnitEvent(EVENT_PLAYER_UNIT_DEATH)
    this.bossDeath.addAction(() => {
      const boss = Unit.fromHandle(GetTriggerUnit())
      if (boss.typeId == UnitIds.TreantAncient) {
        const pos = Vec2.unitPos(this.treeAncient.tree)
        this.treeAncient.cleanup()
        this.treeAncient = null
        print(
          'You may have destroyed my physical form, but my spirit is stronger still!'
        )
        doAfter(2.0, () => {
          this.spirit = new Spirit(pos)
          this.spirit.start()
        })
      }
      if (boss.typeId == UnitIds.WispAncient) {
        this.spirit.cleanup()
        print('Nooooooooo!')
        print(
          'You may have defeated me, but I will destroy my forest before I ever let you get your hands on her power!'
        )
        doAfter(5.0, () => {
          print('|cffffcc00You have won! Thanks for playing!|r')
          print('The game will restart in a few seconds...')
          doAfter(10, () => {
            print('One more time!')
            this.cleanup()
            this.start()
          })
        })
      }
    })
  }

  private setupMobOrdering() {
    this.mobTimer = Timer.get()
    this.mobTimer.startPeriodic(5, () => {
      const g = new Group()
      g.enumUnitsOfPlayer(
        PlayerAncients,
        Filter(() => {
          const u = Unit.fromHandle(GetFilterUnit())
          return (
            u.typeId != UnitIds.TreantAncient && u.typeId != UnitIds.WispAncient
          )
        })
      )
      g.for(() => {
        const u = Unit.fromHandle(GetEnumUnit())
        const target = findNearestUnit(
          Vec2.unitPos(u),
          2500,
          Filter(() => {
            return Unit.fromHandle(GetFilterUnit()).isEnemy(PlayerAncients)
          })
        )
        u.issueOrderAt('attack', target.x, target.y)
      })
      g.destroy()
    })
  }

  private spawnPlayers() {
    this.scarab = new Unit(
      PlayerOne,
      UnitIds.ScarabKing,
      GetRectCenterX(gg_rct_PlayerOneSpawn),
      GetRectCenterY(gg_rct_PlayerOneSpawn),
      90
    )
    SelectUnitForPlayerSingle(this.scarab.handle, this.scarab.owner.handle)
    SetCameraPositionForPlayer(
      this.scarab.owner.handle,
      this.scarab.x,
      this.scarab.y
    )
    // TODO: Other player
    this.demon = new Unit(
      PlayerTwo,
      UnitIds.FireDemon,
      GetRectCenterX(gg_rct_PlayerTwoSpawn),
      GetRectCenterY(gg_rct_PlayerTwoSpawn),
      90
    )
    SelectUnitForPlayerSingle(this.demon.handle, this.demon.owner.handle)
    SetCameraPositionForPlayer(PlayerTwo.handle, this.demon.x, this.demon.y)
    // Ahnks
    this.scarab.addItemById(ItemIds.Ahnk)
    this.demon.addItemById(ItemIds.Ahnk)

    this.swap = new Trigger()
    this.swap.registerPlayerChatEvent(PlayerOne, '-swap', true)
    this.swap.registerPlayerChatEvent(PlayerTwo, '-swap', true)
    this.swap.addAction(() => {
      const temp = this.scarab.owner
      this.scarab.owner = this.demon.owner
      this.demon.owner = temp
    })
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
    // This doesn't get cleaned up b/c it's for test mode
    const killTrg = new Trigger()
    killTrg.registerPlayerChatEvent(PlayerOne, '-kill', true)
    killTrg.addAction(() => {
      EnumUnitsSelected(PlayerOne.handle, null, () => {
        KillUnit(GetEnumUnit())
      })
    })
  }

  private onStartEncounter() {
    this.treeAncient.start()
    this.startEncounter.destroy()
    this.createVision()
    this.runes.start()
  }

  private cleanup() {
    this.compVision.destroy()
    this.p1Vision.destroy()
    this.p2Vision.destroy()
    this.gameOver.destroy()
    this.runes.cleanup()
    this.mobTimer.release()
    this.bossDeath.destroy()

    this.scarab.destroy()
    this.demon.destroy()

    if (this.treeAncient) {
      this.treeAncient.cleanup()
    }
    if (this.spirit) {
      this.spirit.cleanup()
    }

    // General cleanup
    const playable = Rectangle.fromHandle(GetPlayableMapRect())
    forUnitsInRect(playable, (u: Unit) => {
      u.destroy()
    })
    EnumItemsInRect(playable.handle, null, () => {
      RemoveItem(GetEnumItem())
    })
    forDestructablesInRect(playable, (d: Destructable) => {
      d.heal(d.maxLife, true)
    })
  }
}
