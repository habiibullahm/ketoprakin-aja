import { expect, test, type APIRequestContext, type Page } from "@playwright/test"

async function loginAsMerchant(page: Page) {
  await page.goto("/merchant/login")
  await page.getByRole("button", { name: "Use demo account" }).click()
  await page.getByRole("button", { name: "Login", exact: true }).click()
  await expect(page).toHaveURL(/\/merchant\/kitchen/)
}

async function createGuestOrder(request: APIRequestContext, customerName: string, authenticated = false) {
  let token: string | undefined
  if (authenticated) {
    const registration = await request.post("/api/auth/register", {
      data: { email: `e2e-${Date.now()}-${Math.random()}@example.com`, password: "customer123", name: customerName },
    })
    expect(registration.ok()).toBeTruthy()
    token = (await registration.json()).token
  }
  const menu = await request.get("/api/menu/available")
  const items = await menu.json()
  const order = await request.post("/api/orders/guest", {
    data: {
      customerName,
      whatsappNumber: "0812-3456 7890",
      orderType: "pickup",
      paymentMethod: "qris",
      items: [{ menuId: items[0].id, quantity: 1, spiceLevel: 5, garlicAmount: "normal", sauceConsistency: "pas" }],
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  expect(order.status()).toBe(201)
  return { order: await order.json(), token }
}

test("buyer landing only presents the storefront", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByText("Mau ketoprak level berapa hari ini?")).toBeVisible()
  await expect(page.getByText("Kitchen Display")).toHaveCount(0)
  await expect(page.getByText("Buku Kasbon")).toHaveCount(0)
})

test("guest checkout validates WhatsApp and creates a secure tracking link", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Pilih" }).first().click()
  await page.getByRole("button", { name: "Tambah ke Keranjang" }).click()
  await page.getByRole("button", { name: "Buka keranjang" }).click()
  await page.getByPlaceholder("Contoh: Budi").fill("E2E Guest")
  await page.getByPlaceholder("Contoh: 0812-3456 7890").fill("+62+62812")
  await page.getByRole("button", { name: "Checkout" }).click()
  await expect(page.getByText("Masukkan nomor WhatsApp Indonesia yang aktif.")).toBeVisible()
  await page.getByPlaceholder("Contoh: 0812-3456 7890").fill("0812-3456 7890")
  await page.getByRole("button", { name: "Checkout" }).click()
  await expect(page).toHaveURL(/\/track\/[A-Za-z0-9_-]{21}$/)
  await expect(page.getByRole("link", { name: "Simpan ke WhatsApp" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Salin nomor order" })).toBeVisible()
})

test("public tracking hides internal data and numeric lookup is protected", async ({ request }) => {
  const { order } = await createGuestOrder(request, `Tracking ${Date.now()}`)
  const tracking = await request.get(`/api/orders/track/${order.trackingToken}`)
  expect(tracking.ok()).toBeTruthy()
  const body = await tracking.json()
  expect(body.trackingToken).toBe(order.trackingToken)
  expect(body.id).toBeUndefined()
  expect(body.customerPhone).toBeUndefined()
  expect((await request.get("/api/orders/1")).status()).toBe(401)
})

test("merchant advances and settles an order with one-tap kitchen actions", async ({ page, context, request }) => {
  const customerName = `E2E Customer ${Date.now()}`
  const { order } = await createGuestOrder(request, customerName, true)
  const trackingPage = await context.newPage()
  await trackingPage.goto(`/track/${order.trackingToken}`)
  await expect(trackingPage.getByText(customerName)).toBeVisible()
  await loginAsMerchant(page)
  const orderCard = page.getByText(customerName, { exact: true }).locator("xpath=ancestor::*[@data-testid][1]")
  await expect(orderCard).toContainText(customerName)
  await orderCard.getByRole("button", { name: "MULAI NGULEG" }).click()
  await expect(trackingPage.getByText("Mas Edo sedang menguleg bumbu pesanan Anda...")).toBeVisible()
  await expect(orderCard.getByRole("button", { name: "LUNAS & SIAP DIAMBIL" })).toBeVisible()
  await orderCard.getByRole("button", { name: "LUNAS & SIAP DIAMBIL" }).click()
  await expect(orderCard).toContainText("Lunas")
  await expect(trackingPage.getByText("QRIS · ✓ Lunas")).toBeVisible()
  await expect(trackingPage.getByText("Pesanan Anda Siap!")).toBeVisible()
})

test("merchant can manage stock, expenses, and debts", async ({ page }) => {
  await loginAsMerchant(page)
  await page.goto("/merchant/stock")
  await page.getByRole("button", { name: "Matikan" }).first().click()
  await expect(page.getByRole("button", { name: "Nyalakan" }).first()).toBeVisible()
  await page.getByRole("button", { name: "Nyalakan" }).first().click()

  await page.goto("/merchant/financial")
  const expenseName = `E2E expense ${Date.now()}`
  await page.getByPlaceholder("Contoh: Belanja pasar").fill(expenseName)
  await page.getByPlaceholder("0").fill("12000")
  await page.getByRole("button", { name: "Tambah Pengeluaran" }).click()
  await expect(page.getByText(expenseName, { exact: true })).toBeVisible()

  await page.goto("/merchant/debt")
  const debtName = `E2E debt ${Date.now()}`
  await page.getByPlaceholder("Contoh: Pak RT").fill(debtName)
  await page.getByPlaceholder("0").fill("5000")
  await page.getByRole("button", { name: "Tambah Kasbon" }).click()
  await expect(page.getByText(debtName, { exact: true })).toBeVisible()
})

test("protected merchant routes reject missing and customer credentials", async ({ page, request }) => {
  await page.goto("/merchant/financial")
  await expect(page).toHaveURL(/\/merchant\/login/)
  const registration = await request.post("/api/auth/register", { data: { email: `wrong-role-${Date.now()}@example.com`, password: "customer123", name: "Wrong Role" } })
  const { token } = await registration.json()
  await page.evaluate((customerToken) => localStorage.setItem("authToken", customerToken), token)
  await page.goto("/merchant/kitchen")
  await expect(page).toHaveURL(/\/merchant\/login/)
})

test("PWA files remain available", async ({ request }) => {
  const manifest = await request.get("/manifest.json")
  expect(manifest.ok()).toBeTruthy()
  expect((await manifest.json()).name).toBe("Ketoprakin Aja")
  expect((await request.get("/sw.js")).ok()).toBeTruthy()
})
