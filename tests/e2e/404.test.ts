import { expect, test } from '@playwright/test';

const NOT_FOUND_PATH = '/this-page-does-not-exist';

test.describe('404 page', () => {
    test('displays 404 heading', async ({ page }) => {
        await page.goto(NOT_FOUND_PATH);

        await expect(page.locator('#error-not-found-title')).toHaveText('This page lost the plot');
    });

    test('returns 404 status', async ({ page }) => {
        const response = await page.goto(NOT_FOUND_PATH);

        expect(response?.status()).toBe(404);
    });
});
