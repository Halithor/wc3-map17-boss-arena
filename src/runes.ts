import {ItemIds} from 'constants'
import {doPeriodically} from 'lib/timer'
import {Vec2} from 'lib/vec2'
import {Item} from 'w3ts/index'

export class RuneSystem {
  cleanup: () => void
  runeRects: rect[]

  constructor() {
    this.runeRects = [
      gg_rct_Rune00,
      gg_rct_Rune01,
      gg_rct_Rune02,
      gg_rct_Rune03,
      gg_rct_Rune04,
      gg_rct_Rune05,
      gg_rct_Rune06,
      gg_rct_Rune07,
      gg_rct_Rune08,
      gg_rct_Rune09,
      gg_rct_Rune10,
      gg_rct_Rune11,
      gg_rct_Rune12,
      gg_rct_Rune13,
      gg_rct_Rune14,
      gg_rct_Rune15,
    ]
  }

  start() {
    const cancel = doPeriodically(10, () => {
      const index = math.random(0, this.runeRects.length - 1)
      const rect = this.runeRects[index]
      const pos = new Vec2(GetRectCenterX(rect), GetRectCenterY(rect))
      print('rune ' + index.toString() + '@' + pos.toString())
      let clear = true
      EnumItemsInRect(rect, null, () => {
        clear = false
      })
      if (clear) {
        const rand = math.random()
        if (rand < 0.45) {
          new Item(ItemIds.LifeRune, pos.x, pos.y)
        } else if (rand < 0.9) {
          new Item(ItemIds.ManaRune, pos.x, pos.y)
        } else {
          new Item(ItemIds.RestoRune, pos.x, pos.y)
        }
      }
    })
    this.cleanup = function () {
      cancel()
    }
  }
}
