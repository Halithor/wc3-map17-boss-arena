import {Timer} from 'lib/timer'
import {Unit} from 'w3ts/index'

export interface State {
  update(entity: Unit): State
  interrupt(entity: Unit): State
}

export class Statemachine {
  timer: Timer
  currentState: State

  constructor(
    startingState: State,
    private entity: Unit,
    timerTick: number = 0.01
  ) {
    this.currentState = startingState
    this.timer = Timer.get()

    this.timer.startPeriodic(timerTick, () => {
      if (
        entity.getAbilityLevel(FourCC('BSTN')) > 0 ||
        entity.getAbilityLevel(FourCC('BPSE')) > 0
      ) {
        // interrupt on stun, and skip updates
        this.currentState = this.currentState.interrupt(entity)
        return
      }
      // slow on poison
      if (entity.getAbilityLevel(FourCC('B006')) && math.random() > 0.85) {
        return
      }
      this.currentState = this.currentState.update(entity)
    })
  }

  public cleanup() {
    this.currentState.interrupt(this.entity)
    this.timer.release()
  }
}
