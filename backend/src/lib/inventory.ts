export interface InventoryItem {
  menuId: number
  quantity: number
  toppings?: number[]
}

export interface InventoryRequirement {
  menuId: number
  quantity: number
}

export function aggregateInventoryRequirements(items: InventoryItem[]): InventoryRequirement[] {
  const quantities = new Map<number, number>()
  const add = (menuId: number, quantity: number) => quantities.set(menuId, (quantities.get(menuId) ?? 0) + quantity)

  for (const item of items) {
    add(item.menuId, item.quantity)
    for (const toppingId of item.toppings ?? []) add(toppingId, item.quantity)
  }

  return [...quantities].map(([menuId, quantity]) => ({ menuId, quantity }))
}
