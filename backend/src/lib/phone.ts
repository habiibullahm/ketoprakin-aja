const ALLOWED_PHONE_CHARACTERS = /^\+?[0-9\s()-]+$/
const INDONESIAN_MOBILE = /^\+628\d{8,11}$/

export function normalizeIndonesianWhatsAppNumber(input: string): string {
  const trimmed = input.trim()
  if (!trimmed || !ALLOWED_PHONE_CHARACTERS.test(trimmed)) {
    throw new Error("Masukkan nomor WhatsApp Indonesia yang aktif")
  }

  const plusCount = (trimmed.match(/\+/g) ?? []).length
  if (plusCount > 1 || (plusCount === 1 && !trimmed.startsWith("+"))) {
    throw new Error("Masukkan nomor WhatsApp Indonesia yang aktif")
  }

  const compact = trimmed.replace(/[\s()-]/g, "")
  let digits = compact.startsWith("+") ? compact.slice(1) : compact

  if (digits.startsWith("08")) digits = `62${digits.slice(1)}`
  else if (digits.startsWith("8")) digits = `62${digits}`
  else if (!digits.startsWith("628")) {
    throw new Error("Masukkan nomor WhatsApp Indonesia yang aktif")
  }

  const canonical = `+${digits}`
  if (!INDONESIAN_MOBILE.test(canonical)) {
    throw new Error("Masukkan nomor WhatsApp Indonesia yang aktif")
  }
  return canonical
}
