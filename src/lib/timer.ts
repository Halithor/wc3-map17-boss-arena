import {Handle} from 'w3ts/index'

const freeTimers: Timer[] = []
let freeTimersCount: number = 0
const HEALD = 0x28829022
const timerData = {}

// doAfter uses a timer to perform an action after a given duration. Returns a cancelation function,
// which can be called to cancel the callback.
export function doAfter(timeout: number, callback: () => void): () => void {
  const t = Timer.get()
  t.start(timeout, () => {
    t.release()
    callback()
  })
  return () => t.release()
}

// doPeriodically uses a timer to periodically call your callback function, passing the callback a
// cancelation function, which can be used to stop the periodic timer. Also returns a cancelation
// callback to the caller, encase the caller wishes to cancel the timer. Upon cancelation, calls the
// final function.
export function doPeriodically(
  interval: number,
  callback: (cancel: () => void) => void,
  final?: () => void
): () => void {
  const t = Timer.get()
  const cancel = () => {
    if (final) {
      final()
    }
    t.release()
  }
  t.startPeriodic(interval, () => {
    callback(cancel)
  })
  return cancel
}

export function doPeriodicallyCounted(
  interval: number,
  count: number,
  callback: (cancel: () => void, index: number) => void,
  final?: () => void
): () => void {
  const t = Timer.get()
  const cancel = () => {
    if (final) {
      final()
    }
    t.release()
  }
  let i = 0
  t.startPeriodic(interval, () => {
    i++
    if (i > count) {
      cancel()
    }
    callback(cancel, i)
  })
  return cancel
}

// Timer wraps a timer object
export class Timer extends Handle<timer> {
  public static get(): Timer {
    if (freeTimersCount > 0) {
      freeTimersCount--
      freeTimers[freeTimersCount].data = 0
      return freeTimers[freeTimersCount]
    } else {
      return new Timer()
    }
  }

  public release() {
    if (this.data == HEALD) {
      return
    }
    this.data = HEALD
    this.pause()
    freeTimers[freeTimersCount] = this
    freeTimersCount++
  }

  private constructor() {
    if (Handle.initFromHandle()) {
      super()
    } else {
      super(CreateTimer())
    }
  }

  public set data(value: number) {
    timerData[this.id] = value
  }

  public get data(): number {
    return timerData[this.id]
  }

  public get elapsed(): number {
    return TimerGetElapsed(this.handle)
  }

  public get remaining(): number {
    return TimerGetRemaining(this.handle)
  }

  public get timeout(): number {
    return TimerGetTimeout(this.handle)
  }

  public destroy() {
    DestroyTimer(this.handle)
    return this
  }

  public pause() {
    PauseTimer(this.handle)
    return this
  }

  public resume() {
    ResumeTimer(this.handle)
    return this
  }

  public start(timeout: number, handlerFunc: () => void) {
    TimerStart(this.handle, timeout, false, handlerFunc)
    return this
  }

  public startPeriodic(timeout: number, handlerFunc: () => void) {
    TimerStart(this.handle, timeout, true, handlerFunc)
    return this
  }

  public static fromExpired(): Timer {
    return this.fromHandle(GetExpiredTimer())
  }

  public static fromHandle(handle: timer): Timer {
    return this.getObject(handle)
  }
}
