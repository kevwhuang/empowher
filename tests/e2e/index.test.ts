import { expect, test } from '@playwright/test';

test.describe('index page', () => {
    test('loads with correct title', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveTitle('EmpowHER Festival');
    });
});
