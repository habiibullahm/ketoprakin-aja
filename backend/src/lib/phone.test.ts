import assert from "node:assert/strict"
import test from "node:test"
import { normalizeIndonesianWhatsAppNumber } from "./phone"

test("normalizes common Indonesian WhatsApp formats idempotently", () => {
  for (const input of ["0812-3456 7890", "81234567890", "6281234567890", "+6281234567890", "+62 (812) 3456-7890"]) {
    assert.equal(normalizeIndonesianWhatsAppNumber(input), "+6281234567890")
  }
})

test("rejects malformed, duplicated, and foreign prefixes", () => {
  for (const input of ["+62+6281234567890", "62081234567890", "+60123456789", "0812abc789", "08123"]) {
    assert.throws(() => normalizeIndonesianWhatsAppNumber(input))
  }
})
