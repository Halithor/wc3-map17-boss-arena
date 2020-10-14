import {MapPlayer, Trigger, Timer, addScriptHook, W3TS_HOOK} from 'w3ts/index'
import {Players} from 'w3ts/globals/index'
import {PlayerOne, PlayerTwo} from 'constants'

// The global running system
let system: CameraSystem

// Divide by 100 to account for the percentage aspect of our system
const camDistanceBase: number = 1650 / 100.0

const chatMessageTrigger = '-cam'
const chatMessageLock1 = 'l'
const chatMessageLock2 = 'lock'

class PlayerCameraSetting {
  distance: number = 150.0
  locked: boolean = true
}

export class CameraSystem {
  private trg: Trigger
  private settings: PlayerCameraSetting[] = []
  private timer: Timer

  constructor() {
    this.trg = new Trigger()

    for (let i = 0; i < bj_MAX_PLAYERS; i++) {
      this.settings[i] = new PlayerCameraSetting()
      this.updatePlayerCamera(Players[i], true)
      this.trg.registerPlayerChatEvent(Players[i], chatMessageTrigger, false)
    }

    this.trg.addAction(() => {
      const speaker = MapPlayer.fromEvent()
      const string = GetEventPlayerChatString().trim()
      let message = string.substring(chatMessageTrigger.length).trim()
      this.settings[speaker.id].locked = false
      if (
        message.endsWith(chatMessageLock1) ||
        message.endsWith(chatMessageLock2)
      ) {
        this.settings[speaker.id].locked = true
        message = message
          .replace(chatMessageLock2, '')
          .replace(chatMessageLock1, '')
          .trim()
      }
      this.settings[speaker.id].distance = S2R(message)
      DisplayTimedTextToPlayer(
        speaker.handle,
        0,
        0,
        10,
        'Setting camera to ' +
          this.settings[speaker.id].distance.toString() +
          '% distance' +
          (this.settings[speaker.id].locked ? 'Camera locked.' : '')
      )
      this.updatePlayerCamera(speaker, false)
    })

    this.timer = new Timer()
    this.timer.start(0.03, true, () => {
      if (this.settings[PlayerOne.id].locked) {
        this.updatePlayerCamera(PlayerOne, true)
      }
      if (this.settings[PlayerTwo.id].locked) {
        this.updatePlayerCamera(PlayerTwo, true)
      }
    })
  }

  updatePlayerCamera(p: MapPlayer, instant: boolean) {
    const curDistance = GetCameraField(CAMERA_FIELD_TARGET_DISTANCE)
    const goalDistance = this.settings[p.id].distance * camDistanceBase
    if (math.abs(curDistance - goalDistance) > 10) {
      SetCameraFieldForPlayer(
        p.handle,
        CAMERA_FIELD_TARGET_DISTANCE,
        goalDistance,
        instant ? 0 : 0.8
      )
    }
  }

  pause() {
    this.timer.pause()
  }

  resume() {
    this.timer.resume()
  }
}

export function pauseCameraSystem(paused: boolean) {
  if (paused) {
    system.pause()
  } else {
    system.resume()
  }
}

export function initCamSystem() {
  system = new CameraSystem()
}

