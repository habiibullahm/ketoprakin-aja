const ALLOWED_PHONE_CHARACTERS = /^\+?[0-9\s()-]+$/
const INDONESIAN_MOBILE = /^\+628\d{8,11}$/

export function normalizeIndonesianPhone(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed || !ALLOWED_PHONE_CHARACTERS.test(trimmed)) return null
  const plusCount = (trimmed.match(/\+/g) ?? []).length
  if (plusCount > 1 || (plusCount === 1 && !trimmed.startsWith("+"))) return null
  const compact = trimmed.replace(/[\s()-]/g, "")
  let digits = compact.startsWith("+") ? compact.slice(1) : compact
  if (digits.startsWith("08")) digits = `62${digits.slice(1)}`
  else if (digits.startsWith("8")) digits = `62${digits}`
  else if (!digits.startsWith("628")) return null
  const canonical = `+${digits}`
  return INDONESIAN_MOBILE.test(canonical) ? canonical : null
}
