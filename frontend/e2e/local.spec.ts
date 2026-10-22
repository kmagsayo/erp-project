import { expect, test, type Page } from '@playwright/test'

const password = process.env.ERP_ADMIN_PASSWORD ?? 'admin123'

async function expectNoPageErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

test('login page loads and survives a refresh', async ({ page }) => {
  const errors = await expectNoPageErrors(page)
  const response = await page.goto('/login')
  expect(response?.ok()).toBeTruthy()
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  expect(errors).toEqual([])
})

test('invalid login stays on the page', async ({ page }) => {
  await page.goto('/login')
  await page.locator('#email').fill('admin')
  await page.locator('#password').fill('wrong-password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText('Invalid email or password.')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
})

test('login, refresh, navigate, and log out', async ({ page }) => {
  const external: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
      external.push(request.url())
    }
  })

  await page.goto('/login')
  await page.locator('#email').fill('admin')
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText('Pending Quotations')).toBeVisible()

  await page.reload()
  await expect(page.getByText('Pending Quotations')).toBeVisible()

  await page.goto('/quotations')
  await expect(page.getByRole('heading', { name: 'Quotations' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Quotations' })).toBeVisible()

  await page.getByRole('button', { name: 'Log out' }).click()
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  expect(external).toEqual([])
})

test('protected pages redirect to login', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
})

test('server remains available after the page closes', async ({ browser, request }) => {
  const page = await browser.newPage()
  await page.goto('/login')
  await page.close()
  const health = await request.get('/api/health')
  expect(health.ok()).toBeTruthy()
  const body = await health.json()
  expect(body.database).toBe('ok')
})
