import { test, expect } from '@playwright/test';

test.describe('Sign Up', () => {
  test('should create a new user successfully', async ({ page }) => {
    const username = `uiuser${Date.now()}`;
    const password = 'Test123!';

    await page.goto('http://localhost/signup');

    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByLabel('Repeat Password').fill(password);

    const responsePromise = page.waitForResponse(
      response =>
        response.url().includes('/v1/proxy/users/') &&
        response.request().method() === 'POST'
    );

    await page.getByRole('button', { name: 'Sign Up' }).click();

    const response = await responsePromise;
    expect(response.status()).toBe(200);

    await expect(page).toHaveURL(
      new RegExp(`/signupsuccess/${username}`)
    );

    await expect(page.getByText('Created user')).toBeVisible();
    await expect(page.getByText(username)).toBeVisible();
  });
});