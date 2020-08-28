import {Timer, Unit} from 'w3ts/index'

export interface State {
  update(entity: Unit): State
  interrupt(): State
}

export class Statemachine {
  timer: Timer
  currentState: State

  constructor(startingState: State, entity: Unit) {
    this.currentState = startingState
    this.timer = new Timer()

    this.timer.start(0.01, true, () => {
      this.currentState = this.currentState.update(entity)
    })
  }
}
