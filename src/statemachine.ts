import {Timer} from 'lib/timer'
import {Unit} from 'w3ts/index'

export interface State {
  update(entity: Unit): State
  interrupt(entity: Unit): State
}

export class Statemachine {
  timer: Timer
  currentState: State

  constructor(startingState: State, entity: Unit, timerTick: number = 0.01) {
    this.currentState = startingState
    this.timer = Timer.get()

    this.timer.startPeriodic(0.01, () => {
      if (
        entity.getAbilityLevel(FourCC('BSTN')) > 0 ||
        entity.getAbilityLevel(FourCC('BPSE')) > 0
      ) {
        // interrupt on stun
        this.currentState = this.currentState.interrupt(entity)
      }
      this.currentState = this.currentState.update(entity)
    })
  }

  public cleanup() {
    this.timer.release()
  }
}
