import {Timer, Unit} from 'w3ts'
import {Players} from 'w3ts/globals'
import {addScriptHook, W3TS_HOOK} from 'w3ts/hooks'
import {Game} from 'game'
import {CameraSystem} from 'lib/camera'
import {initScarab} from 'scarabking'
import { initDemon } from 'firedemon'

const BUILD_DATE = compiletime(() => new Date().toUTCString())
const TS_VERSION = compiletime(() => require('typescript').version)
const TSTL_VERSION = compiletime(() => require('typescript-to-lua').version)

function tsMain() {
  initScarab()
  initDemon()

  const game = new Game()
  const camera = new CameraSystem()

  new Timer().start(1.0, false, () => {
    game.start()
  })
}

addScriptHook(W3TS_HOOK.MAIN_AFTER, tsMain)
