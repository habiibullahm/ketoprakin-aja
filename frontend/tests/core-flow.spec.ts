import { expect, test, type APIRequestContext, type Page } from "@playwright/test"

async function loginAsMerchant(page: Page) {
  await page.goto("/merchant/login")
  await page.getByRole("button", { name: "Use demo account" }).click()
  await page.getByRole("button", { name: "Login", exact: true }).click()
  await expect(page).toHaveURL(/\/merchant\/kitchen/)
}

async function createOrder(request: APIRequestContext, customerName: string) {
  const email = `e2e-${Date.now()}@example.com`
  const registration = await request.post("/api/auth/register", {
    data: { email, password: "customer123", name: customerName },
  })
  expect(registration.ok()).toBeTruthy()
  const { token } = await registration.json()
  const menu = await request.get("/api/menu/available")
  const items = await menu.json()
  const order = await request.post("/api/orders", {
    data: {
      customerName,
      orderType: "pickup",
      paymentMethod: "qris",
      items: [{ menuId: items[0].id, quantity: 1, spiceLevel: 5, garlicAmount: "normal", sauceConsistency: "pas" }],
    },
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(order.status()).toBe(201)
  return { order: await order.json(), token }
}

test("customer checkout requires a name", async ({ page }) => {
  await page.goto("/customer/menu")
  await page.getByRole("button", { name: "Pilih" }).first().click()
  await page.getByRole("button", { name: "Tambah ke Keranjang" }).click()
  await page.getByRole("button", { name: "Checkout" }).click()
  await expect(page.getByText("Masukkan nama untuk pesanan Anda.")).toBeVisible()
})

test("tracking page accepts an order ID lookup", async ({ page }) => {
  await page.goto("/customer/tracking")
  await expect(page.getByRole("heading", { name: "Lacak Pesanan" })).toBeVisible()
  await page.getByLabel("ID Pesanan").fill("1")
  await page.getByRole("button", { name: "Lacak Pesanan" }).click()
  await expect(page).toHaveURL(/orderId=1/)
})

test("merchant confirms payment and advances an order", async ({ page, request }) => {
  const customerName = `E2E Customer ${Date.now()}`
  const { order } = await createOrder(request, customerName)

  await loginAsMerchant(page)
  const orderCard = page.getByTestId(`order-${order.id}`)
  await expect(orderCard).toContainText(customerName)
  await orderCard.getByRole("button", { name: "Konfirmasi Bayar" }).click()
  await expect(orderCard).toContainText("Lunas")
  await orderCard.getByRole("button", { name: "Mulai Nguleg" }).click()
  await expect(orderCard.getByRole("button", { name: "Selesai" })).toBeVisible()

  await page.goto(`/customer/tracking?orderId=${order.id}`)
  await expect(page.getByText(customerName)).toBeVisible()
  await expect(page.getByText("QRIS · ✓ Lunas")).toBeVisible()
  await expect(page.getByText("Nguleg Bumbu", { exact: true })).toBeVisible()
})

test("merchant can manage stock, expenses, and debts", async ({ page }) => {
  await loginAsMerchant(page)

  await page.goto("/merchant/stock")
  const stockToggle = page.getByRole("button", { name: "Matikan" }).first()
  await stockToggle.click()
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

test("PWA files and protected routes are available", async ({ page, request }) => {
  const manifest = await request.get("/manifest.json")
  expect(manifest.ok()).toBeTruthy()
  expect((await manifest.json()).name).toBe("Ketoprakin Aja")
  expect((await request.get("/sw.js")).ok()).toBeTruthy()

  await page.goto("/merchant/financial")
  await expect(page).toHaveURL(/\/merchant\/login/)
})
