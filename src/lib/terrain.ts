import {Vec2} from './vec2'
import {Item, Rectangle} from 'w3ts/index'

export function isTerrainWalkable(pos: Vec2): boolean {
  const dummyItem = new Item(FourCC('wolg'), 0, 0)
  dummyItem.visible = false
  const itemSearchRect = new Rectangle(0, 0, 128, 128)
  const maxRangeSq = 100
  // First hide items in the way.
  const itemsInWay: Item[] = []
  itemSearchRect.move(pos.x, pos.y)
  itemSearchRect.enumItems(null, () => {
    const i = Item.fromHandle(GetEnumItem())
    i.visible = false
    itemsInWay.push(i)
  })
  dummyItem.setPosition(pos.x, pos.y) // Unhides the item
  const newPos = Vec2.widgetPos(dummyItem)
  dummyItem.visible = false // hide it again
  dummyItem.destroy()

  // Unhide items in the way
  itemsInWay.forEach((i) => {
    i.visible = true
  })

  return (
    newPos.distanceToSq(pos) < maxRangeSq &&
    !IsTerrainPathable(pos.x, pos.y, PATHING_TYPE_WALKABILITY)
  )
}
