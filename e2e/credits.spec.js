// @ts-check
import { test, expect } from '@playwright/test';

async function login(page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'My Videos' })).toBeVisible({ timeout: 15000 });
}

function creditsButton(page) {
  return page.getByRole('button', { name: 'Buy' }).first();
}

test.describe('Credits system (mock mode)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('credit balance visible in header', async ({ page }) => {
    const btn = creditsButton(page);
    await expect(btn).toBeVisible({ timeout: 10000 });
    await expect(btn.getByText('42')).toBeVisible();
  });

  test('click balance opens packages modal', async ({ page }) => {
    await creditsButton(page).click();
    await expect(page.getByRole('heading', { name: 'Get Credits' })).toBeVisible({ timeout: 5000 });
  });

  test('modal shows 3 packages with correct names and prices', async ({ page }) => {
    await creditsButton(page).click();
    const modal = page.locator('[class*="fixed inset-0"]');
    await expect(modal.getByRole('heading', { name: 'Get Credits' })).toBeVisible({ timeout: 5000 });

    await expect(modal.getByText('Starter')).toBeVisible();
    await expect(modal.getByText('Standard')).toBeVisible();
    await expect(modal.getByText('Premium')).toBeVisible();

    await expect(modal.getByText('$4.99')).toBeVisible();
    await expect(modal.getByText('$19.99')).toBeVisible();
    await expect(modal.getByText('$34.99')).toBeVisible();

    await expect(modal.getByText('10', { exact: true }).first()).toBeVisible();
    await expect(modal.getByText('50', { exact: true }).first()).toBeVisible();
    await expect(modal.getByText('100', { exact: true }).first()).toBeVisible();
  });

  test('Most Popular badge visible on Standard package', async ({ page }) => {
    await creditsButton(page).click();
    await expect(page.getByRole('heading', { name: 'Get Credits' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Most Popular')).toBeVisible();
  });

  test('purchase flow: buy -> confirm -> success -> balance updates', async ({ page }) => {
    await creditsButton(page).click();
    const modal = page.locator('[class*="fixed inset-0"]');
    await expect(modal.getByRole('heading', { name: 'Get Credits' })).toBeVisible({ timeout: 5000 });

    const buyButtons = modal.getByRole('button', { name: 'Buy Now' });
    await buyButtons.first().click();

    await expect(modal.getByText('Confirm purchase?')).toBeVisible();
    await modal.getByRole('button', { name: /Confirm/ }).click();

    await expect(modal.getByText('Credits Added!')).toBeVisible({ timeout: 10000 });
    await expect(modal.getByText('+10 credits')).toBeVisible();
    await expect(modal.getByText('New balance:')).toBeVisible();

    await modal.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByRole('heading', { name: 'Get Credits' })).not.toBeVisible();

    await expect(creditsButton(page).getByText('52')).toBeVisible({ timeout: 5000 });
  });

  test('close modal via X button', async ({ page }) => {
    await creditsButton(page).click();
    await expect(page.getByRole('heading', { name: 'Get Credits' })).toBeVisible({ timeout: 5000 });

    await page.getByLabel('Close').click();
    await expect(page.getByRole('heading', { name: 'Get Credits' })).not.toBeVisible();
  });

  test('close modal via overlay click', async ({ page }) => {
    await creditsButton(page).click();
    await expect(page.getByRole('heading', { name: 'Get Credits' })).toBeVisible({ timeout: 5000 });

    await page.locator('.fixed.inset-0.bg-black').click({ position: { x: 10, y: 10 } });
    await expect(page.getByRole('heading', { name: 'Get Credits' })).not.toBeVisible();
  });
});
