import assert from "node:assert/strict"
import test from "node:test"
import { aggregateInventoryRequirements } from "./inventory"

test("aggregates duplicate menus and toppings by parent quantity", () => {
  assert.deepEqual(aggregateInventoryRequirements([
    { menuId: 1, quantity: 2, toppings: [4, 5] },
    { menuId: 1, quantity: 3, toppings: [4] },
  ]), [
    { menuId: 1, quantity: 5 },
    { menuId: 4, quantity: 5 },
    { menuId: 5, quantity: 2 },
  ])
})
