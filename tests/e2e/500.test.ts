import { expect, test } from '@playwright/test';

const SERVER_ERROR_PATH = '/500';

test.describe('500 page', () => {
    test('displays 500 heading', async ({ page }) => {
        await page.goto(SERVER_ERROR_PATH);

        await expect(page.locator('#error-server-title')).toHaveText('Something skipped a beat');
    });

    test('returns 500 status', async ({ page }) => {
        const response = await page.goto(SERVER_ERROR_PATH);

        expect(response?.status()).toBe(500);
    });
});
