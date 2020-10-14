import {Timer} from 'w3ts'
import {addScriptHook, W3TS_HOOK} from 'w3ts/hooks'
import {Game} from 'game'
import {initCamSystem} from 'lib/camera'
import {initScarab} from 'scarabking'
import {initDemon} from 'firedemon'

const BUILD_DATE = compiletime(() => new Date().toUTCString())
const TS_VERSION = compiletime(() => require('typescript').version)
const TSTL_VERSION = compiletime(() => require('typescript-to-lua').version)

function tsMain() {
  initScarab()
  initDemon()
  initCamSystem()

  let game = new Game()

  new Timer().start(1.0, false, () => {
    game.start()
  })
}

addScriptHook(W3TS_HOOK.MAIN_AFTER, tsMain)
